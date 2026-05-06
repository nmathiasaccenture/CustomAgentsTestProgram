import { useState, useRef, useEffect } from "react";
import {
  loadCounterState,
  saveCounterState,
  clearCounterState,
} from "../lib/counterStorage";

export type CounterProps = {
  initial?: number;
  step?: number;
};

/**
 * Error copy shown beneath the step input when the user enters anything that
 * is not a positive finite number (NaN, empty string, 0, negatives, "abc"...).
 *
 * Why a module-level constant? The exact text is part of the behavior contract
 * (matched verbatim by the upcoming Stage 3 tests and the user story). Pinning
 * it here prevents accidental drift from typos in JSX and gives tests a single
 * source of truth to import later if desired.
 */
const STEP_ERROR_MESSAGE = "Step must be positive number";

/**
 * Counter — increment, decrement, reset, double, with a configurable step size.
 *
 * `initial` and `step` set the starting count and starting step (both default
 * sensibly). Step is editable at runtime via a number input.
 *
 * Step input behavior (replaces the previous silent fallback):
 *   - The visible input is bound to `stepInput` (a string) so the user can
 *     type freely — including transient empty / partial / invalid states —
 *     without React snapping the value back mid-keystroke.
 *   - `stepSize` (the number actually used by +/-) only updates when the
 *     entered value parses to a finite number greater than zero.
 *   - When the entry is invalid, a red error message appears below the input.
 *     `stepSize` is intentionally left at its last valid value so increment/
 *     decrement still make progress at the rate the user previously chose.
 *
 * Keyboard shortcuts (when focus is on the section, not inside the step input):
 *   - ArrowUp   → increment by current step
 *   - ArrowDown → decrement by current step
 *   - r / R     → reset count to initial value
 *   - s / S     → enter step-entry mode (type digits, Enter to commit, Esc to cancel)
 *
 * Step-entry mode:
 *   While active, digit keys append to a temporary buffer (capped at 9 chars)
 *   displayed as a badge. Backspace removes the last digit. Enter commits
 *   (validates and applies) or shows an error if invalid. Escape cancels and
 *   also clears any stale error badge. Tab is never suppressed — keyboard-only
 *   users must always be able to move focus away. All other keys are suppressed.
 */
