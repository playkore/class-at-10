import { StateNode } from "../types";

const scene: StateNode = {
  title: "Комната, вид на окно",
  image: "scenes/apartment-curtains/background.png",
  actions: [
    {
      text: "Раздвинуть шторы",
      effects: [
        {
          goto: "room_curtains_open",
        },
      ],
    },
    {
      text: "Назад к столу",
      effects: [
        {
          goto: "room_desk_view",
        },
      ],
    },
  ],
};

export default scene;
