"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { octopusLastWords } from "@/ai/actions";
import { getTone, subscribeVoice, takeVoiceCredit } from "@/lib/octopusVoice";
import { DEFAULT_TONE, isVoiceTone, lineFor } from "@/lib/personality";
import { useAi } from "@/lib/useAi";

/**
 * The defeated octopus's parting line. A built-in line shows at once; if AI
 * is on (and today's allowance isn't spent), a written-for-this-run line
 * replaces it a moment later.
 */
export function LastWords({ name, titles }: { name: string; titles: string[] }) {
  const tone = useSyncExternalStore(subscribeVoice, getTone, () => DEFAULT_TONE);
  const ai = useAi();
  const [fallback] = useState(() => lineFor(tone, { moment: "defeated", octopus: name }, Math.random()));
  const [written, setWritten] = useState<string | null>(null);
  const key = titles.join("\n");

  useEffect(() => {
    if (!ai.ready || !isVoiceTone(tone) || !takeVoiceCredit()) return;
    let live = true;
    octopusLastWords(name, key.split("\n"), tone)
      .then((r) => live && r.ok && setWritten(r.data))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [ai.ready, tone, name, key]);

  const line = written ?? fallback;
  if (!line || tone === "off") return null;
  return <p className="mt-3 text-foam/80 italic">&ldquo;{line}&rdquo;</p>;
}
