import { StateNode } from "../types";

const scene: StateNode = {
  title: "Буфет: развязка",
  image: "scenes/university-cafe/background.png",
  actions: [
    {
      text: "Заговорить",
      effects: {
        message:
          "— Ну как, сдал?\n— Сдал! Хорошо, что я тебя послушал, препод уходила уже, еле успел.\n— Я рада за тебя!\n— Знаешь, не поеду я в наш корпус. У меня пятерка есть, хочешь творожник с чаем?\n— Хочу.\n— Я Костя, кстати…\n— Я…\n",
        goto: "true_ending",
      },
    },
  ],
};

export default scene;
