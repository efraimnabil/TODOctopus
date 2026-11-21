"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { aiStatus } from "@/ai/actions";

const CONSENT_KEY = "todoctopus:ai-consent";

type Consent = "yes" | "no" | null;

const listeners = new Set<() => void>();
let enabled: boolean | null = null; // null until the server has answered

function readConsent(): Consent {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === "yes" || v === "no" ? v : null;
  } catch {
    return null;
  }
}

function writeConsent(value: Consent) {
  try {
    if (value) localStorage.setItem(CONSENT_KEY, value);
    else localStorage.removeItem(CONSENT_KEY);
  } catch {
    // Private mode: the choice just lasts until reload.
  }
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  window.addEventListener("storage", l);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", l);
  };
};

/**
 * AI availability for the UI: `available` (the server has a key),
 * `consent` (the player agreed to send task text to the model),
 * and `ready` (both).
 */
export function useAi() {
  const consent = useSyncExternalStore(subscribe, readConsent, () => null);
  const available = useSyncExternalStore(
    subscribe,
    () => enabled === true,
    () => false,
  );

  useEffect(() => {
    if (enabled !== null) return;
    aiStatus()
      .then((s) => (enabled = s.enabled))
      .catch(() => (enabled = false))
      .finally(() => listeners.forEach((l) => l()));
  }, []);

  const setConsent = useCallback((value: Consent) => writeConsent(value), []);
  return { available, consent, ready: available && consent === "yes", setConsent };
}
