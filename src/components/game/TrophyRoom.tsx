"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { computeStats } from "@/game/rules";
import { trophies } from "@/game/view";
import { GameProvider, useGame } from "./GameProvider";

export default function TrophyRoom() {
  return (
    <GameProvider>
      <Room />
    </GameProvider>
  );
}

const subscribeMinute = (cb: () => void) => {
  const t = window.setInterval(cb, 15_000);
  return () => window.clearInterval(t);
};
const currentMinute = () => Math.floor(Date.now() / 60_000);

function Room() {
  const ready = useGame((s) => s.status === "ready");
  const game = useGame((s) => s.game);
  const minute = useSyncExternalStore(subscribeMinute, currentMinute, currentMinute);
  const stats = useMemo(() => computeStats(game, minute * 60_000), [game, minute]);
  const list = useMemo(() => trophies(game), [game]);

  return (
    <main id="main" className="mx-auto max-w-3xl px-5 py-10 md:py-16">
      <div className="flex items-center justify-between">
        <Link href="/" className="font-display text-2xl tracking-widest text-brand-gradient">
          TODOctopus
        </Link>
        <Link href="/play" className="rounded-full px-3 py-1.5 text-sm text-foam/70 hover:bg-white/10 hover:text-foam">
          Back to the sea
        </Link>
      </div>
      <h1 className="mt-8 text-4xl md:text-5xl">Trophy room</h1>

      {!ready ? (
        <p className="mt-8 animate-pulse text-foam/60">Loading…</p>
      ) : (
        <>
          <dl className="mt-6 grid grid-cols-3 gap-3 text-center">
            <Stat label="Defeated" value={stats.killed} />
            <Stat label="Tentacles slashed" value={stats.finished} />
            <Stat label="Day streak" value={stats.streak} />
          </dl>

          {list.length === 0 ? (
            <div className="glass mt-8 rounded-3xl p-8 text-center">
              <p className="text-2xl">No trophies yet</p>
              <p className="mt-2 text-foam/65">
                Slash every tentacle of an octopus and it will be mounted here.
              </p>
              <Link
                href="/play"
                className="mt-6 inline-block rounded-full bg-brand-gradient px-6 py-2.5 text-lg text-white transition-transform hover:scale-105 active:scale-95"
              >
                Go hunting
              </Link>
            </div>
          ) : (
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {list.map((t) => (
                <li key={t.octopusId} className="glass rounded-3xl p-5">
                  <div className="flex items-baseline justify-between gap-2">
                    <h2 className="truncate text-2xl text-brand-gradient">{t.name}</h2>
                    <time
                      dateTime={new Date(t.defeatedAt).toISOString()}
                      className="shrink-0 text-xs text-foam/55"
                    >
                      {new Date(t.defeatedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </time>
                  </div>
                  <p className="mt-1 text-xs tracking-[0.2em] text-foam/50 uppercase">
                    {t.tasks.length} {t.tasks.length === 1 ? "tentacle" : "tentacles"}
                  </p>
                  <ul className="mt-3 space-y-0.5 text-sm text-foam/70">
                    {t.tasks.map((task) => (
                      <li key={task.id} className="truncate line-through decoration-foam/30">
                        {task.title}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass rounded-2xl px-2 py-4">
      <dd className="text-3xl text-brand-gradient">{value}</dd>
      <dt className="mt-1 text-xs text-foam/60">{label}</dt>
    </div>
  );
}
