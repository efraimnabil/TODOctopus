"use client";

import { useEffect, useRef, useState, type SubmitEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { useGame } from "./GameProvider";

type Mode = "sign-up" | "sign-in";

/** Top-right: save progress / sign in for guests, the account for members. */
export function AccountMenu() {
  const account = useGame((s) => s.account);
  const pending = useGame((s) => s.pending);
  const hasTasks = useGame((s) => s.game.tasks.length > 0);
  const reload = useGame((s) => s.reload);
  const [dialog, setDialog] = useState<Mode | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const member = account && !account.isGuest;

  return (
    <div className="absolute top-4 right-4 flex items-center gap-2 md:top-6 md:right-6">
      {pending > 0 && (
        <span className="text-xs text-foam/45" aria-live="polite">
          Saving…
        </span>
      )}
      {member ? (
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label="Account"
            className="glass grid size-10 place-items-center rounded-full text-lg text-foam uppercase"
          >
            {(account.name || account.email || "?").slice(0, 1)}
          </button>
          {menuOpen && (
            <div className="glass absolute top-12 right-0 w-56 rounded-2xl p-3 text-sm">
              <p className="truncate text-foam">{account.name}</p>
              <p className="truncate text-xs text-foam/55">{account.email}</p>
              <button
                onClick={async () => {
                  setMenuOpen(false);
                  await authClient.signOut();
                  await reload();
                }}
                className="mt-3 w-full rounded-full bg-white/10 px-3 py-1.5 text-foam hover:bg-white/15"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          <button
            onClick={() => setDialog("sign-in")}
            className="rounded-full px-3 py-1.5 text-sm text-foam/70 hover:bg-white/10 hover:text-foam"
          >
            Sign in
          </button>
          {hasTasks && (
            <button
              onClick={() => setDialog("sign-up")}
              className="rounded-full bg-brand-gradient px-4 py-1.5 text-sm text-white shadow-lg transition-transform hover:scale-105"
            >
              Save your progress
            </button>
          )}
        </>
      )}
      {dialog && (
        <AuthDialog
          mode={dialog}
          onMode={setDialog}
          onClose={() => setDialog(null)}
          onDone={async () => {
            setDialog(null);
            await reload();
          }}
        />
      )}
    </div>
  );
}

function AuthDialog({
  mode,
  onMode,
  onClose,
  onDone,
}: {
  mode: Mode;
  onMode: (m: Mode) => void;
  onClose: () => void;
  onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const signUp = mode === "sign-up";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = signUp
      ? await authClient.signUp.email({ name: name.trim() || email.split("@")[0], email, password })
      : await authClient.signIn.email({ email, password });
    setBusy(false);
    if (error) setError(error.message ?? "That didn't work. Try again.");
    else onDone();
  };

  return (
    <div
      className="fixed inset-0 z-10 grid place-items-center bg-abyss/60 p-4"
      onMouseDown={(e) => {
        if (!panel.current?.contains(e.target as Node)) onClose();
      }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        className="glass w-full max-w-sm rounded-3xl p-6"
      >
        <h2 id="auth-title" className="text-2xl">
          {signUp ? "Save your progress" : "Welcome back"}
        </h2>
        <p className="mt-1 text-sm text-foam/60">
          {signUp
            ? "Your octopuses come with you, on any device."
            : "Anything you did as a guest here joins your account."}
        </p>
        <form onSubmit={submit} className="mt-5 space-y-3">
          {signUp && (
            <Field label="Name (optional)" value={name} onChange={setName} autoComplete="name" />
          )}
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            required
            autoFocus
          />
          <Field
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete={signUp ? "new-password" : "current-password"}
            minLength={8}
            required
          />
          {error && (
            <p role="alert" className="text-sm text-rose-300">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-brand-gradient px-4 py-2.5 text-white disabled:opacity-50"
          >
            {busy ? "One moment…" : signUp ? "Create account" : "Sign in"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-foam/60">
          {signUp ? "Already have an account? " : "New here? "}
          <button
            onClick={() => {
              setError(null);
              onMode(signUp ? "sign-in" : "sign-up");
            }}
            className="text-foam underline decoration-foam/40 hover:decoration-foam"
          >
            {signUp ? "Sign in" : "Create one"}
          </button>
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  onChange,
  ...input
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  autoFocus?: boolean;
  minLength?: number;
}) {
  return (
    <label className="block text-sm">
      <span className="text-foam/70">{label}</span>
      <input
        {...input}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-white/15 bg-abyss/50 px-3 py-2 text-foam outline-none focus:ring-2 focus:ring-brand-pink/60"
      />
    </label>
  );
}
