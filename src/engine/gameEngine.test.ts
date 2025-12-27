import { describe, expect, it } from "vitest";

import type { ActionDef, GameSpec } from "../data/types";
import {
  applyAction,
  buildActionLabel,
  createInitialGameState,
  getNode,
} from "./gameEngine";

const baseSpec = (actions: ActionDef[]): GameSpec => ({
  meta: {
    game_id: "test",
    title: "Test",
    loop: {
      start_state: "start",
      end_states: ["end"],
      carry_over: [],
      reset_each_loop: [],
      variables: {
        "loop.points": { type: "int", initial: 1 },
        "loop.name": { type: "string", initial: "Alex" },
      },
    },
  },
  flags: {
    persistent_flags: {
      p1: { initial: true },
    },
    daily_flags: {
      d1: { initial: false },
    },
  },
  states: {
    start: {
      title: "Start",
      image: "",
      on_enter: {
        messages: [
          { message: "Daily on", visible: "daily.d1" },
          { message: "Daily off", visible: true },
        ],
      },
      actions,
    },
    middle: {
      title: "Middle",
      image: "",
      actions: [],
    },
  },
  terminals: {
    end: {
      title: "End",
      effects: [{ set: { "persistent.p1": false } }, { end: true }],
    },
  },
});

describe("createInitialGameState", () => {
  it("hydrates flags, variables, and on-enter message", () => {
    const spec = baseSpec([]);
    const state = createInitialGameState(spec);

    expect(state.currentStateId).toBe("start");
    expect(state.flags.persistent.p1).toBe(true);
    expect(state.flags.daily.d1).toBe(false);
    expect(state.variables["loop.points"]).toBe(1);
    expect(state.message).toBe("Daily off");
    expect(state.isEnded).toBe(false);
  });
});

describe("getNode", () => {
  it("returns state, terminal, or missing lookups", () => {
    const spec = baseSpec([]);

    expect(getNode(spec, "start").kind).toBe("state");
    expect(getNode(spec, "end").kind).toBe("terminal");
    expect(getNode(spec, "unknown").kind).toBe("missing");
  });
});

describe("applyAction", () => {
  it("applies failed effects when guard blocks action", () => {
    const spec = baseSpec([
      {
        text: "Travel",
        guard: "daily.d1",
        failed_effects: [{ message: "Need a pass" }],
        effects: [{ goto: "middle" }],
      },
    ]);

    const state = createInitialGameState(spec);
    const nextState = applyAction(state, spec, 0);

    expect(nextState.currentStateId).toBe("start");
    expect(nextState.message).toBe("Need a pass");
  });

  it("uses the first matching guard before action effects", () => {
    const spec = baseSpec([
      {
        text: "Check",
        guards: [
          {
            if: "persistent.p1",
            effects: [{ message: "Handled by guard" }],
          },
        ],
        effects: [{ set: { "daily.d1": true } }],
      },
    ]);

    const state = createInitialGameState(spec);
    const nextState = applyAction(state, spec, 0);

    expect(nextState.message).toBe("Handled by guard");
    expect(nextState.flags.daily.d1).toBe(false);
  });

  it("applies goto effects and terminal effects", () => {
    const spec = baseSpec([
      {
        text: "Finish",
        effects: [{ set: { "daily.d1": true } }, { goto: "end" }],
      },
    ]);

    const state = createInitialGameState(spec);
    const nextState = applyAction(state, spec, 0);

    expect(nextState.currentStateId).toBe("end");
    expect(nextState.flags.daily.d1).toBe(true);
    expect(nextState.flags.persistent.p1).toBe(false);
    expect(nextState.isEnded).toBe(true);
  });
});

describe("buildActionLabel", () => {
  it("falls back to id when text is blank", () => {
    expect(buildActionLabel(2, { text: "  ", effects: [] })).toBe("2");
    expect(buildActionLabel(2, { text: "Rest", effects: [] })).toBe("Rest");
  });
});
