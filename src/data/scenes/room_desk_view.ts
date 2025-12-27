import { StateNode } from "../types";

const scene: StateNode = {
  title: "Комната, вид на стол",
  image: "scenes/apartment-desk/background.png",
  objects: [
    {
      name: "Расписание занятий",
      description: "Моё расписание на сегодня",
      boundingBox: {
        x: 0.18,
        y: 0.16,
        width: 0.23,
        height: 0.14,
      },
      actions: [
        {
          text: "Посмотреть расписание",
          effects: [
            {
              set: {
                "persistent.knows_schedule": true,
              },
            },
            {
              message: "Ага, сегодня у меня аудитория 404.",
            },
          ],
        },
      ],
      image: "",
      visible: true,
    },
    {
      name: "Ящик стола",
      description: "Выдвижной ящик стола со всяким хламом",
      boundingBox: {
        x: 0.69,
        y: 0.61,
        width: 0.3,
        height: 0.09,
      },
      actions: [
        {
          text: "Открыть ящик",
          effects: [
            {
              goto: "room_desk_drawer_open",
            },
          ],
          guards: [
            {
              if: {
                not: "persistent.pass_unlocked",
              },
              effects: [
                {
                  message: "Мне там ничего не нужно, там только хлам всякий.",
                },
              ],
            },
          ],
        },
      ],
      image: "",
      visible: true,
    },
    {
      name: "Косметичка",
      description: "Моя косметичка",
      boundingBox: {
        x: 0.65,
        y: 0.44,
        width: 0.26,
        height: 0.11,
      },
      actions: [
        {
          text: "Накраситься",
          effects: [
            {
              set: {
                "daily.makeup_on": true,
              },
            },
          ],
          guards: [
            {
              if: "daily.makeup_on",
              effects: [
                {
                  message: "Я уже накрасилась.",
                },
              ],
            },
          ],
        },
      ],
      image: "",
      visible: true,
    },
    {
      name: "Тетрадь и ручка",
      description: "Моя тетрадь и ручка для записей",
      boundingBox: {
        x: 0.3,
        y: 0.51,
        width: 0.34,
        height: 0.09,
      },
      actions: [
        {
          text: "Взять",
          effects: [
            {
              set: {
                "daily.has_notebook": true,
              },
            },
          ],
        },
      ],
      image: "scenes/apartment-desk/object-notebook.png",
      visible: {
        not: "daily.has_notebook",
      },
    },
    {
      name: "Одежда",
      description: "Моя одежда на сегодня",
      boundingBox: {
        x: 0.03,
        y: 0.6,
        width: 0.52,
        height: 0.23,
      },
      actions: [
        {
          text: "Одеться",
          effects: [
            {
              set: {
                "daily.is_dressed": true,
              },
            },
          ],
        },
      ],
      image: "scenes/apartment-desk/object-clothes.png",
      visible: {
        not: "daily.is_dressed",
      },
    },
  ],
  actions: [
    {
      text: "В коридор",
      effects: [
        {
          goto: "corridor",
        },
      ],
    },
  ],
};

export default scene;
