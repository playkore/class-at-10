import { StateNode } from "../types";

const scene: StateNode = {
  title: "Аудитория",
  image: "scenes/class/background.png",
  actions: [
    {
      text: "Сесть к Наташе",
      effects: [
        {
          goto: "with_natasha",
        },
      ],
    },
    {
      text: "Сесть в одиночестве",
      effects: [
        {
          goto: "alone",
        },
      ],
    },
  ],
};

export default scene;
