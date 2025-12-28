import { StateNode } from "../types";

const scene: StateNode = {
  title: "В трамвае, виден кондуктор",
  image: "scenes/tram-inside/background.png",
  actions: [
    {
      text: "Выйти на остановке",
      effects: {
        goto: "university_outside",
      },
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
              effects: {
                set: {
                  "persistent.pass_unlocked": true,
                },
                message:
                  "Блин, проездной дома забыла. Точно помню, он в столе дома лежит. Придется теперь билет покупать.",
              },
            },
            {
              if: "daily.paid_for_tram",
              effects: {
                message: "Да я уже показывала...",
              },
            },
          ],
          effects: {
            message: "Кондуктор кивает.",
            set: {
              "daily.paid_for_tram": true,
            },
          },
          visible: { not: "daily.paid_for_tram" },
        },
        {
          text: "Купить билет",
          guards: [
            {
              if: "daily.has_pass",
              effects: {
                message: "Да у меня же проездной!",
              },
            },
          ],
          effects: {
            message: "Кондуктор принимает монетки и даёт билет.",
            set: {
              "daily.paid_for_tram": true,
              "daily.has_coins": false,
            },
          },
          visible: { and: ["daily.has_coins", { not: "daily.paid_for_tram" }] },
        },
      ],
      image: "",
    },
  ],
};

export default scene;
