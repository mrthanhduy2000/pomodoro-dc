# UI INVARIANTS — rules any UI change must respect

> Moved out of `START_HERE.md` on 2026-09-06 (ADR-075). Every session was loading these ~4,000 chars
> before it knew whether the task touched the UI at all. **Nothing was changed.**
>
> ⚠️ **Read this before changing anything under `src/components/` or `src/store/uiSkins.js`.**
> Each rule below is guarded by a named test; breaking one turns that test red.

---

- **Rewards**: ONE shared card (`components/shared/RewardCard.jsx`), ONE rarity scale of **exactly
  four** tiers (`engine/rewardTiers.js`). Never add a fifth, never draw a bespoke reward card
  anywhere — `rewardTiers.test.js` locks the number 4.
- **Interruption law has no exceptions** (ADR-060/061): full-screen blocking is reserved for era-up ·
  ascension · era crisis · disaster. It works because one field became two:
  `lastWeeklyReportDate` = *invited*, `lastWeeklyReportSeenDate` = *seen*. Law: **opening = seen,
  an expired toast writes nothing**. Since ADR-077 the weekly report dialog is gone — the Stats
  screen answers "this week vs last" — so *opening* means `markWeeklyReportSeen()` + the Stats
  tab, and the never-expiring safety-net dot sits on the **Thống kê tab** (`attentionTabIds`), which
  exists on both platforms by construction.
- **Motion: EXACTLY THREE presets**, single source `src/lib/motionPresets.js` — `enter` · `press` ·
  `reward`. All three self-silence under "Reduce motion", so callers must not check it themselves.
  Never hand-write `initial`/`animate`, never add a fourth preset (`motionPresets.test.js` counts).
  Staggered lists use `withDelay(enterMotion, i * 0.03)`. Exceptions go through `useCustomMotion`
  (opt out) or `useSnapMotion` (jump to target, for cases where `animate` CARRIES LAYOUT — returning
  empty there breaks the UI) and must carry a one-line reason. **Not applied to the 3D city.**
  ⚠️ `motionCoverage.test.js` guards the whole tree: files outside the exemption table must have zero
  loose declarations, and a file in the table that got tidied must have its number LOWERED. Adding a
  row there is a decision, not a cleanup.
- **Navigation: 5 sidebar items** on desktop (Tập trung · Hành trang · Thành Phố · Thống kê · Cài
  đặt); iPhone shows **4 buttons + "Thêm"**. Skills/Treasure/Achievements are sub-tabs of "Hành
  trang" and **keep their old ids** — saved notifications point at them; `resolveTabTarget`
  (`App.jsx`) is the translation layer.
- **Skins: 5**, default **"Sân Chơi" (`arcade`)**. Single source: `src/store/uiSkins.js`. Adding one
  needs all three places (list · `SKIN_OPTIONS` in `Settings.jsx` · `[data-skin=…]` in `index.css`)
  **plus** a `[data-theme="dark"][data-skin=…]` block, because the dark block follows every skin
  block at equal specificity and would otherwise win. `uiSkins.test.js` guards all four.
  ✅ **The one-time skin migration is DONE (2026-08-29) — never do it again.** Saved data beat
  `DEFAULT_UI_SKIN`, which is why changing the default did nothing on Đàm's machine on 2026-08-28.
  `settingsStore` is now version 9 and `migrate` calls `resolveSkinAfterMigration`: a machine without
  the `skinMigratedV1` flag is pulled to the default exactly once, then stamped. ⚠️ **Never force
  again** — after the stamp, every skin choice is Đàm's conscious choice. To change the default for
  new machines edit `DEFAULT_UI_SKIN` only; do not bump the version to re-run `migrate`. And never
  "fix" this into comparing `uiSkin === 'editorial'` — value comparison re-forces on every later
  version bump.
- **Anything new that wants to "tell Đàm" picks ONE of three, never opens a dialog by itself**:
  toast (`engine/rewardFeed.js`) · attention dot (`engine/navAttention.js` → `attentionTabIds`) ·
  notification bell (`ui.notificationFeed`). `rewardToastWiring.test.js` guards this.
- **Era stages**: the milestone is real (`src/engine/eraStage.js`) — the header bar measures the
  stage (~3%/session, fills 3× per era) plus a "còn ~N phiên nữa tới «…»" countdown on Focus.
  Crossing one celebrates (`pickStageCelebration`, stamped in localStorage `dc-stage-seen-v1`), and
  the Streak cell shows `Chuỗi ⚠` when the streak is at risk (`evaluateStreakAtRisk`).
  ⚠️ Never "tidy" the header bar back to measuring a whole era: an era is 5,600–20,800 EP ⇒ ~1% per
  session, filling once every 1–6 months. `stageProgressWiring.test.js` guards it, including a case
  demanding it stay OUTSIDE any `hidden … lg:flex` block (the old stage bar lived only in the right
  column, so iPhone never saw it).

- **No button paints itself (ADR-078, #86 gate).** A `<button>` / `<motion.button>` may not carry a Tailwind palette colour in `className` or a hex / numeric rgb()/rgba() literal in `style` — ESLint `no-restricted-syntax` in `eslint.config.js` is the gate, discovery-based over every file; the only exemptions are `shared/ActionButton.jsx` (the door) and pure white on a filled button. Action buttons go through `ActionButton`; tabs, chips, toggles and icon buttons stay raw and read tokens.
