// Core JSON schema types for the loop-game DSL.
export type StateId = string;
export type ActionId = number;
export type ChoiceId = string;

export type FlagNamespace = "persistent" | "daily";
export type FlagPath = `${FlagNamespace}.${string}`;
export type VarPath = `loop.${string}`;
export type ValuePath = FlagPath | VarPath;

export interface GameSpec {
  meta: Meta;
  flags: Flags;
  states: Record<StateId, StateNode>;
  terminals?: Record<StateId, TerminalNode>;
}

export interface Meta {
  game_id: string;
  title: string;
  loop: LoopMeta;
}

export interface LoopMeta {
  start_state: StateId;
  end_states: StateId[];
  carry_over: string[];
  reset_each_loop: string[];
  variables?: Record<VarPath, VariableSpec>;
}

export type Value = boolean | string | number;
export type VariableType = "int" | "float" | "string" | "bool";

export interface VariableSpec {
  type: VariableType;
  initial: number | string | boolean;
}

export interface Flags {
  persistent_flags: Record<string, FlagSpec>;
  daily_flags: Record<string, FlagSpec>;
}

export interface FlagSpec {
  description?: string;
  initial: boolean;
}

export interface BoundingBox {
  //  Normalized coordinate from the left edge (0-1).
  x: number;
  // Normalized coordinate from the top edge (0-1).
  y: number;
  width: number;
  height: number;
}

export type BooleanExpression =
  | { and: BooleanExpression[] }
  | { or: BooleanExpression[] }
  | { not: BooleanExpression }
  | boolean
  | ValuePath;


export interface SceneObject {
  id?: string;
  name: string;
  description?: string;
  boundingBox: BoundingBox;
  actions: ActionDef[];
  image?: string;
  visible?: BooleanExpression;
}
export interface StateNode {
  title: string;
  image: string;
  on_enter?: OnEnter;
  actions?: ActionDef[];
  objects?: SceneObject[];
}

export interface TerminalNode {
  title: string;
  effects?: Effect[];
}

export interface ConditionalMessage {
  message: string;
  visible: BooleanExpression;
}

export interface OnEnter {
  messages: ConditionalMessage[];
}

export type ConditionalGuard = {
  if: BooleanExpression;
  effects: Effect[];
};

export interface ActionDef {
  // The action button text.
  text: string;
  // The action button visibility condition.
  visible?: BooleanExpression;
  // Optional guard for a single conditional action (e.g. object actions).
  guard?: BooleanExpression;
  // Effects to apply when the action is taken.
  effects: Effect[];
  // Effects to apply when the guard fails.
  failed_effects?: Effect[];
  // If none of the guards fail, the effects are applied.
  // Otherwise, the effects from the first failed guard are applied.
  guards?: ConditionalGuard[];
}

export interface ChoiceDef {
  id?: ChoiceId;
  text: string;
  goto?: StateId;
  effects?: Effect[];
  message?: string;
}

export interface OnFail {
  stay?: boolean;
  message?: string;
  message_by_first_failed_guard?: Record<string, string>;
}

export interface IfThenElse {
  then: { effects?: Effect[]; message?: string };
  else?: { effects?: Effect[]; message?: string };
}

// export type Guard =
//   | ValuePath
//   | { flag: string }
//   | { not_flag: string }
//   | { not: Guard }
//   | { gte: [ValuePath | number, number] }
//   | { any: Guard[] };

export type Effect =
  | { set: Record<ValuePath, any> }
  | { inc: Record<VarPath, number> }
  | { reset: "daily_flags" | "persistent_flags" }
  | { end: true }
  | { message: string }
  | { goto: StateId };
