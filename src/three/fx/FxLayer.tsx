import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import type * as THREE from "three";
import type { Palette } from "../octopus/constants";
import type { FxBus, InkSpawn, SeveredSpawn, SlashSpawn } from "./FxBus";
import { InkBurst } from "./InkBurst";
import { SeveredPiece } from "./SeveredPiece";
import { Slash } from "./Slash";

function useSpawnList<T extends { id: number }>(
  subscribe: (add: (item: T) => void) => () => void,
) {
  const [items, setItems] = useState<T[]>([]);
  useEffect(() => subscribe((item) => setItems((list) => [...list, item])), [subscribe]);
  const remove = useCallback(
    (id: number) => setItems((list) => list.filter((i) => i.id !== id)),
    [],
  );
  return [items, remove] as const;
}

/** Ticks the shared FxBus once per frame, before everything else. */
export function FxDriver({ fx }: { fx: FxBus }) {
  useFrame((_, delta) => fx.tick(Math.min(delta, 1 / 20)), -1);
  return null;
}

/** Shakes everything inside it (cheaper than fighting the orbit camera). */
export function ShakeGroup({ fx, children }: { fx: FxBus; children: ReactNode }) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const g = group.current;
    if (!g) return;
    const t = clock.elapsedTime * 60;
    g.position.set(Math.sin(t * 1.3) * fx.shake, Math.cos(t * 1.7) * fx.shake, 0);
  });
  return <group ref={group}>{children}</group>;
}

export function FxLayer({ fx, palette }: { fx: FxBus; palette: Palette }) {
  const [severed, removeSevered] = useSpawnList<SeveredSpawn>(
    useCallback((add) => fx.on("severed", add), [fx]),
  );
  const [ink, removeInk] = useSpawnList<InkSpawn>(
    useCallback((add) => fx.on("ink", add), [fx]),
  );
  const [slashes, removeSlash] = useSpawnList<SlashSpawn>(
    useCallback((add) => fx.on("slash", add), [fx]),
  );
  return (
    <>
      {severed.map((s) => (
        <SeveredPiece key={s.id} spawn={s} palette={palette} fx={fx} onDone={removeSevered} />
      ))}
      {ink.map((s) => (
        <InkBurst key={s.id} spawn={s} fx={fx} onDone={removeInk} />
      ))}
      {slashes.map((s) => (
        <Slash key={s.id} spawn={s} onDone={removeSlash} />
      ))}
    </>
  );
}
