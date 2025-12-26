import type { GameSpec } from "../types/gameSpec";

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
      actions: {
        open_eyes: {
          text: "Открыть глаза",
          goto: "room_bed_view",
        },
      },
    },
    room_bed_view: {
      title: "Вид с кровати",
      image: "scenes/darkness.png",
      actions: {
        get_up: {
          text: "Встать",
          goto: "corridor",
        },
        close_eyes: {
          text: "Закрыть глаза",
          goto: "darkness_start",
        },
      },
    },
    corridor: {
      title: "Коридор, вид на ванну с туалетом",
      image: "scenes/darkness.png",
      actions: {
        go_to_toilet: {
          text: "Сходить в туалет",
          guard: [
            {
              not: "daily.used_toilet_home",
            },
          ],
          effects: [
            {
              set: {
                "daily.used_toilet_home": true,
              },
            },
          ],
          goto: "bathroom",
        },
        wash_teeth: {
          text: "Умыться и почистить зубы",
          guard: [
            {
              not: "daily.washed_face",
            },
          ],
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
          ],
          goto: "bathroom",
        },
        back_to_room: {
          text: "Вернуться в комнату",
          goto: "room_desk_view",
        },
        go_kitchen: {
          text: "Пойти на кухню",
          goto: "kitchen",
        },
        go_outside: {
          text: "Выйти на улицу",
          guard: [
            "daily.has_keys",
            "daily.has_notebook",
            "daily.is_dressed",
            {
              any: ["daily.has_pass", "daily.has_coins"],
            },
          ],
          on_fail: {
            stay: true,
            message_by_first_failed_guard: {
              "daily.has_keys": "А домой я как попаду? Ключи не взяла!",
              "daily.has_notebook": "А писать я в чем в институте буду?",
              "daily.is_dressed": "Как я на улицу пойду в таком виде?",
              transport: "Как я на трамвае поеду, зайцем?",
            },
          },
          goto: "tram_stop",
        },
      },
    },
    bathroom: {
      title: "Ванная",
      image: "scenes/darkness.png",
      actions: {
        exit: {
          text: "Выйти",
          goto: "corridor",
        },
      },
    },
    room_desk_view: {
      title: "Комната, вид на стол",
      image: "scenes/darkness.png",
      actions: {
        check_schedule: {
          text: "Посмотреть расписание",
          effects: [
            {
              set: {
                "persistent.knows_schedule": true,
              },
            },
          ],
          note: "Показывает: сегодня аудитория 404",
        },
        put_makeup: {
          text: "Накраситься",
          guard: [
            {
              not: "daily.makeup_on",
            },
          ],
          effects: [
            {
              set: {
                "daily.makeup_on": true,
              },
            },
          ],
        },
        take_notebook: {
          text: "Взять тетрадь и ручку",
          guard: [
            {
              not: "daily.has_notebook",
            },
          ],
          effects: [
            {
              set: {
                "daily.has_notebook": true,
              },
            },
          ],
        },
        take_coins: {
          text: "Взять россыпь монет",
          guard: [
            {
              not: "daily.has_coins",
            },
          ],
          effects: [
            {
              set: {
                "daily.has_coins": true,
              },
            },
          ],
        },
        take_keys: {
          text: "Взять ключи",
          guard: [
            {
              not: "daily.has_keys",
            },
          ],
          effects: [
            {
              set: {
                "daily.has_keys": true,
              },
            },
          ],
        },
        dress_up: {
          text: "Одеться",
          guard: [
            {
              not: "daily.is_dressed",
            },
          ],
          effects: [
            {
              set: {
                "daily.is_dressed": true,
              },
            },
          ],
        },
        open_wardrobe: {
          text: "Открыть шкаф",
          guard: ["persistent.pass_unlocked"],
          goto: "wardrobe_open",
        },
        go_corridor: {
          text: "В коридор",
          goto: "corridor",
        },
      },
    },
    wardrobe_open: {
      title: "Открытый шкаф",
      image: "scenes/darkness.png",
      actions: {
        take_pass: {
          text: "Взять проездной",
          guard: [
            {
              not: "daily.has_pass",
            },
          ],
          effects: [
            {
              set: {
                "daily.has_pass": true,
              },
            },
          ],
        },
        close: {
          text: "Закрыть шкаф",
          goto: "room_desk_view",
        },
      },
    },
    kitchen: {
      title: "Кухня",
      image: "scenes/darkness.png",
      actions: {
        eat_yogurt: {
          text: "Съесть йогурт",
          guard: ["daily.is_hungry"],
          effects: [
            {
              set: {
                "daily.is_hungry": false,
              },
            },
          ],
        },
        go_corridor: {
          text: "В коридор",
          goto: "corridor",
        },
      },
    },
    tram_stop: {
      title: "Улица, остановка. Трамвай остановился, открыл двери",
      image: "scenes/darkness.png",
      actions: {
        board_tram: {
          text: "Сесть в трамвай",
          goto: "tram_inside",
        },
      },
    },
    tram_inside: {
      title: "В трамвае, виден кондуктор",
      image: "scenes/darkness.png",
      actions: {
        show_pass: {
          text: "Показать проездной",
          guard: ["daily.has_pass"],
          goto: "university_outside",
        },
        buy_ticket: {
          text: "Купить билет",
          guard: ["daily.has_coins", { not: "daily.has_pass" }],
          effects: [
            {
              set: {
                "daily.has_coins": false,
              },
            },
            {
              set: {
                "persistent.pass_unlocked": true,
              },
            },
          ],
          message:
            "Блин, проездной дома забыла. Точно помню, он в шкафу дома лежит. Придется теперь билет покупать.",
          goto: "university_outside",
        },
      },
    },
    university_outside: {
      title: "Университет, на улице",
      image: "scenes/darkness.png",
      actions: {
        enter: {
          text: "Войти",
          goto: "university_hall",
        },
      },
    },
    university_hall: {
      title: "Вестибюль университета",
      image: "scenes/darkness.png",
      on_enter: {
        message_if: [
          {
            if: {
              "daily.talked_konstantin_today": true,
            },
            then: "Константина уже нет — он ушёл сдавать.",
          },
        ],
      },
      actions: {
        go_toilet: {
          text: "Туалет",
          guard: [
            {
              gte: ["loop.day_index", 2],
            },
            {
              not: "daily.used_toilet_uni",
            },
            {
              not: "daily.used_toilet_home",
            },
          ],
          goto: "uni_toilet",
        },
        go_room_404: {
          text: "Аудитория 404",
          guard: ["persistent.knows_schedule"],
          goto: "lecture_hall",
        },
        wait_in_corner: {
          text: "Присесть в уголочке",
          goto: "university_hall_corner",
        },
        talk_konstantin: {
          text: "Константин",
          guard: [
            {
              not: "daily.talked_konstantin_today",
            },
          ],
          effects: [
            {
              set: {
                "daily.talked_konstantin_today": true,
              },
            },
          ],
          goto: "talk_konstantin",
        },
        nap: {
          text: "Подремать",
          goto: "sleep_next_day",
        },
      },
    },
    university_hall_corner: {
      title: "Вестибюль: уголочек",
      image: "scenes/darkness.png",
      on_enter: {
        message_if: [
          {
            if: {
              "persistent.knows_schedule": false,
            },
            then: "Подожду наших… Всё равно я не знаю, в какой аудитории занятие.",
          },
          {
            else: "Подожду наших, пойдем вместе в аудиторию.",
          },
        ],
      },
      actions: {
        stand_up: {
          text: "Встать",
          goto: "university_hall",
        },
        doze_off: {
          text: "Подремать",
          goto: "sleep_next_day",
        },
      },
    },
    talk_konstantin: {
      title: "Диалог: Константин в вестибюле",
      image: "scenes/darkness.png",
      actions: {
        greet: {
          text: "Заговорить",
          choices: [
            {
              id: "ask_call",
              text: "А позвонить?",
              goto: "konstantin_needs_change",
            },
            {
              id: "do_nothing",
              text: "Пожелать удачи и уйти",
              goto: "university_hall",
            },
          ],
        },
      },
    },
    konstantin_needs_change: {
      title: "Константин: 'У меня только пятерка. Не разменяешь?'",
      image: "scenes/darkness.png",
      actions: {
        give_ruble: {
          text: "Отдать рубль (если есть мелочь)",
          guard: ["daily.has_coins"],
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
          ],
          message: "Спасибо! Я верну, разменяю и верну, обязательно!",
          goto: "university_hall",
        },
        refuse: {
          text: "Извини, я дома деньги оставила",
          message:
            "Жаль. Ладно, пойду один сдавать. Я уже и так опоздал… Пока!",
          goto: "university_hall",
        },
        tell_friends_wont_come: {
          text: "Они не придут (если знаешь про общагу)",
          guard: ["persistent.met_konstantin_in_cafeteria"],
          effects: [
            {
              set: {
                "persistent.told_friends_wont_come": true,
              },
            },
          ],
          goto: "konstantin_why_know",
        },
      },
    },
    konstantin_why_know: {
      title: "Константин: 'Откуда ты знаешь?'",
      image: "scenes/darkness.png",
      actions: {
        intuition: {
          text: "Женская интуиция. Иди один сдавай.",
          message: "Ладно, может ты и права… Пойду, пожалуй. Пока!",
          goto: "university_hall",
        },
      },
    },
    uni_toilet: {
      title: "Туалет (университет)",
      image: "scenes/darkness.png",
      actions: {
        use: {
          text: "Сходить",
          effects: [
            {
              set: {
                "daily.used_toilet_uni": true,
              },
            },
          ],
        },
        inspect_notebook: {
          text: "Забытая тетрадь",
          goto: "natasha_notebook",
        },
        exit: {
          text: "Выйти",
          goto: "university_hall",
        },
      },
    },
    natasha_notebook: {
      title: "Забытая тетрадь",
      image: "scenes/darkness.png",
      actions: {
        look: {
          text: "Посмотреть",
          message: "Это тетрадь Наташи.",
        },
        take: {
          text: "Взять",
          guard: [
            {
              not: "daily.found_natasha_notebook",
            },
          ],
          effects: [
            {
              set: {
                "daily.found_natasha_notebook": true,
              },
            },
          ],
          goto: "uni_toilet",
        },
        back: {
          text: "Назад",
          goto: "uni_toilet",
        },
      },
    },
    lecture_hall: {
      title: "Аудитория",
      image: "scenes/darkness.png",
      actions: {
        sit_with_natasha: {
          text: "Сесть к Наташе",
          goto: "with_natasha",
        },
        sit_alone: {
          text: "Сесть в одиночестве",
          goto: "alone",
        },
      },
    },
    with_natasha: {
      title: "Сидеть с Наташей",
      image: "scenes/darkness.png",
      actions: {
        return_natasha_notebook: {
          text: "Отдать тетрадь (если есть)",
          guard: [
            "daily.found_natasha_notebook",
            {
              not: "daily.returned_natasha_notebook_today",
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
          ],
          message: "Ой! Моя! Спасибо тебе!",
        },
        ask_copy_yesterday: {
          text: "Попросить списать вчерашнюю лекцию",
          guard: ["persistent.natasha_owes"],
          if: {
            guard: ["daily.returned_natasha_notebook_today"],
            then: {
              effects: [
                {
                  set: {
                    "daily.got_lecture_notebook_today": true,
                  },
                },
              ],
              message: "Держи, вот моя другая тетрадь, там лекция.",
            },
            else: {
              message: "Эх… я сегодня свою тетрадь забыла.",
            },
          },
        },
        go_cafeteria_half: {
          text: "Пойти в буфет на полпары, чтобы списать лекцию",
          guard: [
            "daily.got_lecture_notebook_today",
            {
              not: "daily.went_to_cafeteria_today",
            },
          ],
          effects: [
            {
              set: {
                "daily.went_to_cafeteria_today": true,
              },
            },
          ],
          goto: "cafeteria",
        },
        doze_off: {
          text: "Закрыть глаза, задремать",
          goto: "sleep_next_day",
        },
      },
    },
    alone: {
      title: "Сидеть в одиночестве",
      image: "scenes/darkness.png",
      actions: {
        doze_off: {
          text: "Закрыть глаза, задремать",
          goto: "sleep_next_day",
        },
      },
    },
    cafeteria: {
      title: "Буфет",
      image: "scenes/darkness.png",
      actions: {
        talk_konstantin_if_lent: {
          text: "Константин (если дала ему рубль)",
          guard: ["persistent.lent_ruble"],
          effects: [
            {
              set: {
                "persistent.met_konstantin_in_cafeteria": true,
              },
            },
          ],
          message:
            "О, хорошо, что ты тут! Я разменял пятерку, вот твой рубль… Дозвонился. Они не придут. Бухали вчера в общаге…",
          goto: "cafeteria",
        },
        talk_konstantin_if_told: {
          text: "Константин (если сказала, что друзья не придут)",
          guard: ["persistent.told_friends_wont_come"],
          goto: "cafeteria_true_ending_dialog",
        },
        doze_off: {
          text: "Сесть, задремать",
          goto: "sleep_next_day",
        },
      },
    },
    cafeteria_true_ending_dialog: {
      title: "Буфет: развязка",
      image: "scenes/darkness.png",
      actions: {
        dialogue: {
          text: "Заговорить",
          message:
            "— Ну как, сдал?\n— Сдал! Хорошо, что я тебя послушал, препод уходила уже, еле успел.\n— Я рада за тебя!\n— Знаешь, не поеду я в наш корпус. У меня пятерка есть, хочешь творожник с чаем?\n— Хочу.\n— Я Костя, кстати…\n— Я…\n",
          goto: "true_ending",
        },
      },
    },
    sleep_next_day: {
      title: "Темнота → следующий день",
      image: "scenes/darkness.png",
      on_enter: {
        message: "…",
      },
      actions: {
        open_eyes: {
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
          ],
          goto: "darkness_start",
        },
      },
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
