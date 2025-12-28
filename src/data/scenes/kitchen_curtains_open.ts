import { StateNode } from "../types";

const scene: StateNode = {
  title: "Кухня, у окна, шторы раздвинуты",
  image: "scenes/apartment-curtains-open/background.png",
  objects: [
    {
      name: "Россыпь монет",
      description: "Немного мелочи на подоконнике",
      boundingBox: {
        x: 0.54,
        y: 0.65,
        width: 0.24,
        height: 0.06,
      },
      actions: [
        {
          text: "Взять",
          guard: {
            not: "daily.has_coins",
          },
          failed_effects: {
            message: "Монетки уже у меня.",
          },

          effects: {
            set: {
              "daily.has_coins": true,
            },
          },
        },
      ],
      image: "scenes/apartment-curtains-open/object-coins.png",
      visible: {
        not: "daily.has_coins",
      },
    },
  ],
  actions: [
    {
      text: "Задвинуть шторы",
      effects: {
        goto: "kitchen_curtains_closed",
      },
    },
    {
      text: "Назад",
      effects: {
        goto: "kitchen",
      },
    },
  ],
};

export default scene;
