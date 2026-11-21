"use client";

import { useRef, useState, type SubmitEvent } from "react";
import { suggestSubtasks } from "@/ai/actions";
import type { Subtask } from "@/ai/subtasks";
import type { AiResult } from "@/ai/types";
import { TITLE_MAX, nextHome } from "@/game/rules";
import type { Priority } from "@/game/types";
import { useAi } from "@/lib/useAi";
import { AiConsent } from "./AiConsent";
import { DueField } from "./DueField";
import { SplitPreview } from "./SplitPreview";
import { PriorityPicker } from "./PriorityPicker";
import { useGame } from "./GameProvider";

type SplitPhase = "idle" | "consent" | "loading" | "preview" | "error";

const AI_ERRORS: Record<Extract<AiResult<unknown>, { ok: false }>["reason"], string> = {
  disabled: "AI is switched off right now.",
  "signed-out": "Add a task first, then try again.",
  invalid: "Type a shorter task and try again.",
  "rate-limited": "You've used today's AI suggestions. Try again tomorrow.",
  error: "The AI didn't answer. Try again.",
};

export function AddTaskForm() {
  const addTask = useGame((s) => s.addTask);
  const home = useGame((s) => nextHome(s.game));
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>(2);
  const [dueAt, setDueAt] = useState<number | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const ai = useAi();
  const [phase, setPhase] = useState<SplitPhase>("idle");
  const [steps, setSteps] = useState<Subtask[]>([]);
  const [aiError, setAiError] = useState("");

  const split = async () => {
    if (!title.trim()) return;
    if (ai.consent !== "yes") return setPhase("consent");
    setPhase("loading");
    const res = await suggestSubtasks(title.trim());
    if (res.ok) {
      setSteps(res.data);
      setPhase("preview");
    } else {
      setAiError(AI_ERRORS[res.reason]);
      setPhase("error");
    }
  };

  const grow = (picked: Subtask[]) => {
    for (const s of picked) addTask({ title: s.title, priority: s.priority, dueAt });
    setTitle("");
    setDueAt(null);
    setPhase("idle");
    input.current?.focus();
  };

  const submit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (addTask({ title, priority, dueAt })) {
      setTitle("");
      setDueAt(null);
    }
    input.current?.focus();
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <input
        ref={input}
        id="new-task"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="New task → new tentacle"
        maxLength={TITLE_MAX}
        aria-label="New task"
        autoComplete="off"
        className="w-full rounded-full border border-brand-pink/60 bg-transparent px-4 py-2 text-foam placeholder-foam/60 outline-none focus:ring-2 focus:ring-brand-pink/60"
      />
      <div className="flex items-center justify-between gap-2">
        <PriorityPicker value={priority} onChange={setPriority} />
        <button
          type="submit"
          disabled={!title.trim()}
          className="rounded-full bg-brand-gradient px-4 py-1.5 text-sm text-white transition disabled:opacity-40"
        >
          Grow
        </button>
      </div>
      <DueField value={dueAt} onChange={setDueAt} />
      {ai.available && ai.consent !== "no" && phase === "idle" && (
        <button
          type="button"
          disabled={!title.trim()}
          onClick={split}
          className="rounded-full border border-brand-pink/40 px-3 py-1 text-xs text-foam/80 transition hover:text-foam disabled:opacity-40"
        >
          ✨ Split with AI
        </button>
      )}
      {phase === "consent" && (
        <AiConsent
          onAllow={() => {
            ai.setConsent("yes");
            setPhase("idle");
          }}
          onDecline={() => {
            ai.setConsent("no");
            setPhase("idle");
          }}
        />
      )}
      {phase === "loading" && (
        <p className="px-1 text-xs text-foam/60" role="status">
          Thinking…
        </p>
      )}
      {phase === "error" && (
        <p className="px-1 text-xs text-rose-300" role="alert">
          {aiError}{" "}
          <button type="button" className="underline" onClick={() => setPhase("idle")}>
            Dismiss
          </button>
        </p>
      )}
      {phase === "preview" && (
        <SplitPreview steps={steps} onGrow={grow} onCancel={() => setPhase("idle")} />
      )}
      <p className="px-1 text-xs text-foam/60" aria-live="polite">
        {home ? (
          <>
            Grows on <span className="text-foam/70">{home.name}</span>
          </>
        ) : (
          "Summons a new octopus"
        )}
      </p>
    </form>
  );
}
