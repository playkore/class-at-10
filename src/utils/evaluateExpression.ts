import type { BooleanExpression, ValuePath, VarPath } from "../data/types";
import type { GameState } from "../engine/gameEngine";

const getValue = (state: GameState, path: ValuePath) => {
  const [namespace, key] = path.split(".");
  if (namespace === "daily") {
    return state.flags.daily[key];
  }
  if (namespace === "persistent") {
    return state.flags.persistent[key];
  }
  return state.variables[path as VarPath];
};

export const evaluateExpression = (
  expression: BooleanExpression | undefined,
  state: GameState
) => {
  if (expression === undefined) {
    return true;
  }
  if (typeof expression === "boolean") {
    return expression;
  }
  if (typeof expression === "string") {
    return Boolean(getValue(state, expression));
  }
  if ("and" in expression) {
    return expression.and.every((item) => evaluateExpression(item, state));
  }
  if ("or" in expression) {
    return expression.or.some((item) => evaluateExpression(item, state));
  }
  if ("not" in expression) {
    return !evaluateExpression(expression.not, state);
  }
  return false;
};
