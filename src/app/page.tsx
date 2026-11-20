import Link from "next/link";
import { HeroLoader } from "@/components/landing/HeroLoader";
import { SoundToggle } from "@/components/SoundToggle";

export default function Home() {
  return (
    <main>
      <section className="relative h-dvh min-h-[34rem] w-full overflow-hidden bg-abyss">
        <HeroLoader />

        <nav
          aria-label="Main"
          className="absolute inset-x-0 top-0 flex items-center justify-between p-4 md:p-6"
        >
          <span className="font-display text-xl tracking-widest text-brand-gradient md:text-3xl">
            TODOctopus
          </span>
          <div className="flex items-center gap-1 text-sm">
            <Link href="/trophies" className="rounded-full px-2 py-1.5 text-foam/70 md:px-3 hover:bg-white/10 hover:text-foam">
              Trophies
            </Link>
            <Link href="/about" className="rounded-full px-2 py-1.5 text-foam/70 md:px-3 hover:bg-white/10 hover:text-foam">
              About
            </Link>
            <SoundToggle className="px-2 py-1.5 md:px-3" />
          </div>
        </nav>

        <div className="pointer-events-none absolute inset-x-0 top-[13%] px-5 text-center">
          <h1 className="text-4xl leading-tight text-balance drop-shadow-lg md:text-6xl">
            Every task is a <span className="text-brand-gradient">tentacle</span>.
          </h1>
          <p className="mx-auto mt-3 max-w-md text-lg text-foam/80 text-balance drop-shadow md:text-xl">
            Finish one and slash it off. Slash them all to defeat the octopus.
          </p>
        </div>

        <div className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-3 px-5 text-center md:bottom-10">
          <Link
            href="/play"
            className="rounded-full bg-brand-gradient px-9 py-3.5 text-xl text-white shadow-xl transition-transform hover:scale-105 active:scale-95"
          >
            Let&rsquo;s start
          </Link>
          <p className="text-sm text-foam/60">
            Try it: click or swipe a tentacle · No sign-up needed
          </p>
        </div>
      </section>

      <section aria-labelledby="how" className="mx-auto max-w-4xl px-5 py-16 md:py-24">
        <h2 id="how" className="text-center text-3xl md:text-4xl">
          How it works
        </h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            ["1", "Add a task", "Each task grows a tentacle on an octopus. Eight tentacles fill an octopus; the next task summons a new one."],
            ["2", "Slash it when it's done", "Click or swipe the tentacle, or hit Slash in the list. It's cut off with a satisfying splash."],
            ["3", "Defeat the octopus", "Cut every tentacle and the octopus is defeated. It joins your trophy room and your streak grows."],
          ].map(([n, title, text]) => (
            <li key={n} className="glass rounded-3xl p-6">
              <span className="font-display text-4xl text-brand-gradient">{n}</span>
              <h3 className="mt-2 text-xl">{title}</h3>
              <p className="mt-2 text-foam/70">{text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-12 text-center">
          <Link
            href="/play"
            className="rounded-full bg-brand-gradient px-8 py-3 text-lg text-white transition-transform hover:scale-105 active:scale-95"
          >
            Meet your first octopus
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 px-5 py-6 text-center text-sm text-foam/50">
        <Link href="/about" className="hover:text-foam">About</Link>
        {" · "}
        <Link href="/lab" className="hover:text-foam">Octopus Lab</Link>
        {" · "}
        <a href="https://github.com/efraimnabil/TODOctopus" className="hover:text-foam">GitHub</a>
      </footer>
    </main>
  );
}
