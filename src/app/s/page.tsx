import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { cardImagePath, parseShare, sharePath, slashedText } from "@/lib/share";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const card = parseShare(await searchParams);
  const title = `${card.name} was defeated`;
  const description = `${slashedText(card.slashed)}. Every task is a tentacle. Can you slash them all?`;
  const image = { url: cardImagePath(card), width: 1200, height: 630, alt: title };
  return {
    title,
    description,
    robots: { index: false },
    alternates: { canonical: sharePath(card) },
    openGraph: { title: `${title} on TODOctopus`, description, images: [image] },
    twitter: { card: "summary_large_image", title: `${title} on TODOctopus`, description, images: [image.url] },
  };
}

export default function SharePage({ searchParams }: Props) {
  // The card comes from the link, which is only known per request; the page frame is static.
  return (
    <main id="main" className="grid min-h-dvh place-items-center px-5 py-10">
      <section className="glass w-full max-w-md rounded-3xl p-8 text-center">
        <p className="text-sm tracking-[0.3em] text-foam/60 uppercase">Octopus defeated</p>
        <Suspense fallback={<h1 className="mt-2 text-4xl">An octopus is gone</h1>}>
          <CardFacts searchParams={searchParams} />
        </Suspense>
        <Link
          href="/play"
          className="mt-8 inline-block rounded-full bg-brand-gradient px-8 py-3 text-lg text-white transition-transform hover:scale-105 active:scale-95"
        >
          Slash your own tasks
        </Link>
      </section>
    </main>
  );
}

async function CardFacts({ searchParams }: Props) {
  const card = parseShare(await searchParams);
  return (
    <>
      <h1 className="mt-2 text-4xl">
        <span className="text-brand-gradient">{card.name}</span> is gone
      </h1>
      <p className="mt-3 text-lg text-foam/80">
        {slashedText(card.slashed)}
        {card.streak > 0 && ` · ${card.streak}-day streak`}
      </p>
    </>
  );
}
