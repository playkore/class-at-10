import { StateNode } from "../types";

const scene: StateNode = {
  title: "Коридор, вид на ванну с туалетом",
  image: "scenes/apartment-corridor/background.png",
  objects: [
    {
      id: "bathroom_door",
      name: "Дверь в ванную",
      description: "Ведёт в ванную комнату",
      boundingBox: {
        x: 0.20977073923732206,
        y: 0.14510129018733442,
        width: 0.25488536961866104,
        height: 0.451226344977417,
      },
      actions: [
        {
          text: "Открыть дверь",
          effects: {
            goto: "bathroom",
          },
        },
      ],
      image: "",
      visible: true,
    },
    {
      id: "toilet_room_door",
      name: "Дверь в туалет",
      description: "Ведёт в туалет",
      boundingBox: {
        x: 0.4987936653135899,
        y: 0.14510129018733442,
        width: 0.2420787833743068,
        height: 0.4487869952165876,
      },
      actions: [
        {
          text: "Открыть",
          effects: {
            set: {
              "daily.used_toilet_home": true,
            },
          },

          guard: {
            not: "daily.used_toilet_home",
          },
          failed_effects: {
            message: "Я больше не хочу.",
          },
        },
      ],
      image: "",
      visible: true,
    },
    {
      id: "kitchen_room_door",
      name: "Дверь в кухню",
      description: "Ведёт в кухню",
      boundingBox: {
        x: 0.8,
        y: 0.11,
        width: 0.15,
        height: 0.44,
      },
      actions: [
        {
          text: "Зайти",
          effects: {
            goto: "kitchen",
          },
        },
      ],
      image: "",
      visible: true,
    },
    {
      id: "outside_door",
      name: "Дверь на улицу",
      description: "Ведёт на улицу",
      boundingBox: {
        x: 0.04,
        y: 0.08,
        width: 0.16,
        height: 0.63,
      },
      actions: [
        {
          text: "Выйти",
          guards: [
            {
              if: {
                not: "daily.has_keys",
              },
              effects: {
                message: "А домой я как попаду? Ключи не взяла!",
              },
            },
            {
              if: {
                not: "daily.has_notebook",
              },
              effects: {
                message: "А писать я в чем в институте буду?",
              },
            },
            {
              if: {
                not: "daily.is_dressed",
              },
              effects: {
                message: "Как я на улицу пойду в таком виде?",
              },
            },
            {
              if: {
                and: [{ not: "daily.has_pass" }, { not: "daily.has_coins" }],
              },
              effects: {
                message: "Как я на трамвае поеду, зайцем?",
              },
            },
          ],
          effects: {
            goto: "tram_stop",
          },
        },
      ],
      image: "",
      visible: true,
    },
  ],
  actions: [
    {
      text: "Вернуться в комнату",
      effects: {
        goto: "room_desk_view",
      },
    },
  ],
};

export default scene;
