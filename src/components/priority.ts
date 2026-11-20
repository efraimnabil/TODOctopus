import type { Priority } from "@/game/types";

export const PRIORITIES: { value: Priority; label: string; dot: string }[] = [
  { value: 1, label: "Low", dot: "bg-emerald-400" },
  { value: 2, label: "Medium", dot: "bg-amber-400" },
  { value: 3, label: "High", dot: "bg-rose-500" },
];

export const PRIORITY_DOT: Record<Priority, string> = {
  1: "bg-emerald-400",
  2: "bg-amber-400",
  3: "bg-rose-500",
};
