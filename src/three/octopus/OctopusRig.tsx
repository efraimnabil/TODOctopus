import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Octopus } from "@/game/scene";
import type { FxBus } from "../fx/FxBus";
import { useLazyRef } from "../useLazyRef";
import { createPalette, damp } from "./constants";
import { Eyes } from "./Eyes";
import type { TubeBuilder } from "../geometry/tube";
import { ArmWebs } from "./ArmWebs";
import {
  createMantleGeometry,
  createSkinMaterial,
  createSuckerMaterial,
  disposeSkinMaterial,
} from "./materials";
import type { LabelStore } from "../labels";
import { createHoverState, type HoverState, type OctoState, type TuningRef } from "./shared";
import type { Species } from "./species";
import { Tentacle } from "./Tentacle";

interface Props {
  model: Octopus;
  species: Species;
  fx: FxBus;
  tuning: TuningRef;
  labels: LabelStore | null;
  /** False for display-only octopuses (comparison lineup) */
  interactive?: boolean;
  /** Shared so the canvas can slash a hovered arm that lifted off the cursor */
  hover?: HoverState;
  /** Task picked in the list: its tentacle glows */
  selectedId?: string | null;
  onCut: (id: string, cutIndex: number) => void;
  onRetracted: (id: string) => void;
  onDead: () => void;
}

const DEATH_DURATION = 3.1;

