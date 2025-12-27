import { StateNode } from "../types";

const scene: StateNode = {
  title: "Вестибюль университета",
  image: "scenes/university-hall/background.png",
  on_enter: {
    messages: [
      {
        message: "Константина уже нет — он ушёл сдавать.",
        visible: "daily.talked_konstantin_today",
      },
    ],
  },
  actions: [
    {
      text: "Туалет",
      guards: [
        {
          if: "daily.used_toilet_uni",
          effects: [
            {
              message: "Я уже забегала сюда сегодня.",
            },
          ],
        },
        {
          if: "daily.used_toilet_home",
          effects: [
            {
              message: "Ладно, надо было сходить дома. Теперь поздно.",
            },
          ],
        },
      ],
      effects: [
        {
          goto: "uni_toilet",
        },
      ],
    },
    {
      text: "Аудитория 404",
      guard: "persistent.knows_schedule",
      failed_effects: [
        {
          message: "Хм… Я ведь так и не посмотрела расписание.",
        },
      ],
      effects: [
        {
          goto: "lecture_hall",
        },
      ],
    },
    {
      text: "Присесть в уголочке",
      effects: [
        {
          message: "Посижу, подожду ребят.",
        },
        {
          goto: "university_hall_corner",
        },
      ],
    },
    {
      text: "Константин",
      guard: {
        not: "daily.talked_konstantin_today",
      },
      failed_effects: [
        {
          message: "Сегодня мы уже поговорили — он убежал сдавать.",
        },
      ],
      effects: [
        {
          set: {
            "daily.talked_konstantin_today": true,
          },
        },
        {
          goto: "talk_konstantin",
        },
      ],
    },
    {
      text: "Подремать",
      effects: [
        {
          message: "Глаза предательски закрываются…",
        },
        {
          goto: "sleep_next_day",
        },
      ],
    },
  ],
};

export default scene;
