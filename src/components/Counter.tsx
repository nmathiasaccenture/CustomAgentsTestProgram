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
