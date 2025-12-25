import { useEffect, useMemo, useRef, useState } from "react";
import type {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  RefObject,
} from "react";
import type {
  BoundingBox,
  SceneDefinition,
  SceneObject,
} from "../types/scenes";
import { scenes } from "../data/scenes";
import { resolveSceneImage } from "../utils/resolveSceneImage";
import "./SceneEditor.css";

export interface SceneEditorProps {
  initialSceneId?: string;
  onClose: () => void;
}

type DraftScene = Omit<SceneDefinition, "id" | "objects"> & {
  id: string;
  objects: DraftSceneObject[];
};

type DraftSceneObject = Omit<SceneObject, "id"> & {
  id: string;
};

type ResizeCorner = "nw" | "ne" | "sw" | "se";

type PointerSession =
  | {
      mode: "move";
      objectId: string;
      start: { x: number; y: number };
      box: BoundingBox;
    }
  | {
      mode: "resize";
      objectId: string;
      start: { x: number; y: number };
      box: BoundingBox;
      corner: ResizeCorner;
    };

const SceneEditor = ({ initialSceneId, onClose }: SceneEditorProps) => {
  const defaultSceneId = (initialSceneId ?? scenes[0]?.id ?? "") as
    | SceneDefinition["id"]
    | "";
  const [selectedSceneId, setSelectedSceneId] = useState<
    SceneDefinition["id"] | ""
  >(defaultSceneId);
  const [sceneDraft, setSceneDraft] = useState<DraftScene | null>(() => {
    const scene = scenes.find((item) => item.id === defaultSceneId);
    return createDraftScene(scene);
  });
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle"
  );
  const stageRef = useRef<HTMLDivElement | null>(null);
  const pointerSessionRef = useRef<PointerSession | null>(null);

  useEffect(() => {
    const scene = scenes.find((item) => item.id === selectedSceneId);
    setSceneDraft(createDraftScene(scene));
    setSelectedObjectId(null);
  }, [selectedSceneId]);

  useEffect(() => {
    const handleEscapeClose = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscapeClose);
    return () => {
      document.removeEventListener("keydown", handleEscapeClose);
    };
  }, [onClose]);

  const sceneOptions = useMemo(
    () => scenes.map((scene) => ({ id: scene.id, name: scene.name })),
    []
  );

  const selectedObject =
    sceneDraft?.objects.find((object) => object.id === selectedObjectId) ??
    null;

  const sceneJson = useMemo(() => {
    if (!sceneDraft) {
      return "";
    }
    return JSON.stringify(sceneDraft, null, 2);
  }, [sceneDraft]);

  const stageImageSrc = sceneDraft
    ? resolveSceneImage(sceneDraft.imageSrc)
    : "";

  const handleSceneFieldChange = (
    key: keyof Omit<DraftScene, "objects">,
    value: string
  ) => {
    setSceneDraft((prev) => {
      if (!prev) {
        return prev;
      }
      return { ...prev, [key]: value };
    });
  };

  const updateObject = (
    objectId: string,
    updater: (object: DraftSceneObject) => DraftSceneObject
  ) => {
    setSceneDraft((prev) => {
      if (!prev) {
        return prev;
      }
      const index = prev.objects.findIndex((object) => object.id === objectId);
      if (index === -1) {
        return prev;
      }

      const objects = [...prev.objects];
      objects[index] = updater(objects[index]);
      return { ...prev, objects };
    });
  };

  const handleBoundingBoxChange = (
    axis: keyof BoundingBox,
    nextValue: number
  ) => {
    if (!selectedObject) {
      return;
    }

    updateObject(selectedObject.id, (object) => ({
      ...object,
      boundingBox: clampBoundingBox({
        ...object.boundingBox,
        [axis]: nextValue,
      }),
    }));
  };

  const handleAddObject = () => {
    setSceneDraft((prev) => {
      if (!prev) {
        return prev;
      }
      const newObject: DraftSceneObject = {
        id: makeObjectId(prev.objects),
        name: "New object",
        description: "",
        boundingBox: { x: 0.1, y: 0.1, width: 0.2, height: 0.2 },
        interactions: [],
      };
      const objects = [...prev.objects, newObject];
      setSelectedObjectId(newObject.id);
      return { ...prev, objects };
    });
  };

  const handleRemoveObject = () => {
    if (!sceneDraft || !selectedObjectId) {
      return;
    }
    setSceneDraft((prev) => {
      if (!prev) {
        return prev;
      }
      return {
        ...prev,
        objects: prev.objects.filter(
          (object) => object.id !== selectedObjectId
        ),
      };
    });
    setSelectedObjectId(null);
  };

  const handleAddInteraction = () => {
    if (!selectedObject) {
      return;
    }
    updateObject(selectedObject.id, (object) => ({
      ...object,
      interactions: [
        ...object.interactions,
        {
          label: "New interaction",
          effect: (state) => {
            return state;
          },
        },
      ],
    }));
  };

  const handleInteractionChange = (
    index: number,
    changes: Partial<SceneObject["interactions"][number]>
  ) => {
    if (!selectedObject) {
      return;
    }
    updateObject(selectedObject.id, (object) => {
      const interactions = [...object.interactions];
      interactions[index] = {
        ...interactions[index],
        ...changes,
      };
      return { ...object, interactions };
    });
  };

  const handleRemoveInteraction = (index: number) => {
    if (!selectedObject) {
      return;
    }
    updateObject(selectedObject.id, (object) => ({
      ...object,
      interactions: object.interactions.filter((_, idx) => idx !== index),
    }));
  };

  const handleCopyJson = async () => {
    if (!sceneDraft) {
      return;
    }
    try {
      await navigator.clipboard.writeText(sceneJson);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 2000);
    } catch (error) {
      console.warn("Failed to copy scene JSON", error);
      setCopyState("error");
    }
  };

  const beginPointerSession = (
    mode: PointerSession["mode"],
    objectId: string,
    event: ReactPointerEvent<HTMLElement>,
    corner?: ResizeCorner
  ) => {
    if (!sceneDraft) {
      return;
    }
    const object = sceneDraft.objects.find((item) => item.id === objectId);
    if (!object) {
      return;
    }
    const startPoint = getRelativePoint(event.clientX, event.clientY, stageRef);
    if (!startPoint) {
      return;
    }
    const session: PointerSession =
      mode === "move"
        ? {
            mode: "move",
            objectId,
            start: startPoint,
            box: { ...object.boundingBox },
          }
        : {
            mode: "resize",
            objectId,
            start: startPoint,
            box: { ...object.boundingBox },
            corner: corner ?? "se",
          };

    pointerSessionRef.current = session;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const current = pointerSessionRef.current;
      if (!current) {
        return;
      }
      const pointerPoint = getRelativePoint(
        moveEvent.clientX,
        moveEvent.clientY,
        stageRef
      );
      if (!pointerPoint) {
        return;
      }

      setSceneDraft((prev) => {
        if (!prev) {
          return prev;
        }
        const index = prev.objects.findIndex(
          (object) => object.id === current.objectId
        );
        if (index === -1) {
          return prev;
        }
        const objects = [...prev.objects];
        const nextBox =
          current.mode === "move"
            ? moveBoundingBox(current.box, current.start, pointerPoint)
            : resizeBoundingBox(
                current.box,
                current.start,
                pointerPoint,
                current.corner
              );
        objects[index] = {
          ...objects[index],
          boundingBox: nextBox,
        };

        return { ...prev, objects };
      });
    };

    const handlePointerUp = () => {
      pointerSessionRef.current = null;
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  const handleRectPointerDown = (
    objectId: string,
    event: ReactPointerEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedObjectId(objectId);
    beginPointerSession("move", objectId, event);
  };

  const handleHandlePointerDown = (
    objectId: string,
    corner: ResizeCorner,
    event: ReactPointerEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedObjectId(objectId);
    beginPointerSession("resize", objectId, event, corner);
  };

  const handleStageBackgroundClick = (
    event: ReactMouseEvent<HTMLDivElement>
  ) => {
    if (event.target === event.currentTarget) {
      setSelectedObjectId(null);
    }
  };

  return (
    <div className="sceneEditorOverlay" role="dialog" aria-modal="true">
      <div className="sceneEditorShell">
        <header className="sceneEditorHeader">
          <div>
            <p className="sceneEditorEyebrow">Scene editor</p>
            <h2>Edit interactive regions</h2>
          </div>
          <div className="sceneEditorHeaderControls">
            <label className="sceneEditorLabel">
              Scene
              <select
                className="sceneEditorSelect"
                value={selectedSceneId}
                onChange={(event) =>
                  setSelectedSceneId(
                    event.target.value as SceneDefinition["id"]
                  )
                }
              >
                {sceneOptions.map((scene) => (
                  <option key={scene.id} value={scene.id}>
                    {scene.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="sceneEditorButton sceneEditorButton--ghost"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </header>

        <div className="sceneEditorGrid">
          <section className="sceneEditorPanel">
            <header className="sceneEditorPanelHeader">
              <div>
                <p className="sceneEditorPanelLabel">Stage</p>
                <strong>
                  {sceneDraft?.objects.length ?? 0} regions • Adjust hit boxes
                </strong>
              </div>
              <button
                type="button"
                className="sceneEditorButton sceneEditorButton--primary"
                onClick={handleAddObject}
                disabled={!sceneDraft}
              >
                + Object
              </button>
            </header>
            <div className="sceneEditorStage">
              {sceneDraft && sceneDraft.imageSrc ? (
                <div className="sceneEditorStageFrame">
                  <div
                    className="sceneEditorStageImage"
                    ref={stageRef}
                    onClick={handleStageBackgroundClick}
                  >
                    <img
                      src={stageImageSrc}
                      alt={sceneDraft.description ?? sceneDraft.name}
                    />
                    {sceneDraft.objects.some((object) => object.imageSrc) && (
                      <div
                        className="sceneEditorStageObjectLayer"
                        aria-hidden="true"
                      >
                        {sceneDraft.objects.map((object) => {
                          if (!object.imageSrc) {
                            return null;
                          }
                          const objectImageSrc = resolveSceneImage(
                            object.imageSrc
                          );
                          return (
                            <img
                              key={`scene-object-${object.id}`}
                              src={objectImageSrc}
                              alt=""
                              draggable="false"
                            />
                          );
                        })}
                      </div>
                    )}
                    <div className="sceneEditorStageOverlay">
                      {sceneDraft.objects.map((object) => (
                        <div
                          key={object.id}
                          className={`sceneEditorRect ${
                            selectedObjectId === object.id ? "is-selected" : ""
                          }`}
                          style={{
                            left: `${object.boundingBox.x * 100}%`,
                            top: `${object.boundingBox.y * 100}%`,
                            width: `${object.boundingBox.width * 100}%`,
                            height: `${object.boundingBox.height * 100}%`,
                          }}
                          onPointerDown={(event) =>
                            handleRectPointerDown(object.id, event)
                          }
                        >
                          <span>{object.name || object.id}</span>
                          {selectedObjectId === object.id && (
                            <>
                              {(["nw", "ne", "sw", "se"] as ResizeCorner[]).map(
                                (corner) => (
                                  <button
                                    key={corner}
                                    type="button"
                                    className={`sceneEditorHandle sceneEditorHandle--${corner}`}
                                    onPointerDown={(event) =>
                                      handleHandlePointerDown(
                                        object.id,
                                        corner,
                                        event
                                      )
                                    }
                                  />
                                )
                              )}
                            </>
                          )}
                        </div>
                      ))}
                      {!sceneDraft.objects.length && (
                        <div className="sceneEditorStageMessage">
                          No objects yet. Use + Object to draw a region.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="sceneEditorEmptyStage">
                  <p>Set an imageSrc to see the scene backdrop.</p>
                </div>
              )}
            </div>
          </section>

          <section className="sceneEditorPanel sceneEditorPanel--scroll">
            <header className="sceneEditorPanelHeader">
              <div>
                <p className="sceneEditorPanelLabel">Details</p>
                <strong>Edit scene + object</strong>
              </div>
            </header>

            <div className="sceneEditorDetails">
              <div className="sceneEditorCopyStatus">
                {copyState === "copied" && "Copied!"}
                {copyState === "error" && "Clipboard unavailable"}
              </div>

              <fieldset className="sceneEditorFieldset">
                <legend>Scene</legend>
                <label className="sceneEditorField">
                  <span>id</span>
                  <input
                    type="text"
                    value={sceneDraft?.id ?? ""}
                    onChange={(event) =>
                      handleSceneFieldChange("id", event.target.value)
                    }
                  />
                </label>
                <label className="sceneEditorField">
                  <span>name</span>
                  <input
                    type="text"
                    value={sceneDraft?.name ?? ""}
                    onChange={(event) =>
                      handleSceneFieldChange("name", event.target.value)
                    }
                  />
                </label>
                <label className="sceneEditorField">
                  <span>description</span>
                  <textarea
                    value={sceneDraft?.description ?? ""}
                    onChange={(event) =>
                      handleSceneFieldChange("description", event.target.value)
                    }
                  />
                </label>
                <label className="sceneEditorField">
                  <span>imageSrc</span>
                  <input
                    type="text"
                    value={sceneDraft?.imageSrc ?? ""}
                    onChange={(event) =>
                      handleSceneFieldChange("imageSrc", event.target.value)
                    }
                  />
                </label>
              </fieldset>

              <fieldset className="sceneEditorFieldset">
                <legend>Selected object</legend>
                {selectedObject ? (
                  <>
                    <label className="sceneEditorField">
                      <span>id</span>
                      <input
                        type="text"
                        value={selectedObject.id}
                        onChange={(event) => {
                          const nextId = event.target.value;
                          updateObject(selectedObject.id, (object) => ({
                            ...object,
                            id: nextId,
                          }));
                          setSelectedObjectId(nextId);
                        }}
                      />
                    </label>
                    <label className="sceneEditorField">
                      <span>name</span>
                      <input
                        type="text"
                        value={selectedObject.name}
                        onChange={(event) =>
                          updateObject(selectedObject.id, (object) => ({
                            ...object,
                            name: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="sceneEditorField">
                      <span>description</span>
                      <textarea
                        value={selectedObject.description}
                        onChange={(event) =>
                          updateObject(selectedObject.id, (object) => ({
                            ...object,
                            description: event.target.value,
                          }))
                        }
                      />
                    </label>

                    <div className="sceneEditorBoundingGrid">
                      {(
                        ["x", "y", "width", "height"] as (keyof BoundingBox)[]
                      ).map((axis) => (
                        <label key={axis} className="sceneEditorField">
                          <span>{axis}</span>
                          <input
                            type="number"
                            min={0}
                            max={1}
                            step={0.01}
                            value={
                              Math.round(
                                (selectedObject.boundingBox[axis] ?? 0) * 100
                              ) / 100
                            }
                            onChange={(event) =>
                              handleBoundingBoxChange(
                                axis,
                                Number(event.target.value)
                              )
                            }
                          />
                        </label>
                      ))}
                    </div>

                    <div className="sceneEditorDetailsActions">
                      <button
                        type="button"
                        className="sceneEditorButton sceneEditorButton--ghost"
                        onClick={() => setSelectedObjectId(null)}
                      >
                        Deselect
                      </button>
                      <button
                        type="button"
                        className="sceneEditorButton sceneEditorButton--danger"
                        onClick={handleRemoveObject}
                      >
                        Delete object
                      </button>
                    </div>

                    <div className="sceneEditorInteractions">
                      <div className="sceneEditorInteractionsHeader">
                        <strong>Interactions</strong>
                        <button
                          type="button"
                          className="sceneEditorButton sceneEditorButton--primary"
                          onClick={handleAddInteraction}
                        >
                          + Interaction
                        </button>
                      </div>
                      {selectedObject.interactions.length ? (
                        selectedObject.interactions.map(
                          (interaction, index) => (
                            <div
                              key={`${selectedObject.id}-interaction-${index}`}
                              className="sceneEditorInteractionCard"
                            >
                              <label className="sceneEditorField">
                                <span>label</span>
                                <input
                                  type="text"
                                  value={interaction.label}
                                  onChange={(event) =>
                                    handleInteractionChange(index, {
                                      label: event.target.value,
                                    })
                                  }
                                />
                              </label>
                              <button
                                type="button"
                                className="sceneEditorButton sceneEditorButton--danger"
                                onClick={() => handleRemoveInteraction(index)}
                              >
                                Remove interaction
                              </button>
                            </div>
                          )
                        )
                      ) : (
                        <p className="sceneEditorEmptyState">
                          No interactions yet.
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="sceneEditorEmptyState">
                    Select an object to edit its fields.
                  </p>
                )}
              </fieldset>

              <fieldset className="sceneEditorFieldset">
                <legend>Scene JSON</legend>
                <div className="sceneEditorFieldsetRow">
                  <span className="sceneEditorHint">
                    Preview of the current scene definition.
                  </span>
                  <button
                    type="button"
                    className="sceneEditorButton sceneEditorButton--ghost"
                    onClick={handleCopyJson}
                    disabled={!sceneDraft}
                  >
                    Copy JSON
                  </button>
                </div>
                <textarea value={sceneJson} readOnly rows={12} />
              </fieldset>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SceneEditor;

const createDraftScene = (scene?: SceneDefinition | null): DraftScene => {
  if (!scene) {
    return {
      id: "",
      name: "",
      description: "",
      imageSrc: "",
      interactions: [],
      objects: [],
    };
  }
  return JSON.parse(JSON.stringify(scene)) as DraftScene;
};

const makeObjectId = (objects: DraftSceneObject[]) => {
  const prefix = "object";
  let index = objects.length + 1;
  let candidate = `${prefix}_${index}`;
  const existing = new Set(objects.map((object) => object.id));
  while (existing.has(candidate)) {
    index += 1;
    candidate = `${prefix}_${index}`;
  }
  return candidate;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const roundCoord = (value: number) =>
  Math.round(Number.isFinite(value) ? value * 100 : 0) / 100;

const clampBoundingBox = (box: BoundingBox): BoundingBox => {
  const width = roundCoord(clamp(box.width, 0.01, 1));
  const height = roundCoord(clamp(box.height, 0.01, 1));
  const x = roundCoord(clamp(box.x, 0, 1 - width));
  const y = roundCoord(clamp(box.y, 0, 1 - height));
  return { x, y, width, height };
};

const getRelativePoint = (
  clientX: number,
  clientY: number,
  containerRef: RefObject<HTMLDivElement>
) => {
  const container = containerRef.current;
  if (!container) {
    return null;
  }
  const rect = container.getBoundingClientRect();
  if (!rect.width || !rect.height) {
    return null;
  }
  return {
    x: clamp((clientX - rect.left) / rect.width, 0, 1),
    y: clamp((clientY - rect.top) / rect.height, 0, 1),
  };
};

const moveBoundingBox = (
  box: BoundingBox,
  start: { x: number; y: number },
  point: { x: number; y: number }
): BoundingBox => {
  const dx = point.x - start.x;
  const dy = point.y - start.y;
  return clampBoundingBox({
    ...box,
    x: box.x + dx,
    y: box.y + dy,
  });
};

const resizeBoundingBox = (
  box: BoundingBox,
  start: { x: number; y: number },
  point: { x: number; y: number },
  corner: ResizeCorner
) => {
  const minSize = 0.02;
  const startRight = box.x + box.width;
  const startBottom = box.y + box.height;
  const dx = point.x - start.x;
  const dy = point.y - start.y;
  let x = box.x;
  let y = box.y;
  let width = box.width;
  let height = box.height;

  if (corner.includes("n")) {
    const newTop = clamp(box.y + dy, 0, startBottom - minSize);
    height = startBottom - newTop;
    y = newTop;
  }
  if (corner.includes("s")) {
    const newBottom = clamp(startBottom + dy, y + minSize, 1);
    height = newBottom - y;
  }
  if (corner.includes("w")) {
    const newLeft = clamp(box.x + dx, 0, startRight - minSize);
    width = startRight - newLeft;
    x = newLeft;
  }
  if (corner.includes("e")) {
    const newRight = clamp(startRight + dx, x + minSize, 1);
    width = newRight - x;
  }

  return clampBoundingBox({ x, y, width, height });
};
