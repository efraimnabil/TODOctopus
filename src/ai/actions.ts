"use server";

import { aiEnabled } from "./config";

/** Whether AI features exist at all on this deployment (no key means no buttons). */
export async function aiStatus(): Promise<{ enabled: boolean }> {
  return { enabled: aiEnabled() };
}
