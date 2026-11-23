"use client";

import { useRef, useState } from "react";
import { suggestSubtasks, understandTask } from "@/ai/actions";
import type { Subtask } from "@/ai/subtasks";
import type { AiResult } from "@/ai/types";
import { endOfDay, toDateInput } from "@/game/due";
import type { Priority } from "@/game/types";
import { count } from "@/lib/analytics";
import { useAi } from "@/lib/useAi";
import { AiConsent } from "./AiConsent";
import { CloseIcon, SparkIcon } from "./icons";
import { SplitPreview } from "./SplitPreview";

type Phase = "idle" | "consent" | "loading" | "preview" | "error";
export type AiJob = { kind: "split" | "fill"; text: string };

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

/**
 * The AI helpers for the new-task box: split a task into steps, or fill the
 * form from a sentence. They only fill in or preview; the player still
 * presses Grow.
 */
export function useAiAssist({
  onFill,
  onGrowSteps,
}: {
  onFill: (filled: Filled) => void;
  onGrowSteps: (steps: Subtask[]) => void;
}) {
  const ai = useAi();
  const [phase, setPhase] = useState<Phase>("idle");
  const [job, setJob] = useState<AiJob | null>(null);
  const [steps, setSteps] = useState<Subtask[]>([]);
  const [error, setError] = useState("");
  const pending = useRef<AiJob | null>(null);

  const fail = (reason: keyof typeof ERRORS) => {
    setError(ERRORS[reason]);
    setPhase("error");
  };

  /** Calls the model for one job. The caller has checked consent. */
  const execute = async (j: AiJob) => {
    setJob(j);
    setPhase("loading");
    count("ai_used", { feature: j.kind });
    if (j.kind === "split") {
      const res = await suggestSubtasks(j.text.trim());
      if (!res.ok) return fail(res.reason);
      setSteps(res.data);
      return setPhase("preview");
    }
    const res = await understandTask(j.text.trim(), toDateInput(Date.now()));
    if (!res.ok) return fail(res.reason);
    const { title, priority, due } = res.data;
    onFill({ title, priority, dueAt: due ? endOfDay(due) : null });
    setPhase("idle");
  };

  const run = async (j: AiJob) => {
    if (!j.text.trim() || phase === "loading") return;
    if (ai.consent !== "yes") {
      pending.current = j;
      return setPhase("consent");
    }
    await execute(j);
  };

  const decide = (value: "yes" | "no") => {
    ai.setConsent(value);
    const j = pending.current;
    pending.current = null;
    setPhase("idle");
    if (value === "yes" && j) void execute(j);
  };

  const reset = () => setPhase("idle");

  const panel = (
    <>
      {phase === "consent" && (
        <AiConsent onAllow={() => decide("yes")} onDecline={() => decide("no")} />
      )}
      {phase === "loading" && (
        <p className="flex items-center gap-2 px-1 text-xs text-foam/70" role="status">
          <span className="size-3 animate-spin rounded-full border-2 border-brand-pink/30 border-t-brand-pink" />
          {job?.kind === "split" ? "Splitting it into steps…" : "Reading your task…"}
        </p>
      )}
      {phase === "error" && (
        <p
          className="flex items-start gap-2 rounded-xl bg-rose-500/10 px-3 py-2 text-xs text-rose-200"
          role="alert"
        >
          <span className="flex-1">{error}</span>
          <button type="button" onClick={reset} aria-label="Dismiss" className="text-rose-200/70 hover:text-rose-100">
            <CloseIcon size={12} />
          </button>
        </p>
      )}
      {phase === "preview" && (
        <SplitPreview
          steps={steps}
          onGrow={(picked) => {
            onGrowSteps(picked);
            setPhase("idle");
          }}
          onCancel={reset}
        />
      )}
    </>
  );

  return {
    /** The server has a model and the player hasn't said no. */
    enabled: ai.available && ai.consent !== "no",
    busy: phase === "loading",
    /** Something is open below the box (consent, a preview…). */
    open: phase !== "idle",
    run,
    panel,
  };
}

const chip =
  "flex items-center gap-1.5 rounded-full bg-brand-pink/10 px-2.5 py-1 text-xs text-foam/85 ring-1 ring-brand-pink/30 transition hover:bg-brand-pink/20 hover:text-foam disabled:opacity-40";

/** The two AI actions, offered once there is something typed. */
export function AiChips({
  text,
  busy,
  onRun,
}: {
  text: string;
  busy: boolean;
  onRun: (job: AiJob) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button type="button" className={chip} disabled={busy} onClick={() => onRun({ kind: "split", text })}>
        <SparkIcon size={12} /> Split into steps
      </button>
      <button type="button" className={chip} disabled={busy} onClick={() => onRun({ kind: "fill", text })}>
        <SparkIcon size={12} /> Fill details
      </button>
    </div>
  );
}
