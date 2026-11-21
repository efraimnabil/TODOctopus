"use client";

import Link from "next/link";
import { useEffect, useState, type SubmitEvent } from "react";
import { createApiToken, listApiTokens, revokeApiToken } from "@/mcp/actions";
import type { TokenInfo } from "@/mcp/tokens";

type View =
  | { kind: "loading" }
  | { kind: "blocked"; reason: "signed-out" | "guest" }
  | { kind: "ready"; tokens: TokenInfo[] };

const when = (ms: number | null) =>
  ms === null ? "never used" : `last used ${new Date(ms).toLocaleDateString()}`;

const MESSAGES = {
  limit: "You have the maximum number of tokens. Revoke one first.",
  "rate-limited": "Too many tokens created just now. Try again later.",
  invalid: "That name isn't valid.",
  "signed-out": "Sign in first.",
  guest: "Save your progress (create an account) first.",
} as const;

export function TokensPanel() {
  const [view, setView] = useState<View>({ kind: "loading" });
  const [label, setLabel] = useState("");
  const [fresh, setFresh] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let live = true;
    listApiTokens()
      .then((r) => {
        if (!live) return;
        setView(r.ok ? { kind: "ready", tokens: r.data } : { kind: "blocked", reason: r.reason as "signed-out" | "guest" });
      })
      .catch(() => live && setError("Couldn't load your tokens."));
    return () => {
      live = false;
    };
  }, []);

  const create = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const r = await createApiToken(label);
    if (!r.ok) return setError(MESSAGES[r.reason]);
    setFresh(r.data.token);
    setCopied(false);
    setLabel("");
    setView((v) => (v.kind === "ready" ? { kind: "ready", tokens: [...v.tokens, r.data.info] } : v));
  };

  const revoke = async (id: string) => {
    const r = await revokeApiToken(id);
    if (!r.ok) return setError(MESSAGES[r.reason as keyof typeof MESSAGES] ?? "Couldn't revoke it.");
    setView((v) => (v.kind === "ready" ? { kind: "ready", tokens: v.tokens.filter((t) => t.id !== id) } : v));
  };

  if (view.kind === "loading") {
    return (
      <p className="mt-8 text-foam/60" role="status">
        Loading…
      </p>
    );
  }

  if (view.kind === "blocked") {
    return (
      <p className="glass mt-8 rounded-2xl p-5 text-foam/80">
        {view.reason === "guest"
          ? "Tokens are for accounts, because a guest can't sign back in to revoke one. "
          : "Sign in to make a token. "}
        <Link href="/play" className="underline">
          Go to the game
        </Link>{" "}
        and use <strong>Save your progress</strong> or <strong>Sign in</strong>.
      </p>
    );
  }

  const command = (token: string) =>
    `claude mcp add --transport http todoctopus ${location.origin}/api/mcp --header "Authorization: Bearer ${token}"`;

  return (
    <div className="mt-8 space-y-8">
      {fresh && (
        <section className="glass space-y-3 rounded-2xl p-5" aria-label="New token">
          <h2 className="text-xl">Your new token</h2>
          <p className="text-sm text-foam/70">
            Copy it now. It is shown once and can&rsquo;t be recovered, only replaced.
          </p>
          <code className="block overflow-x-auto rounded-xl bg-abyss/60 p-3 text-sm break-all">{fresh}</code>
          <p className="text-sm text-foam/70">To connect Claude Code:</p>
          <code className="block overflow-x-auto rounded-xl bg-abyss/60 p-3 text-sm break-all">
            {command(fresh)}
          </code>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(fresh);
                  setCopied(true);
                } catch {
                  setError("Couldn't copy. Select the token and copy it by hand.");
                }
              }}
              className="rounded-full bg-brand-gradient px-4 py-1.5 text-white"
            >
              {copied ? "Copied" : "Copy token"}
            </button>
            <button type="button" onClick={() => setFresh(null)} className="rounded-full px-4 py-1.5 text-foam/70">
              Done
            </button>
          </div>
        </section>
      )}

      <section>
        <h2 className="text-2xl">Create a token</h2>
        <form onSubmit={create} className="mt-3 flex flex-wrap gap-2">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={40}
            placeholder="Name, e.g. Claude Code on my laptop"
            aria-label="Token name"
            className="min-w-0 flex-1 rounded-full border border-brand-pink/60 bg-transparent px-4 py-2 outline-none focus:ring-2 focus:ring-brand-pink/60"
          />
          <button type="submit" className="rounded-full bg-brand-gradient px-5 py-2 text-white">
            Create
          </button>
        </form>
        {error && (
          <p className="mt-2 text-sm text-rose-300" role="alert">
            {error}
          </p>
        )}
      </section>

      <section>
        <h2 className="text-2xl">Your tokens</h2>
        {view.tokens.length === 0 ? (
          <p className="mt-2 text-foam/60">No tokens yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {view.tokens.map((t) => (
              <li key={t.id} className="glass flex items-center justify-between gap-3 rounded-2xl px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-foam">{t.label}</p>
                  <p className="text-xs text-foam/55">
                    <code>{t.prefix}…</code> · {when(t.lastUsedAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => revoke(t.id)}
                  aria-label={`Revoke ${t.label}`}
                  className="rounded-full px-3 py-1 text-sm text-rose-300 hover:bg-white/10"
                >
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="text-sm text-foam/70">
        <h2 className="text-2xl text-foam">What can it do?</h2>
        <p className="mt-2">
          <code>list_tasks</code>, <code>add_task</code>, <code>slash_task</code>,{" "}
          <code>list_octopuses</code> and <code>get_stats</code>. It can&rsquo;t delete anything or
          touch your account. Ask Claude: &ldquo;add &lsquo;buy milk&rsquo; to my octopus&rdquo;.
        </p>
      </section>
    </div>
  );
}
