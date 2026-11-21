import type { Metadata } from "next";
import Link from "next/link";
import { TokensPanel } from "@/components/settings/TokensPanel";

export const metadata: Metadata = {
  title: "API tokens",
  description: "Connect Claude or another MCP client to your octopus.",
  robots: { index: false },
};

export default function TokensPage() {
  return (
    <main id="main" className="mx-auto max-w-3xl px-5 py-10 md:py-16">
      <Link href="/play" className="font-display text-2xl tracking-widest text-brand-gradient">
        TODOctopus
      </Link>
      <h1 className="mt-8 text-4xl md:text-5xl">API tokens</h1>
      <p className="mt-3 text-lg text-foam/80">
        Let Claude Code, Claude Desktop or any MCP client add and slash tasks on your octopus. A
        token works like a password for your tasks: keep it private, and revoke it if it leaks.
      </p>
      <TokensPanel />
    </main>
  );
}
