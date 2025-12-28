import { StateNode } from "../types";

const scene: StateNode = {
  title: "Улица, остановка. Трамвай остановился, открыл двери",
  image: "scenes/tram-stop/background.png",
  objects: [
    {
      name: "Двери трамвая",
      description: "Двери трамвая открыты",
      boundingBox: {
        x: 0.51,
        y: 0.36,
        width: 0.16,
        height: 0.3,
      },
      actions: [
        {
          text: "Зайти в трамвай",
          effects: {
            goto: "tram_inside",
          },
        },
      ],
      image: "",
      visible: true,
    },
  ],
};

export default scene;
