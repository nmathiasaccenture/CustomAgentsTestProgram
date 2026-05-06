import { useState } from "react";

export type CounterProps = {
  initial?: number;
  step?: number;
};

/**
 * Counter — increment, decrement, reset, with a configurable step size.
 * `initial` and `step` set the starting count and starting step (both default
 * sensibly). Step is editable at runtime via a number input; non-finite or
 * non-positive entries fall back to 1 so the buttons always make progress.
 */
export function Counter({ initial = 0, step = 1 }: CounterProps) {
  const [count, setCount] = useState(initial);
  const [stepSize, setStepSize] = useState(step);

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

  const onStepChange = (raw: string) => {
    const parsed = Number(raw);
    setStepSize(Number.isFinite(parsed) && parsed > 0 ? parsed : 1);
  };

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
        <input
          type="number"
          min={1}
          value={stepSize}
          onChange={(e) => onStepChange(e.target.value)}
          aria-label="step size"
        />
      </label>
    </section>
  );
}