export function Counter({ initial = 0, step = 1 }: CounterProps) {
  const [count, setCount] = useState(initial);
  const [stepSize, setStepSize] = useState(step);
  // Raw, user-visible string for the step input. Decoupled from `stepSize` so
  // typing "" or "abc" doesn't force the field to revert to a number.
  const [stepInput, setStepInput] = useState(String(step));
  // null when no error is showing. Holds the literal message string when an
  // invalid entry is currently displayed.
  const [stepError, setStepError] = useState<string | null>(null);

  // True while the user is in the keyboard step-entry flow (pressed S and has
  // not yet committed or cancelled). False at rest.
  const [stepEntryMode, setStepEntryMode] = useState(false);

  // Digit characters typed since S was pressed. Stored as a string so we can
  // display it directly and parse it with Number() on commit.
  const [stepEntryBuffer, setStepEntryBuffer] = useState("");

  // Ref attached to the <section> element so we can programmatically focus it
  // on mount. This ensures keyboard shortcuts work immediately without the user
  // clicking first. tabIndex={-1} makes the element programmatically focusable
  // while keeping it out of the natural Tab order (buttons handle their own Tab).
  const sectionRef = useRef<HTMLElement>(null);

  /**
   * Hydration coordination flag.
   *
   * Why a ref and not state?
   *   We need a synchronous, non-rendering signal that the persistence-load
   *   effect has run. A `useState` boolean would trigger an extra render on
   *   flip and — more importantly — would not be observable inside the same
   *   commit by the save effect below.
   *
   * Why does it exist at all?
   *   Without it, the save effect would fire on the very first commit (when
   *   `count`/`stepSize` still hold the prop defaults) and overwrite a valid
   *   saved snapshot before the load effect ever gets the chance to run. The
   *   guard makes saves a no-op until hydration is complete, after which the
   *   effect behaves normally for every subsequent change.
   */
  const hasHydratedRef = useRef<boolean>(false);

  /**
   * Mount focus effect — moves focus to the section element as soon as the
   * component is inserted into the DOM.
   *
   * Why `?.focus()` rather than `!.focus()`? The optional-chain form is safe
   * in any environment where the ref might not yet be attached (e.g. server
   * rendering or shallow test mounts that don't call `useEffect`). There is no
   * meaningful error to surface if the ref is null — we simply skip focus.
   */
  useEffect(() => {
    sectionRef.current?.focus();
  }, []);

  /**
   * Hydration effect — runs once on mount, reads any persisted snapshot, and
   * if found applies it to the live state via the existing setters.
   *
   * StrictMode safety:
   *   React 18 StrictMode mounts effects twice in dev. This effect is idempotent
   *   because it only ever calls `setCount` / `setStepSize` / `setStepInput`
   *   with the SAME loaded values — the second invocation sets state to what
   *   it already equals, which React short-circuits.
   *
   * Why also set `stepInput`?
   *   `stepInput` is the user-visible string bound to the <input>. Restoring
   *   `stepSize` without restoring `stepInput` would show the prop-default
   *   number in the field while the buttons used the persisted step — a
   *   confusing mismatch. We mirror the loaded `stepSize` into the string.
   *
   * `hasHydratedRef.current = true` runs unconditionally at the end so that
   * even on a first visit (no saved state) subsequent changes are persisted.
   */
  useEffect(() => {
    const loaded = loadCounterState();
    if (loaded !== null) {
      setCount(loaded.count);
      setStepSize(loaded.stepSize);
      setStepInput(String(loaded.stepSize));
    }
    hasHydratedRef.current = true;
  }, []);

  /**
   * Persistence effect — writes `{ count, stepSize }` to localStorage whenever
   * either value changes.
   *
   * Why the `hasHydratedRef` early-return?
   *   On first commit, `count` and `stepSize` hold the prop defaults
   *   (`initial`, `step`). If we wrote those out before the hydration effect
   *   above had a chance to overwrite them, we would clobber any genuinely
   *   saved snapshot with the defaults — defeating the whole point of
   *   persistence. The ref blocks the very first run; once hydration finishes
   *   it stays `true` for the lifetime of the component and every subsequent
   *   change persists normally.
   *
   * Note: we intentionally do NOT include `stepInput` in the deps array —
   * partial / invalid keystrokes ("", "abc") shouldn't trigger writes; only
   * accepted `stepSize` changes should.
   */
  useEffect(() => {
    if (!hasHydratedRef.current) return;
    saveCounterState({ count, stepSize });
  }, [count, stepSize]);

  const increment = () => setCount((c) => c + stepSize);
  const decrement = () => setCount((c) => c - stepSize);
  const reset = () => setCount(initial);

  /**
   * clearSaved — wipe the persisted snapshot AND restore the in-memory state
   * to a pristine "as if just mounted with no saved data" condition.
   *
   * Why reset every related slice rather than just clear storage?
   *   Clearing localStorage alone would leave the live UI in whatever state
   *   the user was in before the click — meaning the next change would
   *   immediately re-persist that state and undo the clear from the user's
   *   perspective. Resetting state in lock-step with the storage clear gives
   *   the button a single, intuitive meaning: "go back to factory defaults".
   *
   * Slices reset (in order, mirroring the constructor's defaults):
   *   - count          → `initial` prop
   *   - stepSize       → `step` prop
   *   - stepInput      → `String(step)` so the visible field matches stepSize
   *   - stepError      → null (any stale error must not survive the reset)
   *   - stepEntryMode  → false (exit step-entry mode if it was active)
   *   - stepEntryBuffer → "" (drop any partially-typed digits)
   *
   * The follow-up `saveCounterState` triggered by the persistence effect WILL
   * fire after this handler finishes (because `count`/`stepSize` changed), but
   * it will write the prop-default values — which is a benign no-op from the
   * user's perspective and keeps the storage in sync with the visible state.
   *
   * @returns void — all effects are state updates and a side-effecting clear.
   */
  const clearSaved = () => {
    clearCounterState();
    setCount(initial);
    setStepSize(step);
    setStepInput(String(step));
    setStepError(null);
    setStepEntryMode(false);
    setStepEntryBuffer("");
  };

  /**
   * double — multiply the current count by 2.
   *
   * Why a functional updater (`(c) => c * 2`) instead of `setCount(count * 2)`?
   * React may batch state updates, and `count` captured in this closure can be
   * stale if Double is clicked rapidly or alongside other setters in the same
   * tick. The functional form always receives the latest committed value, so
   * two quick clicks from `count = 4` deterministically produce `4 -> 8 -> 16`.
   *
   * Why ignore `stepSize`? Per the behavior contract, doubling is a one-shot
   * transform of the existing value. The configured step continues to govern
   * future increment/decrement operations only — we explicitly do NOT mutate
   * `stepSize` here.
   *
   * @returns void — state is updated as a side effect via `setCount`.
   */
  const double = () => setCount((c) => c * 2);

  /**
   * onStepChange — handle every keystroke in the step <input>.
   *
   * Always commits the raw string to `stepInput` so the field shows exactly
   * what the user typed (no snap-back on partial / invalid input).
   *
   * Branches on validity:
   *   - Valid:   `parsed` is finite AND `parsed > 0`. We update `stepSize`
   *              (so +/- use the new value) and clear `stepError` to null.
   *   - Invalid: anything else — NaN ("abc"), 0, negative, Infinity. We
   *              deliberately do NOT touch `stepSize`; it keeps its last
   *              valid value so the buttons remain useful while the user
   *              fixes the input. We set `stepError` to the contract message.
   *
   * Why `Number(raw)` rather than `parseFloat`? `parseFloat("12abc")` returns
   * `12` (truthy/finite/positive) which would silently accept obviously
   * malformed input. `Number("12abc")` returns `NaN`, matching user intent.
   * `Number("")` returns `0`, which our `> 0` check correctly rejects.
   *
   * @param raw - The unprocessed string from the input's `change` event.
   * @returns void — all effects are state updates.
   */
  const onStepChange = (raw: string) => {
    setStepInput(raw);
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed > 0) {
      setStepSize(parsed);
      setStepError(null);
    } else {
      setStepError(STEP_ERROR_MESSAGE);
    }
  };

  /**
   * enterStepEntry — activate keyboard step-entry mode.
   *
   * Called when the user presses S in normal mode. Resets the digit buffer to
   * empty so any previous (cancelled or committed) session does not bleed
   * through, then flips `stepEntryMode` to true so `onSectionKeyDown` routes
   * subsequent keys into the buffer instead of the normal shortcut handlers.
   *
   * @returns void — state is updated as a side effect.
   */
  const enterStepEntry = () => {
    setStepEntryMode(true);
    setStepEntryBuffer("");
  };

  /**
   * cancelStepEntry — exit step-entry mode without applying any change.
   *
   * Called when the user presses Escape during step-entry mode. Deliberately
   * does NOT touch `stepSize` or `stepInput` — the goal is a pure "never mind"
   * that leaves the counter operating exactly as it was before S was pressed.
   *
   * `stepError` IS cleared here. If a previous failed commitStepEntry left an
   * error badge showing, pressing S and then Escape is semantically a cancellation
   * of the entire entry flow; surfacing a stale error from a prior attempt would
   * be misleading. Clearing it makes Escape a true "back to normal" action.
   *
   * @returns void — state is updated as a side effect.
   */
  const cancelStepEntry = () => {
    setStepEntryMode(false);
    setStepEntryBuffer("");
    setStepError(null);
  };

  /**
   * commitStepEntry — validate the current buffer and apply it as the new step.
   *
   * Called when the user presses Enter during step-entry mode. Parses the
   * accumulated digit string with `Number(...)` and applies two validity checks:
   *
   *   1. `Number.isFinite(parsed)` — rejects NaN (empty buffer → `Number("")` → 0,
   *      which falls through to the integer check below) and Infinity.
   *   2. `Number.isInteger(parsed)` — ensures no decimal was somehow introduced.
   *   3. `parsed >= 1` — step must be at least 1 (strictly positive integer).
   *
   * On ACCEPT: updates `stepSize`, `stepInput` (so the visible field reflects
   * the new value), and clears `stepError`.
   *
   * On REJECT (empty buffer, zero, negative, non-integer, non-finite): sets
   * `stepError` to STEP_ERROR_MESSAGE only. `stepSize` and `stepInput` are
   * intentionally left untouched so the counter keeps working at the last
   * valid rate.
   *
   * Either way: always exits step-entry mode by clearing `stepEntryMode` and
   * `stepEntryBuffer`.
   *
   * Why `Number.isInteger` in addition to `isFinite`? The buffer only collects
   * digit characters (0-9) via `onSectionKeyDown`, so a decimal is impossible
   * in practice — but the guard is cheap and makes the acceptance rule explicit
   * and self-documenting rather than relying on an implicit assumption about
   * the buffer's contents.
   *
   * @returns void — all effects are state updates.
   */
  const commitStepEntry = () => {
    const parsed = Number(stepEntryBuffer);
    if (
      Number.isFinite(parsed) &&
      Number.isInteger(parsed) &&
      parsed >= 1
    ) {
      setStepSize(parsed);
      setStepInput(String(parsed));
      setStepError(null);
    } else {
      setStepError(STEP_ERROR_MESSAGE);
    }
    // Always exit mode, regardless of validation outcome.
    setStepEntryMode(false);
    setStepEntryBuffer("");
  };

  /**
   * onSectionKeyDown — top-level keyboard handler attached to the <section>.
   *
   * Routes key events to the correct action depending on whether the app is in
   * normal mode or step-entry mode. Two guards at the top prevent this handler
   * from intercepting events that belong to native controls or browser shortcuts.
   *
   * Branching order (must be followed exactly — order matters):
   *
   * 1. Step-input guard: if the event originates inside an <input>, return
   *    immediately. This allows ArrowUp/Down to spin the step number input
   *    natively and prevents r/s from firing while the user edits the field.
   *
   * 2. Modifier guard: if Ctrl, Meta (Cmd), or Alt is held, return immediately.
   *    This lets Ctrl+R (browser reload), Cmd+R (Mac reload), and similar
   *    OS/browser shortcuts pass through unmodified.
   *
   * 3. Step-entry mode active (stepEntryMode === true):
   *    - Digit (0-9)  → append to buffer (capped at 9 chars), preventDefault.
   *    - Backspace     → remove last buffer character, preventDefault.
   *    - Enter         → commitStepEntry(), preventDefault.
   *    - Escape        → cancelStepEntry(), preventDefault.
   *    - Tab           → return without preventDefault (must not trap focus).
   *    - Anything else → preventDefault and return (suppresses ArrowUp/Down,
   *                      r/R, s/S, and all other keys while in mode).
   *
   * 4. Normal mode (stepEntryMode === false) — switch on lowercased key:
   *    - "arrowup"   → increment(), preventDefault.
   *    - "arrowdown" → decrement(), preventDefault.
   *    - "r"         → reset(), preventDefault.
   *    - "s"         → enterStepEntry(), preventDefault.
   *    - default     → do nothing (no preventDefault — let the browser handle it).
   *
   * @param event - The React synthetic keyboard event from the <section> element.
   * @returns void — all effects are either state updates or DOM calls.
   */
  const onSectionKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    // Guard 1: let native <input> controls handle their own keys.
    if (event.target instanceof HTMLInputElement) return;

    // Guard 2: don't intercept browser/OS shortcuts that use modifier keys.
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    if (stepEntryMode) {
      // Step-entry mode: digits build the buffer; Enter commits; Esc cancels;
      // everything else is suppressed to avoid accidental increments/resets.
      if (/^[0-9]$/.test(event.key)) {
        // Cap at 9 characters: Number.MAX_SAFE_INTEGER has 16 digits, but a
        // 9-digit step (up to 999,999,999) is already far beyond any practical
        // use and keeps us comfortably within safe integer range.
        setStepEntryBuffer((b) => b.length < 9 ? b + event.key : b);
        event.preventDefault();
      } else if (event.key === "Backspace") {
        setStepEntryBuffer((b) => b.slice(0, -1));
        event.preventDefault();
      } else if (event.key === "Enter") {
        commitStepEntry();
        event.preventDefault();
      } else if (event.key === "Escape") {
        cancelStepEntry();
        event.preventDefault();
      } else {
        // Suppress all other keys (ArrowUp, ArrowDown, r, s, etc.) so they
        // cannot accidentally trigger shortcuts while the user is midway
        // through typing a new step value.
        //
        // Exception: Tab must NOT be suppressed. Keyboard-only users may need
        // to Tab away from the section mid-entry (e.g. to reach a browser
        // address bar or another page control). Trapping Tab here would make
        // the page inaccessible without a mouse.
        if (event.key === "Tab") return;
        event.preventDefault();
      }
    } else {
      // Normal mode: single-key shortcuts.
      switch (event.key.toLowerCase()) {
        case "arrowup":
          increment();
          event.preventDefault();
          break;
        case "arrowdown":
          decrement();
          event.preventDefault();
          break;
        case "r":
          reset();
          event.preventDefault();
          break;
        case "s":
          enterStepEntry();
          event.preventDefault();
          break;
        default:
          // Intentionally no preventDefault — unrecognised keys must not be
          // swallowed (e.g. Tab for focus movement, F5 for refresh, etc.).
          break;
      }
    }
  };

  // Derived once for readability and to keep ARIA wiring consistent: when
  // there is no error we omit `aria-describedby` entirely rather than point
  // it at a non-existent id (screen readers complain about dangling refs).
  const hasError = stepError !== null;

  return (
    <section
      className="counter"
      aria-label="counter"
      ref={sectionRef}
      tabIndex={-1}
      onKeyDown={onSectionKeyDown}
    >
      <p className="counter__value" data-testid="count">
        {count}
      </p>
      <div className="counter__controls">
        <button type="button" onClick={decrement} aria-label="decrement">
          −
        </button>
        <button type="button" onClick={increment} aria-label="increment">
          +
        </button>
        <button type="button" onClick={reset} aria-label="reset">
          Reset
        </button>
        <button type="button" onClick={double} aria-label="double">
          Double
        </button>
        <button type="button" onClick={clearSaved} aria-label="clear saved">
          Clear Saved
        </button>
      </div>
      <label className="counter__step">
        Step
        {/*
          Inner column-flex wrapper keeps the input on one row and the error
          message directly beneath it. The label still wraps everything so
          clicking "Step" focuses the input — no htmlFor/id plumbing needed.
        */}
        <span className="counter__step-field">
          <input
            type="number"
            min={1}
            value={stepInput}
            onChange={(e) => onStepChange(e.target.value)}
            aria-label="step size"
            aria-invalid={hasError}
            aria-describedby={hasError ? "step-error" : undefined}
          />
          {hasError && (
            <span
              id="step-error"
              role="alert"
              className="counter__error"
            >
              {stepError}
            </span>
          )}
          {/*
            Step-entry mode indicator. Appears between S-press and Enter/Esc.
            role="status" with aria-live="polite" announces buffer changes to
            screen readers without interrupting whatever they were saying.
            The underscore placeholder when the buffer is empty signals to the
            user that the mode is active and awaiting a first digit.
          */}
          {stepEntryMode && (
            <span
              className="counter__step-entry"
              role="status"
              aria-live="polite"
            >
              Step entry: {stepEntryBuffer || "_"}
            </span>
          )}
        </span>
      </label>
    </section>
  );
}
