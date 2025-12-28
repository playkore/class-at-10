import { StateNode } from "../types";

const scene: StateNode = {
  title: "Ящик стола",
  image: "scenes/apartment-desk-drawer/background.png",
  objects: [
    {
      name: "Проездной",
      description: "Проездной лежит среди бумаг",
      boundingBox: {
        x: 0.32,
        y: 0.56,
        width: 0.42,
        height: 0.2,
      },
      actions: [
        {
          text: "Забрать",
          effects: {
            set: {
              "daily.has_pass": true,
            },
            message: "Проездной у меня.",
          },
        },
      ],
      image: "scenes/apartment-desk-drawer/object-ticket.png",
      visible: {
        not: "daily.has_pass",
      },
    },
  ],
  actions: [
    {
      text: "Закрыть ящик",
      effects: {
        goto: "room_desk_view",
      },
    },
  ],
};

export default scene;
