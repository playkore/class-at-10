import { StateNode } from "../types";

const scene: StateNode = {
  title: "Диалог: Константин в вестибюле",
  image: "scenes/university-hall/background.png",
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
