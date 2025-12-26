import { useEffect, useState } from "react";
import type { GameSpec, StateId, VarPath } from "../types/gameSpec";
import { gameSpec } from "../data/gameSpec";
import {
  applyAction,
  createInitialGameState,
  type GameState,
} from "../engine/gameEngine";

export type { GameState } from "../engine/gameEngine";

const STORAGE_KEY = "winter-1999/game-state";

const isValidStateId = (stateId: unknown, spec: GameSpec): stateId is StateId =>
  typeof stateId === "string" &&
  (stateId in spec.states || Boolean(spec.terminals?.[stateId]));

const loadStoredGameState = (spec: GameSpec): GameState => {
  if (typeof window === "undefined") {
    return createInitialGameState(spec);
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createInitialGameState(spec);
    }
    const parsed = JSON.parse(raw) as Partial<GameState>;
    const defaults = createInitialGameState(spec);
    return {
      ...defaults,
      ...parsed,
      currentStateId: isValidStateId(parsed?.currentStateId, spec)
        ? parsed.currentStateId
        : defaults.currentStateId,
      flags: {
        persistent: {
          ...defaults.flags.persistent,
          ...(parsed?.flags?.persistent ?? {}),
        },
        daily: {
          ...defaults.flags.daily,
          ...(parsed?.flags?.daily ?? {}),
        },
      },
      variables: {
        ...defaults.variables,
        ...(parsed?.variables ?? {}),
      },
      message:
        typeof parsed?.message === "string" || parsed?.message === null
          ? parsed?.message ?? null
          : defaults.message,
      isEnded:
        typeof parsed?.isEnded === "boolean"
          ? parsed?.isEnded
          : defaults.isEnded,
    };
  } catch (error) {
    console.warn("Failed to parse saved game state", error);
    return createInitialGameState(spec);
  }
};

const getLoopVar = (state: GameState, key: VarPath) =>
  state.variables[key] as number | string | boolean | undefined;

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>(() =>
    loadStoredGameState(gameSpec)
  );

  // Save game state to local storage on changes
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    } catch (error) {
      console.warn("Failed to store game state", error);
    }
  }, [gameState]);

  const applyGameAction = (actionId: string, choiceId?: string) => {
    setGameState((oldState) =>
      applyAction(oldState, gameSpec, actionId, choiceId)
    );
  };

  const resetGame = () => {
    setGameState(createInitialGameState(gameSpec));
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
