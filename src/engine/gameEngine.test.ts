import { describe, expect, it } from "vitest";

import { gameSpec } from "../data/gameSpec";
import type {
  ActionDef,
  DialogOption,
  GameSpec,
  SceneObject,
  StateNode,
} from "../data/types";
import {
  applyAction,
  applyActionDefinition,
  applyDialogOption,
  buildActionLabel,
  createInitialGameState,
  getNode,
  type GameState,
} from "./gameEngine";
import { evaluateExpression } from "../utils/evaluateExpression";

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
      effects: { set: { "persistent.p1": false }, end: true },
    },
  },
});

const getStateNode = (spec: GameSpec, stateId: string): StateNode => {
  const node = spec.states[stateId];
  expect(node, `Missing state ${stateId}`).toBeDefined();
  return node;
};

const getVisibleSceneAction = (
  spec: GameSpec,
  state: GameState,
  actionText: string
): ActionDef => {
  const scene = getStateNode(spec, state.currentStateId);
  const action = (scene.actions ?? []).find(
    (item) =>
      item.text === actionText && evaluateExpression(item.visible, state)
  );
  expect(action, `Missing scene action "${actionText}" in ${state.currentStateId}`).toBeDefined();
  return action!;
};

const getVisibleObject = (
  spec: GameSpec,
  state: GameState,
  objectName: string
): SceneObject => {
  const scene = getStateNode(spec, state.currentStateId);
  const object = (scene.objects ?? []).find(
    (item) =>
      item.name === objectName && evaluateExpression(item.visible, state)
  );
  expect(object, `Missing object "${objectName}" in ${state.currentStateId}`).toBeDefined();
  return object!;
};

const getVisibleObjectAction = (
  spec: GameSpec,
  state: GameState,
  objectName: string,
  actionText: string
): ActionDef => {
  const object = getVisibleObject(spec, state, objectName);
  const action = object.actions.find(
    (item) =>
      item.text === actionText && evaluateExpression(item.visible, state)
  );
  expect(
    action,
    `Missing object action "${actionText}" on "${objectName}" in ${state.currentStateId}`
  ).toBeDefined();
  return action!;
};

const getVisibleDialogOption = (
  state: GameState,
  optionText: string
): DialogOption => {
  const option = state.dialogOptions.find(
    (item) => item.text === optionText && evaluateExpression(item.visible, state)
  );
  expect(option, `Missing dialog option "${optionText}" in ${state.currentStateId}`).toBeDefined();
  return option!;
};

const takeSceneAction = (
  spec: GameSpec,
  state: GameState,
  actionText: string
): GameState =>
  applyActionDefinition(state, spec, getVisibleSceneAction(spec, state, actionText));

const takeObjectAction = (
  spec: GameSpec,
  state: GameState,
  objectName: string,
  actionText: string
): GameState =>
  applyActionDefinition(
    state,
    spec,
    getVisibleObjectAction(spec, state, objectName, actionText)
  );

const chooseDialogOption = (
  state: GameState,
  spec: GameSpec,
  optionText: string
): GameState => applyDialogOption(state, spec, getVisibleDialogOption(state, optionText));

const gatherMorningItems = (
  state: GameState,
  options?: { takePass?: boolean }
): GameState => {
  let next = state;
  next = takeSceneAction(gameSpec, next, "Открыть глаза");
  next = takeObjectAction(gameSpec, next, "Будильник", "Выключить будильник");
  next = takeSceneAction(gameSpec, next, "Встать");
  next = takeObjectAction(gameSpec, next, "Расписание занятий", "Посмотреть расписание");
  if (options?.takePass) {
    next = takeObjectAction(gameSpec, next, "Ящик стола", "Открыть ящик");
    next = takeObjectAction(gameSpec, next, "Проездной", "Забрать");
    next = takeSceneAction(gameSpec, next, "Закрыть ящик");
  }
  next = takeObjectAction(gameSpec, next, "Тетрадь и ручка", "Взять");
  next = takeObjectAction(gameSpec, next, "Одежда", "Одеться");
  next = takeSceneAction(gameSpec, next, "В коридор");
  next = takeObjectAction(gameSpec, next, "Дверь в кухню", "Зайти");
  next = takeObjectAction(gameSpec, next, "Миска на столе", "Заглянуть в миску");
  next = takeObjectAction(gameSpec, next, "Ключи от дома", "Взять");
  next = takeSceneAction(gameSpec, next, "Назад");
  next = takeObjectAction(gameSpec, next, "Окошко", "Подойти ближе");
  next = takeSceneAction(gameSpec, next, "Раздвинуть шторы");
  next = takeObjectAction(gameSpec, next, "Россыпь монет", "Взять");
  next = takeSceneAction(gameSpec, next, "Назад");
  next = takeSceneAction(gameSpec, next, "Вернуться в коридор");
  return next;
};

