import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <p className="font-display text-6xl text-brand-gradient">404</p>
        <h1 className="mt-3 text-3xl">Nothing but water here.</h1>
        <p className="mt-2 text-foam/70">That page drifted away.</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full bg-brand-gradient px-6 py-2.5 text-lg text-white transition-transform hover:scale-105 active:scale-95"
        >
          Back to the sea
        </Link>
      </div>
    </main>
  );
}
