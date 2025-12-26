import type {
  ActionDef,
  ActionId,
  ChoiceDef,
  ChoiceId,
  Effect,
  GameSpec,
  Guard,
  StateId,
  StateNode,
  TerminalNode,
  ValuePath,
  VarPath,
} from "../types/gameSpec";

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

export type GuardCheck = {
  passed: boolean;
  failedGuard?: Guard;
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

const getFlagValue = (state: GameState, path: ValuePath) => {
  const [namespace, key] = path.split(".");
  if (namespace === "daily") {
    return Boolean(state.flags.daily[key]);
  }
  if (namespace === "persistent") {
    return Boolean(state.flags.persistent[key]);
  }
  return state.variables[path as VarPath];
};

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

const evaluateGuard = (guard: Guard, state: GameState): GuardCheck => {
  if (typeof guard === "string") {
    return { passed: Boolean(getFlagValue(state, guard)) };
  }
  if ("flag" in guard) {
    return { passed: Boolean(state.flags.daily[guard.flag]) };
  }
  if ("not_flag" in guard) {
    return { passed: !state.flags.daily[guard.not_flag] };
  }
  if ("not" in guard) {
    const result = evaluateGuard(guard.not, state);
    return { passed: !result.passed };
  }
  if ("gte" in guard) {
    const [left, right] = guard.gte;
    const leftValue =
      typeof left === "number" ? left : getFlagValue(state, left);
    return {
      passed: typeof leftValue === "number" && leftValue >= right,
    };
  }
  if ("any" in guard) {
    for (const entry of guard.any) {
      if (evaluateGuard(entry, state).passed) {
        return { passed: true };
      }
    }
    return { passed: false, failedGuard: guard };
  }
  return { passed: false };
};

export const evaluateGuards = (
  guards: Guard[] | undefined,
  state: GameState
): GuardCheck => {
  if (!guards || guards.length === 0) {
    return { passed: true };
  }
  for (const guard of guards) {
    const result = evaluateGuard(guard, state);
    if (!result.passed) {
      return { passed: false, failedGuard: result.failedGuard ?? guard };
    }
  }
  return { passed: true };
};

const getGuardKey = (
  guard: Guard,
  messageMap?: Record<string, string>
) => {
  if (typeof guard === "string") {
    return guard;
  }
  if ("flag" in guard) {
    return `daily.${guard.flag}`;
  }
  if ("not_flag" in guard) {
    return `daily.${guard.not_flag}`;
  }
  if ("not" in guard) {
    return getGuardKey(guard.not, messageMap);
  }
  if ("gte" in guard) {
    const [left] = guard.gte;
    return typeof left === "string" ? left : "gte";
  }
  if ("any" in guard) {
    if (messageMap?.transport) {
      return "transport";
    }
    return "any";
  }
  return "guard";
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
    if ("end" in effect) {
      state.isEnded = true;
    }
  }
};

const applyConditional = (
  state: GameState,
  spec: GameSpec,
  conditional: ActionDef["if"]
) => {
  if (!conditional) {
    return;
  }
  const guardResult = evaluateGuards(conditional.guard, state);
  const branch = guardResult.passed ? conditional.then : conditional.else;
  if (!branch) {
    return;
  }
  applyEffects(state, spec, branch.effects);
  if (branch.message) {
    state.message = branch.message;
  }
};

const getChoice = (
  action: ActionDef,
  choiceId?: ChoiceId
): ChoiceDef | null => {
  if (!action.choices || action.choices.length === 0) {
    return null;
  }
  if (!choiceId) {
    return null;
  }
  return action.choices.find((choice) => choice.id === choiceId) ?? null;
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
  if (!onEnter) {
    return null;
  }
  if (onEnter.message_if) {
    let elseMessage: string | null = null;
    for (const item of onEnter.message_if) {
      if ("else" in item) {
        elseMessage = item.else;
        continue;
      }
      const checks = Object.entries(item.if);
      const matches = checks.every(([path, value]) => {
        return getFlagValue(state, path as ValuePath) === value;
      });
      if (matches) {
        return item.then;
      }
    }
    if (elseMessage) {
      return elseMessage;
    }
  }
  return onEnter.message ?? null;
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

export const applyAction = (
  state: GameState,
  spec: GameSpec,
  actionId: ActionId,
  choiceId?: ChoiceId
): GameState => {
  if (state.isEnded) {
    return state;
  }
  const lookup = getNode(spec, state.currentStateId);
  if (lookup.kind !== "state") {
    return state;
  }
  const action = lookup.node.actions[actionId];
  if (!action) {
    return state;
  }

  const nextState = cloneState(state);
  nextState.message = null;

  const guardResult = evaluateGuards(action.guard, nextState);
  if (!guardResult.passed) {
    const onFail = action.on_fail;
    if (onFail) {
      if (onFail.message) {
        nextState.message = onFail.message;
      } else if (onFail.message_by_first_failed_guard) {
        const failedGuard = guardResult.failedGuard ?? action.guard?.[0];
        if (failedGuard) {
          const key = getGuardKey(
            failedGuard,
            onFail.message_by_first_failed_guard
          );
          nextState.message =
            onFail.message_by_first_failed_guard[key] ?? nextState.message;
        }
      }
      if (onFail.stay) {
        return nextState;
      }
    }
    return nextState;
  }

  applyEffects(nextState, spec, action.effects);

  const chosen = getChoice(action, choiceId);
  if (chosen) {
    applyEffects(nextState, spec, chosen.effects);
    if (chosen.message) {
      nextState.message = chosen.message;
    }
    applyGoto(nextState, spec, chosen.goto ?? action.goto);
    return nextState;
  }

  applyConditional(nextState, spec, action.if);

  if (!nextState.message && action.message) {
    nextState.message = action.message;
  }

  applyGoto(nextState, spec, action.goto);

  return nextState;
};

export const buildActionLabel = (actionId: ActionId, action: ActionDef) =>
  action.text?.trim() ? action.text : actionId;
