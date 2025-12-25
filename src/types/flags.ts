export type FlagId = "bootsStuffed" | "disguiseChecked";

export type FlagsState = Record<FlagId, boolean>;

export const defaultFlagsState: FlagsState = {
  bootsStuffed: false,
  disguiseChecked: false,
};
