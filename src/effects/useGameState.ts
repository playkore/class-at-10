import { useEffect, useState } from "react";
import { initialSceneId, type SceneId } from "../data/scenes";
import { ObjectInteraction } from "../types/scenes";
import { InventoryItemId } from "../types/inventory";
import { defaultFlagsState, FlagsState } from "../types/flags";
import { GameStateWrapper } from "./gameStateWrapper";

export type GameStateLook = "neutral" | "happy" | "angry";

export type GameState = {
  currentSceneId: SceneId;
  chairFixed: boolean;
  hasDuctTape: boolean;
  inventory: InventoryItemId[];
  flags: FlagsState;
  message: string | null;
  look: GameStateLook;
  score: number;
};

const createInitialGameState = (): GameState => ({
  currentSceneId: initialSceneId,
  chairFixed: false,
  hasDuctTape: false,
  inventory: [],
  flags: { ...defaultFlagsState },
  message: null,
  look: "neutral",
  score: 0,
});

const isValidLook = (value: unknown): value is GameStateLook =>
  value === "neutral" || value === "happy" || value === "angry";

const STORAGE_KEY = "eve-hunter-adventure/game-state";

const loadFlags = (value: unknown, defaults: FlagsState): FlagsState => {
  if (!value || typeof value !== "object") {
    return defaults;
  }
  const record = value as Record<string, unknown>;
  return {
    bootsStuffed:
      typeof record.bootsStuffed === "boolean"
        ? record.bootsStuffed
        : defaults.bootsStuffed,
    disguiseChecked:
      typeof record.disguiseChecked === "boolean"
        ? record.disguiseChecked
        : defaults.disguiseChecked,
  };
};

const loadStoredGameState = (): GameState => {
  if (typeof window === "undefined") {
    return createInitialGameState();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createInitialGameState();
    }
    const parsed = JSON.parse(raw) as Partial<GameState>;
    const defaults = createInitialGameState();
    return {
      ...defaults,
      ...parsed,
      inventory: Array.isArray(parsed?.inventory)
        ? parsed?.inventory
        : defaults.inventory,
      flags: loadFlags(parsed?.flags, defaults.flags),
      message:
        typeof parsed?.message === "string" || parsed?.message === null
          ? parsed?.message ?? null
          : defaults.message,
      look: isValidLook(parsed?.look) ? parsed.look : defaults.look,
      score: typeof parsed?.score === "number" ? parsed.score : defaults.score,
    };
  } catch (error) {
    console.warn("Failed to parse saved game state", error);
    return createInitialGameState();
  }
};

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>(loadStoredGameState);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    } catch (error) {
      console.warn("Failed to store game state", error);
    }
  }, [gameState]);

  const executeEffect = (objectInteraction: ObjectInteraction) => {
    setGameState((oldState: GameState) => {
      const wrapper = new GameStateWrapper(oldState);
      objectInteraction.effect(wrapper);
      const nextState = wrapper.getState();
      return {
        ...nextState,
      };
    });
  };

  const resetGame = () => {
    setGameState(createInitialGameState());
  };

  const resetMessage = () => {
    setGameState((oldState) => ({
      ...oldState,
      message: null,
    }));
  };

  return {
    executeEffect,
    gameState,
    resetGame,
    resetMessage,
  };
};
