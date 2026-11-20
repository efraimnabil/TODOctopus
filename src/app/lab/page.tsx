import type { Metadata } from "next";
import { LabLoader } from "./LabLoader";

export const metadata: Metadata = {
  title: "Octopus Lab",
  description: "Prototype: grow tentacles, slash them, defeat the octopus.",
};

export default function LabPage() {
  return <LabLoader />;
}
