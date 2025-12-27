import { StateNode } from "../types";

const scene: StateNode = {
  title: "Университет, на улице",
  image: "scenes/university-entrance/background.png",
  objects: [
    {
      name: "Вход в университет",
      description: "Двери университета",
      boundingBox: {
        x: 0.47,
        y: 0.47,
        width: 0.24,
        height: 0.15,
      },
      actions: [
        {
          text: "Войти",
          effects: [
            {
              goto: "university_hall",
            },
          ],
        },
      ],
    },
  ],
};

export default scene;
