import { StateNode } from "../types";

const scene: StateNode = {
  title: "Константину нужна мелочь",
  image: "scenes/university-hall-boy-close/background.png",
  on_enter: {
    messages: [
      {
        message:
          "Может быть, они еще дома, может позвонить им? Вот автомат рядом.",
        visible: true,
      },
    ],
  },
  actions: [
    {
      text: "Дать рубль",
      visible: "daily.has_coins",
      effects: {
        add_dialog_lines: [
          "Вообще да, неплохая идея. Только у меня мелочи нет, а разменивать не хочу идти, боюсь их пропустить. Ты пятерку не разменяешь?",
          "Конечно! Только у меня на пятерку не наберется. Держи рубль, как разменяешь, отдашь. Я после пары в буфете буду.",
          "Хорошо, я тебя потом найду в буфете, спасибо большое!",
        ],
        set: {
          "persistent.lent_ruble": true,
          "daily.has_coins": false,
          "daily.talked_konstantin_today": true,
        },
        dialog_options: [
          {
            text: "До встречи!",
            effects: {
              goto: "university_hall",
            },
          },
        ],
      },
    },
    {
      text: "Сказать, что мелочи нет",
      visible: { not: "daily.has_coins" },
      effects: {
        add_dialog_lines: [
          "Вообще да, неплохая идея. Только у меня мелочи нет, а разменивать не хочу идти, боюсь их пропустить. Ты пятерку не разменяешь?",
          "Ой, нет. Я все на трамвай потратила сегодня утром...",
          "Жалко. Ладно, пойду один сдавать...",
        ],
        set: {
          "daily.talked_konstantin_today": true,
        },
        dialog_options: [
          {
            text: "До встречи!",
            effects: {
              goto: "university_hall",
            },
          },
        ],
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
