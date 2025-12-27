import { StateNode } from "../types";

const scene: StateNode = {
  title: "Кухня, у окна",
  image: "scenes/apartment-curtains/background.png",
  actions: [
    {
      text: "Раздвинуть шторы",
      effects: [
        {
          goto: "kitchen_curtains_open",
        },
      ],
    },
    {
      text: "Назад",
      effects: [
        {
          goto: "kitchen",
        },
      ],
    },
  ],
};

export default scene;
