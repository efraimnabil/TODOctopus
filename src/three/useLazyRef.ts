import { useRef, type RefObject } from "react";

/** A ref initialised once from a factory (for mutable per-frame sim state). */
export function useLazyRef<T>(factory: () => T): RefObject<T> {
  const ref = useRef<T | null>(null);
  if (ref.current === null) ref.current = factory();
  return ref as RefObject<T>;
}
