import { StateNode } from "../types";

const scene: StateNode = {
  title: "Буфет: развязка",
  image: "scenes/university-cafe/background.png",
  on_enter: {
    messages: [
      {
        message:
          "Я беру сочник, и мы остаемся в теплом буфете еще ненадолго. На этот раз день наконец идет как надо.",
        visible: true,
      },
    ],
  },
  actions: [
    {
      text: "Остаться с Константином",
      effects: {
        goto: "true_ending",
      },
    },
  ],
};

export default scene;
