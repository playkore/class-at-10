import { StateNode } from "../types";

const scene: StateNode = {
  title: "Университет, на улице",
  image: "scenes/university-entrance/background.png",
  actions: [
    {
      text: "Войти внутрь",
      effects: [
        {
          goto: "university_hall",
        },
      ],
    },
  ],
};

export default scene;
