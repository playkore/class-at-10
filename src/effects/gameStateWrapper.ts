import { InventoryItemId } from "../types/inventory";
import { FlagId } from "../types/flags";
import type { SceneId } from "../data/scenes";
import { GameState, GameStateLook } from "./useGameState";

export class GameStateWrapper {
  private state: GameState;

  constructor(state: GameState) {
    this.state = state;
  }

  getState(): GameState {
    return this.state;
  }

  setScene(sceneId: SceneId) {
    this.state.message = null;
    this.state.currentSceneId = sceneId;
  }

  addToInventory(itemId: InventoryItemId) {
    if (this.state.inventory.includes(itemId)) {
      return;
    }
    this.state.inventory = [...this.state.inventory, itemId];
  }

  setFlag(flagId: FlagId, value = true) {
    this.state.flags[flagId] = value;
  }

  setStateLook(look: GameStateLook) {
    this.state.look = look;
  }

  setMessage(message: string) {
    this.state.message = message;
  }

  addScore(points: number) {
    this.state.score = this.state.score + points;
  }
}
