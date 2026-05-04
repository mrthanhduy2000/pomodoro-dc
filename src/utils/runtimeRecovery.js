import { lazy } from 'react';
import {
  CACHE_NAME_PATTERNS,
  RUNTIME_RECOVERY_STORAGE_PREFIX,
  LEGACY_RUNTIME_RECOVERY_STORAGE_PREFIXES,
  readSessionStorageValue,
} from '../lib/appIdentity';

const RECOVERY_STORAGE_PREFIXES = [RUNTIME_RECOVERY_STORAGE_PREFIX, ...LEGACY_RUNTIME_RECOVERY_STORAGE_PREFIXES];
const RECOVERY_TTL_MS = 60_000;
const CHUNK_ERROR_PATTERNS = [
  /failed to fetch dynamically imported module/i,
  /error loading dynamically imported module/i,
  /importing a module script failed/i,
  /chunkloaderror/i,
  /loading css chunk/i,
  /unable to preload css/i,
];

function canUseBrowserRuntime() {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

function getRecoveryStorageKey(scope = 'global') {
  return `${RUNTIME_RECOVERY_STORAGE_PREFIX}${scope}`;
}

function getLegacyRecoveryStorageKeys(scope = 'global') {
  return LEGACY_RUNTIME_RECOVERY_STORAGE_PREFIXES.map((prefix) => `${prefix}${scope}`);
}

function readRecoveryEntry(scope) {
  if (!canUseBrowserRuntime()) return null;

  try {
    const raw = readSessionStorageValue(getRecoveryStorageKey(scope), getLegacyRecoveryStorageKeys(scope));
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return typeof parsed?.at === 'number' ? parsed : null;
  } catch {
    return null;
  }
}

function writeRecoveryEntry(scope, reason) {
  if (!canUseBrowserRuntime()) return;

  try {
    window.sessionStorage.setItem(
      getRecoveryStorageKey(scope),
      JSON.stringify({
        at: Date.now(),
        reason,
      }),
    );
  } catch {
    // Ignore sessionStorage write failures and keep the reload path alive.
  }
}

function clearRecoveryEntry(scope) {
  if (!canUseBrowserRuntime()) return;

  try {
    window.sessionStorage.removeItem(getRecoveryStorageKey(scope));
  } catch {
    // Ignore sessionStorage cleanup failures.
  }
}

export function cleanupRuntimeRecoveryState() {
  if (!canUseBrowserRuntime()) return;

  try {
    const now = Date.now();

    for (const key of Object.keys(window.sessionStorage)) {
      if (!RECOVERY_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix))) continue;

      const raw = window.sessionStorage.getItem(key);
      if (!raw) {
        window.sessionStorage.removeItem(key);
        continue;
      }

      try {
        const parsed = JSON.parse(raw);
        if (typeof parsed?.at !== 'number' || now - parsed.at > RECOVERY_TTL_MS) {
          window.sessionStorage.removeItem(key);
        }
      } catch {
        window.sessionStorage.removeItem(key);
      }
    }
  } catch {
    // Ignore cleanup failures so boot can continue.
  }
}

export function isRecoverableAssetError(error) {
  if (!error) return false;

  const message = typeof error === 'string'
    ? error
    : error instanceof Error
      ? `${error.name} ${error.message}`.trim()
      : String(error);

  return CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

async function clearRuntimeCaches() {
  if (typeof window === 'undefined') return;

  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    } catch (error) {
      console.warn('[runtime-recovery] Cannot unregister service workers', error);
    }
  }

  if ('caches' in window) {
    try {
      const cacheNames = await window.caches.keys();
      await Promise.all(
        cacheNames
          .filter((cacheName) => CACHE_NAME_PATTERNS.some((pattern) => pattern.test(cacheName)))
          .map((cacheName) => window.caches.delete(cacheName)),
      );
    } catch (error) {
      console.warn('[runtime-recovery] Cannot clear runtime caches', error);
    }
  }
}

export async function hardReloadCurrentPage({ reason = 'manual-reload', scope = 'global', force = false } = {}) {
  if (typeof window === 'undefined') return false;

  const previousAttempt = readRecoveryEntry(scope);
  const withinCooldown = previousAttempt && Date.now() - previousAttempt.at < RECOVERY_TTL_MS;
  if (!force && withinCooldown) {
    return false;
  }

  writeRecoveryEntry(scope, reason);
  await clearRuntimeCaches();

  const targetUrl = new URL(window.location.href);
  targetUrl.searchParams.set('__reload', `${Date.now()}`);
  window.location.replace(targetUrl.toString());
  return true;
}

export async function attemptRuntimeRecovery(error, scope = 'global') {
  if (!isRecoverableAssetError(error)) return false;
  return hardReloadCurrentPage({
    reason: error instanceof Error ? error.message : String(error),
    scope,
  });
}

export function markRuntimeRecoverySuccess(scope = 'global') {
  clearRecoveryEntry(scope);
}

export function createRecoverableLazy(importer, scope) {
  return lazy(() =>
    importer().catch(async (error) => {
      const recovered = await attemptRuntimeRecovery(error, `lazy:${scope}`);
      if (recovered) {
        return new Promise(() => {});
      }

      throw error;
    }),
  );
}
