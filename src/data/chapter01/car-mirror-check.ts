import type { SceneDefinition } from "../../types/scenes";

const carMirrorCheck: SceneDefinition = {
  id: "car-mirror-check",
  name: "Зеркало машины",
  description: "Неплохо выгляжу.",
  imageSrc: "/scenes/chapter01/car-mirror-check.png",
  interactions: [
    {
      label: "Вернуться на улицу",
      effect: (wrapper) => {
        if (!wrapper.getState().flags["disguiseChecked"]) {
          wrapper.addScore(1);
        }
        wrapper.setFlag("disguiseChecked");
        wrapper.setScene("street-exit");
      },
    },
  ],
  objects: [],
};

export default carMirrorCheck;
