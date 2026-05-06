import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Counter } from "./Counter";

const renderCounter = (props: Parameters<typeof Counter>[0] = {}) => {
  const user = userEvent.setup();
  render(<Counter {...props} />);
  return {
    user,
    count: () => screen.getByTestId("count"),
    inc: () => screen.getByRole("button", { name: /increment/i }),
    dec: () => screen.getByRole("button", { name: /decrement/i }),
    reset: () => screen.getByRole("button", { name: /reset/i }),
    double: () => screen.getByRole("button", { name: /double/i }),
    step: () => screen.getByRole("spinbutton", { name: /step size/i }),
    error: () => screen.queryByRole("alert"),
  };
};

describe("Counter", () => {
  it("renders the initial value (default 0)", () => {
    const { count } = renderCounter();
    expect(count()).toHaveTextContent("0");
  });

  it("respects a custom initial value", () => {
    const { count } = renderCounter({ initial: 7 });
    expect(count()).toHaveTextContent("7");
  });

  it("increments by the step on +", async () => {
    const { user, count, inc } = renderCounter({ step: 2 });
    await user.click(inc());
    await user.click(inc());
    expect(count()).toHaveTextContent("4");
  });

  it("decrements by the step on -", async () => {
    const { user, count, dec } = renderCounter({ initial: 5, step: 2 });
    await user.click(dec());
    expect(count()).toHaveTextContent("3");
  });

  it("resets to the initial value, not zero", async () => {
    const { user, count, inc, reset } = renderCounter({ initial: 10 });
    await user.click(inc());
    await user.click(inc());
    expect(count()).toHaveTextContent("12");
    await user.click(reset());
    expect(count()).toHaveTextContent("10");
  });

  it("uses an updated step for subsequent operations", async () => {
    const { user, count, inc, step } = renderCounter();
    await user.clear(step());
    await user.type(step(), "5");
    await user.click(inc());
    expect(count()).toHaveTextContent("5");
  });

  it("shows error and preserves last valid step when input is non-positive", async () => {
    const { user, count, inc, step, error } = renderCounter({ step: 4 });
    await user.clear(step());
    await user.type(step(), "0");
    expect(error()).toHaveTextContent("Step must be positive number");
    await user.click(inc());
    expect(count()).toHaveTextContent("4");
  });

  it("shows error and preserves last valid step when input is cleared", async () => {
    const { user, count, inc, step, error } = renderCounter({ step: 4 });
    await user.clear(step());
    expect(error()).toHaveTextContent("Step must be positive number");
    await user.click(inc());
    expect(count()).toHaveTextContent("4");
  });

  it("shows no error on initial render", () => {
    const { error } = renderCounter();
    expect(error()).not.toBeInTheDocument();
  });

  it("shows error when input is negative", async () => {
    const { user, step, error } = renderCounter();
    await user.clear(step());
    await user.type(step(), "-2");
    expect(error()).toHaveTextContent("Step must be positive number");
  });

  it("shows error when input is non-numeric", () => {
    const { step, error } = renderCounter();
    fireEvent.change(step(), { target: { value: "abc" } });
    expect(error()).toHaveTextContent("Step must be positive number");
  });

  it("clears error when a valid positive number is entered after invalid", async () => {
    const { user, count, inc, step, error } = renderCounter();
    await user.clear(step());
    await user.type(step(), "0");
    expect(error()).toHaveTextContent("Step must be positive number");
    await user.clear(step());
    await user.type(step(), "5");
    expect(error()).not.toBeInTheDocument();
    await user.click(inc());
    expect(count()).toHaveTextContent("5");
  });

  it("sets aria-invalid and aria-describedby on the input while error shows", async () => {
    const { user, step } = renderCounter();
    await user.clear(step());
    await user.type(step(), "0");
    expect(step()).toHaveAttribute("aria-invalid", "true");
    expect(step()).toHaveAttribute("aria-describedby", "step-error");
  });

  it("omits aria-describedby when no error", () => {
    const { step } = renderCounter();
    expect(step()).not.toHaveAttribute("aria-describedby");
  });

  it("renders error element with role=alert and counter__error class", async () => {
    const { user, step, error } = renderCounter();
    await user.clear(step());
    await user.type(step(), "0");
    const el = error();
    expect(el).toHaveAttribute("role", "alert");
    expect(el).toHaveClass("counter__error");
  });

  it("doubles the current value immediately on Double click", async () => {
    const { user, count, double } = renderCounter({ initial: 5 });
    await user.click(double());
    expect(count()).toHaveTextContent("10");
  });

  it("does not modify step when Double is clicked", async () => {
    const { user, count, inc, double } = renderCounter({ step: 3 });
    await user.click(inc());
    expect(count()).toHaveTextContent("3");
    await user.click(double());
    expect(count()).toHaveTextContent("6");
    await user.click(inc());
    expect(count()).toHaveTextContent("9");
  });

  it("doubling zero stays zero", async () => {
    const { user, count, double } = renderCounter();
    await user.click(double());
    expect(count()).toHaveTextContent("0");
  });

  it("doubles a negative value correctly", async () => {
    const { user, count, double } = renderCounter({ initial: -3 });
    await user.click(double());
    expect(count()).toHaveTextContent("-6");
  });

  it("resets to the initial value after Double, not the pre-double value", async () => {
    const { user, count, double, reset } = renderCounter({ initial: 5 });
    await user.click(double());
    expect(count()).toHaveTextContent("10");
    await user.click(reset());
    expect(count()).toHaveTextContent("5");
  });
});
