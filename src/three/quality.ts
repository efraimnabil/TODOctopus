export type Quality = "high" | "low";

interface DeviceHints {
  cores?: number;
  /** GB, as reported by navigator.deviceMemory (Chromium only) */
  memory?: number;
  saveData?: boolean;
  reducedMotion?: boolean;
}

/**
 * The starting render quality for this device. Weak or data-saving devices
 * start on "low" (no post-processing, fewer particles); the frame-rate
 * monitor can still drop any device to "low" later.
 */
export function pickQuality({ cores, memory, saveData }: DeviceHints): Quality {
  if (saveData) return "low";
  if (memory !== undefined && memory <= 4) return "low";
  if (cores !== undefined && cores <= 4) return "low";
  return "high";
}

export function detectQuality(): Quality {
  if (typeof navigator === "undefined") return "high";
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  return pickQuality({
    cores: nav.hardwareConcurrency,
    memory: nav.deviceMemory,
    saveData: nav.connection?.saveData,
  });
}
