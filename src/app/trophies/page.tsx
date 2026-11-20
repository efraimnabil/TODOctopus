import type { Metadata } from "next";
import { TrophyLoader } from "./TrophyLoader";

export const metadata: Metadata = {
  title: "Trophy room",
  description: "Every octopus you've defeated.",
};

export default function TrophiesPage() {
  return <TrophyLoader />;
}
