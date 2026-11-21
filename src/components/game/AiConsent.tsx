"use client";

import Link from "next/link";

/** One-time question before any task text is sent to the AI model. */
export function AiConsent({
  onAllow,
  onDecline,
}: {
  onAllow: () => void;
  onDecline: () => void;
}) {
  return (
    <div
      role="group"
      aria-label="AI consent"
      className="glass space-y-2 rounded-2xl p-3 text-xs text-foam/80"
    >
      <p>
        AI features send the text you type (a task title) to Anthropic&rsquo;s Claude model to
        get a suggestion. Nothing else leaves your octopus.{" "}
        <Link href="/about#ai" className="underline">
          Details
        </Link>
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onAllow}
          className="rounded-full bg-brand-gradient px-3 py-1 text-white"
        >
          Allow
        </button>
        <button type="button" onClick={onDecline} className="rounded-full px-3 py-1 text-foam/60">
          No thanks
        </button>
      </div>
    </div>
  );
}
