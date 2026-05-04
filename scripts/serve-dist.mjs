#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { cp, mkdir, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { formatVietnamOffsetISOString } from '../src/engine/time.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectDir = path.resolve(__dirname, '..');
const distDir = path.join(projectDir, 'dist');
const runtimeDir = path.join(projectDir, '.runtime');
const releasesDir = path.join(runtimeDir, 'releases');
const pendingDir = path.join(runtimeDir, 'pending');
const assetArchiveDir = path.join(runtimeDir, 'asset-archive');
const currentReleasePath = path.join(runtimeDir, 'current-release.json');
const port = Number(process.env.CIVJOURNEY_PORT ?? 31105);
const host = process.env.CIVJOURNEY_HOST ?? '127.0.0.1';
const buildRetryMs = Number(process.env.CIVJOURNEY_BUILD_RETRY_MS ?? 60_000);
const releasesToKeep = Math.max(5, Number(process.env.CIVJOURNEY_RELEASES_TO_KEEP ?? 12));
const buildWatchRoots = [
  path.join(projectDir, 'src'),
  path.join(projectDir, 'public'),
  path.join(projectDir, 'index.html'),
  path.join(projectDir, 'package.json'),
  path.join(projectDir, 'package-lock.json'),
  path.join(projectDir, 'vite.config.js'),
  path.join(projectDir, 'postcss.config.js'),
  path.join(projectDir, 'tailwind.config.js'),
];

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};
const IMMUTABLE_ASSET_BASENAME_PATTERN = /-[A-Za-z0-9_]{8,}\./;

let activeRelease = null;
let buildPromise = null;
let lastSuccessfulSourceMtime = 0;
let lastAttemptedSourceMtime = 0;
let lastBuildError = null;
let retryAfter = 0;
let buildStatus = 'idle';

function log(message) {
  console.log(`[civjourney:${formatVietnamOffsetISOString()}] ${message}`);
}

function resolveNpmBin() {
  const candidates = [
    process.env.CIVJOURNEY_NPM_BIN,
    process.env.npm_execpath,
    '/opt/homebrew/bin/npm',
    '/usr/local/bin/npm',
    'npm',
  ].filter(Boolean);

  return candidates.find((candidate) => candidate === 'npm' || existsSync(candidate)) ?? 'npm';
}

async function latestMtimeMs(targetPath) {
  if (!existsSync(targetPath)) return 0;

  const info = await stat(targetPath);
  if (!info.isDirectory()) return info.mtimeMs;

  const entries = await readdir(targetPath, { withFileTypes: true });
  let latest = info.mtimeMs;

  for (const entry of entries) {
    latest = Math.max(latest, await latestMtimeMs(path.join(targetPath, entry.name)));
  }

  return latest;
}

async function getLatestSourceMtime() {
  let latest = 0;

  for (const rootPath of buildWatchRoots) {
    latest = Math.max(latest, await latestMtimeMs(rootPath));
  }

  return latest;
}

