import { StateNode } from "../types";

const scene: StateNode = {
  title: "Сидеть с Наташей",
  image: "scenes/class-friend-close/background.png",
  actions: [
    {
      text: "Поговорить",
      effects: {
        dialog_options: [
          {
            text: "Наташа, у тебя случайно нет вчерашней лекции по возрастной?",
            visible: { not: "daily.returned_natasha_notebook_today" },
            effects: {
              add_dialog_lines: ["Кажется, я забыла тетрадь дома..."],
            },
          },
          {
            text: "Я нашла твою тетрадь по возрастной в туалете.",
            visible: {
              and: [
                "daily.found_natasha_notebook",
                { not: "daily.returned_natasha_notebook_today" },
              ],
            },
            effects: {
              add_dialog_lines: ["Ой! Спасибо большое!"],
              set: {
                "daily.returned_natasha_notebook_today": true,
              },
              dialog_options: [
                {
                  text: "Можно, кстати, списать у тебя вчерашнюю лекцию?",
                  effects: {
                    add_dialog_lines: ["Конечно, держи."],
                    dialog_options: [
                      {
                        text: "Спасибо! Я тогда пойду в буфет на полпары, чтобы списать.",
                        effects: { goto: "cafeteria" },
                      },
                    ],
                    set: {
                      "daily.got_lecture_notebook_today": true,
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      text: "Пойти в буфет на полпары",
      visible: "daily.got_lecture_notebook_today",
      effects: {
        set: {
          "daily.went_to_cafeteria_today": true,
        },
        goto: "cafeteria",
      },
    },
    {
      text: "Закрыть глаза, задремать",
      effects: {
        message: "Складываю руки на парте и проваливаюсь в сон.",
        goto: "sleep_next_day",
      },
    },
  ],
};

export default scene;
