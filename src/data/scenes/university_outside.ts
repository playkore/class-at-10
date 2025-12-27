import { StateNode } from "../types";

const scene: StateNode = {
  title: "Университет, на улице",
  image: "scenes/university-entrance/background.png",
  objects: [
    {
      name: "Вход в университет",
      description: "Двери университета",
      boundingBox: {
        x: 0.4,
        y: 0.2,
        width: 0.2,
        height: 0.6,
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
