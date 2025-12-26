import type { GameState } from "../effects/useGameState";

export interface ObjectInteraction {
  label: string;
  kind: "action" | "menu" | "ui";
  actionId?: string;
  choiceId?: string;
  uiAction?: "back";
  autoRun?: boolean;
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
  description?: string;
  boundingBox: BoundingBox;
  interactions: ObjectInteraction[];
  imageSrc?: string;
  visible?: (state: GameState) => boolean;
}

export interface SceneDefinition {
  id: string;
  name: string;
  imageSrc?: string;
  description?: string;
  objects: SceneObject[];
  interactions: ObjectInteraction[];
}
