import type { MouseEvent as ReactMouseEvent, ReactNode } from "react";
import type {
  ObjectInteraction,
  SceneDefinition,
  SceneObject,
} from "../types/scenes";
import type { GameState } from "../effects/useGameState";
import { useSceneAssetsLoading } from "../effects/useSceneAssetsLoading";
import { resolveSceneImage } from "../utils/resolveSceneImage";
import "./SceneView.css";
import SceneDescriptionOverlay from "./SceneDescriptionOverlay";
import TVStaticCanvas from "./TVStaticCanvas";

export interface SceneViewProps {
  scene: SceneDefinition;
  gameState: GameState;
  selectedObjectId: string | null;
  onObjectSelect: (sceneObject: SceneObject | null) => void;
  descriptionText: string | null;
  interactions: ObjectInteraction[];
  onInteractionSelect: (interaction: ObjectInteraction) => void;
  menuAction?: ReactNode;
}

const SceneView = ({
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
  const imageSrc = resolveSceneImage(scene.imageSrc);
  const objectsWithVisibility = scene.objects.map((sceneObject) => ({
    sceneObject,
    isVisible: sceneObject.visible ? sceneObject.visible(gameState) : true,
  }));

  const handleSceneClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (
      target.closest("button.hitbox") ||
      target.closest("button.sceneActionButton")
    ) {
      // Click was on an object or a button, do not deselect
      return;
    }
    onObjectSelect(null);
  };

  return (
    <div className="povWrap" aria-label={`Scene ${scene.name}`}>
      <div
        className="pov"
        onClick={handleSceneClick}
        aria-busy={isLoading}
        aria-live="polite"
      >
        <img
          className="sceneImage"
          src={imageSrc}
          alt={scene.description ?? scene.name}
          draggable="false"
        />
        <SceneDescriptionOverlay text={descriptionText} />
        {(interactions.length > 0 || menuAction) && (
          <div className="sceneActionsOverlay">
            <div className="sceneActionsList" role="group">
              {interactions.map((interaction, index) => (
                <button
                  key={`${scene.id}-interaction-${index}`}
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
          if (!sceneObject.imageSrc || !isVisible) {
            return null;
          }

          const objectImageSrc = resolveSceneImage(sceneObject.imageSrc);
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
