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
                      message:
                        "Мне там ничего не нужно, там только хлам всякий.",
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
          text: "Посмотреть в окно",
          effects: [
            {
              goto: "room_curtains_closed",
            },
          ],
        },
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
            x: 0.32,
            y: 0.56,
            width: 0.42,
            height: 0.2,
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
          image: "public/scenes/tram-stop.png",
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
          image: "scenes/tram-inside.png",
        },
      ],
    },
    university_outside: {
      title: "Университет, на улице",
      image: "scenes/university-entrance.png",
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
    university_hall: {
      title: "Вестибюль университета",
      image: "scenes/university-hall.png",
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
    },
    university_hall_corner: {
      title: "Вестибюль: уголочек",
      image: "scenes/university-hall.png",
      on_enter: {
        messages: [
          {
            message:
              "Подожду наших… Всё равно я не знаю, в какой аудитории занятие.",
            visible: {
              not: "persistent.knows_schedule",
            },
          },
          {
            message: "Подожду наших, пойдём вместе в аудиторию.",
            visible: "persistent.knows_schedule",
          },
        ],
      },
      actions: [
        {
          text: "Встать",
          effects: [
            {
              goto: "university_hall",
            },
          ],
        },
        {
          text: "Подремать",
          effects: [
            {
              message:
                "Задремать прямо тут — плохая идея… но глаза закрываются.",
            },
            {
              goto: "sleep_next_day",
            },
          ],
        },
      ],
    },
    talk_konstantin: {
      title: "Диалог: Константин в вестибюле",
      image: "scenes/university-hall-boy.png",
      actions: [
        {
          text: "А позвонить?",
          effects: [
            {
              goto: "konstantin_needs_change",
            },
          ],
        },
        {
          text: "Пожелать удачи и уйти",
          effects: [
            {
              goto: "university_hall",
            },
          ],
        },
      ],
    },
    konstantin_needs_change: {
      title: 'Константин: "У меня только пятерка. Не разменяешь?"',
      image: "scenes/university-hall-boy-close.png",
      actions: [
        {
          text: "Отдать рубль",
          guard: "daily.has_coins",
          failed_effects: [
            {
              message: "Если бы… У меня совсем нет мелочи.",
            },
          ],
          effects: [
            {
              set: {
                "persistent.lent_ruble": true,
              },
            },
            {
              set: {
                "daily.has_coins": false,
              },
            },
            {
              message: "Спасибо! Разменяю и обязательно верну.",
            },
            {
              goto: "university_hall",
            },
          ],
        },
        {
          text: "Извини, я дома деньги оставила",
          effects: [
            {
              message:
                "Жаль. Ладно, пойду один сдавать. Я уже и так опоздал… Пока!",
            },
            {
              goto: "university_hall",
            },
          ],
        },
        {
          text: "Они не придут (если слышала о тусовке)",
          guard: "persistent.met_konstantin_in_cafeteria",
          failed_effects: [
            {
              message: "Откуда мне это знать? Надо сначала что-то услышать.",
            },
          ],
          effects: [
            {
              set: {
                "persistent.told_friends_wont_come": true,
              },
            },
            {
              goto: "konstantin_why_know",
            },
          ],
        },
      ],
    },
    konstantin_why_know: {
      title: 'Константин: "Откуда ты знаешь?"',
      image: "scenes/university-hall-boy-close.png",
      actions: [
        {
          text: "Женская интуиция. Иди один сдавай.",
          effects: [
            {
              message: "Ладно, может ты и права… Пойду, пожалуй. Пока!",
            },
            {
              goto: "university_hall",
            },
          ],
        },
      ],
    },
    uni_toilet: {
      title: "Туалет (университет)",
      image: "scenes/toilet.png",
      actions: [
        {
          text: "Сходить",
          guard: {
            not: "daily.used_toilet_uni",
          },
          failed_effects: [
            {
              message: "Я уже заходила — больше не получится.",
            },
          ],
          effects: [
            {
              set: {
                "daily.used_toilet_uni": true,
              },
            },
            {
              message: "Готово. Можно идти дальше.",
            },
          ],
        },
        {
          text: "Кабинка",
          effects: [
            {
              goto: "uni_toilet_cabin",
            },
          ],
        },
        {
          text: "Забытая тетрадь",
          effects: [
            {
              goto: "natasha_notebook",
            },
          ],
        },
        {
          text: "Выйти",
          effects: [
            {
              goto: "university_hall",
            },
          ],
        },
      ],
    },
    uni_toilet_cabin: {
      title: "Туалет (кабинка)",
      image: "scenes/toilet-cabin.png",
      actions: [
        {
          text: "Осмотреться",
          effects: [
            {
              goto: "natasha_notebook",
            },
          ],
        },
        {
          text: "Назад",
          effects: [
            {
              goto: "uni_toilet",
            },
          ],
        },
      ],
    },
    natasha_notebook: {
      title: "Забытая тетрадь",
      image: "scenes/toilet-cabin-notebook.png",
      actions: [
        {
          text: "Посмотреть",
          effects: [
            {
              message: "Это тетрадь Наташи.",
            },
          ],
        },
        {
          text: "Взять",
          guard: {
            not: "daily.found_natasha_notebook",
          },
          failed_effects: [
            {
              message: "Уже лежит у меня в сумке.",
            },
          ],
          effects: [
            {
              set: {
                "daily.found_natasha_notebook": true,
              },
            },
            {
              message: "Возьму, вдруг пригодится.",
            },
            {
              goto: "uni_toilet",
            },
          ],
        },
        {
          text: "Назад",
          effects: [
            {
              goto: "uni_toilet",
            },
          ],
        },
      ],
    },
    lecture_hall: {
      title: "Аудитория",
      image: "scenes/class.png",
      actions: [
        {
          text: "Сесть к Наташе",
          effects: [
            {
              goto: "with_natasha",
            },
          ],
        },
        {
          text: "Сесть в одиночестве",
          effects: [
            {
              goto: "alone",
            },
          ],
        },
      ],
    },
    with_natasha: {
      title: "Сидеть с Наташей",
      image: "scenes/class-friend-close.png",
      actions: [
        {
          text: "Отдать тетрадь (если есть)",
          guards: [
            {
              if: {
                not: "daily.found_natasha_notebook",
              },
              effects: [
                {
                  message: "Нечего отдавать — пустые руки.",
                },
              ],
            },
            {
              if: "daily.returned_natasha_notebook_today",
              effects: [
                {
                  message: "Я уже отдала её сегодня.",
                },
              ],
            },
          ],
          effects: [
            {
              set: {
                "daily.returned_natasha_notebook_today": true,
              },
            },
            {
              set: {
                "persistent.natasha_owes": true,
              },
            },
            {
              message: "Ой! Моя! Спасибо тебе!",
            },
          ],
        },
        {
          text: "Попросить списать вчерашнюю лекцию",
          guard: "persistent.natasha_owes",
          failed_effects: [
            {
              message: "Неудобно просить — я ей ещё ничем не помогла.",
            },
          ],
          guards: [
            {
              if: {
                not: "daily.returned_natasha_notebook_today",
              },
              effects: [
                {
                  message: "Эх… я сегодня свою тетрадь забыла.",
                },
              ],
            },
          ],
          effects: [
            {
              set: {
                "daily.got_lecture_notebook_today": true,
              },
            },
            {
              message: "Держи, вот моя другая тетрадь, там лекция.",
            },
          ],
        },
        {
          text: "Пойти в буфет на полпары",
          guards: [
            {
              if: {
                not: "daily.got_lecture_notebook_today",
              },
              effects: [
                {
                  message:
                    "Сначала бы списать лекцию — без тетради там делать нечего.",
                },
              ],
            },
            {
              if: "daily.went_to_cafeteria_today",
              effects: [
                {
                  message: "Я уже прогуливала сегодня — второй раз нельзя.",
                },
              ],
            },
          ],
          effects: [
            {
              set: {
                "daily.went_to_cafeteria_today": true,
              },
            },
            {
              message: "С Наташиным конспектом можно прогулять полпары.",
            },
            {
              goto: "cafeteria",
            },
          ],
        },
        {
          text: "Закрыть глаза, задремать",
          effects: [
            {
              message: "Складываю руки на парте и проваливаюсь в сон.",
            },
            {
              goto: "sleep_next_day",
            },
          ],
        },
      ],
    },
    alone: {
      title: "Сидеть в одиночестве",
      image: "scenes/class.png",
      actions: [
        {
          text: "Закрыть глаза, задремать",
          effects: [
            {
              message: "Скучно и клонит в сон.",
            },
            {
              goto: "sleep_next_day",
            },
          ],
        },
      ],
    },
    cafeteria: {
      title: "Буфет",
      image: "scenes/university-cafe.png",
      actions: [
        {
          text: "Константин (вернуть рубль)",
          guard: "persistent.lent_ruble",
          failed_effects: [
            {
              message: "Без рубля мы и не перекинулись бы словом.",
            },
          ],
          effects: [
            {
              set: {
                "persistent.met_konstantin_in_cafeteria": true,
              },
            },
            {
              message:
                "О, хорошо, что ты тут! Я разменял пятерку, вот твой рубль… Дозвонился. Они не придут. Бухали вчера в общаге…",
            },
            {
              goto: "cafeteria",
            },
          ],
        },
        {
          text: "Константин (спросить, как сдал)",
          guard: "persistent.told_friends_wont_come",
          failed_effects: [
            {
              message: "Пока рано — он всё ещё переживает в вестибюле.",
            },
          ],
          effects: [
            {
              goto: "cafeteria_true_ending_dialog",
            },
          ],
        },
        {
          text: "Вернуться в вестибюль",
          effects: [
            {
              goto: "university_hall",
            },
          ],
        },
        {
          text: "Сесть, задремать",
          effects: [
            {
              message: "В буфете тепло и сон клонит…",
            },
            {
              goto: "sleep_next_day",
            },
          ],
        },
      ],
    },
    cafeteria_true_ending_dialog: {
      title: "Буфет: развязка",
      image: "scenes/university-cafe-boy.png",
      actions: [
        {
          text: "Заговорить",
          effects: [
            {
              message:
                "— Ну как, сдал?\n— Сдал! Хорошо, что я тебя послушал, препод уходила уже, еле успел.\n— Я рада за тебя!\n— Знаешь, не поеду я в наш корпус. У меня пятерка есть, хочешь творожник с чаем?\n— Хочу.\n— Я Костя, кстати…\n— Я…\n",
            },
            {
              goto: "true_ending",
            },
          ],
        },
      ],
    },
    sleep_next_day: {
      title: "Темнота → следующий день",
      image: "scenes/darkness.png",
      on_enter: {
        messages: [
          {
            message: "…",
            visible: true,
          },
        ],
      },
      actions: [
        {
          text: "Открыть глаза",
          effects: [
            {
              inc: {
                "loop.day_index": 1,
              },
            },
            {
              reset: "daily_flags",
            },
            {
              goto: "darkness_start",
            },
          ],
        },
      ],
    },
  },
  terminals: {
    true_ending: {
      title: "Конец",
      effects: [
        {
          end: true,
        },
      ],
    },
  },
};
