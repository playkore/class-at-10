import { GameState } from "../effects/useGameState";
import type { SceneId } from "../data/scenes";
import { GameStateWrapper } from "../effects/gameStateWrapper";

type SceneEffectCommandFunction = (stateWrapper: GameStateWrapper) => void;
export interface ObjectInteraction {
  label: string;
  effect: SceneEffectCommandFunction;
}

export interface BoundingBox {
  /**
   * Normalized coordinate from the left edge (0-1).
   */
  x: number;
  /**
   * Normalized coordinate from the top edge (0-1).
   */
  y: number;
  width: number;
  height: number;
}

export interface SceneObject {
  id: string;
  name: string;
  description: string;
  boundingBox: BoundingBox;
  interactions: ObjectInteraction[];
  imageSrc?: string;
  visible?: (state: GameState) => boolean;
}

export interface SceneDefinition {
  id: SceneId;
  name: string;
  imageSrc: string;
  description?: string;
  objects: SceneObject[];
  interactions: ObjectInteraction[];
}
