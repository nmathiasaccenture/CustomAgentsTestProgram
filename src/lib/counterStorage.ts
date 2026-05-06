/**
 * counterStorage — pure (non-React) helpers for persisting the counter's
 * `{ count, stepSize }` to `window.localStorage`.
 *
 * Why a separate module?
 *   - Keeps `Counter.tsx` focused on render/UX concerns; persistence logic is
 *     orthogonal and wants its own unit-testable surface (Stage 3).
 *   - Allows the same helpers to be reused by future call-sites (e.g. a
 *     "reset all" preferences screen) without dragging React along.
 *
 * Why so much defensive validation in the loader?
 *   localStorage is a string store shared with anything else running on the
 *   same origin (browser extensions, devtools edits, older versions of this
 *   app). A corrupt or partial payload should silently behave as "no saved
 *   state" rather than crash the UI or seed the counter with NaN.
 */

/**
 * Storage key used for the persisted counter state. Exported so tests and any
 * future migration code can reference the exact same string the runtime uses.
 */
export const COUNTER_STORAGE_KEY = "counter:state";

/**
 * Shape of the persisted counter snapshot. Kept intentionally minimal:
 *   - `count`     — the current displayed value (any finite number).
 *   - `stepSize`  — the active step (any finite number > 0).
 *
 * Note: this type describes what we WRITE and what a successful read RETURNS.
 * The loader independently re-validates these invariants on read because the
 * raw bytes in localStorage are not type-checked by TypeScript.
 */
export type PersistedCounterState = {
  count: number;
  stepSize: number;
};

/**
 * Internal helper — returns true when we are in an environment where
 * `window.localStorage` is both defined AND usable.
 *
 * Why isolate this?
 *   - SSR / Node test runners have no `window`.
 *   - Some privacy modes throw on the very ACT of accessing `localStorage`,
 *     not just on get/set. Wrapping the access in try/catch lets us treat
 *     those environments as "no storage" instead of crashing at import time.
 *
 * @returns true when `window.localStorage` is available; false otherwise.
 */
function hasLocalStorage(): boolean {
  try {
    return (
      typeof window !== "undefined" &&
      typeof window.localStorage !== "undefined" &&
      window.localStorage !== null
    );
  } catch {
    return false;
  }
}

/**
 * loadCounterState — read and validate persisted counter state.
 *
 * Returns `null` (meaning "no saved state — use defaults") on ANY of:
 *   1. No `window` / no `localStorage` (SSR, locked-down browsers).
 *   2. The key is missing (first visit, after a clear).
 *   3. `JSON.parse` throws (corrupted payload, hand-edited gibberish).
 *   4. The parsed result is not a plain non-array object.
 *   5. `count` is missing, not a `number`, or not `Number.isFinite`
 *      (rejects NaN, Infinity, "7", null).
 *   6. `stepSize` is missing, not a `number`, not finite, or `<= 0`
 *      (a non-positive step would deadlock +/- buttons).
 *
 * Why catch ANY validation failure rather than throw?
 *   The caller (Counter mount effect) can't meaningfully recover from a
 *   storage error mid-render. Treating "bad data" the same as "no data" is
 *   the only sane UX — the counter simply shows its prop-default values.
 *
 * @returns The validated `{ count, stepSize }` snapshot, or `null` when no
 *          usable saved state exists.
 */
export function loadCounterState(): PersistedCounterState | null {
  // Guard 1: environment must support localStorage at all.
  if (!hasLocalStorage()) return null;

  let raw: string | null;
  try {
    raw = window.localStorage.getItem(COUNTER_STORAGE_KEY);
  } catch {
    // Some browsers throw on getItem under disk-full / privacy modes.
    return null;
  }

  // Guard 2: no key present yet.
  if (raw === null) return null;

  // Guard 3: must be valid JSON. Any parse error → treat as missing.
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  // Guard 4: must be a plain object (reject null, arrays, primitives).
  if (
    parsed === null ||
    typeof parsed !== "object" ||
    Array.isArray(parsed)
  ) {
    return null;
  }

  // Narrow to a record so we can probe properties without `any`.
  const obj = parsed as Record<string, unknown>;
  const { count, stepSize } = obj;

  // Guard 5: count must be a finite number. `Number.isFinite` correctly
  // rejects NaN and Infinity (unlike the global isFinite which coerces).
  if (typeof count !== "number" || !Number.isFinite(count)) return null;

  // Guard 6: stepSize must be a finite number AND strictly positive. A zero
  // or negative step would make increment/decrement either no-ops or move
  // in the opposite direction of the button label — both are unrecoverable
  // UX bugs from the user's perspective, so we reject the whole snapshot.
  if (
    typeof stepSize !== "number" ||
    !Number.isFinite(stepSize) ||
    stepSize <= 0
  ) {
    return null;
  }

  return { count, stepSize };
}

/**
 * saveCounterState — persist the given snapshot under `COUNTER_STORAGE_KEY`.
 *
 * Silent on failure by design. The caller is a `useEffect` running on every
 * count/step change; throwing would propagate into React's commit phase and
 * tear down the component over a transient storage hiccup. Failure modes
 * that we deliberately swallow:
 *   - `QuotaExceededError` — disk full or per-origin quota hit.
 *   - `SecurityError`      — privacy mode / disabled storage.
 *   - Any other DOMException variant browsers may throw.
 *
 * Note: we do NOT attempt to validate the input shape here. TypeScript's
 * compile-time check on `PersistedCounterState` is sufficient for in-app
 * callers, and validation lives in `loadCounterState` where it actually
 * matters (i.e. when reading back data of unknown provenance).
 *
 * @param state - The `{ count, stepSize }` pair to write.
 * @returns void — write success/failure is intentionally unobservable.
 */
export function saveCounterState(state: PersistedCounterState): void {
  if (!hasLocalStorage()) return;
  try {
    window.localStorage.setItem(
      COUNTER_STORAGE_KEY,
      JSON.stringify(state),
    );
  } catch {
    // Swallow QuotaExceededError, SecurityError, etc. See JSDoc above.
  }
}

/**
 * clearCounterState — remove any persisted snapshot.
 *
 * Used by the "Clear Saved" button to give users an explicit way to forget
 * the persisted state without having to reach into devtools. Same env-guard
 * and same swallow-everything error policy as `saveCounterState`: the user
 * pressed a button labelled "Clear Saved" — if it fails for environmental
 * reasons, surfacing an exception is worse than the operation being a no-op.
 *
 * @returns void — clear success/failure is intentionally unobservable.
 */
export function clearCounterState(): void {
  if (!hasLocalStorage()) return;
  try {
    window.localStorage.removeItem(COUNTER_STORAGE_KEY);
  } catch {
    // Swallow SecurityError and similar.
  }
}
