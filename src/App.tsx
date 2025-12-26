import { useEffect, useMemo, useRef, useState } from "react";
import SceneView from "./components/SceneView";
import { gameSpec } from "./data/gameSpec";
import { buildSceneDefinition, getActionEntries } from "./engine/sceneAdapter";
import { useGameState } from "./effects/useGameState";
import type { ObjectInteraction, SceneObject } from "./types/scenes";
import "./App.css";

const App = () => {
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [choiceActionId, setChoiceActionId] = useState<string | null>(null);
  const { applyGameAction, gameState, getLoopVar, resetGame, resetMessage } =
    useGameState();
  const menuWrapperRef = useRef<HTMLDivElement | null>(null);

  const currentScene = useMemo(
    () =>
      buildSceneDefinition(gameState.currentStateId, gameSpec, gameState),
    [gameState]
  );

  const actionEntries = useMemo(
    () => getActionEntries(gameState.currentStateId, gameSpec, gameState),
    [gameState]
  );

  const actionEntryMap = useMemo(() => {
    return new Map(actionEntries.map((entry) => [entry.id, entry]));
  }, [actionEntries]);

  const activeAction = choiceActionId
    ? actionEntryMap.get(choiceActionId) ?? null
    : null;

  const availableInteractions = useMemo<ObjectInteraction[]>(() => {
    if (gameState.isEnded) {
      return [];
    }

    if (activeAction?.action.choices?.length) {
      const choiceInteractions = activeAction.action.choices.map((choice) => ({
        label: choice.text,
        kind: "action" as const,
        actionId: activeAction.id,
        choiceId: choice.id,
      }));
      return [
        ...choiceInteractions,
        {
          label: "Назад",
          kind: "ui",
          uiAction: "back",
        },
      ];
    }

    return actionEntries
      .filter((entry) => entry.isVisible || entry.isLocked)
      .map((entry) => ({
        label: entry.label,
        kind: entry.action.choices ? "menu" : "action",
        actionId: entry.id,
      }));
  }, [actionEntries, activeAction, gameState.isEnded]);

  const selectedObject: SceneObject | null =
    currentScene.objects.find((object) => object.id === selectedObjectId) ??
    null;

  const dayIndex = getLoopVar(gameState, "loop.day_index");
  const baseDescription =
    typeof dayIndex === "number"
      ? `${currentScene.description ?? currentScene.name} · День ${dayIndex}`
      : currentScene.description ?? currentScene.name;
  const sceneDescriptionText =
    gameState.message && gameState.message.trim() !== ""
      ? gameState.message
      : selectedObject?.description ?? baseDescription ?? null;

  useEffect(() => {
    if (!selectedObjectId) {
      return;
    }
    const activeObject = currentScene.objects.find(
      (object) => object.id === selectedObjectId
    );
    if (!activeObject) {
      setSelectedObjectId(null);
      return;
    }
    const isVisible = activeObject.visible
      ? activeObject.visible(gameState)
      : true;
    if (!isVisible) {
      setSelectedObjectId(null);
    }
  }, [currentScene, selectedObjectId, gameState]);

  useEffect(() => {
    setChoiceActionId(null);
  }, [gameState.currentStateId]);

  useEffect(() => {
    if (choiceActionId && !actionEntryMap.has(choiceActionId)) {
      setChoiceActionId(null);
    }
  }, [choiceActionId, actionEntryMap]);

  const handleObjectSelect = (object: SceneObject | null) => {
    setSelectedObjectId(object?.id ?? null);
    if (!object) {
      resetMessage();
      return;
    }
    const interaction = object.interactions[0];
    if (interaction?.autoRun) {
      handleInteraction(interaction);
      setSelectedObjectId(null);
      return;
    }
    resetMessage();
  };

  const handleInteraction = (interaction: ObjectInteraction) => {
    if (interaction.kind === "ui" && interaction.uiAction === "back") {
      setChoiceActionId(null);
      return;
    }
    if (interaction.kind === "menu") {
      setChoiceActionId(interaction.actionId ?? null);
      resetMessage();
      return;
    }
    if (interaction.kind !== "action" || !interaction.actionId) {
      return;
    }
    applyGameAction(interaction.actionId, interaction.choiceId);
    setChoiceActionId(null);
  };

  const handleMenuToggle = () => {
    setIsMenuOpen((prevState) => !prevState);
  };

  const handleNewGame = () => {
    setSelectedObjectId(null);
    resetGame();
    setIsMenuOpen(false);
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
        </div>
      )}
    </div>
  );

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
    </>
  );
};

export default App;
