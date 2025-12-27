import { StateNode } from "../types";

const scene: StateNode = {
  title: "Буфет",
  image: "scenes/university-cafe/background.png",
  actions: [
    {
      text: "Константин (вернуть рубль)",
      guard: "persistent.lent_ruble",
      failed_effects: [
        {
          message: "Без рубля мы и не перекинулись бы словом.",
        },
      ],
      effects: [
        {
          set: {
            "persistent.met_konstantin_in_cafeteria": true,
          },
        },
        {
          message:
            "О, хорошо, что ты тут! Я разменял пятерку, вот твой рубль… Дозвонился. Они не придут. Бухали вчера в общаге…",
        },
        {
          goto: "cafeteria",
        },
      ],
    },
    {
      text: "Константин (спросить, как сдал)",
      guard: "persistent.told_friends_wont_come",
      failed_effects: [
        {
          message: "Пока рано — он всё ещё переживает в вестибюле.",
        },
      ],
      effects: [
        {
          goto: "cafeteria_true_ending_dialog",
        },
      ],
    },
    {
      text: "Вернуться в вестибюль",
      effects: [
        {
          goto: "university_hall",
        },
      ],
    },
    {
      text: "Сесть, задремать",
      effects: [
        {
          message: "В буфете тепло и сон клонит…",
        },
        {
          goto: "sleep_next_day",
        },
      ],
    },
  ],
};

export default scene;
