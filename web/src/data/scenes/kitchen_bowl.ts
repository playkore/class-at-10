import { StateNode } from "../types";

const scene: StateNode = {
  title: "Кухня: миска",
  image: "scenes/apartment-kitchen-bowl/background.png",
  objects: [
    {
      name: "Ключи от дома",
      description: "Ключи от моей квартиры",
      boundingBox: {
        x: 0.26,
        y: 0.41,
        width: 0.56,
        height: 0.24,
      },
      actions: [
        {
          text: "Взять",
          guard: {
            not: "daily.has_keys",
          },
          failed_effects: {
            message: "Ключи уже у меня.",
          },

          effects: {
            set: {
              "daily.has_keys": true,
            },
          },
        },
      ],
      image: "scenes/apartment-kitchen-bowl/object-keys.png",
      visible: {
        not: "daily.has_keys",
      },
    },
  ],
  actions: [
    {
      text: "Назад",
      effects: {
        goto: "kitchen",
      },
    },
  ],
};

export default scene;
