import { StateNode } from "../types";

const scene: StateNode = {
  title: 'Константин: "У меня только пятерка. Не разменяешь?"',
  image: "scenes/university-hall-boy-close/background.png",
  actions: [
    {
      text: "Отдать рубль",
      guard: "daily.has_coins",
      failed_effects: {
        message: "Если бы… У меня совсем нет мелочи.",
      },

      effects: {
        set: {
          "persistent.lent_ruble": true,
          "daily.has_coins": false,
        },
        message: "Спасибо! Разменяю и обязательно верну.",
        goto: "university_hall",
      },
    },
    {
      text: "Извини, я дома деньги оставила",
      effects: {
        message: "Жаль. Ладно, пойду один сдавать. Я уже и так опоздал… Пока!",
        goto: "university_hall",
      },
    },
    {
      text: "Они не придут (если слышала о тусовке)",
      guard: "persistent.met_konstantin_in_cafeteria",
      failed_effects: {
        message: "Откуда мне это знать? Надо сначала что-то услышать.",
      },
      effects: {
        set: {
          "persistent.told_friends_wont_come": true,
        },
        goto: "konstantin_why_know",
      },
    },
  ],
};

export default scene;
