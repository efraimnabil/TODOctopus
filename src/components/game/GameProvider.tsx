"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useStore } from "zustand";
import { ServerRepository } from "@/game/serverRepository";
import { browserDeps, createGameStore, type GameStore, type GameStoreState } from "@/game/store";
import { reactToGameEvents } from "@/lib/sound";

const GameContext = createContext<GameStore | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => createGameStore(new ServerRepository(), { ...browserDeps, onEvents: reactToGameEvents }));
  useEffect(() => {
    void store.getState().load();
  }, [store]);
  return <GameContext value={store}>{children}</GameContext>;
}

export function useGameStore(): GameStore {
  const store = useContext(GameContext);
  if (!store) throw new Error("useGame must be used inside <GameProvider>");
  return store;
}

export function useGame<T>(selector: (state: GameStoreState) => T): T {
  return useStore(useGameStore(), selector);
}
