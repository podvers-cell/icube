import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// jsdom implements neither observer. Motion's whileInView/scroll features construct them on mount,
// so any component using a scroll-reveal animation would otherwise throw during render.
// The stubs never fire, which is what tests want: elements render in their settled state.
class NoopObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

for (const name of ["IntersectionObserver", "ResizeObserver"] as const) {
  if (!(name in globalThis)) {
    Object.defineProperty(globalThis, name, {
      writable: true,
      configurable: true,
      value: NoopObserver,
    });
  }
}

afterEach(() => {
  cleanup();
});
