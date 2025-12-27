import type { GameSpec } from "./types";
import darkness_start from "./scenes/darkness_start";
import room_bed_view_ringing_alarm from "./scenes/room_bed_view_ringing_alarm";
import room_bed_view_muted_alarm from "./scenes/room_bed_view_muted_alarm";
import corridor from "./scenes/corridor";
import bathroom from "./scenes/bathroom";
import kitchen from "./scenes/kitchen";
import kitchen_bowl from "./scenes/kitchen_bowl";
import room_desk_view from "./scenes/room_desk_view";
import room_curtains_closed from "./scenes/room_curtains_closed";
import room_curtains_open from "./scenes/room_curtains_open";
import room_desk_drawer_open from "./scenes/room_desk_drawer_open";
import tram_stop from "./scenes/tram_stop";
import tram_inside from "./scenes/tram_inside";
import university_outside from "./scenes/university_outside";
import university_hall from "./scenes/university_hall";
import university_hall_corner from "./scenes/university_hall_corner";
import talk_konstantin from "./scenes/talk_konstantin";
import konstantin_needs_change from "./scenes/konstantin_needs_change";
import konstantin_why_know from "./scenes/konstantin_why_know";
import uni_toilet from "./scenes/uni_toilet";
import uni_toilet_cabin from "./scenes/uni_toilet_cabin";
import natasha_notebook from "./scenes/natasha_notebook";
import lecture_hall from "./scenes/lecture_hall";
import with_natasha from "./scenes/with_natasha";
import alone from "./scenes/alone";
import cafeteria from "./scenes/cafeteria";
import cafeteria_true_ending_dialog from "./scenes/cafeteria_true_ending_dialog";
import sleep_next_day from "./scenes/sleep_next_day";

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
    darkness_start,
    room_bed_view_ringing_alarm,
    room_bed_view_muted_alarm,
    corridor,
    bathroom,
    kitchen,
    kitchen_bowl,
    room_desk_view,
    room_curtains_closed,
    room_curtains_open,
    room_desk_drawer_open,
    tram_stop,
    tram_inside,
    university_outside,
    university_hall,
    university_hall_corner,
    talk_konstantin,
    konstantin_needs_change,
    konstantin_why_know,
    uni_toilet,
    uni_toilet_cabin,
    natasha_notebook,
    lecture_hall,
    with_natasha,
    alone,
    cafeteria,
    cafeteria_true_ending_dialog,
    sleep_next_day,
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