const travelToUniversity = (
  state: GameState,
  options?: { usePass?: boolean; unlockPass?: boolean }
): GameState => {
  let next = state;
  next = takeObjectAction(gameSpec, next, "Дверь на улицу", "Выйти");
  next = takeObjectAction(gameSpec, next, "Двери трамвая", "Зайти в трамвай");
  if (options?.unlockPass) {
    next = takeObjectAction(gameSpec, next, "Кондуктор", "Показать проездной");
  }
  next = options?.usePass
    ? takeObjectAction(gameSpec, next, "Кондуктор", "Показать проездной")
    : takeObjectAction(gameSpec, next, "Кондуктор", "Купить билет");
  next = takeSceneAction(gameSpec, next, "Выйти на остановке");
  next = takeObjectAction(gameSpec, next, "Вход в университет", "Войти");
  return next;
};

const goToLectureAndCafeteria = (state: GameState): GameState => {
  let next = state;
  next = takeObjectAction(gameSpec, next, "Дверь в туалет", "Войти");
  next = takeObjectAction(gameSpec, next, "Кабинка", "Зайти внутрь");
  next = takeObjectAction(gameSpec, next, "Забытая тетрадь", "Взять");
  next = takeSceneAction(gameSpec, next, "Назад");
  next = takeSceneAction(gameSpec, next, "Выйти");
  next = takeObjectAction(gameSpec, next, "К аудиториям", "Идти на занятия");
  next = takeObjectAction(gameSpec, next, "Наташа", "Сесть рядом");
  next = takeSceneAction(gameSpec, next, "Поговорить");
  next = chooseDialogOption(
    next,
    gameSpec,
    "Я нашла твою тетрадь по возрастной в туалете."
  );
  next = chooseDialogOption(
    next,
    gameSpec,
    "Можно, кстати, списать у тебя вчерашнюю лекцию?"
  );
  next = chooseDialogOption(
    next,
    gameSpec,
    "Спасибо! Я тогда пойду в буфет на полпары, чтобы списать."
  );
  return next;
};

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
        failed_effects: { message: "Need a pass" },
        effects: { goto: "middle" },
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
            effects: { message: "Handled by guard" },
          },
        ],
        effects: { set: { "daily.d1": true } },
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
        effects: { set: { "daily.d1": true }, goto: "end" },
      },
    ]);

    const state = createInitialGameState(spec);
    const nextState = applyAction(state, spec, 0);

    expect(nextState.currentStateId).toBe("end");
    expect(nextState.flags.daily.d1).toBe(true);
    expect(nextState.flags.persistent.p1).toBe(false);
    expect(nextState.isEnded).toBe(true);
  });

  it("appends dialog lines and updates dialog options", () => {
    const spec = baseSpec([
      {
        text: "Chat",
        effects: {
          add_dialog_lines: ["Hello"],
          dialog_options: [
            {
              text: "Reply",
              effects: {
                add_dialog_lines: ["Hi there"],
              },
            },
          ],
        },
      },
    ]);

    const state = createInitialGameState(spec);
    const nextState = applyAction(state, spec, 0);

    expect(nextState.dialogLines).toEqual(["Hello"]);
    expect(nextState.dialogOptions).toHaveLength(1);

    const dialogState = applyDialogOption(
      nextState,
      spec,
      nextState.dialogOptions[0]
    );

    expect(dialogState.dialogLines).toEqual(["Hello", "Hi there"]);
    expect(dialogState.dialogOptions).toHaveLength(0);
  });
});

