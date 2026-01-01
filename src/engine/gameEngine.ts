import type {
  ActionDef,
  ActionId,
  DialogOption,
  Effects,
  GameSpec,
  StateId,
  StateNode,
  TerminalNode,
  ValuePath,
  VarPath,
} from "../data/types";
import { evaluateExpression } from "../utils/evaluateExpression";

export type FlagState = Record<string, boolean>;
export type VariableState = Record<VarPath, number | string | boolean>;

export type GameState = {
  currentStateId: StateId;
  flags: {
    persistent: FlagState;
    daily: FlagState;
  };
  variables: VariableState;
  message: string | null;
  dialogLines: string[];
  dialogOptions: DialogOption[];
  isEnded: boolean;
};

export type NodeLookup =
  | { kind: "state"; node: StateNode }
  | { kind: "terminal"; node: TerminalNode }
  | { kind: "missing" };

const buildFlagState = (spec: GameSpec, key: keyof GameSpec["flags"]) => {
  const entries = Object.entries(spec.flags[key]);
  return entries.reduce<FlagState>((acc, [flagId, flagSpec]) => {
    acc[flagId] = Boolean(flagSpec.initial);
    return acc;
  }, {});
};

export const createInitialGameState = (spec: GameSpec): GameState => {
  const variables = Object.entries(
    spec.meta.loop.variables ?? {}
  ).reduce<VariableState>((acc, [path, variableSpec]) => {
    acc[path as VarPath] = variableSpec.initial;
    return acc;
  }, {});

  const currentStateId = spec.meta.loop.start_state;
  const message = getOnEnterMessage(spec, currentStateId, {
    currentStateId,
    flags: {
      persistent: buildFlagState(spec, "persistent_flags"),
      daily: buildFlagState(spec, "daily_flags"),
    },
    variables,
    message: null,
    dialogLines: [],
    dialogOptions: [],
    isEnded: false,
  });

  return {
    currentStateId,
    flags: {
      persistent: buildFlagState(spec, "persistent_flags"),
      daily: buildFlagState(spec, "daily_flags"),
    },
    variables,
    message,
    dialogLines: [],
    dialogOptions: [],
    isEnded: false,
  };
};

export const getNode = (spec: GameSpec, stateId: StateId): NodeLookup => {
  if (spec.states[stateId]) {
    return { kind: "state", node: spec.states[stateId] };
  }
  if (spec.terminals?.[stateId]) {
    return { kind: "terminal", node: spec.terminals[stateId] };
  }
  return { kind: "missing" };
};

const cloneState = (state: GameState): GameState => ({
  currentStateId: state.currentStateId,
  flags: {
    persistent: { ...state.flags.persistent },
    daily: { ...state.flags.daily },
  },
  variables: { ...state.variables },
  message: state.message,
  dialogLines: [...state.dialogLines],
  dialogOptions: [...state.dialogOptions],
  isEnded: state.isEnded,
});

const setFlagValue = (state: GameState, path: ValuePath, value: any) => {
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

const getOnEnterMessage = (
  spec: GameSpec,
  stateId: StateId,
  state: GameState
) => {
  const lookup = getNode(spec, stateId);
  if (lookup.kind !== "state") {
    return null;
  }
  const onEnter = lookup.node.on_enter;
  if (!onEnter?.messages?.length) {
    return null;
  }
  const match = onEnter.messages.find((item) =>
    evaluateExpression(item.visible, state)
  );
  return match?.message ?? null;
};

const applyGoto = (state: GameState, spec: GameSpec, target?: StateId) => {
  if (!target) {
    return;
  }
  state.currentStateId = target;
  state.dialogLines = [];
  state.dialogOptions = [];
  const lookup = getNode(spec, target);
  if (lookup.kind === "terminal") {
    applyEffects(state, spec, lookup.node.effects);
    return;
  }
  if (lookup.kind === "state" && !state.message) {
    const onEnterMessage = getOnEnterMessage(spec, target, state);
    if (onEnterMessage) {
      state.message = onEnterMessage;
    }
  }
  if (spec.meta.loop.end_states.includes(target)) {
    state.isEnded = true;
  }
};

const applyEffects = (state: GameState, spec: GameSpec, effects?: Effects) => {
  if (!effects) {
    return;
  }
  if (effects.dialog_options !== undefined) {
    state.dialogOptions = effects.dialog_options;
  } else {
    state.dialogLines = [];
  }
  if (effects.add_dialog_lines) {
    state.dialogLines = state.dialogLines.concat(effects.add_dialog_lines);
  }
  if (effects.reset === "daily_flags") {
    state.flags.daily = buildFlagState(spec, "daily_flags");
  }
  if (effects.reset === "persistent_flags") {
    state.flags.persistent = buildFlagState(spec, "persistent_flags");
  }
  if (effects.set) {
    for (const [path, value] of Object.entries(effects.set)) {
      setFlagValue(state, path as ValuePath, value);
    }
  }
  if (effects.inc) {
    for (const [path, value] of Object.entries(effects.inc)) {
      const current = state.variables[path as VarPath];
      const base = typeof current === "number" ? current : 0;
      state.variables[path as VarPath] = base + value;
    }
  }
  if (effects.message) {
    state.message = effects.message;
  }
  if (effects.goto) {
    applyGoto(state, spec, effects.goto);
  }
  if (effects.end) {
    state.isEnded = true;
  }
};

const finalizeState = (state: GameState, spec: GameSpec) => {
  if (spec.meta.loop.end_states.includes(state.currentStateId)) {
    state.isEnded = true;
  }
  return state;
};

export const applyAction = (
  state: GameState,
  spec: GameSpec,
  actionId: ActionId
): GameState => {
  if (state.isEnded) {
    return state;
  }
  const lookup = getNode(spec, state.currentStateId);
  if (lookup.kind !== "state") {
    return state;
  }
  const actions = lookup.node.actions ?? [];
  const action = actions[actionId];
  if (!action) {
    return state;
  }

  return applyActionDefinition(state, spec, action);
};

export const applyActionDefinition = (
  state: GameState,
  spec: GameSpec,
  action: ActionDef
): GameState => {
  const nextState = cloneState(state);
  nextState.message = null;
  nextState.dialogOptions = [];

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

export const applyDialogOption = (
  state: GameState,
  spec: GameSpec,
  option: DialogOption
): GameState => {
  if (state.isEnded) {
    return state;
  }

  const nextState = cloneState(state);
  nextState.message = null;
  nextState.dialogOptions = [];
  applyEffects(nextState, spec, option.effects);
  return finalizeState(nextState, spec);
};

export const buildActionLabel = (actionId: ActionId, action: ActionDef) =>
  action.text?.trim() ? action.text : String(actionId);
