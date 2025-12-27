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
  ],
  objects: [
    {
      name: "Парень",
      description:
        "Парень с тетрадями в руках стоит возле колонны. Кого-то ждет.",
      boundingBox: {
        x: 0.74,
        y: 0.48,
        width: 0.19,
        height: 0.37,
      },
      image: "scenes/university-hall/object-boy.png",
      actions: [
        {
          text: "Познакомиться",
          effects: [
            {
              set: {
                "daily.talked_konstantin_today": true,
              },
            },
            {
              goto: "university_hall_boy_close",
            },
          ],
        },
      ],
    },
    {
      name: "Диванчик",
      description: "Уютный диванчик у стены. Можно присесть и отдохнуть.",
      boundingBox: {
        x: 0,
        y: 0.69,
        width: 0.22,
        height: 0.22,
      },
      actions: [
        {
          text: "Присесть",
          effects: [
            {
              goto: "university_hall_corner",
            },
          ],
        },
      ],
    },
  ],
};

export default scene;
