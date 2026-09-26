import { StateNode } from "../types";

const scene: StateNode = {
  title: "Какой-то звук...",
  image: "scenes/darkness/background.png",
  actions: [
    {
      text: "Открыть глаза",
      effects: {
        goto: "room_bed_view_ringing_alarm",
      },
    },
  ],
  objects: [],
};
export default scene;
