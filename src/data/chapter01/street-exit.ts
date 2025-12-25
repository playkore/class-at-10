import type { SceneDefinition } from "../../types/scenes";

const streetExit: SceneDefinition = {
  id: "street-exit",
  name: "Улица в пригороде",
  description:
    "Хотелось бы знать, на кого я похожа в этом наряде. Впрочем, миссия не ждет. Нужно двигаться дальше.",
  imageSrc: "/scenes/chapter01/street-exit.png",
  interactions: [
    {
      label: "Направиться в город",
      effect: (wrapper) => {
        return wrapper.setScene("smithtown-view");
      },
    },
  ],
  objects: [
    {
      id: "car-side-mirror",
      name: "Боковое зеркало авто",
      description: "Отличное место, чтобы проверить, на кого я похожа.",
      boundingBox: {
        x: 0.6,
        y: 0.42,
        width: 0.13,
        height: 0.08,
      },
      interactions: [
        {
          label: "Глянуть в зеркало",
          effect: (wrapper) => wrapper.setScene("car-mirror-check"),
        },
      ],
    },
  ],
};

export default streetExit;
