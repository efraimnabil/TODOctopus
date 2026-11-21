"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/** The slice of the browser's speech API we use (not in every TypeScript lib). */
interface Recognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
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

/**
 * Speech to text with the browser's own recognizer (the audio never touches
 * our server). `supported` is false where the API doesn't exist.
 */
export function useSpeech(onText: (text: string) => void) {
  const supported = useSyncExternalStore(
    noopSubscribe,
    () => ctor() !== null,
    () => false,
  );
  const [listening, setListening] = useState(false);
  const rec = useRef<Recognition | null>(null);
  const onTextRef = useRef(onText);

  useEffect(() => {
    onTextRef.current = onText;
  }, [onText]);

  useEffect(() => () => rec.current?.stop(), []);

  const start = useCallback((lang: SpeechLang) => {
    const Ctor = ctor();
    if (!Ctor) return;
    const r = new Ctor();
    r.lang = lang;
    r.interimResults = false;
    r.maxAlternatives = 1;
    r.onresult = (e) => {
      const text = e.results[0]?.[0]?.transcript?.trim();
      if (text) onTextRef.current(text);
    };
    r.onerror = () => setListening(false);
    r.onend = () => setListening(false);
    rec.current = r;
    setListening(true);
    try {
      r.start();
    } catch {
      setListening(false);
    }
  }, []);

  const stop = useCallback(() => rec.current?.stop(), []);
  return { supported, listening, start, stop };
}
