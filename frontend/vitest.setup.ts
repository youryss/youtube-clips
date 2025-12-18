import "@testing-library/jest-dom/vitest";

// Basic mock for window.matchMedia which Next.js and some components might rely on
if (typeof window !== "undefined" && !window.matchMedia) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).matchMedia = () => ({
    matches: false,
    media: "",
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}


