import { StateNode } from "../types";

const scene: StateNode = {
  title: 'Константин: "Откуда ты знаешь?"',
  image: "scenes/university-hall-boy-close/background.png",
  actions: [
    {
      text: "Женская интуиция. Иди один сдавай.",
      effects: {
        message: "Ладно, может ты и права… Пойду, пожалуй. Пока!",
        goto: "university_hall",
      },
    },
  ],
};

export default scene;
