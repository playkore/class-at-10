import { StateNode } from "../types";

const scene: StateNode = {
  title: "Ванная",
  image: "scenes/apartment-corridor/background.png",
  actions: [
    {
      text: "Выйти",
      effects: [
        {
          goto: "corridor",
        },
      ],
    },
    {
      text: "Умыться и почистить зубы",
      effects: [
        {
          set: {
            "daily.washed_face": true,
          },
        },
        {
          set: {
            "daily.makeup_on": false,
          },
        },
        {
          goto: "bathroom",
        },
      ],
    },
  ],
};

export default scene;
