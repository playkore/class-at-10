import { StateNode } from "../types";

const scene: StateNode = {
  title: "В трамвае, виден кондуктор",
  image: "scenes/tram-inside/background.png",
  actions: [
    {
      text: "Выйти на остановке",
      effects: [
        {
          goto: "university_outside",
        },
      ],
      visible: "daily.paid_for_tram",
    },
  ],
  objects: [
    {
      name: "Кондуктор",
      description: "Кондуктор проверяет проездные и продаёт билеты",
      boundingBox: {
        x: 0.44,
        y: 0.16,
        width: 0.28,
        height: 0.39,
      },
      actions: [
        {
          text: "Показать проездной",
          guards: [
            {
              if: {
                not: "daily.has_pass",
              },
              effects: [
                {
                  set: {
                    "persistent.pass_unlocked": true,
                  },
                },
                {
                  set: {
                    "daily.paid_for_tram": true,
                  },
                },
                {
                  message:
                    "Блин, проездной дома забыла. Точно помню, он в шкафу дома лежит. Придется теперь билет покупать.",
                },
              ],
            },
          ],
          effects: [
            {
              message: "Кондуктор кивает.",
            },
          ],
        },
        {
          text: "Купить билет",
          effects: [
            {
              message: "Кондуктор принимает монетки и даёт билет.",
            },
            {
              set: {
                "persistent.pass_unlocked": true,
              },
            },
          ],
        },
      ],
      image: "",
    },
  ],
};

export default scene;
