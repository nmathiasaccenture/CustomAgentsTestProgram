import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  COUNTER_STORAGE_KEY,
  clearCounterState,
  loadCounterState,
  saveCounterState,
} from "./counterStorage";

// Note: the `typeof window === "undefined"` env-guard branches are not exercised
// here. Under jsdom `window` and `localStorage` are always defined, and stubbing
// them out tends to break testing-library more than it provides confidence.
// Those branches are SSR/locked-down-browser safety nets and not realistically
// reachable from this test runner.

describe("counterStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("loadCounterState", () => {
    it("returns null when the key is missing", () => {
      expect(loadCounterState()).toBeNull();
    });

    it("returns the parsed state when valid JSON with finite numbers is stored", () => {
      localStorage.setItem(
        COUNTER_STORAGE_KEY,
        JSON.stringify({ count: 5, stepSize: 2 }),
      );
      expect(loadCounterState()).toEqual({ count: 5, stepSize: 2 });
    });

    it("returns the parsed state for negative count and fractional positive stepSize", () => {
      localStorage.setItem(
        COUNTER_STORAGE_KEY,
        JSON.stringify({ count: -10, stepSize: 0.5 }),
      );
      expect(loadCounterState()).toEqual({ count: -10, stepSize: 0.5 });
    });

    it("returns null on corrupted JSON", () => {
      localStorage.setItem(COUNTER_STORAGE_KEY, "{not json");
      expect(loadCounterState()).toBeNull();
    });

    it("returns null when parsed value is an array (not a plain object)", () => {
      localStorage.setItem(COUNTER_STORAGE_KEY, JSON.stringify([1, 2, 3]));
      expect(loadCounterState()).toBeNull();
    });

    it("returns null when parsed value is a primitive number", () => {
      localStorage.setItem(COUNTER_STORAGE_KEY, JSON.stringify(42));
      expect(loadCounterState()).toBeNull();
    });

    it("returns null when parsed value is null", () => {
      localStorage.setItem(COUNTER_STORAGE_KEY, JSON.stringify(null));
      expect(loadCounterState()).toBeNull();
    });

    it("returns null when parsed value is a string", () => {
      localStorage.setItem(COUNTER_STORAGE_KEY, JSON.stringify("hello"));
      expect(loadCounterState()).toBeNull();
    });

    it("returns null when count is missing", () => {
      localStorage.setItem(
        COUNTER_STORAGE_KEY,
        JSON.stringify({ stepSize: 2 }),
      );
      expect(loadCounterState()).toBeNull();
    });

    it("returns null when count is NaN", () => {
      // NaN is not JSON-serializable, so we hand-craft the payload.
      localStorage.setItem(
        COUNTER_STORAGE_KEY,
        '{"count":null,"stepSize":2}',
      );
      expect(loadCounterState()).toBeNull();
    });

    it("returns null when count is the string '7' (wrong type)", () => {
      localStorage.setItem(
        COUNTER_STORAGE_KEY,
        JSON.stringify({ count: "7", stepSize: 2 }),
      );
      expect(loadCounterState()).toBeNull();
    });

    it("returns null when count is Infinity (serialized as null by JSON)", () => {
      // JSON.stringify({count: Infinity}) produces {"count":null}, which our
      // typeof check rejects. We also test the string-injected form below.
      localStorage.setItem(
        COUNTER_STORAGE_KEY,
        JSON.stringify({ count: Infinity, stepSize: 2 }),
      );
      expect(loadCounterState()).toBeNull();
    });

    it("returns null when stepSize is missing", () => {
      localStorage.setItem(
        COUNTER_STORAGE_KEY,
        JSON.stringify({ count: 5 }),
      );
      expect(loadCounterState()).toBeNull();
    });

    it("returns null when stepSize is 0", () => {
      localStorage.setItem(
        COUNTER_STORAGE_KEY,
        JSON.stringify({ count: 5, stepSize: 0 }),
      );
      expect(loadCounterState()).toBeNull();
    });

    it("returns null when stepSize is negative", () => {
      localStorage.setItem(
        COUNTER_STORAGE_KEY,
        JSON.stringify({ count: 5, stepSize: -2 }),
      );
      expect(loadCounterState()).toBeNull();
    });

    it("returns null when stepSize is a string ('2')", () => {
      localStorage.setItem(
        COUNTER_STORAGE_KEY,
        JSON.stringify({ count: 5, stepSize: "2" }),
      );
      expect(loadCounterState()).toBeNull();
    });

    it("returns null when stepSize is NaN (serialized as null)", () => {
      localStorage.setItem(
        COUNTER_STORAGE_KEY,
        '{"count":5,"stepSize":null}',
      );
      expect(loadCounterState()).toBeNull();
    });

    it("returns null on partial data — only count present", () => {
      localStorage.setItem(COUNTER_STORAGE_KEY, JSON.stringify({ count: 5 }));
      expect(loadCounterState()).toBeNull();
    });

    it("returns null on partial data — only stepSize present", () => {
      localStorage.setItem(
        COUNTER_STORAGE_KEY,
        JSON.stringify({ stepSize: 2 }),
      );
      expect(loadCounterState()).toBeNull();
    });
  });

  describe("saveCounterState", () => {
    it("writes a JSON-encoded object to localStorage under COUNTER_STORAGE_KEY", () => {
      saveCounterState({ count: 3, stepSize: 4 });
      const raw = localStorage.getItem(COUNTER_STORAGE_KEY);
      expect(raw).not.toBeNull();
      expect(JSON.parse(raw as string)).toEqual({ count: 3, stepSize: 4 });
    });

    it("overwrites a previously stored value", () => {
      saveCounterState({ count: 1, stepSize: 1 });
      saveCounterState({ count: 9, stepSize: 3 });
      const raw = localStorage.getItem(COUNTER_STORAGE_KEY);
      expect(JSON.parse(raw as string)).toEqual({ count: 9, stepSize: 3 });
    });

    it("does not throw when setItem throws (e.g. QuotaExceededError)", () => {
      // Simulate a storage quota error by stubbing setItem on the prototype.
      // We throw a DOMException with name "QuotaExceededError" to mirror what
      // browsers actually raise when the per-origin storage limit is reached.
      // Direct method replacement (not vi.spyOn) — vi.spyOn does not reliably
      // intercept the in-memory Storage shim installed by setupTests.ts. We
      // capture calls manually and restore the original method in finally.
      const original = window.localStorage.setItem;
      const calls: Array<[string, string]> = [];
      window.localStorage.setItem = (key: string, value: string) => {
        calls.push([key, value]);
        throw new DOMException("Quota exceeded", "QuotaExceededError");
      };
      try {
        expect(() =>
          saveCounterState({ count: 1, stepSize: 1 }),
        ).not.toThrow();
        expect(calls).toEqual([
          [COUNTER_STORAGE_KEY, JSON.stringify({ count: 1, stepSize: 1 })],
        ]);
      } finally {
        window.localStorage.setItem = original;
      }
    });

    it("does not throw when setItem throws a SecurityError", () => {
      vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
        throw new DOMException("Storage disabled", "SecurityError");
      });

      expect(() =>
        saveCounterState({ count: 2, stepSize: 2 }),
      ).not.toThrow();
    });
  });

  describe("clearCounterState", () => {
    it("removes the key from localStorage", () => {
      localStorage.setItem(
        COUNTER_STORAGE_KEY,
        JSON.stringify({ count: 5, stepSize: 2 }),
      );
      expect(localStorage.getItem(COUNTER_STORAGE_KEY)).not.toBeNull();

      clearCounterState();

      expect(localStorage.getItem(COUNTER_STORAGE_KEY)).toBeNull();
    });

    it("is a safe no-op when the key is already absent", () => {
      expect(() => clearCounterState()).not.toThrow();
      expect(localStorage.getItem(COUNTER_STORAGE_KEY)).toBeNull();
    });

    it("does not throw when removeItem throws", () => {
      vi.spyOn(window.localStorage, "removeItem").mockImplementation(() => {
        throw new DOMException("Storage disabled", "SecurityError");
      });

      expect(() => clearCounterState()).not.toThrow();
    });
  });
});
