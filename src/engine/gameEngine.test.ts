import { describe, expect, it } from "vitest";

import type { ActionDef, GameSpec } from "../data/types";
import {
  applyAction,
  buildActionLabel,
  createInitialGameState,
  evaluateGuards,
  getNode,
} from "./gameEngine";

const baseSpec = (actions: Record<string, ActionDef>): GameSpec => ({
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
      bus: { initial: false },
      train: { initial: false },
    },
  },
  states: {
    start: {
      title: "Start",
      on_enter: {
        message_if: [
          { if: { "loop.points": 1 }, then: "Points 1" },
          { else: "No points" },
        ],
      },
      actions,
    },
    middle: {
      title: "Middle",
      actions: {},
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
    const spec = baseSpec({});
    const state = createInitialGameState(spec);

    expect(state.currentStateId).toBe("start");
    expect(state.flags.persistent.p1).toBe(true);
    expect(state.flags.daily.d1).toBe(false);
    expect(state.variables["loop.points"]).toBe(1);
    expect(state.message).toBe("Points 1");
    expect(state.isEnded).toBe(false);
  });
});

describe("getNode", () => {
  it("returns state, terminal, or missing lookups", () => {
    const spec = baseSpec({});

    expect(getNode(spec, "start").kind).toBe("state");
    expect(getNode(spec, "end").kind).toBe("terminal");
    expect(getNode(spec, "unknown").kind).toBe("missing");
  });
});

describe("evaluateGuards", () => {
  it("handles nested and any guards with proper failure metadata", () => {
    const spec = baseSpec({});
    const state = createInitialGameState(spec);

    const result = evaluateGuards(
      [
        { gte: ["loop.points", 1] },
        { not: { flag: "bus" } },
        { any: [{ flag: "bus" }, { flag: "train" }] },
      ],
      state
    );

    expect(result.passed).toBe(false);
    expect(result.failedGuard).toEqual({
      any: [{ flag: "bus" }, { flag: "train" }],
    });
  });
});

describe("applyAction", () => {
  it("uses on-fail message_by_first_failed_guard with any guards", () => {
    const spec = baseSpec({
      travel: {
        guard: [{ any: [{ flag: "bus" }, { flag: "train" }] }],
        on_fail: {
          stay: true,
          message_by_first_failed_guard: {
            transport: "Need transport",
          },
        },
        goto: "middle",
      },
    });

    const state = createInitialGameState(spec);
    const nextState = applyAction(state, spec, "travel");

    expect(nextState.currentStateId).toBe("start");
    expect(nextState.message).toBe("Need transport");
  });

  it("applies choice effects, messages, and terminal transitions", () => {
    const spec = baseSpec({
      pick: {
        effects: [{ set: { "daily.d1": true } }],
        choices: [
          {
            id: "take",
            text: "Take",
            message: "Chose take",
            effects: [{ inc: { "loop.points": 2 } }],
            goto: "end",
          },
        ],
      },
    });

    const state = createInitialGameState(spec);
    const nextState = applyAction(state, spec, "pick", "take");

    expect(nextState.currentStateId).toBe("end");
    expect(nextState.variables["loop.points"]).toBe(3);
    expect(nextState.flags.daily.d1).toBe(true);
    expect(nextState.flags.persistent.p1).toBe(false);
    expect(nextState.message).toBe("Chose take");
    expect(nextState.isEnded).toBe(true);
  });

  it("applies conditional branches and messages", () => {
    const spec = baseSpec({
      check: {
        if: {
          guard: ["daily.d1"],
          then: { message: "Allowed" },
          else: {
            message: "Blocked",
            effects: [{ set: { "loop.points": 5 } }],
          },
        },
      },
    });

    const state = createInitialGameState(spec);
    const nextState = applyAction(state, spec, "check");

    expect(nextState.message).toBe("Blocked");
    expect(nextState.variables["loop.points"]).toBe(5);
  });
});

describe("buildActionLabel", () => {
  it("falls back to id when text is blank", () => {
    expect(buildActionLabel("rest", { text: "  " })).toBe("rest");
    expect(buildActionLabel("rest", { text: "Rest" })).toBe("Rest");
  });
});
