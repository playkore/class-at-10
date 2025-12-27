import { StateNode } from "../types";

const scene: StateNode = {
  title: "Будильник звонит",
  image: "scenes/alarm-ringing/background.png",
  objects: [
    {
      id: "alarm_clock",
      name: "Будильник",
      description: "Звонит, пора вставать",
      boundingBox: {
        x: 0.2700646046538219,
        y: 0.40604501362605533,
        width: 0.5329712423532103,
        height: 0.19268195071751187,
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
