import { useEffect, useState } from "react";
import type { GameSpec, VarPath } from "../data/types";
import {
  applyAction,
  createInitialGameState,
  type GameState,
} from "../engine/gameEngine";

export type { GameState } from "../engine/gameEngine";

const STORAGE_KEY = "class-at-10/game-state";


const loadStoredGameState = (spec: GameSpec): GameState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createInitialGameState(spec);
    }
    const parsed = JSON.parse(raw) as GameState;
    // TODO Validate loaded state
    return parsed;
  } catch (error) {
    console.warn("Failed to parse saved game state", error);
    return createInitialGameState(spec);
  }
};

const getLoopVar = (state: GameState, key: VarPath) =>
  state.variables[key] as number | string | boolean | undefined;

export const useGameState = (spec: GameSpec) => {
  const [gameState, setGameState] = useState<GameState>(() =>
    loadStoredGameState(spec)
  );

  // Save game state to local storage on changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    } catch (error) {
      console.warn("Failed to store game state", error);
    }
  }, [gameState]);

  const applyGameAction = (actionId: number) => {
    setGameState((oldState) => applyAction(oldState, spec, actionId));
  };

  const resetGame = () => {
    setGameState(createInitialGameState(spec));
  };

  const resetMessage = () => {
    setGameState((oldState) => ({
      ...oldState,
      message: null,
    }));
  };

  return {
    applyGameAction,
    gameState,
    getLoopVar,
    resetGame,
    resetMessage,
  };
};
