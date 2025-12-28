import { useEffect, useMemo, useState } from "react";
import SceneView, { type SceneInteraction } from "./components/SceneView";
import DebugPanel from "./components/DebugPanel";
import { gameSpec } from "./data/gameSpec";
import type { BoundingBox, DialogOption } from "./data/types";
import {
  applyActionDefinition,
  applyDialogOption,
  createInitialGameState,
  type GameState,
} from "./engine/gameEngine";
import { evaluateExpression } from "./utils/evaluateExpression";
import "./App.css";

const App = () => {
  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialGameState(gameSpec)
  );
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [editBoundingBoxes, setEditBoundingBoxes] = useState(false);
  const [boundingBoxOverrides, setBoundingBoxOverrides] = useState<
    Record<string, BoundingBox>
  >({});

  const sceneId = gameState.currentStateId;
  const scene = gameSpec.states[sceneId];

  const sceneObjects = useMemo(() => {
    const objects = scene?.objects ?? [];
    return objects.map((sceneObject, index) => ({
      ...sceneObject,
      id: sceneObject.id ?? `${sceneId}-object-${index}`,
      boundingBox:
        boundingBoxOverrides[sceneObject.id ?? `${sceneId}-object-${index}`] ??
        sceneObject.boundingBox,
    }));
  }, [scene?.objects, sceneId, boundingBoxOverrides]);

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

  const dialogOptions = useMemo(() => {
    if (gameState.isEnded) {
      return [];
    }
    return gameState.dialogOptions.filter((option) =>
      evaluateExpression(option.visible, gameState)
    );
  }, [gameState]);

  const interactions = activeObject ? objectActions : sceneActions;
  const dialogText =
    gameState.dialogLines.length > 0
      ? gameState.dialogLines.join("\n")
      : null;
  const descriptionText = activeObject
    ? activeObject.description ?? activeObject.name
    : dialogText ?? gameState.message ?? scene?.title ?? "";

  const handleInteractionSelect = (interaction: SceneInteraction) => {
    console.log("Selected interaction", interaction);
    setGameState((prevState) =>
      applyActionDefinition(prevState, gameSpec, interaction.action)
    );
    setSelectedObjectId(null);
    setIsMenuOpen(false);
  };

  const handleDialogOptionSelect = (option: DialogOption) => {
    setGameState((prevState) =>
      applyDialogOption(prevState, gameSpec, option)
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

  const roundBox = (box: BoundingBox): BoundingBox => ({
    x: Number(box.x.toFixed(2)),
    y: Number(box.y.toFixed(2)),
    width: Number(box.width.toFixed(2)),
    height: Number(box.height.toFixed(2)),
  });

  const handleBoundingBoxChange = (objectId: string, box: BoundingBox) => {
    setBoundingBoxOverrides((prev) => ({
      ...prev,
      [objectId]: roundBox(box),
    }));
  };

  const handleCopySpec = async () => {
    const stateId = sceneId;
    const stateNode = gameSpec.states[stateId];
    if (!stateNode) {
      return;
    }

    const updatedState = stateNode.objects?.length
      ? {
          ...stateNode,
          objects: stateNode.objects.map((sceneObject, index) => {
            const objectId = sceneObject.id ?? `${stateId}-object-${index}`;
            const override = boundingBoxOverrides[objectId];
            if (!override) {
              return sceneObject;
            }
            return {
              ...sceneObject,
              boundingBox: { ...override },
            };
          }),
        }
      : stateNode;

    try {
      await navigator.clipboard.writeText(
        JSON.stringify(updatedState, null, 2)
      );
    } catch (error) {
      console.warn("Failed to copy updated spec", error);
    }
  };

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
                dialogOptions={dialogOptions}
                onDialogOptionSelect={handleDialogOptionSelect}
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
                editBoundingBoxes={editBoundingBoxes}
                onBoundingBoxChange={handleBoundingBoxChange}
              />
            )}
            {isMenuOpen && (
              <div className="appMenu" role="dialog" aria-label="Game menu">
                <button
                  type="button"
                  className="menuItem"
                  onClick={handleReset}
                >
                  Restart
                </button>
                <button
                  type="button"
                  className="menuItem"
                  onClick={() => {
                    setIsDebugOpen(true);
                    setIsMenuOpen(false);
                  }}
                >
                  Debug
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
            <DebugPanel
              isOpen={isDebugOpen}
              onClose={() => setIsDebugOpen(false)}
              gameState={gameState}
              spec={gameSpec}
              setGameState={setGameState}
              editBoundingBoxes={editBoundingBoxes}
              onToggleEditBoundingBoxes={setEditBoundingBoxes}
              onCopySpec={handleCopySpec}
            />
          </section>
        </main>
      </div>
    </>
  );
};

export default App;
