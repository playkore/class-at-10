import { StateNode } from "../types";

const scene: StateNode = {
  title: "Сидеть с Наташей",
  image: "scenes/class-friend-close/background.png",
  actions: [
    {
      text: "Отдать тетрадь (если есть)",
      guards: [
        {
          if: {
            not: "daily.found_natasha_notebook",
          },
          effects: [
            {
              message: "Нечего отдавать — пустые руки.",
            },
          ],
        },
        {
          if: "daily.returned_natasha_notebook_today",
          effects: [
            {
              message: "Я уже отдала её сегодня.",
            },
          ],
        },
      ],
      effects: [
        {
          set: {
            "daily.returned_natasha_notebook_today": true,
          },
        },
        {
          set: {
            "persistent.natasha_owes": true,
          },
        },
        {
          message: "Ой! Моя! Спасибо тебе!",
        },
      ],
    },
    {
      text: "Попросить списать вчерашнюю лекцию",
      guard: "persistent.natasha_owes",
      failed_effects: [
        {
          message: "Неудобно просить — я ей ещё ничем не помогла.",
        },
      ],
      guards: [
        {
          if: {
            not: "daily.returned_natasha_notebook_today",
          },
          effects: [
            {
              message: "Эх… я сегодня свою тетрадь забыла.",
            },
          ],
        },
      ],
      effects: [
        {
          set: {
            "daily.got_lecture_notebook_today": true,
          },
        },
        {
          message: "Держи, вот моя другая тетрадь, там лекция.",
        },
      ],
    },
    {
      text: "Пойти в буфет на полпары",
      guards: [
        {
          if: {
            not: "daily.got_lecture_notebook_today",
          },
          effects: [
            {
              message:
                "Сначала бы списать лекцию — без тетради там делать нечего.",
            },
          ],
        },
        {
          if: "daily.went_to_cafeteria_today",
          effects: [
            {
              message: "Я уже прогуливала сегодня — второй раз нельзя.",
            },
          ],
        },
      ],
      effects: [
        {
          set: {
            "daily.went_to_cafeteria_today": true,
          },
        },
        {
          message: "С Наташиным конспектом можно прогулять полпары.",
        },
        {
          goto: "cafeteria",
        },
      ],
    },
    {
      text: "Закрыть глаза, задремать",
      effects: [
        {
          message: "Складываю руки на парте и проваливаюсь в сон.",
        },
        {
          goto: "sleep_next_day",
        },
      ],
    },
  ],
};

export default scene;
