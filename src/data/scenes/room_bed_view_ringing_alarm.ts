import { StateNode } from "../types";

const scene: StateNode = {
  title: "Будильник пиликает на всю квартиру.",
  image: "scenes/alarm-ringing/background.png",
  objects: [
    {
      id: "alarm_clock",
      name: "Будильник",
      description: "Звонит, пора вставать",
      boundingBox: {
        x: 0.28,
        y: 0.41,
        width: 0.52,
        height: 0.18,
      },
      actions: [
        {
          text: "Выключить будильник",
          effects: [
            {
              goto: "room_bed_view_muted_alarm",
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
