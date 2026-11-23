"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/** The slice of the browser's speech API we use (not in every TypeScript lib). */
interface RecognitionResult {
  isFinal: boolean;
  0: { transcript: string };
}
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: { resultIndex: number; results: ArrayLike<RecognitionResult> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type RecognitionCtor = new () => Recognition;

function ctor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const noopSubscribe = () => () => {};

export type SpeechLang = "en-US" | "ar-EG";
export type SpeechError = "denied" | "no-speech" | "failed";

/** Quiet time after the player stops talking before we wrap up. */
const SILENCE_MS = 2500;
/** How long we wait for the first word. */
const FIRST_WORD_MS = 8000;
/** A hard stop, in case the mic is left open. */
const MAX_MS = 60_000;

/**
 * Speech to text with the browser's own recognizer (the audio never touches
 * our server). It keeps listening through short pauses: browsers end a
 * recognition session on their own after a moment of silence, so we quietly
 * restart it until the player is done (they tap stop, or stay quiet for a
 * couple of seconds). `onInterim` gets the words live; `onFinal` the whole
 * sentence once.
 */
export function useSpeech({
  onInterim,
  onFinal,
}: {
  onInterim?: (text: string) => void;
  onFinal: (text: string) => void;
}) {
  const supported = useSyncExternalStore(
    noopSubscribe,
    () => ctor() !== null,
    () => false,
  );
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<SpeechError | null>(null);
  const session = useRef<{ rec: Recognition; finish: () => void } | null>(null);
  const handlers = useRef({ onInterim, onFinal });

  useEffect(() => {
    handlers.current = { onInterim, onFinal };
  }, [onInterim, onFinal]);

  useEffect(() => () => session.current?.rec.abort(), []);

  const start = useCallback((lang: SpeechLang) => {
    const Ctor = ctor();
    if (!Ctor) return;
    session.current?.rec.abort();

    let wanted = true;
    let finalText = "";
    let interim = "";
    let heard = false;
    let failure: SpeechError | null = null;
    let quiet: ReturnType<typeof setTimeout> | undefined;
    const startedAt = Date.now();

    const r = new Ctor();
    r.lang = lang;
    r.continuous = true;
    r.interimResults = true;
    r.maxAlternatives = 1;

    const text = () => `${finalText} ${interim}`.replace(/\s+/g, " ").trim();
    const finish = () => {
      wanted = false;
      clearTimeout(quiet);
      r.stop();
    };
    const armQuiet = (ms: number) => {
      clearTimeout(quiet);
      quiet = setTimeout(() => {
        if (!heard) failure = "no-speech";
        finish();
      }, ms);
    };

    r.onresult = (e) => {
      interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const piece = e.results[i][0]?.transcript ?? "";
        if (e.results[i].isFinal) finalText = `${finalText} ${piece}`;
        else interim += piece;
      }
      const now = text();
      if (now) heard = true;
      handlers.current.onInterim?.(now);
      armQuiet(SILENCE_MS);
    };
    r.onerror = (e) => {
      // "no-speech" and "aborted" are handled by our own timers and restarts.
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        failure = "denied";
        wanted = false;
      } else if (e.error === "network" || e.error === "audio-capture") {
        failure = "failed";
        wanted = false;
      }
    };
    r.onend = () => {
      // The browser hung up on its own (a pause, a hiccup): pick up again.
      if (wanted && Date.now() - startedAt < MAX_MS) {
        // Words still in flight became final when the session closed.
        if (interim) finalText = `${finalText} ${interim}`;
        interim = "";
        try {
          r.start();
          return;
        } catch {
          // Fall through and wrap up with what we have.
        }
      }
      clearTimeout(quiet);
      if (session.current?.rec === r) session.current = null;
      setListening(false);
      const said = text();
      if (said) handlers.current.onFinal(said);
      else setError(failure ?? "no-speech");
    };

    session.current = { rec: r, finish };
    setError(null);
    setListening(true);
    armQuiet(FIRST_WORD_MS);
    setTimeout(() => wanted && finish(), MAX_MS);
    try {
      r.start();
    } catch {
      session.current = null;
      setListening(false);
      setError("failed");
    }
  }, []);

  const stop = useCallback(() => session.current?.finish(), []);

  const clearError = useCallback(() => setError(null), []);

  return { supported, listening, error, start, stop, clearError };
}
