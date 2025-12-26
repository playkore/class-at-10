import type { GameSpec } from "./types";

export const gameSpec: GameSpec = {
  meta: {
    game_id: "winter_1999_loop",
    title: "Зима 1999",
    loop: {
      start_state: "darkness_start",
      end_states: ["true_ending"],
      carry_over: ["persistent_flags"],
      reset_each_loop: ["daily_flags"],
      variables: {
        "loop.day_index": {
          type: "int",
          initial: 1,
        },
      },
    },
  },
  flags: {
    persistent_flags: {
      knows_schedule: {
        description: "Хоть раз посмотрела расписание и запомнила аудиторию",
        initial: false,
      },
      pass_unlocked: {
        description:
          "Хоть раз покупала билет монетками — теперь знает/помнит, что проездной лежит в шкафу",
        initial: false,
      },
      lent_ruble: {
        description: "Одолжила рубль Константину",
        initial: false,
      },
      told_friends_wont_come: {
        description: "Сказала Константину, что друзья не придут",
        initial: false,
      },
      met_konstantin_in_cafeteria: {
        description: "Говорила с Константином в буфете в прошлые дни",
        initial: false,
      },
      natasha_owes: {
        description: "Вернула Наташе тетрадь/помогла ей — Наташа должна услугу",
        initial: false,
      },
    },
    daily_flags: {
      has_keys: {
        description: "Ключи взяты",
        initial: false,
      },
      is_dressed: {
        description: "Оделась",
        initial: false,
      },
      has_notebook: {
        description: "Взяла тетрадь и ручку",
        initial: false,
      },
      has_coins: {
        description: "Взяла мелочь",
        initial: false,
      },
      has_pass: {
        description: "Есть проездной (если достала из шкафа)",
        initial: false,
      },
      is_hungry: {
        description: "Не ела утром",
        initial: true,
      },
      used_toilet_home: {
        description: "Сходила в туалет дома (один раз за день)",
        initial: false,
      },
      washed_face: {
        description: "Умылась/почистила зубы (один раз за день)",
        initial: false,
      },
      makeup_on: {
        description: "Накрашена",
        initial: false,
      },
      used_toilet_uni: {
        description: "Сходила в туалет в универе (один раз за день)",
        initial: false,
      },
      found_natasha_notebook: {
        description: "Нашла тетрадь Наташи в туалете универа",
        initial: false,
      },
      returned_natasha_notebook_today: {
        description: "Отдала Наташе тетрадь сегодня",
        initial: false,
      },
      got_lecture_notebook_today: {
        description: "Получила тетрадь с лекцией (для списывания) сегодня",
        initial: false,
      },
      went_to_cafeteria_today: {
        description: "Зашла в буфет сегодня",
        initial: false,
      },
      talked_konstantin_today: {
        description: "Сегодня уже поговорила с Константином — он ушёл",
        initial: false,
      },
    },
  },
  states: {
    darkness_start: {
      title: "Темнота",
      image: "scenes/darkness.png",
      actions: [
        {
          text: "Открыть глаза",
          effects: [
            {
              goto: "room_bed_view_ringing_alarm",
            },
          ],
        },
      ],
      objects: [],
    },
    room_bed_view_ringing_alarm: {
      title: "Будильник звонит",
      image: "scenes/darkness.png",
      objects: [
        {
          id: "alarm_clock",
          name: "Будильник",
          description: "Звонит, пора вставать",
          boundingBox: {
            x: 0.2700646046538219,
            y: 0.40604501362605533,
            width: 0.5329712423532103,
            height: 0.19268195071751187,
          },
          actions: [
            {
              text: "Выключить будильник",
              effects: [
                {
                  goto: "room_bed_view_muted_alarm",
                },
              ],
            },
          ],
          image: "scenes/alarm-ringing.png",
          visible: true,
        },
      ],
    },
    room_bed_view_muted_alarm: {
      title: "Будильник замолк",
      image: "scenes/alarm-muted.png",
      actions: [
        {
          text: "Встать",
          effects: [
            {
              goto: "corridor",
            },
          ],
        },
        {
          text: "Закрыть глаза",
          effects: [
            {
              goto: "darkness_start",
            },
          ],
        },
      ],
      objects: [],
    },
    corridor: {
      title: "Коридор, вид на ванну с туалетом",
      image: "scenes/corridor.png",
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
              effects: [
                {
                  goto: "bathroom",
                },
              ],
            },
          ],
          image: "objects/door.png",
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
              effects: [
                {
                  set: {
                    "daily.used_toilet_home": true,
                  },
                },
              ],
              guard: {
                not: "daily.used_toilet_home",
              },
              failed_effects: [
                {
                  message: "Я больше не хочу.",
                },
              ],
            },
          ],
          image: "objects/door.png",
          visible: true,
        },
      ],
      actions: [
        {
          text: "Вернуться в комнату",
          effects: [
            {
              goto: "room_desk_view",
            },
          ],
        },
        {
          text: "Пойти на кухню",
          effects: [
            {
              goto: "kitchen",
            },
          ],
        },
        {
          text: "Выйти на улицу",
          guards: [
            {
              if: {
                not: "daily.has_keys",
              },
              effects: [
                {
                  message: "А домой я как попаду? Ключи не взяла!",
                },
              ],
            },
            {
              if: {
                not: "daily.has_notebook",
              },
              effects: [
                {
                  message: "А писать я в чем в институте буду?",
                },
              ],
            },
            {
              if: {
                not: "daily.is_dressed",
              },
              effects: [
                {
                  message: "Как я на улицу пойду в таком виде?",
                },
              ],
            },
            {
              if: {
                or: ["daily.has_pass", "daily.has_coins"],
              },
              effects: [
                {
                  message: "Как я на трамвае поеду, зайцем?",
                },
              ],
            },
          ],
          effects: [
            {
              goto: "tram_stop",
            },
          ],
        },
      ],
    },
    bathroom: {
      title: "Ванная",
      image: "scenes/darkness.png",
      actions: [
        {
          text: "Выйти",
          effects: [
            {
              goto: "corridor",
            },
          ],
        },
        {
          text: "Умыться и почистить зубы",
          effects: [
            {
              set: {
                "daily.washed_face": true,
              },
            },
            {
              set: {
                "daily.makeup_on": false,
              },
            },
            {
              goto: "bathroom",
            },
          ],
        },
      ],
    },
    room_desk_view: {
      title: "Комната, вид на стол",
      image: "scenes/apartment-desk.png",
      objects: [
        {
          name: "Расписание занятий",
          description: "Моё расписание на сегодня",
          boundingBox: {
            x: 0.24,
            y: 0.12,
            width: 0.14,
            height: 0.16,
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
          image: "objects/schedule.png",
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
          image: "objects/wardrobe.png",
          visible: true,
        },
        {
          name: "Косметичка",
          description: "Моя косметичка",
          boundingBox: {
            x: 0.56,
            y: 0.42,
            width: 0.34,
            height: 0.13,
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
          image: "objects/makeup_bag.png",
          visible: true,
        },
        {
          name: "Тетрадь и ручка",
          description: "Моя тетрадь и ручка для записей",
          boundingBox: {
            x: 0.17,
            y: 0.38,
            width: 0.13,
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
          image: "objects/notebook.png",
          visible: {
            not: "daily.has_notebook",
          },
        },
        {
          name: "Россыпь монет",
          description: "Немного мелочи на столе",
          boundingBox: {
            x: 0.14,
            y: 0.3,
            width: 0.11,
            height: 0.05,
          },
          actions: [
            {
              text: "Взять",
              effects: [
                {
                  set: {
                    "daily.has_coins": true,
                  },
                },
              ],
            },
          ],
          image: "objects/coins.png",
          visible: {
            not: "daily.has_coins",
          },
        },
        {
          name: "Ключи от дома",
          description: "Ключи от моей квартиры",
          boundingBox: {
            x: 0.73,
            y: 0.17,
            width: 0.07,
            height: 0.06,
          },
          actions: [
            {
              text: "Взять",
              effects: [
                {
                  set: {
                    "daily.has_keys": true,
                  },
                },
              ],
            },
          ],
          image: "objects/keys.png",
          visible: {
            not: "daily.has_keys",
          },
        },
        {
          name: "Одежда",
          description: "Моя одежда на сегодня",
          boundingBox: {
            x: 0,
            y: 0.53,
            width: 0.51,
            height: 0.31,
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
          image: "scenes/apartment-desk-clothes.png",
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
    },
    room_desk_drawer_open: {
      title: "Ящик стола",
      image: "scenes/apartment-desk-drawer.png",
      objects: [
        {
          name: "Проездной",
          description: "Проездной лежит среди бумаг",
          boundingBox: {
            x: 0.42,
            y: 0.4,
            width: 0.2,
            height: 0.12,
          },
          actions: [
            {
              text: "Забрать",
              effects: [
                {
                  set: {
                    "daily.has_pass": true,
                  },
                },
                {
                  message: "Проездной у меня.",
                },
              ],
            },
          ],
          image: "scenes/apartment-desk-drawer-ticket.png",
          visible: {
            not: "daily.has_pass",
          },
        },
      ],
      actions: [
        {
          text: "Закрыть ящик",
          effects: [
            {
              goto: "room_desk_view",
            },
          ],
        },
      ],
    },
    tram_stop: {
      title: "Улица, остановка. Трамвай остановился, открыл двери",
      image: "scenes/tram_stop.png",
      objects: [
        {
          name: "Двери трамвая",
          description: "Двери трамвая открыты",
          boundingBox: {
            x: 0.4,
            y: 0.3,
            width: 0.2,
            height: 0.5,
          },
          actions: [
            {
              text: "Зайти в трамвай",
              effects: [
                {
                  goto: "tram_inside",
                },
              ],
            },
          ],
          image: "objects/tram_doors.png",
          visible: true,
        },
      ],
    },
    tram_inside: {
      title: "В трамвае, виден кондуктор",
      image: "scenes/tram_interior.png",
      objects: [
        {
          name: "Кондуктор",
          description: "Кондуктор проверяет проездные и продаёт билеты",
          boundingBox: {
            x: 0.7,
            y: 0.2,
            width: 0.2,
            height: 0.5,
          },
          actions: [
            {
              text: "Показать проездной",
              guards: [
                {
                  if: {
                    not: "daily.has_pass",
                  },
                  effects: [
                    {
                      set: {
                        "persistent.pass_unlocked": true,
                      },
                    },
                    {
                      message:
                        "Блин, проездной дома забыла. Точно помню, он в шкафу дома лежит. Придется теперь билет покупать.",
                    },
                  ],
                },
              ],
              effects: [
                {
                  message: "Кондуктор кивает.",
                },
              ],
            },
            {
              text: "Купить билет",
              effects: [
                {
                  message: "Кондуктор принимает монетки и даёт билет.",
                },
                {
                  set: {
                    "persistent.pass_unlocked": true,
                  },
                },
              ],
            },
          ],
          image: "objects/conductor.png",
        },
      ],
    },
    university_outside: {
      title: "Университет, на улице",
      image: "scenes/university_exterior.png",
      actions: [
        {
          text: "Войти внутрь",
          effects: [
            {
              goto: "university_hall",
            },
          ],
        },
      ],
    },
  },
  terminals: {
    true_ending: {
      title: "Конец",
      image: "scenes/darkness.png",
      effects: [
        {
          end: true,
        },
      ],
    },
  },
};

// university_hall: {
//   title: "Вестибюль университета",
//   image: "scenes/university_hall.png",
//   on_enter: {
//     message_if: [
//       {
//         if: {
//           "daily.talked_konstantin_today": true,
//         },
//         then: "Константина уже нет — он ушёл сдавать.",
//       },
//     ],
//   },
//   actions: {
//     go_toilet: {
//       text: "Туалет",
//       guard: [
//         { gte: ["loop.day_index", 2] },
//         { not: "daily.used_toilet_uni" },
//         { not: "daily.used_toilet_home" },
//       ],
//       on_fail: {
//         stay: true,
//         message_by_first_failed_guard: {
//           "loop.day_index":
//             "Сейчас ещё рано — уборщица не пускает. Придётся потерпеть.",
//           "daily.used_toilet_uni": "Я уже забегала сюда сегодня.",
//           "daily.used_toilet_home":
//             "Ладно, надо было сходить дома. Теперь поздно.",
//         },
//       },
//       goto: "uni_toilet",
//     },
//     go_room_404: {
//       text: "Аудитория 404",
//       guard: ["persistent.knows_schedule"],
//       on_fail: {
//         stay: true,
//         message: "Хм… Я ведь так и не посмотрела расписание.",
//       },
//       goto: "lecture_hall",
//     },
//     wait_in_corner: {
//       text: "Присесть в уголочке",
//       message: "Посижу, подожду ребят.",
//       goto: "university_hall_corner",
//     },
//     talk_konstantin: {
//       text: "Константин",
//       guard: [{ not: "daily.talked_konstantin_today" }],
//       effects: [
//         {
//           set: {
//             "daily.talked_konstantin_today": true,
//           },
//         },
//       ],
//       goto: "talk_konstantin",
//       on_fail: {
//         stay: true,
//         message: "Сегодня мы уже поговорили — он убежал сдавать.",
//       },
//     },
//     nap: {
//       text: "Подремать",
//       message: "Глаза предательски закрываются…",
//       goto: "sleep_next_day",
//     },
//   },
// },
// university_hall_corner: {
//   title: "Вестибюль: уголочек",
//   image: "scenes/university_hall_corner.png",
//   on_enter: {
//     message_if: [
//       {
//         if: {
//           "persistent.knows_schedule": false,
//         },
//         then: "Подожду наших… Всё равно я не знаю, в какой аудитории занятие.",
//       },
//       { else: "Подожду наших, пойдём вместе в аудиторию." },
//     ],
//   },
//   actions: {
//     stand_up: {
//       text: "Встать",
//       goto: "university_hall",
//     },
//     doze_off: {
//       text: "Подремать",
//       message: "Задремать прямо тут — плохая идея… но глаза закрываются.",
//       goto: "sleep_next_day",
//     },
//   },
// },
// talk_konstantin: {
//   title: "Диалог: Константин в вестибюле",
//   image: "scenes/university_hall_konstantin.png",
//   actions: {
//     greet: {
//       text: "Заговорить",
//       choices: [
//         {
//           id: "ask_call",
//           text: "А позвонить?",
//           goto: "konstantin_needs_change",
//         },
//         {
//           id: "do_nothing",
//           text: "Пожелать удачи и уйти",
//           goto: "university_hall",
//         },
//       ],
//     },
//   },
// },
// konstantin_needs_change: {
//   title: 'Константин: "У меня только пятерка. Не разменяешь?"',
//   image: "scenes/university_hall_konstantin_close.png",
//   actions: {
//     give_ruble: {
//       text: "Отдать рубль",
//       guard: ["daily.has_coins"],
//       on_fail: {
//         stay: true,
//         message: "Если бы… У меня совсем нет мелочи.",
//       },
//       effects: [
//         {
//           set: {
//             "persistent.lent_ruble": true,
//           },
//         },
//         {
//           set: {
//             "daily.has_coins": false,
//           },
//         },
//       ],
//       message: "Спасибо! Разменяю и обязательно верну.",
//       goto: "university_hall",
//     },
//     refuse: {
//       text: "Извини, я дома деньги оставила",
//       message:
//         "Жаль. Ладно, пойду один сдавать. Я уже и так опоздал… Пока!",
//       goto: "university_hall",
//     },
//     tell_friends_wont_come: {
//       text: "Они не придут (если слышала о тусовке)",
//       guard: ["persistent.met_konstantin_in_cafeteria"],
//       on_fail: {
//         stay: true,
//         message: "Откуда мне это знать? Надо сначала что-то услышать.",
//       },
//       effects: [
//         {
//           set: {
//             "persistent.told_friends_wont_come": true,
//           },
//         },
//       ],
//       goto: "konstantin_why_know",
//     },
//   },
// },
// konstantin_why_know: {
//   title: 'Константин: "Откуда ты знаешь?"',
//   image: "scenes/university_hall_konstantin_close.png",
//   actions: {
//     intuition: {
//       text: "Женская интуиция. Иди один сдавай.",
//       message: "Ладно, может ты и права… Пойду, пожалуй. Пока!",
//       goto: "university_hall",
//     },
//   },
// },
// uni_toilet: {
//   title: "Туалет (университет)",
//   image: "scenes/university_toilet.png",
//   actions: {
//     use: {
//       text: "Сходить",
//       guard: [{ not: "daily.used_toilet_uni" }],
//       on_fail: {
//         stay: true,
//         message: "Я уже заходила — больше не получится.",
//       },
//       effects: [
//         {
//           set: {
//             "daily.used_toilet_uni": true,
//           },
//         },
//       ],
//       message: "Готово. Можно идти дальше.",
//     },
//     inspect_notebook: {
//       text: "Забытая тетрадь",
//       goto: "natasha_notebook",
//     },
//     exit: {
//       text: "Выйти",
//       goto: "university_hall",
//     },
//   },
// },
// natasha_notebook: {
//   title: "Забытая тетрадь",
//   image: "scenes/natasha_notebook.png",
//   actions: {
//     look: {
//       text: "Посмотреть",
//       message: "Это тетрадь Наташи.",
//     },
//     take: {
//       text: "Взять",
//       guard: [{ not: "daily.found_natasha_notebook" }],
//       on_fail: {
//         stay: true,
//         message: "Уже лежит у меня в сумке.",
//       },
//       effects: [
//         {
//           set: {
//             "daily.found_natasha_notebook": true,
//           },
//         },
//       ],
//       message: "Возьму, вдруг пригодится.",
//       goto: "uni_toilet",
//     },
//     back: {
//       text: "Назад",
//       goto: "uni_toilet",
//     },
//   },
// },
// lecture_hall: {
//   title: "Аудитория",
//   image: "scenes/lecture_hall.png",
//   actions: {
//     sit_with_natasha: {
//       text: "Сесть к Наташе",
//       goto: "with_natasha",
//     },
//     sit_alone: {
//       text: "Сесть в одиночестве",
//       goto: "alone",
//     },
//   },
// },
// with_natasha: {
//   title: "Сидеть с Наташей",
//   image: "scenes/lecture_with_natasha.png",
//   actions: {
//     return_natasha_notebook: {
//       text: "Отдать тетрадь (если есть)",
//       guard: [
//         "daily.found_natasha_notebook",
//         { not: "daily.returned_natasha_notebook_today" },
//       ],
//       on_fail: {
//         stay: true,
//         message_by_first_failed_guard: {
//           "daily.found_natasha_notebook": "Нечего отдавать — пустые руки.",
//           "daily.returned_natasha_notebook_today":
//             "Я уже отдала её сегодня.",
//         },
//       },
//       effects: [
//         {
//           set: {
//             "daily.returned_natasha_notebook_today": true,
//           },
//         },
//         {
//           set: {
//             "persistent.natasha_owes": true,
//           },
//         },
//       ],
//       message: "Ой! Моя! Спасибо тебе!",
//     },
//     ask_copy_yesterday: {
//       text: "Попросить списать вчерашнюю лекцию",
//       guard: ["persistent.natasha_owes"],
//       on_fail: {
//         stay: true,
//         message: "Неудобно просить — я ей ещё ничем не помогла.",
//       },
//       if: {
//         guard: ["daily.returned_natasha_notebook_today"],
//         then: {
//           effects: [
//             {
//               set: {
//                 "daily.got_lecture_notebook_today": true,
//               },
//             },
//           ],
//           message: "Держи, вот моя другая тетрадь, там лекция.",
//         },
//         else: {
//           message: "Эх… я сегодня свою тетрадь забыла.",
//         },
//       },
//     },
//     go_cafeteria_half: {
//       text: "Пойти в буфет на полпары",
//       guard: [
//         "daily.got_lecture_notebook_today",
//         { not: "daily.went_to_cafeteria_today" },
//       ],
//       on_fail: {
//         stay: true,
//         message_by_first_failed_guard: {
//           "daily.got_lecture_notebook_today":
//             "Сначала бы списать лекцию — без тетради там делать нечего.",
//           "daily.went_to_cafeteria_today":
//             "Я уже прогуливала сегодня — второй раз нельзя.",
//         },
//       },
//       effects: [
//         {
//           set: {
//             "daily.went_to_cafeteria_today": true,
//           },
//         },
//       ],
//       message: "С Наташиным конспектом можно прогулять полпары.",
//       goto: "cafeteria",
//     },
//     doze_off: {
//       text: "Закрыть глаза, задремать",
//       message: "Складываю руки на парте и проваливаюсь в сон.",
//       goto: "sleep_next_day",
//     },
//   },
// },
// alone: {
//   title: "Сидеть в одиночестве",
//   image: "scenes/lecture_empty.png",
//   actions: {
//     doze_off: {
//       text: "Закрыть глаза, задремать",
//       message: "Скучно и клонит в сон.",
//       goto: "sleep_next_day",
//     },
//   },
// },
// cafeteria: {
//   title: "Буфет",
//   image: "scenes/cafeteria.png",
//   actions: {
//     talk_konstantin_if_lent: {
//       text: "Константин (вернуть рубль)",
//       guard: ["persistent.lent_ruble"],
//       on_fail: {
//         stay: true,
//         message: "Без рубля мы и не перекинулись бы словом.",
//       },
//       effects: [
//         {
//           set: {
//             "persistent.met_konstantin_in_cafeteria": true,
//           },
//         },
//       ],
//       message:
//         "О, хорошо, что ты тут! Я разменял пятерку, вот твой рубль… Дозвонился. Они не придут. Бухали вчера в общаге…",
//       goto: "cafeteria",
//     },
//     talk_konstantin_if_told: {
//       text: "Константин (спросить, как сдал)",
//       guard: ["persistent.told_friends_wont_come"],
//       on_fail: {
//         stay: true,
//         message: "Пока рано — он всё ещё переживает в вестибюле.",
//       },
//       goto: "cafeteria_true_ending_dialog",
//     },
//     return_to_hall: {
//       text: "Вернуться в вестибюль",
//       goto: "university_hall",
//     },
//     doze_off: {
//       text: "Сесть, задремать",
//       message: "В буфете тепло и сон клонит…",
//       goto: "sleep_next_day",
//     },
//   },
// },
// cafeteria_true_ending_dialog: {
//   title: "Буфет: развязка",
//   image: "scenes/cafeteria_true_ending.png",
//   actions: {
//     dialogue: {
//       text: "Заговорить",
//       message:
//         "— Ну как, сдал?\n— Сдал! Хорошо, что я тебя послушал, препод уходила уже, еле успел.\n— Я рада за тебя!\n— Знаешь, не поеду я в наш корпус. У меня пятерка есть, хочешь творожник с чаем?\n— Хочу.\n— Я Костя, кстати…\n— Я…\n",
//       goto: "true_ending",
//     },
//   },
// },
// sleep_next_day: {
//   title: "Темнота → следующий день",
//   image: "scenes/darkness.png",
//   on_enter: {
//     message: "…",
//   },
//   actions: {
//     open_eyes: {
//       text: "Открыть глаза",
//       effects: [
//         {
//           inc: {
//             "loop.day_index": 1,
//           },
//         },
//         {
//           reset: "daily_flags",
//         },
//       ],
//       goto: "darkness_start",
//     },
//   },
// },
