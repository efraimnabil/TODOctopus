"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <p className="font-display text-4xl text-brand-gradient">Oops</p>
        <h1 className="mt-3 text-3xl">The octopus knocked something over.</h1>
        <p className="mt-2 text-foam/70">Your tasks are safe. Try again, or head back to the start.</p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => retry()}
            className="rounded-full bg-brand-gradient px-6 py-2.5 text-lg text-white transition-transform hover:scale-105 active:scale-95"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-full border border-white/20 px-6 py-2.5 text-lg text-foam hover:bg-white/10"
          >
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
