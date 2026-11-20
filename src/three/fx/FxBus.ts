/**
 * Shared "game feel" state and one-shot effect events for the 3D scene.
 * Lives outside React state so per-frame reads cost nothing.
 */
export type Vec3 = [number, number, number];

export interface SeveredSpawn {
  id: number;
  pos: Float32Array;
  prev: Float32Array;
  count: number;
  /** Arc position (0–1) of the cut along the original tentacle */
  s0: number;
  rest: number;
  side: Vec3;
  fling: Vec3;
  seed: number;
}

export interface InkSpawn {
  id: number;
  position: Vec3;
  scale: number;
}

export interface SlashSpawn {
  id: number;
  position: Vec3;
  tangent: Vec3;
}

interface EventMap {
  severed: SeveredSpawn;
  ink: InkSpawn;
  slash: SlashSpawn;
}

type Listener<T> = (event: T) => void;

export class FxBus {
  /** Global sim speed; dips briefly on hits ("hit-stop") */
  timeScale = 1;
  /** 0–1, how much the octopus is hurting right now */
  hurt = 0;
  /** Camera/world shake amplitude */
  shake = 0;
  reducedMotion = false;

  private hitStopUntil = 0;
  private nextId = 1;
  private listeners: { [K in keyof EventMap]: Set<Listener<EventMap[K]>> } = {
    severed: new Set(),
    ink: new Set(),
    slash: new Set(),
  };

  id(): number {
    return this.nextId++;
  }

  on<K extends keyof EventMap>(type: K, fn: Listener<EventMap[K]>) {
    this.listeners[type].add(fn);
    return () => {
      this.listeners[type].delete(fn);
    };
  }

  emit<K extends keyof EventMap>(type: K, event: EventMap[K]) {
    this.listeners[type].forEach((fn) => fn(event));
  }

  hit(strength = 1) {
    this.hurt = Math.min(1, this.hurt + strength);
    if (this.reducedMotion) return;
    this.shake = Math.max(this.shake, 0.09 * strength);
    this.hitStopUntil = performance.now() + 85 * strength;
  }

  /** Call once per frame before anything reads the values. */
  tick(delta: number) {
    const stopped = performance.now() < this.hitStopUntil;
    this.timeScale = stopped
      ? 0.06
      : this.timeScale + (1 - this.timeScale) * (1 - Math.exp(-delta * 18));
    this.hurt *= Math.exp(-delta * 2.2);
    this.shake *= Math.exp(-delta * 9);
  }
}
