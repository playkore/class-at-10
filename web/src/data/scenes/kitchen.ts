import { StateNode } from "../types";

const scene: StateNode = {
  title: "Кухня",
  image: "scenes/apartment-kitchen/background.png",
  actions: [
    {
      text: "Вернуться в коридор",
      effects: {
        goto: "corridor",
      },
    },
  ],
  objects: [
    {
      id: "kitchen_bowl",
      name: "Миска на столе",
      description:
        "Большая керамическая миска. Красивая. Родители привезли из Польши.",
      boundingBox: {
        x: 0.57,
        y: 0.46,
        width: 0.15,
        height: 0.06,
      },
      actions: [
        {
          text: "Заглянуть в миску",
          effects: {
            goto: "kitchen_bowl",
          },
        },
      ],
    },
    {
      id: "kitchen_curtains",
      name: "Окошко",
      description: "Окно на кухне. Тюль задернута, но видно, что уже светает.",
      boundingBox: {
        x: 0.42,
        y: 0.09,
        width: 0.29,
        height: 0.34,
      },
      actions: [
        {
          text: "Подойти ближе",
          effects: {
            goto: "kitchen_curtains_closed",
          },
        },
      ],
    },
  ],
};

export default scene;
