import { StateNode } from "../types";

const scene: StateNode = {
  title: "Сидеть с Наташей",
  image: "scenes/class-friend-close/background.png",
  actions: [
    {
      text: "Поговорить",
      effects: [
        {
          dialog_options: [
            {
              text: "Наташа, у тебя случайно нет вчерашней лекции по возрастной?",
              visible: { not: "daily.returned_natasha_notebook_today" },
              effects: [
                {
                  add_dialog_line: "Кажется, я забыла тетрадь дома...",
                },
              ],
            },
            {
              text: "Я нашла твою тетрадь по возрастной в туалете.",
              visible: {
                and: [
                  "daily.found_natasha_notebook",
                  { not: "daily.returned_natasha_notebook_today" },
                ],
              },
              effects: [
                {
                  add_dialog_line: "Ой! Спасибо большое!",
                  set: {
                    "daily.returned_natasha_notebook_today": true,
                  },
                  dialog_options: [
                    {
                      text: "Можно, кстати, списать у тебя вчерашнюю лекцию?",
                      effects: [
                        {
                          add_dialog_line: "Конечно, держи.",
                          dialog_options: [
                            {
                              text: "Спасибо! Я тогда пойду в буфет на полпары, чтобы списать.",
                              effects: [{ goto: "cafeteria" }],
                            },
                          ],
                        },
                        {
                          set: {
                            "daily.got_lecture_notebook_today": true,
                          },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
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

/*

Логика диалога

(если протоганист НЕ отдал тетрадь сегодня)
Протоганист: Наташа, у тебя случайно нет вчераней лекции по возрастной?
Наташа: Кажется, я забыла тетрадь дома...

(если протоганист отдал тетрадь сегодня)
Протоганист: Я нашла твою тетрадь по возрастной в туалете.
Наташа: Ой! Спасибо большое! 
Протоганист: Можно, кстати, списать у тебя вчерашнюю лекцию?
Наташа: Конечно, держи.
Протоганист: Спасибо! Я тогда пойду в буфет на полпары, чтобы списать.


question
    answer
      question1
        answer1
      question2
        effects:
          set: { some_flag: true }
          dialog_line: {
            text: "answer2"
            speaker: "natasha"
          }
          options: [
            {
              text: "question3",
              effects: [
                {
                  set: { another_flag: true }
              answer3
            question4
              answer4
            }
          ]
        }
        
 */
