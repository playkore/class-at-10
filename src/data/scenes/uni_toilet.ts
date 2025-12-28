import { StateNode } from "../types";

const scene: StateNode = {
  title: "Туалет (университет)",
  image: "scenes/toilet/background.png",
  actions: [
    {
      text: "Выйти",
      effects: [
        {
          goto: "university_hall",
        },
      ],
    },
  ],
  objects: [
    {
      id: "uni_toilet_cabin",
      name: "Кабинка",
      boundingBox: {
        x: 0.11,
        y: 0.26,
        width: 0.17,
        height: 0.43,
      },

      actions: [
        {
          text: "Зайти внутрь",
          effects: [
            {
              goto: "uni_toilet_cabin",
            },
          ],
        },
      ],
    },
  ],
};

export default scene;
