import { useSyncExternalStore } from "react";

const subscribe = (cb: () => void) => {
  const t = window.setInterval(cb, 15_000);
  return () => window.clearInterval(t);
};
const minute = () => Math.floor(Date.now() / 60_000);

/** The current time, rounded to the minute and refreshed on its own. */
export function useNow(): number {
  return useSyncExternalStore(subscribe, minute, minute) * 60_000;
}
