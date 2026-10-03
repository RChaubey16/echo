import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * Reports whether the component has hydrated: false in the server HTML, true once React runs.
 *
 * @returns True after hydration.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