export function OctopusRig({
  model,
  species,
  fx,
  tuning,
  labels,
  interactive = true,
  hover: sharedHover,
  selectedId = null,
  onCut,
  onRetracted,
  onDead,
}: Props) {
  const octo = useLazyRef<OctoState>(() => ({
    offsetY: 0,
    scale: 0.001,
    opacity: 1,
    death: 0,
  }));
  const motion = useRef({ t: 0, scaleVel: 0, deathT: 0, deadSent: false });
  const tubes = useMemo(() => new Map<number, TubeBuilder>(), []);
  const ownHover = useMemo(() => createHoverState(), []);
  const hover = sharedHover ?? ownHover;
  const head = useRef<THREE.Group>(null);
  const mantle = useRef<THREE.Mesh>(null);
  const shadow = useRef<THREE.Mesh>(null);

  const palette = useMemo(() => createPalette(model.seed, species), [model.seed, species]);
  const mantleY = species.mantle.centerY;
  const skinOpacity = species.opacity ?? 1;
  const parts = useMemo(() => {
    const skin = createSkinMaterial(palette, true, undefined, species, "mantle");
    const lid = createSkinMaterial(palette, false, palette.skin, species);
    const web = createSkinMaterial(
      palette,
      false,
      palette.skin.clone().lerp(palette.underside, 0.25),
      species,
    );
    web.side = THREE.DoubleSide;
    const white = new THREE.MeshPhysicalMaterial({
      color: "#fff6ee",
      roughness: 0.12,
      clearcoat: 1,
    });
    const iris = new THREE.MeshPhysicalMaterial({
      color: species.eyes.iris,
      roughness: 0.3,
      clearcoat: 1,
      emissive: new THREE.Color("#ff7a00"),
      emissiveIntensity: 0.25,
    });
    const pupil = new THREE.MeshPhysicalMaterial({
      color: "#0a0710",
      roughness: 0.08,
      clearcoat: 1,
    });
    const sucker = createSuckerMaterial(palette);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: createShadowTexture(),
      transparent: true,
      depthWrite: false,
      color: "#000000",
    });
    return {
      mantleGeo: createMantleGeometry(model.seed, species, palette),
      skin,
      lid,
      web,
      white,
      iris,
      pupil,
      sucker,
      shadowMat,
      fading: [skin, lid, web, white, iris, pupil, sucker],
      skins: [skin, lid, web],
    };
  }, [model.seed, palette, species]);

  useEffect(
    () => () => {
      parts.mantleGeo.dispose();
      parts.skins.forEach(disposeSkinMaterial);
      parts.fading.forEach((m) => m.dispose());
      parts.shadowMat.map?.dispose();
      parts.shadowMat.dispose();
    },
    [parts],
  );

  // Death starts: big ink cloud + one last flinch.
  const dying = model.status === "dying";
  useEffect(() => {
    if (!dying) return;
    fx.emit("ink", {
      id: fx.id(),
      position: [0, mantleY - species.mantle.radius * 0.5, 0.2],
      scale: 2.4,
    });
    fx.hit(1);
    // Real-time fallback: the kill must register even at very low frame rates.
    const timer = window.setTimeout(() => {
      if (motion.current.deadSent) return;
      motion.current.deadSent = true;
      onDead();
    }, 6000);
    return () => window.clearTimeout(timer);
  }, [dying, fx, onDead, mantleY, species.mantle.radius]);

  useFrame((_, delta) => {
    const o = octo.current;
    const m = motion.current;
    const dt = Math.min(delta, 1 / 20) * fx.timeScale;
    m.t += dt;

    // Spawn: springy pop-in.
    m.scaleVel += (1 - o.scale) * 140 * dt;
    m.scaleVel *= Math.exp(-dt * 10);
    o.scale = Math.max(0.001, o.scale + m.scaleVel * dt);

    const bob = Math.sin(m.t * 1.25) * 0.06;
    let rise = 0;
    if (dying || model.status === "dead") {
      m.deathT += dt;
      o.death = Math.min(1, m.deathT / 0.9);
      rise = Math.max(0, m.deathT - 0.9);
      o.opacity = 1 - THREE.MathUtils.clamp((m.deathT - 1.3) / 1.6, 0, 1);
      if (m.deathT > DEATH_DURATION && !m.deadSent) {
        m.deadSent = true;
        onDead();
      }
    }
    o.offsetY = bob + rise * rise * 0.9 + rise * 0.5;

    const hurt = fx.hurt;
    const breath = Math.sin(m.t * 1.7);
    if (head.current) {
      head.current.position.set(0, o.offsetY + mantleY * o.scale, 0);
      head.current.scale.setScalar(o.scale);
      head.current.rotation.z =
        Math.sin(m.t * 0.9) * 0.04 + hurt * Math.sin(m.t * 38) * 0.05;
      head.current.rotation.x = -0.08 + Math.sin(m.t * 0.7) * 0.03 + hurt * 0.15;
    }
    if (mantle.current) {
      const d = o.death;
      mantle.current.scale.set(
        1 + breath * 0.025 + hurt * 0.08 + d * 0.12,
        1 + breath * 0.045 - hurt * 0.12 - d * 0.32,
        1 + breath * 0.025 + hurt * 0.08 + d * 0.12,
      );
    }
    for (const mat of parts.fading) {
      mat.opacity = o.opacity * (parts.skins.includes(mat as never) ? skinOpacity : 1);
      mat.transparent = mat.opacity < 0.999;
    }
    if (shadow.current) {
      const fade = o.opacity * Math.max(0, 1 - rise * 0.6);
      shadow.current.scale.setScalar(o.scale * species.footprint * (1 + breath * 0.02));
      (shadow.current.material as THREE.MeshBasicMaterial).opacity = 0.6 * fade;
    }
    parts.skin.emissiveIntensity +=
      (hurt * 0.25 - parts.skin.emissiveIntensity) * damp(10, dt);
  });

  return (
    <group>
      <group ref={head}>
        <mesh ref={mantle} geometry={parts.mantleGeo} material={parts.skin} />
        {/* Soft "skirt" where the arms join the body */}
        <mesh
          position={[0, species.skirt.y, 0]}
          scale={[species.skirt.radius, species.skirt.height, species.skirt.radius]}
          material={parts.lid}
        >
          <sphereGeometry args={[1, 40, 20]} />
        </mesh>
        <Eyes
          octo={octo.current}
          fx={fx}
          shape={species.eyes}
          lidMaterial={parts.lid}
          whiteMaterial={parts.white}
          irisMaterial={parts.iris}
          pupilMaterial={parts.pupil}
        />
      </group>
      <mesh
        ref={shadow}
        rotation-x={-Math.PI / 2}
        position={[0, 0.012, 0]}
        material={parts.shadowMat}
        raycast={() => null}
      >
        <planeGeometry args={[4.2, 4.2]} />
      </mesh>
      {model.tentacles.map((t) => (
        <Tentacle
          key={t.id}
          model={t}
          species={species}
          interactive={interactive}
          octo={octo.current}
          palette={palette}
          suckerMaterial={parts.sucker}
          fx={fx}
          tuning={tuning}
          labels={model.status === "alive" ? labels : null}
          tubes={tubes}
          hover={hover}
          selected={t.id === selectedId}
          onCut={onCut}
          onRetracted={onRetracted}
        />
      ))}
      {species.web && <ArmWebs tubes={tubes} web={species.web} material={parts.web} />}
    </group>
  );
}

function createShadowTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,0.9)");
  g.addColorStop(0.45, "rgba(255,255,255,0.45)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}
