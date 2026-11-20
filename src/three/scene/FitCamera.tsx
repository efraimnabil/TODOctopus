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
}: {
  distanceScale?: number;
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
      ? aspect >= 1.4 ? 21 : aspect >= 1 ? 30 : 46
      : aspect >= 1.4 ? 8.2 : aspect >= 1 ? 9.4 : aspect >= 0.7 ? 11 : 12.5;
    const distance = base * distanceScale;
    const drop = aspect < 0.9 ? (lineup ? 4 : 1.5) * distanceScale : 0;
    const target = new THREE.Vector3(0, OCTOPUS_CENTER_Y - drop, 0);
    camera.position.copy(target).addScaledVector(DIRECTION, distance);
    camera.lookAt(target);
    if (controls) {
      controls.target.copy(target);
      controls.update();
    }
  }, [camera, controls, width, height, distanceScale, lineup]);

  return null;
}
