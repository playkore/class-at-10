import type { MouseEvent as ReactMouseEvent, ReactNode } from "react";
import type { ActionDef, SceneObject, StateNode } from "../data/types";
import type { GameState } from "../engine/gameEngine";
import { useSceneAssetsLoading } from "../effects/useSceneAssetsLoading";
import { resolveSceneImage } from "../utils/resolveSceneImage";
import { evaluateExpression } from "../utils/evaluateExpression";
import "./SceneView.css";
import SceneDescriptionOverlay from "./SceneDescriptionOverlay";
import TVStaticCanvas from "./TVStaticCanvas";

export interface SceneInteraction {
  id: string;
  label: string;
  action: ActionDef;
}

export interface SceneViewProps {
  sceneId: string;
  scene: StateNode;
  gameState: GameState;
  selectedObjectId: string | null;
  onObjectSelect: (sceneObject: SceneObject | null) => void;
  descriptionText: string | null;
  interactions: SceneInteraction[];
  onInteractionSelect: (interaction: SceneInteraction) => void;
  menuAction?: ReactNode;
}

const SceneView = ({
  sceneId,
  scene,
  gameState,
  selectedObjectId,
  onObjectSelect,
  descriptionText,
  interactions,
  onInteractionSelect,
  menuAction,
}: SceneViewProps) => {
  const { isLoading, loadedCount, totalCount } = useSceneAssetsLoading(scene);
  const progressPercent =
    totalCount > 0 ? Math.round((loadedCount / totalCount) * 100) : 100;
  const imageSrc = scene.image ? resolveSceneImage(scene.image) : null;
  const objectsWithVisibility = (scene.objects ?? []).map(
    (sceneObject, index) => ({
      sceneObject: {
        ...sceneObject,
        id: sceneObject.id ?? `${sceneId}-object-${index}`,
      },
      isVisible: evaluateExpression(sceneObject.visible, gameState),
    })
  );

  const handleSceneClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (
      target.closest("button.hitbox") ||
      target.closest(".sceneActionsOverlay")
    ) {
      // Click was on an object or an action element, do not deselect.
      return;
    }
    onObjectSelect(null);
  };

  return (
    <div className="povWrap" aria-label={`Scene ${scene.title ?? sceneId}`}>
      <div
        className={`pov${imageSrc ? "" : " pov--text-mode"}`}
        onClick={handleSceneClick}
        aria-busy={isLoading}
        aria-live="polite"
      >
        {imageSrc ? (
            <img
              className="sceneImage"
              src={imageSrc}
              alt={scene.title ?? sceneId}
              draggable="false"
            />
          ) : (
          <div className="sceneBackdrop" aria-hidden="true" />
        )}
        <SceneDescriptionOverlay text={descriptionText} />
        {(interactions.length > 0 || menuAction) && (
          <div className="sceneActionsOverlay">
            <div className="sceneActionsList" role="group">
              {interactions.map((interaction) => (
                <button
                  key={interaction.id}
                  type="button"
                  className="sceneActionButton"
                  onClick={() => onInteractionSelect(interaction)}
                >
                  <strong>{interaction.label}</strong>
                </button>
              ))}
              {menuAction && (
                <div className="sceneActionMenu">{menuAction}</div>
              )}
            </div>
          </div>
        )}
        {objectsWithVisibility.map(({ sceneObject, isVisible }) => {
          if (!sceneObject.image || !isVisible) {
            return null;
          }

          const objectImageSrc = resolveSceneImage(sceneObject.image);
          return (
            <img
              key={`object-image-${sceneObject.id}`}
              className="objectImage"
              src={objectImageSrc}
              alt=""
              aria-hidden="true"
              draggable="false"
            />
          );
        })}

        {objectsWithVisibility.map(({ sceneObject, isVisible }) => {
          if (!isVisible) {
            return null;
          }

          return (
            <button
              key={sceneObject.id}
              type="button"
              className={`hitbox${
                selectedObjectId === sceneObject.id ? " selected" : ""
              }`}
              style={{
                left: `${sceneObject.boundingBox.x * 100}%`,
                top: `${sceneObject.boundingBox.y * 100}%`,
                width: `${sceneObject.boundingBox.width * 100}%`,
                height: `${sceneObject.boundingBox.height * 100}%`,
              }}
              onClick={() => onObjectSelect(sceneObject)}
            >
              <span className="tag">{sceneObject.name}</span>
            </button>
          );
        })}

        {isLoading && (
          <div className="sceneLoadingOverlay" role="status" aria-live="polite">
            <TVStaticCanvas />
            <span>
              Loading scene{" "}
              {totalCount > 0
                ? `(${loadedCount}/${totalCount}) · ${progressPercent}%`
                : ""}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SceneView;
