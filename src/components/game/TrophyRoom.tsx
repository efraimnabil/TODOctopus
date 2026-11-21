"use client";

import { useMemo } from "react";
import Link from "next/link";
import { achievements, activity } from "@/game/achievements";
import { computeStats } from "@/game/rules";
import { trophies } from "@/game/view";
import { useNow } from "@/lib/useNow";
import { GameProvider, useGame } from "./GameProvider";

export default function TrophyRoom() {
  return (
    <GameProvider>
      <Room />
    </GameProvider>
  );
}

function Room() {
  const ready = useGame((s) => s.status === "ready");
  const game = useGame((s) => s.game);
  const now = useNow();
  const stats = useMemo(() => computeStats(game, now), [game, now]);
  const list = useMemo(() => trophies(game), [game]);
  const badges = useMemo(() => achievements(game), [game]);
  const days = useMemo(() => activity(game, now, 14), [game, now]);

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

          <Activity days={days} />

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
          <h2 className="mt-12 text-2xl">
            Achievements{" "}
            <span className="text-base text-foam/60">
              {badges.filter((b) => b.earned).length} / {badges.length}
            </span>
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {badges.map((b) => (
              <li
                key={b.id}
                className={`glass flex items-start gap-3 rounded-2xl p-4 ${b.earned ? "" : "opacity-60"}`}
              >
                <span className={`text-3xl ${b.earned ? "" : "grayscale"}`} aria-hidden>
                  {b.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg leading-tight">
                    {b.title}
                    {b.earned && <span className="sr-only"> (earned)</span>}
                  </h3>
                  <p className="text-sm text-foam/70">{b.description}</p>
                  {!b.earned && b.progress && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-foam/60">
                      <div
                        className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={b.progress.need}
                        aria-valuenow={b.progress.have}
                        aria-label={b.title}
                      >
                        <div
                          className="h-full bg-brand-gradient"
                          style={{ width: `${(b.progress.have / b.progress.need) * 100}%` }}
                        />
                      </div>
                      {b.progress.have}/{b.progress.need}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
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

/** Tentacles slashed per day, last two weeks. */
function Activity({ days }: { days: { day: number; count: number }[] }) {
  const max = Math.max(1, ...days.map((d) => d.count));
  const total = days.reduce((n, d) => n + d.count, 0);
  return (
    <section aria-label="Activity" className="glass mt-6 rounded-3xl p-5">
      <h2 className="text-sm tracking-[0.2em] text-foam/60 uppercase">
        Last 14 days · {total} slashed
      </h2>
      <ol className="mt-4 flex h-24 items-end gap-1.5">
        {days.map((d) => {
          const label = new Date(d.day).toLocaleDateString(undefined, { month: "short", day: "numeric" });
          return (
            <li
              key={d.day}
              className="flex h-full flex-1 flex-col justify-end"
              title={`${label}: ${d.count}`}
            >
              <span className="sr-only">
                {label}: {d.count}
              </span>
              <div
                aria-hidden
                className={d.count ? "rounded-t bg-brand-gradient" : "rounded-t bg-white/10"}
                style={{ height: d.count ? `${Math.max(8, (d.count / max) * 100)}%` : "4px" }}
              />
            </li>
          );
        })}
      </ol>
    </section>
  );
}
