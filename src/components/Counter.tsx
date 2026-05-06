import { useState } from "react";

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

  const increment = () => setCount((c) => c + stepSize);
  const decrement = () => setCount((c) => c - stepSize);
  const reset = () => setCount(initial);

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

  // Derived once for readability and to keep ARIA wiring consistent: when
  // there is no error we omit `aria-describedby` entirely rather than point
  // it at a non-existent id (screen readers complain about dangling refs).
  const hasError = stepError !== null;

  return (
    <section className="counter" aria-label="counter">
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
        </span>
      </label>
    </section>
  );
}
