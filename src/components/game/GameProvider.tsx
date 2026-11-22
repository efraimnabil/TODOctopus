"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useStore } from "zustand";
import { ServerRepository } from "@/game/serverRepository";
import { browserDeps, createGameStore, type GameStore, type GameStoreState } from "@/game/store";
import { countGameEvents } from "@/lib/analytics";
import { sayForEvents } from "@/lib/octopusVoice";
import { reactToGameEvents } from "@/lib/sound";

function onEvents(events: Parameters<typeof reactToGameEvents>[0]) {
  reactToGameEvents(events);
  sayForEvents(events);
  countGameEvents(events);
}

const GameContext = createContext<GameStore | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => createGameStore(new ServerRepository(), { ...browserDeps, onEvents }));
  useEffect(() => {
    void store.getState().load();
    // Coming back to the tab: pick up anything added from elsewhere (an MCP client, another tab).
    const onVisible = () => {
      if (document.visibilityState === "visible") void store.getState().sync();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
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
