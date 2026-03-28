import { StateNode } from "../types";

const scene: StateNode = {
  title: "Диалог: Константин в вестибюле",
  image: "scenes/university-hall-boy-close/background.png",
  on_enter: {
    messages: [
      {
        message:
          "Может быть, они еще дома, может позвонить им? Вот автомат рядом.",
        visible: true,
      },
    ],
  },
  actions: [
    {
      text: "А позвонить?",
      effects: {
        goto: "konstantin_needs_change",
      },
    },
    {
      text: "Пожелать удачи и уйти",
      effects: {
        goto: "university_hall",
      },
    },
  ],
};

export default scene;
