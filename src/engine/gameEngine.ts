import type {
  ActionDef,
  ActionId,
  Effect,
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
  const variables = Object.entries(spec.meta.loop.variables ?? {}).reduce<
    VariableState
  >((acc, [path, variableSpec]) => {
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

const applyEffects = (state: GameState, spec: GameSpec, effects?: Effect[]) => {
  if (!effects) {
    return;
  }
  for (const effect of effects) {
    if ("noop" in effect) {
      continue;
    }
    if ("set" in effect) {
      for (const [path, value] of Object.entries(effect.set)) {
        setFlagValue(state, path as ValuePath, value);
      }
      continue;
    }
    if ("inc" in effect) {
      for (const [path, value] of Object.entries(effect.inc)) {
        const current = state.variables[path as VarPath];
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
      applyGoto(state, spec, effect.goto);
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

export const buildActionLabel = (actionId: ActionId, action: ActionDef) =>
  action.text?.trim() ? action.text : String(actionId);
