import type { Metadata } from "next";
import { PlayLoader } from "./PlayLoader";

export const metadata: Metadata = {
  title: "Play",
  description: "Every task is a tentacle. Finish it, slash it.",
};

export default function PlayPage() {
  return <PlayLoader />;
}
