import type { GameEvent } from "@/game/rules";

export const TONES = [
  { id: "playful", label: "Playful" },
  { id: "savage", label: "Savage" },
  { id: "kind", label: "Kind" },
  { id: "off", label: "Quiet" },
] as const;

export type Tone = (typeof TONES)[number]["id"];
/** Tones that actually speak. */
export type VoiceTone = Exclude<Tone, "off">;
export type Moment = "grew" | "cut" | "removed" | "defeated";

export const DEFAULT_TONE: Tone = "playful";

export const isTone = (v: unknown): v is Tone => TONES.some((t) => t.id === v);
export const isVoiceTone = (v: unknown): v is VoiceTone => isTone(v) && v !== "off";

/**
 * What the octopus says. `{task}` is the tentacle's title and `{name}` the
 * octopus's own name. Teasing is aimed at the situation, never at the player.
 */
export const LINES: Record<VoiceTone, Record<Moment, readonly string[]>> = {
  playful: {
    grew: [
      "Ooh, a new arm! “{task}” suits me.",
      "Growing “{task}”. Tickles!",
      "One more tentacle. I'm basically a fan now.",
      "“{task}” has joined the party.",
    ],
    cut: [
      "Slash! “{task}” is history.",
      "Ouch! Worth it. Next?",
      "Another one bites the ink.",
      "Gone! You're on a roll.",
    ],
    removed: [
      "Retracting “{task}”. Changed your mind?",
      "No slash, no glory, but fine.",
      "Tucked it away. Nobody saw.",
    ],
    defeated: [
      "I'm done for! Great slashing.",
      "{name} bows out. What a show!",
      "Tell the other octopuses I fought bravely.",
    ],
  },
  savage: {
    grew: [
      "“{task}”? We'll see how long that lasts.",
      "Another arm. Bold of you to plan ahead.",
      "I give “{task}” until Thursday.",
      "More weight on me. I'm watching the clock.",
    ],
    cut: [
      "Finally. “{task}” was getting old.",
      "Fine, that one's dead. The rest are waiting.",
      "Slashed. Don't let it go to your head.",
      "One down. I'm not even scared.",
    ],
    removed: [
      "Deleted, not defeated. I noticed.",
      "Skipping “{task}”? Convenient.",
      "That doesn't count as a kill, you know.",
    ],
    defeated: [
      "You win. Don't get used to it.",
      "{name} lost. The next one will be tougher.",
      "Fine. Take your trophy.",
    ],
  },
  kind: {
    grew: [
      "“{task}” is on the list. One step at a time.",
      "Nice and clear. I'll hold it for you.",
      "Added “{task}”. You've got this.",
      "A new arm to carry it. We'll do it together.",
    ],
    cut: [
      "Well done! “{task}” is finished.",
      "That's progress. Be proud.",
      "One less thing on your mind.",
      "Lovely. Take a breath if you need one.",
    ],
    removed: [
      "That's okay. Plans change.",
      "Letting “{task}” go is allowed.",
      "No pressure. Tucked away.",
    ],
    defeated: [
      "You did it! I'm so proud of you.",
      "{name} is done, and so is a lot of your list.",
      "What a day. Go celebrate.",
    ],
  },
};

export interface Say {
  moment: Moment;
  task?: string;
  octopus?: string;
}

/** The most important thing that just happened, if the octopus has a line for it. */
export function momentOf(events: readonly GameEvent[]): Say | null {
  const defeated = events.find((e) => e.type === "defeated");
  if (defeated) return { moment: "defeated", octopus: defeated.octopus.name };
  const cut = events.find((e) => e.type === "cut");
  if (cut) return { moment: "cut", task: cut.task.title };
  const removed = events.find((e) => e.type === "removed");
  if (removed) return { moment: "removed", task: removed.task.title };
  const grew = events.find((e) => e.type === "grew");
  if (grew) return { moment: "grew", task: grew.task.title };
  return null;
}

const clip = (s: string, n = 28) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** One line for a moment, or null when the octopus is quiet. `pick` is 0..1. */
export function lineFor(tone: Tone, say: Say, pick: number): string | null {
  if (tone === "off") return null;
  const bank = LINES[tone][say.moment];
  const raw = bank[Math.min(bank.length - 1, Math.floor(pick * bank.length))];
  return raw.replace("{task}", clip(say.task ?? "that")).replace("{name}", say.octopus ?? "I");
}
