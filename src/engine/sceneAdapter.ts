import type {
  ActionDef,
  ActionId,
  GameSpec,
  StateId,
} from "../types/gameSpec";
import type { SceneDefinition, SceneObject } from "../types/scenes";
import {
  buildActionLabel,
  evaluateGuards,
  getNode,
  type GameState,
} from "./gameEngine";

export type ActionEntry = {
  id: ActionId;
  action: ActionDef;
  label: string;
  isLocked: boolean;
  isVisible: boolean;
};

const isActionVisible = (entry: ActionEntry) =>
  entry.isVisible || entry.isLocked;

export const getActionEntries = (
  stateId: StateId,
  spec: GameSpec,
  gameState: GameState
): ActionEntry[] => {
  const lookup = getNode(spec, stateId);
  if (lookup.kind !== "state") {
    return [];
  }
  return Object.entries(lookup.node.actions).map(([id, action]) => {
    const guardResult = evaluateGuards(action.guard, gameState);
    const isVisible = guardResult.passed;
    const isLocked = !guardResult.passed && Boolean(action.on_fail);
    return {
      id,
      action,
      label: buildActionLabel(id, action),
      isLocked,
      isVisible,
    };
  });
};

const layoutActionObjects = (
  entries: ActionEntry[]
): SceneObject[] => {
  const visibleEntries = entries.filter(isActionVisible);
  const total = visibleEntries.length;
  if (total === 0) {
    return [];
  }

  const columns = total > 6 ? 2 : 1;
  const rows = Math.ceil(total / columns);
  const gap = 0.03;
  const topStart = 0.18;
  const availableHeight = 0.66;
  const cellHeight = Math.min(
    0.12,
    (availableHeight - gap * (rows - 1)) / rows
  );
  const width = columns === 1 ? 0.72 : 0.4;
  const xOffsets = columns === 1 ? [0.14] : [0.08, 0.52];

  return visibleEntries.map((entry, index) => {
    const row = Math.floor(index / columns);
    const col = index % columns;
    const x = xOffsets[col] ?? 0.14;
    const y = topStart + row * (cellHeight + gap);
    return {
      id: entry.id,
      name: entry.label,
      description: entry.action.note ?? entry.label,
      boundingBox: {
        x,
        y,
        width,
        height: cellHeight,
      },
      interactions: [
        {
          label: entry.label,
          kind: entry.action.choices ? "menu" : "action",
          actionId: entry.id,
          autoRun: true,
        },
      ],
      visible: () => isActionVisible(entry),
    };
  });
};

export const buildSceneDefinition = (
  stateId: StateId,
  spec: GameSpec,
  gameState: GameState
): SceneDefinition => {
  const lookup = getNode(spec, stateId);
  const title =
    lookup.kind === "state"
      ? lookup.node.title
      : lookup.kind === "terminal"
      ? lookup.node.title
      : stateId;

  const entries = getActionEntries(stateId, spec, gameState);
  const objects = layoutActionObjects(entries);

  return {
    id: stateId,
    name: title,
    description: title,
    imageSrc: undefined,
    objects,
    interactions: [],
  };
};
