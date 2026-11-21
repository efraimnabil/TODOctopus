import { useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Tentacle } from "@/game/scene";
import { PRIORITY_DOT } from "@/components/priority";

/**
 * Task labels drawn as plain DOM above the canvas. Tentacles publish a world
 * anchor each frame; <LabelProjector> (inside the Canvas) projects anchors to
 * screen space and moves the matching elements. No React work per frame.
 */
export class LabelStore {
  readonly anchors = new Map<string, THREE.Vector3>();
  readonly elements = new Map<string, HTMLElement>();
  hovered: string | null = null;
  selected: string | null = null;

  anchor(id: string): THREE.Vector3 {
    let v = this.anchors.get(id);
    if (!v) {
      v = new THREE.Vector3();
      this.anchors.set(id, v);
    }
    return v;
  }
}

const projected = new THREE.Vector3();

export function LabelProjector({ store }: { store: LabelStore }) {
  useFrame(({ camera, size }) => {
    store.elements.forEach((el, id) => {
      const anchor = store.anchors.get(id);
      if (!anchor) {
        el.style.opacity = "0";
        return;
      }
      projected.copy(anchor).project(camera);
      const behind = projected.z > 1;
      const x = (projected.x * 0.5 + 0.5) * size.width;
      const y = (-projected.y * 0.5 + 0.5) * size.height;
      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      el.style.opacity = behind ? "0" : store.hovered === id || store.selected === id ? "1" : "0.85";
    });
  });
  return null;
}

export function TentacleLabels({
  store,
  tentacles,
  selectedId = null,
}: {
  store: LabelStore;
  tentacles: Tentacle[];
  selectedId?: string | null;
}) {
  useEffect(() => {
    store.selected = selectedId;
  }, [store, selectedId]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {tentacles.map((t) => (
        <div
          key={t.id}
          ref={(el) => {
            if (el) store.elements.set(t.id, el);
            else store.elements.delete(t.id);
          }}
          className={`absolute top-0 left-0 flex max-w-48 items-center gap-1.5 rounded-full px-2.5 py-1 text-sm whitespace-nowrap text-foam opacity-0 shadow-lg backdrop-blur transition-opacity ${
            t.overdue
              ? "bg-red-950/90 ring-2 ring-red-400"
              : t.id === selectedId
                ? "bg-abyss/90 ring-2 ring-brand-pink"
                : "bg-abyss/70"
          }`}
        >
          <span className={`size-2 shrink-0 rounded-full ${PRIORITY_DOT[t.priority]}`} />
          <span className="truncate">{t.title}</span>
          {t.overdue && <span className="shrink-0 text-xs text-red-300">overdue</span>}
        </div>
      ))}
    </div>
  );
}

/** Clickable name tags floating above each octopus in the comparison lineup. */
export function SpeciesTags({
  store,
  items,
  onPick,
}: {
  store: LabelStore;
  items: { id: string; name: string; position: [number, number, number] }[];
  onPick: (id: string) => void;
}) {
  useEffect(() => {
    for (const item of items) store.anchor(`species-${item.id}`).set(...item.position);
    return () => {
      for (const item of items) store.anchors.delete(`species-${item.id}`);
    };
  }, [store, items]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {items.map((item) => (
        <button
          key={item.id}
          ref={(el) => {
            const key = `species-${item.id}`;
            if (el) store.elements.set(key, el);
            else store.elements.delete(key);
          }}
          onClick={() => onPick(item.id)}
          className="pointer-events-auto absolute top-0 left-0 rounded-full bg-brand-gradient px-4 py-1.5 text-sm whitespace-nowrap text-white opacity-0 shadow-lg transition-[opacity,scale] hover:scale-105"
        >
          {item.name}
        </button>
      ))}
    </div>
  );
}