async function readJsonIfExists(filePath) {
  if (!existsSync(filePath)) return null;

  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function getReleaseDir(dirName) {
  return path.join(releasesDir, dirName);
}

async function persistActiveRelease(meta) {
  await writeFile(currentReleasePath, JSON.stringify(meta, null, 2));
}

async function setActiveRelease(meta) {
  activeRelease = meta;
  lastSuccessfulSourceMtime = Math.max(lastSuccessfulSourceMtime, meta.sourceMtime ?? 0);
  await persistActiveRelease(meta);
}

async function pruneOldReleases() {
  const entries = await readdir(releasesDir, { withFileTypes: true });
  const releaseNames = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .reverse();

  const keep = new Set(releaseNames.slice(0, releasesToKeep));
  if (activeRelease?.dirName) keep.add(activeRelease.dirName);

  for (const releaseName of releaseNames) {
    if (keep.has(releaseName)) continue;
    await rm(getReleaseDir(releaseName), { recursive: true, force: true });
  }
}

async function importExistingDistAsRelease() {
  const distIndexPath = path.join(distDir, 'index.html');
  if (!existsSync(distIndexPath)) return false;

  const dirName = `release-${Date.now()}`;
  const releaseDir = getReleaseDir(dirName);
  const distSourceMtime = await latestMtimeMs(distDir);

  await cp(distDir, releaseDir, { recursive: true });
  await archiveImmutableAssets(releaseDir);
  await setActiveRelease({
    builtAt: formatVietnamOffsetISOString(),
    dirName,
    releaseDir,
    sourceMtime: distSourceMtime,
  });

  log(`Imported existing dist/ into ${releaseDir}`);
  return true;
}

function isImmutableAssetPath(safePath) {
  const normalized = safePath.startsWith('/') ? safePath : `/${safePath}`;

  if (normalized.startsWith('/assets/')) return true;
  return IMMUTABLE_ASSET_BASENAME_PATTERN.test(path.posix.basename(normalized));
}

async function archiveImmutableAssets(releaseDir) {
  await mkdir(assetArchiveDir, { recursive: true });

  const assetsSourceDir = path.join(releaseDir, 'assets');
  const assetsTargetDir = path.join(assetArchiveDir, 'assets');

  if (existsSync(assetsSourceDir)) {
    await mkdir(assetsTargetDir, { recursive: true });
    await cp(assetsSourceDir, assetsTargetDir, {
      recursive: true,
      force: false,
    });
  }

  const releaseEntries = await readdir(releaseDir, { withFileTypes: true });
  for (const entry of releaseEntries) {
    if (!entry.isFile()) continue;
    if (!IMMUTABLE_ASSET_BASENAME_PATTERN.test(entry.name)) continue;

    await cp(
      path.join(releaseDir, entry.name),
      path.join(assetArchiveDir, entry.name),
      { force: false },
    );
  }
}

async function runBuildToDir(outDir) {
  const npmBin = resolveNpmBin();
  const commandArgs = ['run', 'build', '--', '--outDir', outDir, '--emptyOutDir'];

  log(`Building fresh assets with ${npmBin} ${commandArgs.join(' ')}`);

  await new Promise((resolve, reject) => {
    const child = spawn(npmBin, commandArgs, {
      cwd: projectDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        PATH: `/usr/local/bin:/opt/homebrew/bin:${process.env.PATH ?? ''}`,
      },
    });

    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Build exited with code ${code ?? 'unknown'}`));
    });
    child.on('error', reject);
  });
}

async function buildRelease(sourceMtime, reason) {
  const dirName = `release-${Date.now()}`;
  const tempDir = path.join(pendingDir, dirName);
  const finalDir = getReleaseDir(dirName);

  buildStatus = 'building';
  lastAttemptedSourceMtime = sourceMtime;
  lastBuildError = null;
  retryAfter = 0;

  log(`Starting background rebuild (${reason})`);

  try {
    await rm(tempDir, { recursive: true, force: true });
    await runBuildToDir(tempDir);
    await rm(finalDir, { recursive: true, force: true });
    await rename(tempDir, finalDir);
    await archiveImmutableAssets(finalDir);

    await setActiveRelease({
      builtAt: formatVietnamOffsetISOString(),
      dirName,
      releaseDir: finalDir,
      sourceMtime,
    });
    await pruneOldReleases();

    buildStatus = 'idle';
    log(`Activated release ${dirName}`);
  } catch (error) {
    buildStatus = 'failed';
    lastBuildError = error instanceof Error ? error.message : String(error);
    retryAfter = Date.now() + buildRetryMs;
    await rm(tempDir, { recursive: true, force: true });
    log(`Build failed; continuing to serve last good release. ${lastBuildError}`);

    if (!activeRelease) {
      throw error;
    }
  }
}

async function ensureActiveRelease() {
  await mkdir(runtimeDir, { recursive: true });
  await mkdir(releasesDir, { recursive: true });
  await mkdir(pendingDir, { recursive: true });
  await mkdir(assetArchiveDir, { recursive: true });

  const persisted = await readJsonIfExists(currentReleasePath);
  if (persisted?.dirName) {
    const releaseDir = getReleaseDir(persisted.dirName);
    const releaseIndex = path.join(releaseDir, 'index.html');

    if (existsSync(releaseIndex)) {
      await archiveImmutableAssets(releaseDir);
      activeRelease = {
        ...persisted,
        releaseDir,
      };
      lastSuccessfulSourceMtime = persisted.sourceMtime ?? 0;
      return;
    }
  }

  if (await importExistingDistAsRelease()) return;

  const sourceMtime = await getLatestSourceMtime();
  await buildRelease(sourceMtime, 'initial startup');
}

function shouldRetryBuild(sourceMtime) {
  if (buildPromise) return false;
  if (sourceMtime <= lastSuccessfulSourceMtime) return false;
  if (sourceMtime <= lastAttemptedSourceMtime && Date.now() < retryAfter) return false;
  return true;
}

async function ensureFreshRelease(reason, { blockIfMissing = false } = {}) {
  const sourceMtime = await getLatestSourceMtime();

  if (!shouldRetryBuild(sourceMtime)) {
    return buildPromise;
  }

  buildPromise = buildRelease(sourceMtime, reason)
    .finally(() => {
      buildPromise = null;
    });

  if (blockIfMissing || !activeRelease) {
    await buildPromise;
  }

  return buildPromise;
}

function toSafePath(urlPathname) {
  const decodedPath = decodeURIComponent(urlPathname);
  const normalized = path.posix.normalize(decodedPath);
  return normalized.replace(/^(\.\.(\/|\\|$))+/, '');
}

function isReleaseAssetPath(safePath) {
  const normalized = safePath.startsWith('/') ? safePath : `/${safePath}`;
  if (normalized === '/' || normalized === '/index.html') return false;
  if (normalized.startsWith('/assets/')) return true;

  const extension = path.extname(normalized);
  return extension !== '' && extension !== '.html';
}

async function listReleaseDirsNewestFirst() {
  if (!existsSync(releasesDir)) return [];

  const entries = await readdir(releasesDir, { withFileTypes: true });
  const releaseDirs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => getReleaseDir(entry.name))
    .sort()
    .reverse();

  if (!activeRelease?.releaseDir) {
    return releaseDirs;
  }

  return [
    activeRelease.releaseDir,
    ...releaseDirs.filter((releaseDir) => releaseDir !== activeRelease.releaseDir),
  ];
}

async function resolveReleaseAssetFile(safePath) {
  const releaseDirs = await listReleaseDirsNewestFirst();

  for (const releaseDir of releaseDirs) {
    const candidatePath = path.join(releaseDir, safePath);
    if (!existsSync(candidatePath)) continue;

      const candidateStat = await stat(candidatePath);
      if (candidateStat.isFile()) return candidatePath;
  }

  const archivedPath = path.join(assetArchiveDir, safePath);
  if (existsSync(archivedPath)) {
    const archivedStat = await stat(archivedPath);
    if (archivedStat.isFile()) return archivedPath;
  }

  return null;
}

function getCacheControlHeader(safePath, extension) {
  if (extension === '.html') return 'no-store';
  if (safePath === '/sw.js' || safePath === '/registerSW.js') return 'no-cache, no-store, must-revalidate';
  if (safePath === '/manifest.webmanifest' || safePath === '/manifest.json') return 'no-cache';
  if (isImmutableAssetPath(safePath)) return 'public, max-age=31536000, immutable';
  return 'no-cache';
}

async function resolveRequestFile(safePath) {
  if (isReleaseAssetPath(safePath)) {
    return resolveReleaseAssetFile(safePath);
  }

  if (!activeRelease?.releaseDir) return null;

  const candidatePath = path.join(activeRelease.releaseDir, safePath);

  if (existsSync(candidatePath)) {
    const candidateStat = await stat(candidatePath);
    if (candidateStat.isFile()) return candidatePath;
    if (candidateStat.isDirectory()) {
      const nestedIndex = path.join(candidatePath, 'index.html');
      if (existsSync(nestedIndex)) return nestedIndex;
    }
  }

  return path.join(activeRelease.releaseDir, 'index.html');
}

function writeError(res, statusCode, error) {
  res.writeHead(statusCode, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(`CivJourney server error: ${error instanceof Error ? error.message : String(error)}`);
}

const server = createServer(async (req, res) => {
  const requestUrl = new URL(req.url ?? '/', `http://${req.headers.host ?? `localhost:${port}`}`);

  try {
    await ensureFreshRelease(`request ${requestUrl.pathname}`, { blockIfMissing: false });

    if (requestUrl.pathname === '/healthz') {
      const latestSourceMtime = await getLatestSourceMtime();
      const stale = latestSourceMtime > lastSuccessfulSourceMtime;

      res.writeHead(activeRelease ? 200 : 503, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      res.end(JSON.stringify({
        activeRelease: activeRelease?.dirName ?? null,
        buildError: lastBuildError,
        buildStatus,
        ok: Boolean(activeRelease),
        stale,
      }));
      return;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Method not allowed');
      return;
    }

    const safePath = toSafePath(requestUrl.pathname);
    const filePath = await resolveRequestFile(safePath);
    if (!filePath) {
      if (isReleaseAssetPath(safePath)) {
        res.writeHead(404, {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store',
        });
        res.end(`Asset not found: ${safePath}`);
        return;
      }

      writeError(res, 503, 'No active release is available yet.');
      return;
    }

    const extension = path.extname(filePath);
    const mimeType = MIME_TYPES[extension] ?? 'application/octet-stream';
    const fileStat = await stat(filePath);
    const cacheControl = getCacheControlHeader(safePath, extension);

    res.writeHead(200, {
      'Content-Length': fileStat.size,
      'Content-Type': mimeType,
      'Cache-Control': cacheControl,
    });

    if (req.method === 'HEAD') {
      res.end();
      return;
    }

    createReadStream(filePath).pipe(res);
  } catch (error) {
    writeError(res, 500, error);
  }
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Stop the conflicting process or uninstall the old server first.`);
  } else {
    console.error(error);
  }
  process.exit(1);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}

await ensureActiveRelease();
void ensureFreshRelease('startup', { blockIfMissing: false });

server.listen(port, host, () => {
  log(`Serving release ${activeRelease?.dirName ?? 'unknown'} on http://${host}:${port}/`);
});
