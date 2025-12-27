import { StateNode } from "../types";

const scene: StateNode = {
  title: "Улица, остановка. Трамвай остановился, открыл двери",
  image: "scenes/tram-stop/background.png",
  objects: [
    {
      name: "Двери трамвая",
      description: "Двери трамвая открыты",
      boundingBox: {
        x: 0.4,
        y: 0.3,
        width: 0.2,
        height: 0.5,
      },
      actions: [
        {
          text: "Зайти в трамвай",
          effects: [
            {
              goto: "tram_inside",
            },
          ],
        },
      ],
      image: "",
      visible: true,
    },
  ],
};

export default scene;
