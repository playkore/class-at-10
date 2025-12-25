import type { SceneDefinition } from "../../types/scenes";

const arrivalLawn: SceneDefinition = {
  id: "arrival",
  name: "Arrival",
  description:
    "Ослепительная вспышка... На секунду мне кажется, что я вижу себя со стороны, висящей в центре шара, состоящего из чистой энергии...",
  imageSrc: "/scenes/chapter01/arrival.png",
  interactions: [
    {
      label: "Глава 1. Прибытие",
      effect: (wrapper) => wrapper.setScene("arrival-lawn"),
    },
  ],
  objects: [],
};

export default arrivalLawn;
