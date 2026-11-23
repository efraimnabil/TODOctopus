"use client";

import { useRef, useState, useSyncExternalStore, type SubmitEvent } from "react";
import type { Subtask } from "@/ai/subtasks";
import { TITLE_MAX, nextHome } from "@/game/rules";
import type { Priority } from "@/game/types";
import { useSpeech, type SpeechError, type SpeechLang } from "@/lib/useSpeech";
import { AiChips, useAiAssist } from "./AiTools";
import { DueField } from "./DueField";
import { PriorityPicker } from "./PriorityPicker";
import { useGame } from "./GameProvider";
import { MicIcon, PlusIcon, StopIcon } from "./icons";

const noopSubscribe = () => () => {};
const LANG_KEY = "todoctopus:speech-lang";

const SPEECH_ERRORS: Record<SpeechError, string> = {
  denied: "The microphone is blocked. Allow it in your browser's site settings, then try again.",
  "no-speech": "Didn't catch anything. Tap the mic and try again.",
  failed: "Voice input stopped working. Check your connection and try again.",
};

function savedLang(): SpeechLang | null {
  try {
    const v = localStorage.getItem(LANG_KEY);
    return v === "ar-EG" || v === "en-US" ? v : null;
  } catch {
    return null;
  }
}

/** Type (or say) a task, set its priority and deadline, and grow it. */
export function AddTaskForm() {
  const addTask = useGame((s) => s.addTask);
  const home = useGame((s) => nextHome(s.game));
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>(2);
  const [dueAt, setDueAt] = useState<number | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const reset = () => {
    setTitle("");
    setDueAt(null);
    input.current?.focus();
  };

  const ai = useAiAssist({
    onFill: (f) => {
      setTitle(f.title);
      setPriority(f.priority);
      setDueAt(f.dueAt);
      input.current?.focus();
    },
    onGrowSteps: (steps: Subtask[]) => {
      for (const s of steps) addTask({ title: s.title, priority: s.priority, dueAt });
      reset();
    },
  });

  const browserLang = useSyncExternalStore<SpeechLang>(
    noopSubscribe,
    () => savedLang() ?? (navigator.language.toLowerCase().startsWith("ar") ? "ar-EG" : "en-US"),
    () => "en-US",
  );
  const [picked, setPicked] = useState<SpeechLang | null>(null);
  const lang = picked ?? browserLang;
  const switchLang = () => {
    const next = lang === "ar-EG" ? "en-US" : "ar-EG";
    setPicked(next);
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {
      // Not remembered; fine for this visit.
    }
  };

  const speech = useSpeech({
    onInterim: (text) => setTitle(text.slice(0, TITLE_MAX)),
    onFinal: (text) => {
      const said = text.slice(0, TITLE_MAX);
      setTitle(said);
      input.current?.focus();
      // A spoken sentence ("call mom tomorrow, it's urgent") is what Fill is for.
      if (ai.enabled) void ai.run({ kind: "fill", text: said });
    },
  });

  const submit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (speech.listening) speech.stop();
    if (!title.trim()) return;
    if (addTask({ title, priority, dueAt })) reset();
    else input.current?.focus();
  };

  const typed = title.trim().length > 0;
  const listening = speech.listening;

  return (
    <div className="space-y-2">
      <form
        onSubmit={submit}
        className={`rounded-2xl bg-abyss/45 p-1.5 ring-1 transition ${
          listening
            ? "ring-2 ring-rose-400/70"
            : "ring-white/12 focus-within:ring-2 focus-within:ring-brand-pink/60"
        }`}
      >
        <div className="flex items-center gap-1">
          <input
            ref={input}
            id="new-task"
            dir="auto"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              speech.clearError();
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape" && (title || listening)) {
                e.stopPropagation();
                if (listening) speech.stop();
                setTitle("");
              }
            }}
            placeholder={listening ? "Listening…" : "What needs doing?"}
            maxLength={TITLE_MAX}
            aria-label="New task"
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent px-2.5 py-2 text-foam placeholder-foam/45 outline-none focus-visible:outline-none"
          />
          {speech.supported && (
            <>
              <button
                type="button"
                onClick={switchLang}
                disabled={listening}
                aria-label={`Voice language: ${lang === "ar-EG" ? "Arabic" : "English"}. Switch`}
                title={`Voice language: ${lang === "ar-EG" ? "Arabic" : "English"} (click to switch)`}
                className="grid h-8 min-w-8 shrink-0 place-items-center rounded-full px-1.5 text-xs text-foam/55 hover:bg-white/10 hover:text-foam disabled:opacity-40"
              >
                {lang === "ar-EG" ? "ع" : "EN"}
              </button>
              <button
                type="button"
                aria-pressed={listening}
                aria-label={listening ? "Stop listening" : "Speak a task"}
                title={listening ? "Stop listening" : "Speak a task"}
                onClick={() => (listening ? speech.stop() : speech.start(lang))}
                className={`relative grid size-9 shrink-0 place-items-center rounded-full transition ${
                  listening
                    ? "bg-rose-500 text-white"
                    : "text-foam/70 hover:bg-white/10 hover:text-foam"
                }`}
              >
                {listening && (
                  <span className="absolute inset-0 animate-ping rounded-full bg-rose-500/40" aria-hidden />
                )}
                {listening ? <StopIcon size={14} /> : <MicIcon size={17} />}
              </button>
            </>
          )}
          <button
            type="submit"
            disabled={!typed}
            className="flex shrink-0 items-center gap-1 rounded-xl bg-brand-gradient py-2 pr-3.5 pl-2.5 text-sm text-white shadow-md transition hover:brightness-110 active:scale-95 disabled:opacity-35 disabled:shadow-none"
          >
            <PlusIcon size={15} />
            Grow
          </button>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-1.5 border-t border-white/8 px-1 pt-1.5">
          <PriorityPicker value={priority} onChange={setPriority} />
          <DueField value={dueAt} onChange={setDueAt} />
        </div>
      </form>

      {listening && (
        <p className="flex items-center gap-2 px-1 text-xs text-rose-200" role="status">
          <span className="flex h-3 items-end gap-0.5" aria-hidden>
            {[0, 150, 300].map((d) => (
              <span
                key={d}
                className="w-0.5 animate-pulse rounded-full bg-rose-300"
                style={{ height: "100%", animationDelay: `${d}ms` }}
              />
            ))}
          </span>
          Listening{lang === "ar-EG" ? " (Arabic)" : ""}. Pause when you&rsquo;re done, or tap stop.
        </p>
      )}
      {speech.error && !listening && (
        <p className="px-1 text-xs text-rose-300" role="alert">
          {SPEECH_ERRORS[speech.error]}
        </p>
      )}

      {ai.enabled && typed && !listening && !ai.open && (
        <AiChips text={title} busy={ai.busy} onRun={(j) => void ai.run(j)} />
      )}
      {ai.panel}

      <p className="px-1 text-xs text-foam/45" aria-live="polite">
        {home ? (
          <>
            Grows a tentacle on <span className="text-foam/70">{home.name}</span>
          </>
        ) : (
          "Summons a new octopus"
        )}
      </p>
    </div>
  );
}
