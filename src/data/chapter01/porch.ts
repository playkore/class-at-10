import type { SceneDefinition } from "../../types/scenes";

const porchBoots: SceneDefinition = {
  id: "porch",
  name: "Back Steps & Porch",
  description: "Заднее крыльцо старого дома. Внутри темно и тихо. Пока.",
  imageSrc: "/scenes/chapter01/porch.png",
  interactions: [
    {
      label: "Назад во двор",
      effect: (wrapper) => wrapper.setScene("backyard-clothesline"),
    },
    {
      label: "Выйти на улицу",
      effect: (wrapper) => {
        const hasBoots = wrapper.getState().inventory.includes("oversized-boots");
        if (!hasBoots) {
          return wrapper.setMessage(
            "Негоже расхажиывать босиком по улице. Начтутся ненужные разговоры, а там и до провала миссии недалеко."
          );
        }
        const bootsStuffed = wrapper.getState().flags.bootsStuffed;
        if (!bootsStuffed) {
          return wrapper.setMessage(
            "Ботинки великоваты. Размеров на шесть. Могут свалиться, если попытаюсь пнуть кого-то в челюсть."
          );
        }
        return wrapper.setScene("street-exit");
      },
    },
  ],
  objects: [
    {
      id: "boots",
      name: "Старые ботинки",
      description: "Мужской размер. Великоваты. Размеров на шесть.",
      visible: (s) => !s.inventory.includes("oversized-boots"),
      imageSrc: "/scenes/chapter01/porch-boots.png",
      boundingBox: { x: 0.5, y: 0.37, width: 0.29, height: 0.14 },
      interactions: [
        {
          label: "Надеть",
          effect: (wrapper) => wrapper.addToInventory("oversized-boots"),
        },
      ],
    },
    {
      id: "newspaper",
      name: "Старая газета",
      description:
        "Вчерашняя Правда. Варианты использования: туалетная бумага, завернуть рыбу, да много еще чего.",
      imageSrc: "/scenes/chapter01/porch-newspaper.png",
      boundingBox: { x: 0.06, y: 0.63, width: 0.56, height: 0.22 },
      visible: (s) => !s.flags["bootsStuffed"],
      interactions: [
        {
          label: "Использовать",
          effect: (wrapper) => {
            if (!wrapper.getState().inventory.includes("oversized-boots")) {
              wrapper.setMessage(
                "Принцессы не какают, а рыбы у меня нет."
              );
              return;
            }
            wrapper.setFlag("bootsStuffed");
            wrapper.setMessage(
              "Набиваю ботинки газеткой, чтобы они хотя бы перестали переворачиваться носками назад при ходьбе."
            );
          },
        },
      ],
    },
  ],
};

export default porchBoots;
