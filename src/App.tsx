import { useEffect, useMemo, useState } from "react";
import SceneView, { type SceneInteraction } from "./components/SceneView";
import { gameSpec } from "./data/gameSpec";
import type {
  ActionDef,
  Effect,
  GameSpec,
  ValuePath,
  VarPath,
} from "./data/types";
import { createInitialGameState, type GameState } from "./engine/gameEngine";
import { evaluateExpression } from "./utils/evaluateExpression";
import "./App.css";

const buildFlagState = (spec: GameSpec, key: keyof GameSpec["flags"]) => {
  const entries = Object.entries(spec.flags[key]);
  return entries.reduce<Record<string, boolean>>((acc, [flagId, flagSpec]) => {
    acc[flagId] = Boolean(flagSpec.initial);
    return acc;
  }, {});
};

const cloneState = (state: GameState): GameState => ({
  currentStateId: state.currentStateId,
  flags: {
    persistent: { ...state.flags.persistent },
    daily: { ...state.flags.daily },
  },
  variables: { ...state.variables },
  message: state.message,
  isEnded: state.isEnded,
});

const getValue = (state: GameState, path: ValuePath) => {
  const [namespace, key] = path.split(".");
  if (namespace === "daily") {
    return state.flags.daily[key];
  }
  if (namespace === "persistent") {
    return state.flags.persistent[key];
  }
  return state.variables[path as VarPath];
};

const setValue = (state: GameState, path: ValuePath, value: any) => {
  const [namespace, key] = path.split(".");
  if (namespace === "daily") {
    state.flags.daily[key] = Boolean(value);
    return;
  }
  if (namespace === "persistent") {
    state.flags.persistent[key] = Boolean(value);
    return;
  }
  state.variables[path as VarPath] = value;
};

const applyEffects = (
  state: GameState,
  spec: GameSpec,
  effects?: Effect[]
) => {
  if (!effects) {
    return;
  }
  for (const effect of effects) {
    if ("set" in effect) {
      for (const [path, value] of Object.entries(effect.set)) {
        setValue(state, path as ValuePath, value);
      }
      continue;
    }
    if ("inc" in effect) {
      for (const [path, value] of Object.entries(effect.inc)) {
        const current = getValue(state, path as ValuePath);
        const base = typeof current === "number" ? current : 0;
        state.variables[path as VarPath] = base + value;
      }
      continue;
    }
    if ("reset" in effect) {
      if (effect.reset === "daily_flags") {
        state.flags.daily = buildFlagState(spec, "daily_flags");
      }
      if (effect.reset === "persistent_flags") {
        state.flags.persistent = buildFlagState(spec, "persistent_flags");
      }
      continue;
    }
    if ("message" in effect) {
      state.message = effect.message;
      continue;
    }
    if ("goto" in effect) {
      state.currentStateId = effect.goto;
      continue;
    }
    if ("end" in effect) {
      state.isEnded = true;
    }
  }
};

const finalizeState = (state: GameState, spec: GameSpec) => {
  if (spec.meta.loop.end_states.includes(state.currentStateId)) {
    state.isEnded = true;
  }
  return state;
};

const applyActionDefinition = (
  state: GameState,
  spec: GameSpec,
  action: ActionDef
) => {
  if (state.isEnded) {
    return state;
  }
  const nextState = cloneState(state);
  nextState.message = null;

  if (action.guard && !evaluateExpression(action.guard, nextState)) {
    applyEffects(nextState, spec, action.failed_effects);
    return finalizeState(nextState, spec);
  }

  if (action.guards) {
    for (const guard of action.guards) {
      if (evaluateExpression(guard.if, nextState)) {
        applyEffects(nextState, spec, guard.effects);
        return finalizeState(nextState, spec);
      }
    }
  }

  applyEffects(nextState, spec, action.effects);
  return finalizeState(nextState, spec);
};

