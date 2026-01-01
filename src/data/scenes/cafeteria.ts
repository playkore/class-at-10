import { StateNode } from "../types";

const scene: StateNode = {
  title: "Буфет",
  image: "scenes/university-cafe/background.png",
  objects: [
    {
      name: "Константин",
      image: "scenes/university-cafe/object-boy.png",
      boundingBox: {
        x: 0.31,
        y: 0.16,
        width: 0.62,
        height: 0.7,
      },
      visible: {
        and: [
          { not: "persistent.met_konstantin_in_cafeteria" },
          {
            or: [
              "persistent.told_friends_wont_come",
              "daily.talked_konstantin_today",
            ],
          },
        ],
      },
      actions: [
        {
          text: "Поговорить",
          effects: {
            dialog_options: [
              {
                visible: {
                  not: "persistent.told_friends_wont_come",
                },
                text: "Привет, Константин! Как друзья, ты до них дозвонился?",
                effects: {
                  add_dialog_lines: [
                    "Привет. Да, они бухали вчера в общаге и проспали. Я вот зашел в буфет разметять пятерку. Вот твой рубль... Ну ладно, я побежал, может быть еще успаю сдать работу.",
                  ],
                  dialog_options: [
                    {
                      text: "До встречи...",
                      effects: {
                        set: { "persistent.met_konstantin_in_cafeteria": true },
                      },
                    },
                  ],
                },
              },
              {
                text: "Привет, Константин! Как курсовая, приняли?",
                visible: "persistent.told_friends_wont_come",
                effects: {
                  add_dialog_lines: [
                    "Да! Препод уже убегала на лекцию, я еле успел. Она даже на работа смотреть не стала, подписала зачетку и все. Повезло.",
                  ],
                  dialog_options: [
                    {
                      text: "Рада за тебя. Поздравляю!",
                      effects: {
                        add_dialog_lines: [
                          "Рада за тебя. Поздравляю!",
                          "Спасибо! Буду отмечать. У меня пятерка есть, хочешь сочник с творогом?",
                        ],
                        dialog_options: [
                          {
                            text: "И они жили долго и счастливо.",
                            effects: {
                              goto: "cafeteria_true_ending_dialog",
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
    },
  ],
  actions: [
    {
      text: "Сесть",
      effects: {
        message: "В буфете тепло и в сон клонит...",
        goto: "sleep_next_day",
      },
    },
  ],
};

export default scene;
