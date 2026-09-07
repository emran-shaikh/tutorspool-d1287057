import { lazy, type ComponentType } from "react";

const RELOAD_KEY = "chunk-reload-at";

/**
 * Lazily load a route, retrying once and — if the chunk is truly gone
 * (typical after a new deployment) — refreshing the page once to pick up
 * the new build instead of crashing into the error boundary.
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (error) {
      // Second chance: transient network hiccup
      try {
        await new Promise((r) => setTimeout(r, 500));
        return await factory();
      } catch (err) {
        const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
        // Only auto-reload once per minute to avoid refresh loops
        if (Date.now() - last > 60_000) {
          sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
          window.location.reload();
          // Keep Suspense pending while the page reloads
          return await new Promise<{ default: T }>(() => {});
        }
        throw err;
      }
    }
  });
}
