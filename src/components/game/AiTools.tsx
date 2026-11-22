"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { suggestSubtasks, understandTask } from "@/ai/actions";
import type { Subtask } from "@/ai/subtasks";
import type { AiResult } from "@/ai/types";
import { endOfDay, toDateInput } from "@/game/due";
import type { Priority } from "@/game/types";
import { count } from "@/lib/analytics";
import { useAi } from "@/lib/useAi";
import { useSpeech, type SpeechLang } from "@/lib/useSpeech";
import { AiConsent } from "./AiConsent";
import { SplitPreview } from "./SplitPreview";

const noopSubscribe = () => () => {};

type Phase = "idle" | "consent" | "loading" | "preview" | "error";
type Job = { kind: "split" | "fill"; text: string };

export interface Filled {
  title: string;
  priority: Priority;
  dueAt: number | null;
}

const ERRORS: Record<Extract<AiResult<unknown>, { ok: false }>["reason"], string> = {
  disabled: "AI is switched off right now.",
  "signed-out": "Add a task first, then try again.",
  invalid: "Type a shorter task and try again.",
  "rate-limited": "You've used today's AI suggestions. Try again tomorrow.",
  error: "The AI didn't answer. Try again.",
};

const chip =
  "rounded-full border border-brand-pink/40 px-3 py-1 text-xs text-foam/80 transition hover:text-foam disabled:opacity-40";

/**
 * The AI helpers under the new-task box: split a task into steps, fill the
 * form from a sentence, or speak it. All of them only fill in or preview;
 * the player still presses Grow.
 */
export function AiTools({
  title,
  onFill,
  onGrowSteps,
}: {
  title: string;
  onFill: (filled: Filled) => void;
  onGrowSteps: (steps: Subtask[]) => void;
}) {
  const ai = useAi();
  const [phase, setPhase] = useState<Phase>("idle");
  const [steps, setSteps] = useState<Subtask[]>([]);
  const [error, setError] = useState("");
  const browserLang = useSyncExternalStore<SpeechLang>(
    noopSubscribe,
    () => (navigator.language.toLowerCase().startsWith("ar") ? "ar-EG" : "en-US"),
    () => "en-US",
  );
  const [picked, setPicked] = useState<SpeechLang | null>(null);
  const lang = picked ?? browserLang;
  const pending = useRef<Job | null>(null);

  const fail = (reason: keyof typeof ERRORS) => {
    setError(ERRORS[reason]);
    setPhase("error");
  };

  /** Calls the model for one job. The caller has checked consent. */
  const execute = async (job: Job) => {
    setPhase("loading");
    count("ai_used", { feature: job.kind });
    if (job.kind === "split") {
      const res = await suggestSubtasks(job.text.trim());
      if (!res.ok) return fail(res.reason);
      setSteps(res.data);
      return setPhase("preview");
    }
    const res = await understandTask(job.text.trim(), toDateInput(Date.now()));
    if (!res.ok) return fail(res.reason);
    const { title: t, priority, due } = res.data;
    onFill({ title: t, priority, dueAt: due ? endOfDay(due) : null });
    setPhase("idle");
  };

  const run = async (job: Job) => {
    if (!job.text.trim()) return;
    if (ai.consent !== "yes") {
      pending.current = job;
      return setPhase("consent");
    }
    await execute(job);
  };

  const speech = useSpeech((text) => void run({ kind: "fill", text }));

  if (!ai.available || ai.consent === "no") return null;

  const decide = (value: "yes" | "no") => {
    ai.setConsent(value);
    const job = pending.current;
    pending.current = null;
    setPhase("idle");
    if (value === "yes" && job) void execute(job);
  };

  const busy = phase === "loading";

  return (
    <div className="space-y-2">
      {(phase === "idle" || phase === "error") && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={chip}
            disabled={!title.trim() || busy}
            onClick={() => run({ kind: "split", text: title })}
          >
            ✨ Split with AI
          </button>
          <button
            type="button"
            className={chip}
            disabled={!title.trim() || busy}
            onClick={() => run({ kind: "fill", text: title })}
          >
            ✨ Fill details
          </button>
          {speech.supported && (
            <>
              <button
                type="button"
                className={chip}
                aria-pressed={speech.listening}
                aria-label={speech.listening ? "Stop listening" : "Speak a task"}
                onClick={() => (speech.listening ? speech.stop() : speech.start(lang))}
              >
                {speech.listening ? "● Listening…" : "🎤 Speak"}
              </button>
              <button
                type="button"
                className={chip}
                aria-label={`Speech language: ${lang === "ar-EG" ? "Arabic" : "English"}. Switch`}
                onClick={() => setPicked(lang === "ar-EG" ? "en-US" : "ar-EG")}
              >
                {lang === "ar-EG" ? "ع" : "EN"}
              </button>
            </>
          )}
        </div>
      )}
      {phase === "consent" && (
        <AiConsent onAllow={() => decide("yes")} onDecline={() => decide("no")} />
      )}
      {busy && (
        <p className="px-1 text-xs text-foam/60" role="status">
          Thinking…
        </p>
      )}
      {phase === "error" && (
        <p className="px-1 text-xs text-rose-300" role="alert">
          {error}
        </p>
      )}
      {phase === "preview" && (
        <SplitPreview
          steps={steps}
          onGrow={(picked) => {
            onGrowSteps(picked);
            setPhase("idle");
          }}
          onCancel={() => setPhase("idle")}
        />
      )}
    </div>
  );
}
