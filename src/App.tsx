import { useEffect, useMemo, useRef, useState } from "react";
import SceneView from "./components/SceneView";
import SceneEditor from "./components/SceneEditor";
import { scenes } from "./data/scenes";
import { useGameState } from "./effects/useGameState";
import type {
  ObjectInteraction,
  SceneDefinition,
  SceneObject,
} from "./types/scenes";
import "./App.css";

const App = () => {
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSceneEditorOpen, setIsSceneEditorOpen] = useState(false);
  const { executeEffect, gameState, resetGame, resetMessage } = useGameState();
  const menuWrapperRef = useRef<HTMLDivElement | null>(null);

  const sceneMap = useMemo(() => {
    return new Map<string, SceneDefinition>(
      scenes.map((scene) => [scene.id, scene])
    );
  }, []);

  const currentScene = sceneMap.get(gameState.currentSceneId);
  const selectedObject: SceneObject | null =
    currentScene?.objects.find((object) => object.id === selectedObjectId) ??
    null;

  const availableInteractions =
    (selectedObject
      ? selectedObject.interactions
      : currentScene?.interactions) ?? [];

  const sceneDescriptionText =
    gameState.message && gameState.message.trim() !== ""
      ? gameState.message
      : selectedObject
      ? selectedObject.description
      : currentScene?.description ?? null;

  useEffect(() => {
    if (!currentScene || !selectedObjectId) {
      return;
    }

    const activeObject = currentScene.objects.find(
      (object) => object.id === selectedObjectId
    );

    const isVisible = activeObject?.visible
      ? activeObject.visible(gameState)
      : Boolean(activeObject);

    if (!isVisible) {
      setSelectedObjectId(null);
    }
  }, [currentScene, selectedObjectId, gameState]);

  const handleObjectSelect = (object: SceneObject | null) => {
    setSelectedObjectId(object?.id ?? null);
    resetMessage();
  };

  const handleInteraction = (interaction: ObjectInteraction) => {
    if (!currentScene) {
      return;
    }
    executeEffect(interaction);
  };

  const handleMenuToggle = () => {
    setIsMenuOpen((prevState) => !prevState);
  };

  const handleNewGame = () => {
    setSelectedObjectId(null);
    resetGame();
    setIsMenuOpen(false);
  };

  const handleOpenSceneEditor = () => {
    setIsSceneEditorOpen(true);
    setIsMenuOpen(false);
  };

  const handleCloseSceneEditor = () => {
    setIsSceneEditorOpen(false);
  };

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (
        menuWrapperRef.current &&
        !menuWrapperRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  const menuAction = (
    <div className="menuControls" ref={menuWrapperRef}>
      <button
        type="button"
        className="sceneActionButton sceneActionButton--menu"
        aria-haspopup="true"
        aria-expanded={isMenuOpen}
        onClick={handleMenuToggle}
        aria-label="Game menu"
      >
        <span className="menuTriggerDots" aria-hidden="true" />
      </button>
      {isMenuOpen && (
        <div className="appMenu" role="menu" aria-label="Game menu">
          <button type="button" className="menuItem" onClick={handleNewGame}>
            New game
          </button>
          <button
            type="button"
            className="menuItem"
            onClick={handleOpenSceneEditor}
          >
            DEV: edit current scene
          </button>
        </div>
      )}
    </div>
  );

  if (!currentScene) {
    return (
      <>
        <div className="appStack">
          <main className="appShell">
            <section className="panel">
              <p>No scenes registered yet. Add one in src/data/scenes.ts.</p>
            </section>
          </main>
        </div>
        {isSceneEditorOpen && (
          <SceneEditor
            initialSceneId={gameState.currentSceneId}
            onClose={handleCloseSceneEditor}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="appStack">
        <main className="appShell">
          <section className="panel panel--flush" aria-label="Scene view">
            <SceneView
              scene={currentScene}
              gameState={gameState}
              selectedObjectId={selectedObjectId}
              onObjectSelect={handleObjectSelect}
              descriptionText={sceneDescriptionText}
              interactions={availableInteractions}
              onInteractionSelect={handleInteraction}
              menuAction={menuAction}
            />
          </section>
        </main>
      </div>
      {isSceneEditorOpen && (
        <SceneEditor
          initialSceneId={gameState.currentSceneId}
          onClose={handleCloseSceneEditor}
        />
      )}
    </>
  );
};

export default App;
