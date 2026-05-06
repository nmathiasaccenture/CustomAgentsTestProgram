import "@testing-library/jest-dom/vitest";
import { beforeEach } from "vitest";

// jsdom under this vitest setup ships an empty Object as `window.localStorage`
// (it emits a "--localstorage-file was provided without a valid path" warning
// at startup). Install an in-memory Storage-compatible shim so tests can drive
// the persistence layer end-to-end.
if (typeof window.localStorage?.setItem !== "function") {
  // Methods declared as own properties (not prototype) so vi.spyOn behaves
  // identically to spying on a real browser Storage instance.
  const store = new Map<string, string>();
  const memoryStorage: Storage = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
  };
  Object.defineProperty(window, "localStorage", {
    value: memoryStorage,
    writable: true,
    configurable: true,
  });
}

// Reset persisted state between every test so persistence in one test cannot
// bleed into the next (the Counter component now writes to localStorage on
// mount once hydrated, and on every count/step change).
beforeEach(() => {
  window.localStorage.clear();
});
