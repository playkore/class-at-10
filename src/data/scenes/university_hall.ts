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
  actions: [],
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
          effects: {
            set: {
              "daily.talked_konstantin_today": true,
            },
            goto: "university_hall_boy_close",
          },
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
          effects: {
            goto: "university_hall_corner",
          },
        },
      ],
    },
    {
      name: "Дверь в туалет",
      description: "Дверь в женский туалет",
      boundingBox: {
        x: 0.05,
        y: 0.51,
        width: 0.13,
        height: 0.18,
      },
      actions: [
        {
          text: "Войти",
          guards: [
            {
              if: "daily.used_toilet_home",
              effects: {
                message: "Не хочется.",
              },
            },
          ],
          effects: {
            goto: "uni_toilet",
          },
        },
      ],
    },
    {
      name: "К аудиториям",
      description: "Проход к аудиториям университета",
      boundingBox: {
        x: 0.34,
        y: 0.42,
        width: 0.32,
        height: 0.28,
      },
      actions: [
        {
          text: "Идти на занятия",
          effects: {
            goto: "lecture_hall",
          },
          guards: [
            {
              if: {
                not: "persistent.knows_schedule",
              },
              effects: {
                message:
                  "Я не знаю, в какой аудитории сегодня занятие. Подожду тут одногруппниц.",
              },
            },
          ],
        },
      ],
    },
  ],
};

export default scene;
