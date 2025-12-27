import { StateNode } from "../types";

const scene: StateNode = {
  title: "Будильник замолк",
  image: "scenes/alarm-muted/background.png",
  actions: [
    {
      text: "Встать",
      effects: [
        {
          goto: "room_desk_view",
        },
      ],
    },
    {
      text: "Закрыть глаза",
      effects: [
        {
          goto: "darkness_start",
        },
      ],
    },
  ],
  objects: [],
};

export default scene;
