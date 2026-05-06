import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
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

  it("falls back to step=1 when given a non-positive step", async () => {
    const { user, count, inc, step } = renderCounter();
    await user.clear(step());
    await user.type(step(), "0");
    await user.click(inc());
    expect(count()).toHaveTextContent("1");
  });

  it("falls back to step=1 when the step input is cleared", async () => {
    const { user, count, inc, step } = renderCounter({ step: 4 });
    await user.clear(step());
    await user.click(inc());
    expect(count()).toHaveTextContent("1");
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