describe("gameSpec integrity", () => {
  it("resolves every goto target to a state or terminal", () => {
    const knownTargets = new Set([
      ...Object.keys(gameSpec.states),
      ...Object.keys(gameSpec.terminals ?? {}),
    ]);
    const missingTargets = new Set<string>();

    const visitEffects = (effects?: { goto?: string; dialog_options?: DialogOption[] }) => {
      if (!effects) {
        return;
      }
      if (effects.goto && !knownTargets.has(effects.goto)) {
        missingTargets.add(effects.goto);
      }
      for (const option of effects.dialog_options ?? []) {
        visitEffects(option.effects);
      }
    };

    const visitAction = (action: ActionDef) => {
      visitEffects(action.effects);
      visitEffects(action.failed_effects);
      for (const guard of action.guards ?? []) {
        visitEffects(guard.effects);
      }
    };

    for (const scene of Object.values(gameSpec.states)) {
      for (const action of scene.actions ?? []) {
        visitAction(action);
      }
      for (const object of scene.objects ?? []) {
        for (const action of object.actions) {
          visitAction(action);
        }
      }
    }

    expect([...missingTargets]).toEqual([]);
  });
});

describe("winning route", () => {
  it("plays the intended three-loop path to the true ending", () => {
    let state = createInitialGameState(gameSpec);

    state = gatherMorningItems(state);
    expect(state.currentStateId).toBe("corridor");
    expect(state.flags.daily.has_keys).toBe(true);
    expect(state.flags.daily.has_coins).toBe(true);
    expect(state.flags.daily.has_notebook).toBe(true);
    expect(state.flags.daily.is_dressed).toBe(true);

    state = travelToUniversity(state, { unlockPass: true });
    expect(state.currentStateId).toBe("university_hall");
    expect(state.flags.daily.paid_for_tram).toBe(true);
    expect(state.flags.daily.has_coins).toBe(false);
    expect(state.flags.persistent.pass_unlocked).toBe(true);

    state = takeObjectAction(gameSpec, state, "Парень", "Подойти ближе");
    expect(state.currentStateId).toBe("university_hall_boy_close");

    state = takeSceneAction(gameSpec, state, "Заговорить");
    state = chooseDialogOption(state, gameSpec, "Привет");
    expect(
      getVisibleDialogOption(state, "Может позвонить им?").text
    ).toBe("Может позвонить им?");
    expect(
      state.dialogOptions.some(
        (option) =>
          option.text === "Мне кажется, твои друзья сегодня не придут." &&
          evaluateExpression(option.visible, state)
      )
    ).toBe(false);

    state = chooseDialogOption(state, gameSpec, "Может позвонить им?");
    expect(state.currentStateId).toBe("konstantin_needs_change");
    state = takeSceneAction(gameSpec, state, "Сказать, что мелочи нет");
    expect(state.dialogLines).toContain(
      "Ой, нет. Я все на трамвай потратила сегодня утром..."
    );
    state = chooseDialogOption(state, gameSpec, "До встречи!");
    expect(state.currentStateId).toBe("university_hall");

    state = goToLectureAndCafeteria(state);
    expect(state.currentStateId).toBe("cafeteria");
    expect(state.flags.daily.got_lecture_notebook_today).toBe(true);
    expect(
      getStateNode(gameSpec, state.currentStateId).objects?.some(
        (object) =>
          object.name === "Константин" &&
          evaluateExpression(object.visible, state)
      ) ?? false
    ).toBe(false);
    state = takeSceneAction(gameSpec, state, "Сесть");
    expect(state.currentStateId).toBe("sleep_next_day");
    expect(state.flags.persistent.met_konstantin_in_cafeteria).toBe(false);

    state = takeSceneAction(gameSpec, state, "Какой странный сон...");
    expect(state.currentStateId).toBe("darkness_start");
    expect(state.variables["loop.day_index"]).toBe(2);

    state = gatherMorningItems(state, { takePass: true });
    expect(state.flags.daily.has_pass).toBe(true);
    state = travelToUniversity(state, { usePass: true });
    expect(state.currentStateId).toBe("university_hall");
    expect(state.flags.daily.has_coins).toBe(true);

    state = takeObjectAction(gameSpec, state, "Парень", "Подойти ближе");
    state = takeSceneAction(gameSpec, state, "Заговорить");
    state = chooseDialogOption(state, gameSpec, "Привет");
    expect(
      state.dialogOptions.some(
        (option) =>
          option.text === "Мне кажется, твои друзья сегодня не придут." &&
          evaluateExpression(option.visible, state)
      )
    ).toBe(false);
    state = chooseDialogOption(state, gameSpec, "Может позвонить им?");
    expect(state.currentStateId).toBe("konstantin_needs_change");
    state = takeSceneAction(gameSpec, state, "Дать рубль");
    expect(state.flags.persistent.lent_ruble).toBe(true);
    expect(state.flags.daily.has_coins).toBe(false);
    state = chooseDialogOption(state, gameSpec, "До встречи!");
    expect(state.currentStateId).toBe("university_hall");

    state = goToLectureAndCafeteria(state);
    expect(state.currentStateId).toBe("cafeteria");
    state = takeObjectAction(gameSpec, state, "Константин", "Поговорить");
    state = chooseDialogOption(
      state,
      gameSpec,
      "Привет, Константин! Как друзья, ты до них дозвонился?"
    );
    expect(state.dialogLines).toContain(
      "Привет. Да, они бухали вчера в общаге и проспали. Я вот зашел в буфет перед тем, как бежать сдавать работу. Ну ладно, я побежал, может быть еще успею."
    );
    state = chooseDialogOption(state, gameSpec, "До встречи...");
    expect(state.currentStateId).toBe("sleep_next_day");
    expect(state.flags.persistent.met_konstantin_in_cafeteria).toBe(true);
    expect(state.flags.persistent.told_friends_wont_come).toBe(false);

    state = takeSceneAction(gameSpec, state, "Какой странный сон...");
    expect(state.currentStateId).toBe("darkness_start");
    expect(state.variables["loop.day_index"]).toBe(3);

    state = gatherMorningItems(state, { takePass: true });
    state = travelToUniversity(state, { usePass: true });
    expect(state.currentStateId).toBe("university_hall");

    state = takeObjectAction(gameSpec, state, "Парень", "Подойти ближе");
    state = takeSceneAction(gameSpec, state, "Заговорить");
    state = chooseDialogOption(state, gameSpec, "Привет");
    state = chooseDialogOption(
      state,
      gameSpec,
      "Мне кажется, твои друзья сегодня не придут."
    );
    state = chooseDialogOption(
      state,
      gameSpec,
      "Сама не знаю. Просто поверь мне и иди сдавай без них."
    );
    expect(state.currentStateId).toBe("konstantin_why_know");
    state = takeSceneAction(
      gameSpec,
      state,
      "Женская интуиция. Иди один сдавай."
    );
    expect(state.flags.persistent.told_friends_wont_come).toBe(true);
    expect(state.currentStateId).toBe("university_hall");

    state = goToLectureAndCafeteria(state);
    expect(state.currentStateId).toBe("cafeteria");
    state = takeObjectAction(gameSpec, state, "Константин", "Поговорить");
    state = chooseDialogOption(
      state,
      gameSpec,
      "Привет, Константин! Как курсовая, приняли?"
    );
    expect(state.dialogLines).toContain(
      "Да! Препод уже убегала на лекцию, я еле успел. Она даже на работа смотреть не стала, подписала зачетку и все. Повезло."
    );
    state = chooseDialogOption(state, gameSpec, "Рада за тебя. Поздравляю!");
    expect(state.dialogLines).toContain(
      "Спасибо! Буду отмечать. У меня пятерка есть, хочешь сочник с творогом?"
    );
    state = chooseDialogOption(
      state,
      gameSpec,
      "И они жили долго и счастливо."
    );
    expect(state.currentStateId).toBe("cafeteria_true_ending_dialog");
    state = takeSceneAction(gameSpec, state, "Остаться с Константином");
    expect(state.currentStateId).toBe("true_ending");
    expect(state.isEnded).toBe(true);
  });
});

describe("buildActionLabel", () => {
  it("falls back to id when text is blank", () => {
    expect(buildActionLabel(2, { text: "  ", effects: {} })).toBe("2");
    expect(buildActionLabel(2, { text: "Rest", effects: {} })).toBe("Rest");
  });
});
