// Core JSON schema types for the loop-game DSL.
export type StateId = string;
export type ActionId = string;
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

export interface StateNode {
  title: string;
  image: string;
  on_enter?: OnEnter;
  actions: Record<ActionId, ActionDef>;
}

export interface TerminalNode {
  title: string;
  effects?: Effect[];
}

export interface OnEnter {
  message?: string;
  message_if?: MessageIfItem[];
}

export type MessageIfItem =
  | { if: Record<ValuePath, any>; then: string }
  | { else: string };

export interface ActionDef {
  text?: string;
  goto?: StateId;
  note?: string;
  guard?: Guard[];
  on_fail?: OnFail;
  effects?: Effect[];
  if?: IfThenElse;
  choices?: ChoiceDef[];
  message?: string;
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
  guard: Guard[];
  then: { effects?: Effect[]; message?: string };
  else?: { effects?: Effect[]; message?: string };
}

export type Guard =
  | ValuePath
  | { flag: string }
  | { not_flag: string }
  | { not: Guard }
  | { gte: [ValuePath | number, number] }
  | { any: Guard[] };

export type Effect =
  | { noop: true }
  | { set: Record<ValuePath, any> }
  | { inc: Record<VarPath, number> }
  | { reset: "daily_flags" | "persistent_flags" }
  | { end: true };
