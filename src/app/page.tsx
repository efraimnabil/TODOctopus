import Image from "next/image";
import Link from "next/link";

// Temporary landing page until Phase 4 replaces it with the 3D hero.
export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4 py-16 text-center">
      <Image
        src="/brand/octopus.svg"
        alt=""
        width={253}
        height={235}
        priority
        unoptimized
        className="h-auto w-44 md:w-56"
      />
      <h1 className="text-4xl md:text-6xl">
        Welcome to{" "}
        <span className="font-display tracking-widest text-brand-gradient">
          TODOctopus
        </span>
      </h1>
      <p className="max-w-xl text-lg text-foam/80 md:text-xl">
        Every task is a tentacle. Finish it, slash it. Slash them all and the
        octopus is defeated.
      </p>
      <Link
        href="/lab"
        className="rounded-full bg-brand-gradient px-8 py-3 text-xl text-white transition-transform hover:scale-105 active:scale-95"
      >
        Enter the Octopus Lab
      </Link>
      <p className="text-sm text-foam/50">v2 in progress · Phase 1 prototype</p>
    </main>
  );
}
