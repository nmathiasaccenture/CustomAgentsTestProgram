# Counter App

A small Vite + React 18 + TypeScript counter used as a sandbox for a 6-stage feature pipeline. The counter component lives in `src/components/Counter.tsx` and is mounted from `src/App.tsx` with `initial={0}` and `step={1}`.

## What it does

- Increment / decrement the count by the current step
- Reset the count back to the `initial` prop
- Double the current count (one-shot multiply, leaves step alone)
- Configurable step via either:
  - a visible number input (with a "Step must be positive number" error for invalid entries), or
  - a keyboard step-entry mode triggered by pressing `s`
- Persists `count` and `stepSize` across page refreshes via `localStorage`
- "Clear Saved" button to return to the prop defaults

## Run, build, test

```
npm install         # first-time setup
npm run dev         # start the Vite dev server
npm run build       # tsc -b && vite build (production build)
npm test            # single-run vitest
npm run test:watch  # vitest in watch mode
```

## Keyboard shortcuts

The counter `<section>` is programmatically focused on mount and is keyboard-focusable (`tabIndex={-1}`). When focus is on the section AND not inside the step input, the following keys apply. Modifier-key combos (Ctrl / Cmd / Alt) are always passed through to the browser. Tab is never suppressed — focus must always be moveable away from the section.

Normal mode:

- `ArrowUp` — increment by current step
- `ArrowDown` — decrement by current step
- `r` / `R` — reset count to the `initial` prop
- `s` / `S` — enter step-entry mode

Step-entry mode (after pressing `s`):

- digits `0`-`9` — append to the step buffer (capped at 9 characters)
- `Backspace` — delete the last digit
- `Enter` — commit; on success updates `stepSize` and the visible input; on failure shows the step error and exits the mode
- `Esc` — cancel without changing anything; clears any stale error
- all other non-Tab keys are suppressed while the mode is active

## Persistence (new)

The counter persists `count` and `stepSize` to `window.localStorage` so they survive page refreshes.

**What is saved.** The component writes a JSON object `{"count": <number>, "stepSize": <number>}` to `window.localStorage` under the key `counter:state` on every change to either value. There is no debounce in v1 — each accepted increment, decrement, reset, double, or step commit triggers a write.

**What is loaded.** On mount the component reads the saved snapshot. If it exists and validates, those values seed the UI (and the visible step input is set to `String(stepSize)` so the field matches what the buttons use). If anything is wrong — missing key, JSON parse error, wrong value types, non-finite numbers, `stepSize <= 0`, or partial data with only one of the two fields — the loader returns `null` and the component falls back to its `initial` and `step` props. This is a deliberate "treat bad data the same as no data" policy: the UI never shows `NaN`.

**"Clear Saved" button.** Clears the storage key and resets the in-memory state (`count`, `stepSize`, `stepInput`, `stepError`, `stepEntryMode`, `stepEntryBuffer`) back to prop defaults.

Caveat worth knowing: because the in-memory reset changes `count` and `stepSize`, the persistence effect immediately fires again and writes `{"count": <initial>, "stepSize": <step>}` back into `counter:state`. So after clicking Clear Saved the storage key is **not empty** — it holds the prop-default snapshot. The button name describes intent ("return to a fresh state") more than literal storage contents. From the loader's perspective on the next mount, a prop-default snapshot is functionally indistinguishable from no snapshot at all, so behavior matches the user's expectation.

**Privacy modes and quota.** Save and clear failures (`QuotaExceededError`, `SecurityError`, and other DOMException variants) are silently swallowed. Persistence is best-effort; the UI continues to work normally if storage is unavailable, full, or disabled.

**API surface** in `src/lib/counterStorage.ts`:

- `COUNTER_STORAGE_KEY` — the literal `"counter:state"` storage key
- `PersistedCounterState` — the `{ count: number; stepSize: number }` type
- `loadCounterState()` — returns a validated snapshot or `null`
- `saveCounterState(state)` — writes a snapshot (silent on failure)
- `clearCounterState()` — removes the storage key (silent on failure)

These are component internals; no usage example is needed at the README level.

## Test environment note

`src/setupTests.ts` installs an in-memory `Storage` shim because vitest + jsdom in this project ships an empty `Object` as `window.localStorage` (you will see a `Warning: --localstorage-file was provided without a valid path` at test startup — that is jsdom telling you it disabled real `localStorage`). Without the shim, every persistence test would fail with `localStorage.X is not a function`. The shim also clears storage between tests via a global `beforeEach`.

If you ever upgrade jsdom and the warning goes away, the shim's env-detection check (`typeof window.localStorage?.setItem !== "function"`) will silently no-op and the real `Storage` will take over.

## Pipeline

Feature work follows the 6-stage pipeline in [PIPELINE.md](PIPELINE.md).
