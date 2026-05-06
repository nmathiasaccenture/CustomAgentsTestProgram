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
    section: () => screen.getByRole("region", { name: /counter/i }),
    indicator: () => screen.queryByRole("status"),
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

  // ── Normal-mode keyboard shortcuts ──────────────────────────────────────────

  it("ArrowUp increments the count", async () => {
    const { user, count, section } = renderCounter();
    await user.click(section());
    await user.keyboard("{ArrowUp}");
    expect(count()).toHaveTextContent("1");
  });

  it("ArrowDown decrements the count", async () => {
    const { user, count, section } = renderCounter({ initial: 5 });
    await user.click(section());
    await user.keyboard("{ArrowDown}");
    expect(count()).toHaveTextContent("4");
  });

  it("r resets count to initial", async () => {
    const { user, count, inc, section } = renderCounter({ initial: 3 });
    await user.click(inc());
    await user.click(inc());
    expect(count()).toHaveTextContent("5");
    await user.click(section());
    await user.keyboard("r");
    expect(count()).toHaveTextContent("3");
  });

  it("R also resets (case-insensitive)", async () => {
    const { user, count, inc, section } = renderCounter({ initial: 3 });
    await user.click(inc());
    await user.click(inc());
    expect(count()).toHaveTextContent("5");
    await user.click(section());
    await user.keyboard("R");
    expect(count()).toHaveTextContent("3");
  });

  it("ArrowUp respects current stepSize", async () => {
    const { user, count, section } = renderCounter({ step: 3 });
    await user.click(section());
    await user.keyboard("{ArrowUp}");
    await user.keyboard("{ArrowUp}");
    expect(count()).toHaveTextContent("6");
  });

  // ── Step input passthrough (guard 1) ────────────────────────────────────────

  it("ArrowUp inside step input does not increment the counter", async () => {
    const { user, count, step } = renderCounter({ initial: 0 });
    await user.click(step());
    await user.keyboard("{ArrowUp}");
    expect(count()).toHaveTextContent("0");
  });

  // ── Modifier passthrough (guard 2) ──────────────────────────────────────────

  it("Ctrl+R does not trigger reset", async () => {
    const { user, count, inc, section } = renderCounter({ initial: 5 });
    await user.click(inc());
    expect(count()).toHaveTextContent("6");
    await user.click(section());
    await user.keyboard("{Control>}r{/Control}");
    expect(count()).toHaveTextContent("6");
  });

  // ── Step-entry mode ──────────────────────────────────────────────────────────

  it("s enters step-entry mode (indicator visible)", async () => {
    const { user, indicator, section } = renderCounter();
    await user.click(section());
    await user.keyboard("s");
    expect(indicator()).toBeInTheDocument();
    expect(indicator()).toHaveTextContent(/Step entry/i);
  });

  it("S also enters step-entry mode (case-insensitive)", async () => {
    const { user, indicator, section } = renderCounter();
    await user.click(section());
    await user.keyboard("S");
    expect(indicator()).toBeInTheDocument();
    expect(indicator()).toHaveTextContent(/Step entry/i);
  });

  it("step-entry: digits build the buffer shown in indicator", async () => {
    const { user, indicator, section } = renderCounter();
    await user.click(section());
    await user.keyboard("s");
    await user.keyboard("1");
    await user.keyboard("2");
    expect(indicator()).toHaveTextContent("Step entry: 12");
  });

  it("step-entry: Backspace removes last digit", async () => {
    const { user, indicator, section } = renderCounter();
    await user.click(section());
    await user.keyboard("s");
    await user.keyboard("1");
    await user.keyboard("2");
    await user.keyboard("{Backspace}");
    expect(indicator()).toHaveTextContent("Step entry: 1");
  });

  it("step-entry: Enter commits a valid step and exits mode", async () => {
    const { user, count, inc, indicator, section } = renderCounter({ step: 1 });
    await user.click(section());
    await user.keyboard("s");
    await user.keyboard("3");
    await user.keyboard("{Enter}");
    expect(indicator()).not.toBeInTheDocument();
    await user.click(inc());
    expect(count()).toHaveTextContent("3");
  });

  it("step-entry: Escape cancels without changing step", async () => {
    const { user, count, inc, indicator, section } = renderCounter({ step: 2 });
    await user.click(section());
    await user.keyboard("s");
    await user.keyboard("9");
    await user.keyboard("{Escape}");
    expect(indicator()).not.toBeInTheDocument();
    await user.click(inc());
    expect(count()).toHaveTextContent("2");
  });

  it("step-entry: Enter with empty buffer shows error and exits mode", async () => {
    const { user, indicator, error, section } = renderCounter();
    await user.click(section());
    await user.keyboard("s");
    await user.keyboard("{Enter}");
    expect(indicator()).not.toBeInTheDocument();
    expect(error()).toHaveTextContent("Step must be positive number");
  });

  it("step-entry: Enter with 0 in buffer shows error and preserves step", async () => {
    const { user, count, inc, indicator, error, section } = renderCounter({ step: 2 });
    await user.click(section());
    await user.keyboard("s");
    await user.keyboard("0");
    await user.keyboard("{Enter}");
    expect(indicator()).not.toBeInTheDocument();
    expect(error()).toHaveTextContent("Step must be positive number");
    await user.click(inc());
    expect(count()).toHaveTextContent("2");
  });

  it("step-entry: ArrowUp is suppressed while in mode", async () => {
    const { user, count, section } = renderCounter({ initial: 0 });
    await user.click(section());
    await user.keyboard("s");
    await user.keyboard("{ArrowUp}");
    expect(count()).toHaveTextContent("0");
  });

  it("step-entry: r is suppressed while in mode", async () => {
    const { user, count, inc, section } = renderCounter({ initial: 5 });
    await user.click(inc());
    expect(count()).toHaveTextContent("6");
    await user.click(section());
    await user.keyboard("s");
    await user.keyboard("r");
    expect(count()).toHaveTextContent("6");
  });

  it("step-entry: pressing s again while in mode does not restart the buffer", async () => {
    /**
     * Rationale: once step-entry mode is active, "s" is just another
     * suppressed key — it should NOT call enterStepEntry() again (which would
     * wipe the buffer). The user typed "12" and then fat-fingered "s"; they
     * should still see "Step entry: 12" and be able to continue or commit.
     */
    const { user, indicator, section } = renderCounter();
    await user.click(section());
    // Enter step-entry mode and type two digits.
    await user.keyboard("s");
    await user.keyboard("1");
    await user.keyboard("2");
    expect(indicator()).toHaveTextContent("Step entry: 12");
    // Press s again — should be a no-op inside step-entry mode.
    await user.keyboard("s");
    // Buffer must still be "12"; mode must still be active.
    expect(indicator()).toBeInTheDocument();
    expect(indicator()).toHaveTextContent("Step entry: 12");
  });

  it("Tab in normal mode is not suppressed by the section keydown handler", async () => {
    /**
     * Rationale: the section's onKeyDown default-branch intentionally skips
     * preventDefault for unrecognised keys so Tab (and other browser controls)
     * are never trapped. This test confirms focus actually moves away from the
     * section when Tab is pressed, proving preventDefault was NOT called.
     *
     * We check document.activeElement after Tab: it should no longer be the
     * section element itself. userEvent.tab() simulates a real Tab keypress
     * including focus transfer, which would not occur if preventDefault were
     * being called on the event.
     */
    const { section } = renderCounter();
    // Ensure the section has focus before tabbing.
    section().focus();
    expect(document.activeElement).toBe(section());
    // Tab away — focus must move to the next focusable element (a button).
    await userEvent.tab();
    // After Tab, activeElement must have shifted away from the section.
    expect(document.activeElement).not.toBe(section());
    // The newly focused element should be one of the counter's buttons.
    expect(document.activeElement?.tagName).toBe("BUTTON");
  });
});
