import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description: "Who made TODOctopus, and why every task is a tentacle.",
};

const PEOPLE = [
  {
    role: "Original idea",
    people: [
      { name: "Efraim Nabil", href: "https://www.linkedin.com/in/efraimnabil/" },
      { name: "Heba Ezz", href: "https://www.linkedin.com/in/heba-ezz-361773250/" },
    ],
  },
  {
    role: "Front end",
    people: [
      { name: "Efraim Nabil", href: "https://www.linkedin.com/in/efraimnabil/" },
      { name: "GitHub", href: "https://github.com/efraimnabil" },
    ],
  },
  {
    role: "Back end (v1)",
    people: [
      { name: "Gerges Hany", href: "https://www.linkedin.com/in/gergeshany/" },
      { name: "GitHub", href: "https://github.com/GergesHany" },
    ],
  },
  {
    role: "UI / UX",
    people: [
      { name: "Heba Ezz", href: "https://www.linkedin.com/in/heba-ezz-361773250/" },
      { name: "Behance", href: "https://www.behance.net/hebaaezz" },
    ],
  },
];

export default function AboutPage() {
  return (
    <main id="main" className="mx-auto max-w-3xl px-5 py-10 md:py-16">
      <Link href="/" className="font-display text-2xl tracking-widest text-brand-gradient">
        TODOctopus
      </Link>
      <h1 className="mt-8 text-4xl md:text-5xl">About</h1>

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <section>
          <h2 className="text-2xl text-brand-gradient">Who we are</h2>
          <p className="mt-2 text-lg text-foam/80">
            We are a team of developers who are passionate about creating fun and engaging
            applications. Our goal is to create applications that are not only useful, but
            also enjoyable to use.
          </p>
        </section>
        <section>
          <h2 className="text-2xl text-brand-gradient">What we do</h2>
          <p className="mt-2 text-lg text-foam/80">
            We create applications that are designed to make your life easier. They are
            simple and intuitive, so you can focus on what&rsquo;s important.
          </p>
        </section>
      </div>

      <h2 className="mt-14 text-2xl">The team</h2>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        {PEOPLE.map((group) => (
          <div key={group.role} className="glass rounded-2xl p-4">
            <dt className="text-sm tracking-[0.2em] text-foam/55 uppercase">{group.role}</dt>
            <dd className="mt-1 flex flex-wrap gap-x-3 text-lg">
              {group.people.map((p) => (
                <a
                  key={p.href}
                  href={p.href}
                  rel="noopener noreferrer"
                  className="underline decoration-foam/30 hover:decoration-foam"
                >
                  {p.name}
                </a>
              ))}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-10 text-foam/60">
        Source code:{" "}
        <a
          href="https://github.com/efraimnabil/TODOctopus"
          rel="noopener noreferrer"
          className="underline decoration-foam/30 hover:text-foam"
        >
          github.com/efraimnabil/TODOctopus
        </a>
      </p>

      <Link
        href="/play"
        className="mt-10 inline-block rounded-full bg-brand-gradient px-8 py-3 text-lg text-white transition-transform hover:scale-105 active:scale-95"
      >
        Let&rsquo;s start
      </Link>
    </main>
  );
}
