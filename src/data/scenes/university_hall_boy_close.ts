import { StateNode } from "../types";

const scene: StateNode = {
  title: "Прекрасный незнакомец",
  image: "scenes/university-hall-boy-close/background.png",
  actions: [
    {
      text: "Заговорить",
      effects: {
        dialog_options: [
          {
            text: "Привет",
            effects: {
              add_dialog_lines: [
                "Привет, я тоже ждешь пары? Я тебя раньше не видела, ты в какой группе?",
                "Привет... Я, нет, я жду друзей, я с другого факультета, мы сегодня курсовую сдаем. Они уже давно должны подойти, не знаю, что с ними.",
              ],
              dialog_options: [
                {
                  text: "Может позвонить им?",
                  effects: {
                    goto: "konstantin_needs_change",
                  },
                },
                {
                  text: "Мне кажется, твои друзья сегодня не придут.",
                  visible: {
                    and: [
                      "persistent.lent_ruble",
                      "persistent.met_konstantin_in_cafeteria",
                    ],
                  },
                  effects: {
                    add_dialog_lines: [
                      "Странно это звучит... С чего ты взяла?",
                    ],
                    dialog_options: [
                      {
                        text: "Сама не знаю. Просто поверь мне и иди сдавай без них.",
                        effects: {
                          goto: "konstantin_why_know",
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
};

export default scene;
