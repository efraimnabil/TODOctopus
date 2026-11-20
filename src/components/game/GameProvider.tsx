"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useStore } from "zustand";
import { BrowserRepository } from "@/game/repository";
import { createGameStore, type GameStore, type GameStoreState } from "@/game/store";

const GameContext = createContext<GameStore | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => createGameStore(new BrowserRepository()));
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
