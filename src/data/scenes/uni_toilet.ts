import { StateNode } from "../types";

const scene: StateNode = {
  title: "Туалет (университет)",
  image: "scenes/toilet/background.png",
  actions: [
    {
      text: "Сходить",
      guard: {
        not: "daily.used_toilet_uni",
      },
      failed_effects: [
        {
          message: "Я уже заходила — больше не получится.",
        },
      ],
      effects: [
        {
          set: {
            "daily.used_toilet_uni": true,
          },
        },
        {
          message: "Готово. Можно идти дальше.",
        },
      ],
    },
    {
      text: "Кабинка",
      effects: [
        {
          goto: "uni_toilet_cabin",
        },
      ],
    },
    {
      text: "Забытая тетрадь",
      effects: [
        {
          goto: "natasha_notebook",
        },
      ],
    },
    {
      text: "Выйти",
      effects: [
        {
          goto: "university_hall",
        },
      ],
    },
  ],
};

export default scene;
