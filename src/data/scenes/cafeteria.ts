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
      actions: [
        {
          text: "Поговорить",
          effects: {
            dialog_options: [
              {
                text: "Привет, Константин! Как экзамен?",
                visible: {
                  not: "persistent.told_friends_wont_come",
                },
                effects: {
                  add_dialog_lines: [
                    "Привет... Да никак. Они не пришли на экзамен.",
                    "Я дозвонился до них после экзамена — они бухали вчера в общаге и проспали.",
                  ],
                  set: {
                    "persistent.told_friends_wont_come": true,
                  },
                },
              },
              {
                text: "Ты не хочешь вернуть мне рубль, который я тебе одолжил?",
                visible: "persistent.lent_ruble",
                effects: {
                  add_dialog_lines: [
                    "Эх, извини, сейчас совсем туго с деньгами...",
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
    // {
    //   text: "Константин (вернуть рубль)",
    //   guard: "persistent.lent_ruble",
    //   failed_effects: {
    //     message: "Без рубля мы и не перекинулись бы словом.",
    //   },
    //   effects: {
    //     set: {
    //       "persistent.met_konstantin_in_cafeteria": true,
    //     },
    //     message:
    //       "О, хорошо, что ты тут! Я разменял пятерку, вот твой рубль… Дозвонился. Они не придут. Бухали вчера в общаге…",
    //     goto: "cafeteria",
    //   },
    // },
    // {
    //   text: "Константин (спросить, как сдал)",
    //   guard: "persistent.told_friends_wont_come",
    //   failed_effects: {
    //     message: "Пока рано — он всё ещё переживает в вестибюле.",
    //   },
    //   effects: {
    //     goto: "cafeteria_true_ending_dialog",
    //   },
    // },
    // {
    //   text: "Вернуться в вестибюль",
    //   effects: {
    //     goto: "university_hall",
    //   },
    // },
    // {
    //   text: "Сесть, задремать",
    //   effects: {
    //     message: "В буфете тепло и сон клонит…",
    //     goto: "sleep_next_day",
    //   },
    // },
  ],
};

export default scene;
