import { StateNode } from "../types";

const scene: StateNode = {
  title: "Прекрасный незнакомец",
  image: "scenes/university-hall-boy-close/background.png",
  actions: [
    {
      text: "Заговорить",
      effects: {
        dialog_options: [
          {
            text: "Привет",
            effects: {
              add_dialog_lines: [
                "Привет, я тоже ждешь пары? Я тебя раньше не видела, ты в какой группе?",
                "Привет... Я, нет, я жду друзей, я с другого факультета, мы сегодня курсовую сдаем. Они уже давно должны подойти, не знаю, что с ними.",
              ],
              dialog_options: [
                {
                  text: "Может позвонить им?",
                  effects: {
                    add_dialog_lines: [
                      "Может быть, они еще дома, может позвонить им? Вот автомат рядом.",
                      "Вообще да, неплохая идея. Только у меня мелочи нет, а разменивать не хочу идти, боюсь их пропустить. Ты пятерку на разменяешь?",
                    ],
                    dialog_options: [
                      {
                        text: "Конечно!",
                        visible: "daily.has_coins",
                        effects: {
                          add_dialog_lines: [
                            "Конечно! Только у меня не пятерку не наберется. Держи рубль, как разменяешь, отдашь. Я после пары в буфете буду.",
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
                        text: "Ой, нет",
                        visible: {not: "daily.has_coins"},
                        effects: {
                          add_dialog_lines: [
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
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
};

export default scene;
