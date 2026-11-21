import { useSyncExternalStore } from "react";

// One timer for the whole page, shared by every component that asks the time.
const listeners = new Set<() => void>();
let timer: number | undefined;

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  timer ??= window.setInterval(() => listeners.forEach((fn) => fn()), 15_000);
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0 && timer !== undefined) {
      window.clearInterval(timer);
      timer = undefined;
    }
  };
};
const minute = () => Math.floor(Date.now() / 60_000);

/** The current time, rounded to the minute and refreshed on its own. */
export function useNow(): number {
  return useSyncExternalStore(subscribe, minute, minute) * 60_000;
}
