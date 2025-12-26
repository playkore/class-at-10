import type { Dispatch, SetStateAction } from "react";
import type { GameSpec, VariableSpec, VarPath } from "../data/types";
import type { GameState } from "../engine/gameEngine";
import "./DebugPanel.css";

type DebugPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
  spec: GameSpec;
  setGameState: Dispatch<SetStateAction<GameState>>;
};

const getVariableInputType = (
  value: GameState["variables"][VarPath],
  specType?: VariableSpec["type"]
) => {
  if (specType === "bool" || typeof value === "boolean") {
    return "bool";
  }
  if (specType === "string" || typeof value === "string") {
    return "string";
  }
  return specType ?? "float";
};

const DebugPanel = ({
  isOpen,
  onClose,
  gameState,
  spec,
  setGameState,
}: DebugPanelProps) => {
  if (!isOpen) {
    return null;
  }

  const persistentFlagKeys = [
    ...Object.keys(spec.flags.persistent_flags),
    ...Object.keys(gameState.flags.persistent).filter(
      (key) => !(key in spec.flags.persistent_flags)
    ),
  ];
  const dailyFlagKeys = [
    ...Object.keys(spec.flags.daily_flags),
    ...Object.keys(gameState.flags.daily).filter(
      (key) => !(key in spec.flags.daily_flags)
    ),
  ];
  const variableSpecs = spec.meta.loop.variables ?? {};
  const variableKeys = [
    ...Object.keys(variableSpecs),
    ...Object.keys(gameState.variables).filter(
      (key) => !(key in variableSpecs)
    ),
  ] as VarPath[];

  const updateFlag = (
    namespace: "persistent" | "daily",
    key: string,
    value: boolean
  ) => {
    setGameState((prev) => ({
      ...prev,
      flags: {
        ...prev.flags,
        [namespace]: {
          ...prev.flags[namespace],
          [key]: value,
        },
      },
    }));
  };

  const updateVariable = (path: VarPath, value: number | string | boolean) => {
    setGameState((prev) => ({
      ...prev,
      variables: {
        ...prev.variables,
        [path]: value,
      },
    }));
  };

  return (
    <div
      className="debugOverlay"
      role="dialog"
      aria-label="Debug state editor"
      onClick={onClose}
    >
      <div className="debugPanel" onClick={(event) => event.stopPropagation()}>
        <header className="debugHeader">
          <div>
            <p className="debugEyebrow">Debug</p>
            <h2>Game state</h2>
          </div>
          <button type="button" className="debugClose" onClick={onClose}>
            Close
          </button>
        </header>

        <div className="debugBody">
          <section className="debugSection">
            <h3>Persistent flags</h3>
            <div className="debugGrid">
              {persistentFlagKeys.map((flagId) => {
                const flagSpec = spec.flags.persistent_flags[flagId];
                return (
                  <label key={`persistent-${flagId}`} className="debugItem">
                    <span>
                      {flagId}
                      {flagSpec.description ? (
                        <em>{flagSpec.description}</em>
                      ) : null}
                    </span>
                    <input
                      type="checkbox"
                      checked={Boolean(gameState.flags.persistent[flagId])}
                      onChange={(event) =>
                        updateFlag("persistent", flagId, event.target.checked)
                      }
                    />
                  </label>
                );
              })}
            </div>
          </section>

          <section className="debugSection">
            <h3>Daily flags</h3>
            <div className="debugGrid">
              {dailyFlagKeys.map((flagId) => {
                const flagSpec = spec.flags.daily_flags[flagId];
                return (
                  <label key={`daily-${flagId}`} className="debugItem">
                    <span>
                      {flagId}
                      {flagSpec.description ? (
                        <em>{flagSpec.description}</em>
                      ) : null}
                    </span>
                    <input
                      type="checkbox"
                      checked={Boolean(gameState.flags.daily[flagId])}
                      onChange={(event) =>
                        updateFlag("daily", flagId, event.target.checked)
                      }
                    />
                  </label>
                );
              })}
            </div>
          </section>

          <section className="debugSection">
            <h3>Variables</h3>
            <div className="debugGrid">
              {variableKeys.length === 0 && (
                <p className="debugEmpty">No variables defined.</p>
              )}
              {variableKeys.map((variableId) => {
                const specEntry = variableSpecs[variableId];
                const currentValue = gameState.variables[variableId];
                const inputType = getVariableInputType(
                  currentValue,
                  specEntry?.type
                );

                if (inputType === "bool") {
                  return (
                    <label key={variableId} className="debugItem">
                      <span>{variableId}</span>
                      <input
                        type="checkbox"
                        checked={Boolean(currentValue)}
                        onChange={(event) =>
                          updateVariable(variableId, event.target.checked)
                        }
                      />
                    </label>
                  );
                }

                if (inputType === "string") {
                  return (
                    <label key={variableId} className="debugItem">
                      <span>{variableId}</span>
                      <input
                        type="text"
                        value={String(currentValue ?? "")}
                        onChange={(event) =>
                          updateVariable(variableId, event.target.value)
                        }
                      />
                    </label>
                  );
                }

                const isInt = inputType === "int";
                const value =
                  typeof currentValue === "number" ? currentValue : 0;

                return (
                  <label key={variableId} className="debugItem">
                    <span>{variableId}</span>
                    <input
                      type="number"
                      step={isInt ? 1 : "any"}
                      value={value}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        const parsed = isInt
                          ? Number.parseInt(nextValue, 10)
                          : Number.parseFloat(nextValue);
                        updateVariable(
                          variableId,
                          Number.isNaN(parsed) ? 0 : parsed
                        );
                      }}
                    />
                  </label>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;
