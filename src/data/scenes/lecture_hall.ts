import { StateNode } from "../types";

const scene: StateNode = {
  title: "Аудитория",
  image: "scenes/class/background.png",
  objects: [
    {
      id: "lecture_hall_natasha",
      name: "Наташа",
      description: "Наташа опять пришла на занятие самая первая.",
      boundingBox: {
        x: 0.33,
        y: 0.37,
        width: 0.34,
        height: 0.29,
      },
      actions: [
        {
          text: "Сесть рядом",
          effects: [
            {
              goto: "with_natasha",
            },
          ],
        },
      ],
    },
  ],
};

export default scene;
