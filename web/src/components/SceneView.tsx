import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import type {
  ActionDef,
  BoundingBox,
  DialogOption,
  SceneObject,
  StateNode,
} from "../data/types";
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
  dialogOptions?: DialogOption[];
  onDialogOptionSelect?: (option: DialogOption) => void;
  menuAction?: ReactNode;
  editBoundingBoxes?: boolean;
  onBoundingBoxChange?: (objectId: string, box: BoundingBox) => void;
}

type DragState = {
  objectId: string;
  mode: "move" | "resize";
  startX: number;
  startY: number;
  startBox: BoundingBox;
};

type DefaultHitboxProps = {
  sceneObject: SceneObject;
  isSelected: boolean;
  onSelect: (sceneObject: SceneObject) => void;
};

type EditableHitboxProps = {
  sceneObject: SceneObject;
  onStartDrag: (
    event: ReactMouseEvent,
    sceneObject: SceneObject,
    mode: DragState["mode"]
  ) => void;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const DefaultHitbox = ({
  sceneObject,
  isSelected,
  onSelect,
}: DefaultHitboxProps) => (
  <button
    type="button"
    className={`hitbox${isSelected ? " selected" : ""}`}
    style={{
      left: `${sceneObject.boundingBox.x * 100}%`,
      top: `${sceneObject.boundingBox.y * 100}%`,
      width: `${sceneObject.boundingBox.width * 100}%`,
      height: `${sceneObject.boundingBox.height * 100}%`,
    }}
    onClick={() => onSelect(sceneObject)}
  >
    <span className="tag">{sceneObject.name}</span>
  </button>
);

const EditableHitbox = ({
  sceneObject,
  onStartDrag,
}: EditableHitboxProps) => (
  <div
    className="hitbox hitbox--edit"
    style={{
      left: `${sceneObject.boundingBox.x * 100}%`,
      top: `${sceneObject.boundingBox.y * 100}%`,
      width: `${sceneObject.boundingBox.width * 100}%`,
      height: `${sceneObject.boundingBox.height * 100}%`,
    }}
    onMouseDown={(event) => onStartDrag(event, sceneObject, "move")}
  >
    <span className="tag tag--visible">{sceneObject.name}</span>
    <button
      type="button"
      className="hitboxHandle"
      aria-label={`Resize ${sceneObject.name}`}
      onMouseDown={(event) => onStartDrag(event, sceneObject, "resize")}
    />
  </div>
);

const SceneView = ({
  sceneId,
  scene,
  gameState,
  selectedObjectId,
  onObjectSelect,
  descriptionText,
  interactions,
  onInteractionSelect,
  dialogOptions = [],
  onDialogOptionSelect,
  menuAction,
  editBoundingBoxes = false,
  onBoundingBoxChange,
}: SceneViewProps) => {
  const { isLoading, loadedCount, totalCount } = useSceneAssetsLoading(scene);
  const povRef = useRef<HTMLDivElement | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const progressPercent =
    totalCount > 0 ? Math.round((loadedCount / totalCount) * 100) : 100;
  const imageSrc = scene.image ? resolveSceneImage(scene.image) : null;
  const showDialogOptions = dialogOptions.length > 0;
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
      editBoundingBoxes ||
      target.closest("button.hitbox") ||
      target.closest(".sceneActionsOverlay")
    ) {
      // Click was on an object or an action element, do not deselect.
      return;
    }
    onObjectSelect(null);
  };

  const startDrag = (
    event: ReactMouseEvent,
    sceneObject: SceneObject,
    mode: DragState["mode"]
  ) => {
    if (!editBoundingBoxes || !sceneObject.id) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    setDragState({
      objectId: sceneObject.id,
      mode,
      startX: event.clientX,
      startY: event.clientY,
      startBox: { ...sceneObject.boundingBox },
    });
  };

  useEffect(() => {
    if (!dragState) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      const rect = povRef.current?.getBoundingClientRect();
      if (!rect || !onBoundingBoxChange) {
        return;
      }

      const dx = (event.clientX - dragState.startX) / rect.width;
      const dy = (event.clientY - dragState.startY) / rect.height;

      if (dragState.mode === "move") {
        const nextX = clamp(
          dragState.startBox.x + dx,
          0,
          1 - dragState.startBox.width
        );
        const nextY = clamp(
          dragState.startBox.y + dy,
          0,
          1 - dragState.startBox.height
        );
        onBoundingBoxChange(dragState.objectId, {
          ...dragState.startBox,
          x: nextX,
          y: nextY,
        });
        return;
      }

      const minSize = 0.02;
      const nextWidth = clamp(
        dragState.startBox.width + dx,
        minSize,
        1 - dragState.startBox.x
      );
      const nextHeight = clamp(
        dragState.startBox.height + dy,
        minSize,
        1 - dragState.startBox.y
      );
      onBoundingBoxChange(dragState.objectId, {
        ...dragState.startBox,
        width: nextWidth,
        height: nextHeight,
      });
    };

    const handleMouseUp = () => {
      setDragState(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragState, onBoundingBoxChange]);

  return (
    <div className="povWrap" aria-label={`Scene ${scene.title ?? sceneId}`}>
      <div
        className={`pov${imageSrc ? "" : " pov--text-mode"}`}
        onClick={handleSceneClick}
        aria-busy={isLoading}
        aria-live="polite"
        ref={povRef}
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
        {showDialogOptions ? (
          <div className="dialogOptionsOverlay">
            <div className="dialogOptionsList" role="group">
              {dialogOptions.map((option, index) => (
                <button
                  key={`dialog-option-${index}`}
                  type="button"
                  className="dialogOptionButton"
                  onClick={() => onDialogOptionSelect?.(option)}
                >
                  <strong>{option.text}</strong>
                </button>
              ))}
            </div>
          </div>
        ) : (
          (interactions.length > 0 || menuAction) && (
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
          )
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

        {editBoundingBoxes
          ? (scene.objects ?? []).map((sceneObject, index) => {
              const objectId =
                sceneObject.id ?? `${sceneId}-object-${index}`;
              return (
                <EditableHitbox
                  key={objectId}
                  sceneObject={{ ...sceneObject, id: objectId }}
                  onStartDrag={startDrag}
                />
              );
            })
          : objectsWithVisibility.map(({ sceneObject, isVisible }) => {
              if (!isVisible) {
                return null;
              }

              return (
                <DefaultHitbox
                  key={sceneObject.id}
                  sceneObject={sceneObject}
                  isSelected={selectedObjectId === sceneObject.id}
                  onSelect={onObjectSelect}
                />
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
