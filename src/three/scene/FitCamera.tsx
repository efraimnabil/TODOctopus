import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

const OCTOPUS_CENTER_Y = 1.2;
const DIRECTION = new THREE.Vector3(0, 0.2, 1).normalize();

type Controls = { target: THREE.Vector3; update: () => void };

/**
 * Frames the octopus for the current screen shape by moving the camera and
 * orbit target only. (No setViewOffset: it bakes the old screen size into the
 * projection and left half the canvas black after a resize.)
 * Narrow screens: back off. Portrait: aim below the octopus so it sits above
 * the bottom task sheet.
 */
export function FitCamera({
  distanceScale = 1,
  lineup = false,
  centered = false,
  portraitScale = 1,
}: {
  distanceScale?: number;
  /** Keep the octopus in the middle of the screen (no room made for a task sheet) */
  centered?: boolean;
  /** Extra camera distance on tall, narrow screens */
  portraitScale?: number;
  /** Wide shot that fits the four-octopus comparison row */
  lineup?: boolean;
}) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as Controls | null;
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);

  useEffect(() => {
    const aspect = width / Math.max(1, height);
    const base = lineup
      ? aspect >= 1.4 ? 38 : aspect >= 1 ? 52 : 80
      : aspect >= 1.4 ? 8.2 : aspect >= 1 ? 9.4 : aspect >= 0.7 ? 11 : 12.5;
    const distance = base * distanceScale * (aspect < 0.9 ? portraitScale : 1);
    const drop = aspect < 0.9 && !centered ? (lineup ? 4 : 1.5) * distanceScale : 0;
    const target = new THREE.Vector3(0, OCTOPUS_CENTER_Y - drop, 0);
    camera.position.copy(target).addScaledVector(DIRECTION, distance);
    camera.lookAt(target);
    if (controls) {
      controls.target.copy(target);
      controls.update();
    }
  }, [camera, controls, width, height, distanceScale, lineup, centered, portraitScale]);

  return null;
}
