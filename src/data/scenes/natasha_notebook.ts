import { StateNode } from "../types";

const scene: StateNode = {
  title: "Забытая тетрадь",
  image: "scenes/toilet-cabin/background.png",
  actions: [
    {
      text: "Посмотреть",
      effects: [
        {
          message: "Это тетрадь Наташи.",
        },
      ],
    },
    {
      text: "Взять",
      guard: {
        not: "daily.found_natasha_notebook",
      },
      failed_effects: [
        {
          message: "Уже лежит у меня в сумке.",
        },
      ],
      effects: [
        {
          set: {
            "daily.found_natasha_notebook": true,
          },
        },
        {
          message: "Возьму, вдруг пригодится.",
        },
        {
          goto: "uni_toilet",
        },
      ],
    },
    {
      text: "Назад",
      effects: [
        {
          goto: "uni_toilet",
        },
      ],
    },
  ],
};

export default scene;
