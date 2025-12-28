import { StateNode } from "../types";

const scene: StateNode = {
  title: "Туалет (кабинка)",
  image: "scenes/toilet-cabin/background.png",
  actions: [
    {
      text: "Назад",
      effects: {
        goto: "uni_toilet",
      },
    },
  ],
  objects: [
    {
      id: "cabin_notebook",
      name: "Забытая тетрадь",
      boundingBox: {
        x: 0.49,
        y: 0.31,
        width: 0.16,
        height: 0.06,
      },
      actions: [
        {
          text: "Взять",
          effects: {
            message:
              "Это же Наташина тетрадь по возрастной! О, у нее есть вчерашняя лекция.",
            set: {
              "daily.found_natasha_notebook": true,
            },
          },
        },
      ],
      visible: { not: "daily.found_natasha_notebook" },
      image: "scenes/toilet-cabin/object-notebook.png",
    },
  ],
};

export default scene;
