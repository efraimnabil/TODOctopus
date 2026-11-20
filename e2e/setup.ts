import { writeFileSync } from "node:fs";
import { join } from "node:path";

/** Remember when this run began, so teardown knows which guests are ours. */
export default function setup() {
  writeFileSync(join(__dirname, ".run-start"), String(Date.now()));
}
