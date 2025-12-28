import { StateNode } from "../types";

const scene: StateNode = {
  title: "Сидеть с Наташей",
  image: "scenes/class-friend-close/background.png",
  actions: [
    {
      text: "Отдать тетрадь",
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
      visible: {
        and: [
          "daily.found_natasha_notebook",
          { not: "daily.returned_natasha_notebook_today" },
        ],
      },
    },
    {
      text: "Попросить списать вчерашнюю лекцию",
      visible: {
        and: ["daily.returned_natasha_notebook_today"],
      },
      guards: [
        {
          if: { not: "daily.got_lecture_notebook_today" },
          effects: [
            {
              message: "Странно, мне кажется я забыла тетрадь дома...",
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
          message: "Наташа отдает тетрадь. Ура. Надо сесть в буфете и списать.",
        },
      ],
    },
    {
      text: "Пойти в буфет на полпары",
      visible: "daily.got_lecture_notebook_today",
      effects: [
        {
          set: {
            "daily.went_to_cafeteria_today": true,
          },
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
