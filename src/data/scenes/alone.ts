import { StateNode } from "../types";

const scene: StateNode = {
  title: "Сидеть в одиночестве",
  image: "scenes/class/background.png",
  actions: [
    {
      text: "Закрыть глаза, задремать",
      effects: [
        {
          message: "Скучно и клонит в сон.",
        },
        {
          goto: "sleep_next_day",
        },
      ],
    },
  ],
};

export default scene;
