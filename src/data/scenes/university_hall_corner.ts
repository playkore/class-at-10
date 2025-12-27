import { StateNode } from "../types";

const scene: StateNode = {
  title: "Вестибюль: уголочек",
  image: "scenes/university-hall/background.png",
  on_enter: {
    messages: [
      {
        message:
          "Подожду наших… Всё равно я не знаю, в какой аудитории занятие.",
        visible: {
          not: "persistent.knows_schedule",
        },
      },
      {
        message: "Подожду наших, пойдём вместе в аудиторию.",
        visible: "persistent.knows_schedule",
      },
    ],
  },
  actions: [
    {
      text: "Встать",
      effects: [
        {
          goto: "university_hall",
        },
      ],
    },
    {
      text: "Подремать",
      effects: [
        {
          message:
            "Задремать прямо тут — плохая идея… но глаза закрываются.",
        },
        {
          goto: "sleep_next_day",
        },
      ],
    },
  ],
};

export default scene;
