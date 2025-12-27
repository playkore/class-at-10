import { StateNode } from "../types";

const scene: StateNode = {
  title: "Туалет (кабинка)",
  image: "scenes/toilet-cabin/background.png",
  actions: [
    {
      text: "Осмотреться",
      effects: [
        {
          goto: "natasha_notebook",
        },
      ],
    },
    {
      text: "Назад",
      effects: [
        {
          goto: "uni_toilet",
        },
      ],
    },
  ],
};

export default scene;