const App = () => {
  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialGameState(gameSpec)
  );
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const sceneId = gameState.currentStateId;
  const scene = gameSpec.states[sceneId];

  const sceneObjects = useMemo(() => {
    const objects = scene?.objects ?? [];
    return objects.map((sceneObject, index) => ({
      ...sceneObject,
      id: sceneObject.id ?? `${sceneId}-object-${index}`,
    }));
  }, [scene?.objects, sceneId]);

  const visibleSceneObjects = useMemo(
    () =>
      sceneObjects.filter((sceneObject) =>
        evaluateExpression(sceneObject.visible, gameState)
      ),
    [sceneObjects, gameState]
  );

  const activeObject = useMemo(() => {
    if (!selectedObjectId) {
      return null;
    }
    return (
      visibleSceneObjects.find((sceneObject) => {
        return sceneObject.id === selectedObjectId;
      }) ?? null
    );
  }, [selectedObjectId, visibleSceneObjects]);

  useEffect(() => {
    if (!activeObject && selectedObjectId) {
      setSelectedObjectId(null);
    }
  }, [activeObject, selectedObjectId]);

  useEffect(() => {
    setSelectedObjectId(null);
  }, [sceneId]);

  const sceneActions = useMemo(() => {
    if (!scene || gameState.isEnded) {
      return [];
    }
    return (scene.actions ?? [])
      .filter((action) => evaluateExpression(action.visible, gameState))
      .map<SceneInteraction>((action, index) => ({
        id: `${sceneId}-scene-action-${index}`,
        label: action.text,
        action,
      }));
  }, [scene, sceneId, gameState]);

  const objectActions = useMemo(() => {
    if (!activeObject || gameState.isEnded) {
      return [];
    }
    return activeObject.actions
      .filter((action) => evaluateExpression(action.visible, gameState))
      .map<SceneInteraction>((action, index) => ({
        id: `${activeObject.id}-object-action-${index}`,
        label: action.text,
        action,
      }));
  }, [activeObject, gameState]);

  const interactions = activeObject ? objectActions : sceneActions;
  const descriptionText = activeObject
    ? activeObject.description ?? activeObject.name
    : gameState.message ?? scene?.title ?? "";

  const handleInteractionSelect = (interaction: SceneInteraction) => {
    setGameState((prevState) =>
      applyActionDefinition(prevState, gameSpec, interaction.action)
    );
    setSelectedObjectId(null);
    setIsMenuOpen(false);
  };

  const handleObjectSelect = (sceneObject: { id?: string } | null) => {
    if (!sceneObject?.id) {
      setSelectedObjectId(null);
      return;
    }
    setSelectedObjectId(sceneObject.id);
  };

  const handleReset = () => {
    setGameState(createInitialGameState(gameSpec));
    setSelectedObjectId(null);
    setIsMenuOpen(false);
  };

  console.log('sceneId', sceneId);

  return (
    <>
      <div className="appStack">
        <main className="appShell">
          <section className="panel panel--flush" aria-label="Scene view">
            {scene && (
              <SceneView
                sceneId={sceneId}
                scene={{
                  ...scene,
                  objects: sceneObjects,
                }}
                gameState={gameState}
                selectedObjectId={selectedObjectId}
                onObjectSelect={handleObjectSelect}
                descriptionText={descriptionText}
                interactions={interactions}
                onInteractionSelect={handleInteractionSelect}
                menuAction={
                  <button
                    type="button"
                    className="sceneActionButton sceneActionButton--menu"
                    onClick={() => setIsMenuOpen((prev) => !prev)}
                    aria-label="Open menu"
                    aria-expanded={isMenuOpen}
                  >
                    <span className="menuTriggerDots" aria-hidden="true" />
                  </button>
                }
              />
            )}
            {isMenuOpen && (
              <div className="appMenu" role="dialog" aria-label="Game menu">
                <button type="button" className="menuItem" onClick={handleReset}>
                  Restart
                </button>
                <button
                  type="button"
                  className="menuItem"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Close
                </button>
              </div>
            )}
          </section>
        </main>
      </div>
    </>
  );
};

export default App;
