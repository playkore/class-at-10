import { StateNode } from "../types";

const scene: StateNode = {
  title: "Кухня",
  image: "scenes/apartment-kitchen/background.png",
  actions: [
    {
      text: "Посмотреть на миску",
      effects: [
        {
          goto: "kitchen_bowl",
        },
      ],
    },
    {
      text: "Выйти в коридор",
      effects: [
        {
          goto: "corridor",
        },
      ],
    },
  ],
};

export default scene;
