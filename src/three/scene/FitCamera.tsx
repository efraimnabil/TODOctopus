import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

const TARGET = new THREE.Vector3(0, 1.2, 0);
const DIRECTION = new THREE.Vector3(0, 0.2, 1).normalize();

/**
 * Back the camera off on narrow screens so the octopus fits, and on portrait
 * screens shift the view so it sits above the bottom task sheet.
 */
export function FitCamera() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);
  const controls = useThree((s) => s.controls) as { update?: () => void } | null;

  useEffect(() => {
    const aspect = width / Math.max(1, height);
    const distance = aspect >= 1.4 ? 8.2 : aspect >= 1 ? 9.4 : aspect >= 0.7 ? 11 : 12.5;
    camera.position.copy(TARGET).addScaledVector(DIRECTION, distance);
    camera.lookAt(TARGET);
    if (aspect < 0.9) {
      camera.setViewOffset(width, height, 0, height * 0.2, width, height);
    } else {
      camera.clearViewOffset();
    }
    camera.updateProjectionMatrix();
    controls?.update?.();
  }, [camera, controls, width, height]);

  return null;
}
