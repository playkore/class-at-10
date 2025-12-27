import { StateNode } from "../types";

const scene: StateNode = {
  title: "Темнота → следующий день",
  image: "scenes/darkness/background.png",
  on_enter: {
    messages: [
      {
        message: "…",
        visible: true,
      },
    ],
  },
  actions: [
    {
      text: "Открыть глаза",
      effects: [
        {
          inc: {
            "loop.day_index": 1,
          },
        },
        {
          reset: "daily_flags",
        },
        {
          goto: "darkness_start",
        },
      ],
    },
  ],
};

export default scene;
