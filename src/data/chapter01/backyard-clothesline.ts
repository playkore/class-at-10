import type { SceneDefinition } from "../../types/scenes";

const backyardClothesline: SceneDefinition = {
  id: "backyard-clothesline",
  name: "Backyard Clothesline",
  description: "Задний двор. Неплохо, как временное укрытие.",
  imageSrc: "/scenes/chapter01/backyard-clothesline.png",
  interactions: [
    {
      label: "Пробраться к крыльцу дома",
      effect: (wrapper) => {
        const dressed =
          wrapper.getState().inventory.includes("stolen-jeans") &&
          wrapper.getState().inventory.includes("hang-in-there-t-shirt");
        if (!dressed) {
          wrapper.setMessage("Пожалуй, не буду высовываться, пока не оденусь.");
          return;
        }
        return wrapper.setScene("porch");
      },
    },
  ],
  objects: [
    {
      id: "jeans",
      name: "Широкие джинсы",
      description:
        "Джинсы, свободные и явно не моего размера. Возможно, в 80-х это модно.",
      visible: (s) => !s.inventory.includes("stolen-jeans"),
      imageSrc: "/scenes/chapter01/backyard-clothesline-jeans.png",
      boundingBox: {
        x: 0.13,
        y: 0.23,
        width: 0.37,
        height: 0.47,
      },
      interactions: [
        {
          label: "Надеть джинсы",
          effect: (wrapper) => wrapper.addToInventory("stolen-jeans"),
        },
      ],
    },
    {
      id: "tshirt",
      name: "Футболка с котом",
      description:
        'Футболка с котом. Примечательно, что оба висят на веревках. Написано "Держись". Я стараюсь, милый котенок, я стараюсь.',
      visible: (s) => !s.inventory.includes("hang-in-there-t-shirt"),
      imageSrc: "/scenes/chapter01/backyard-clothesline-tshirt.png",
      boundingBox: {
        x: 0.51,
        y: 0.24,
        width: 0.41,
        height: 0.32,
      },
      interactions: [
        {
          label: "Надеть футболку",
          effect: (wrapper) => wrapper.addToInventory("hang-in-there-t-shirt"),
        },
      ],
    },
  ],
};

export default backyardClothesline;
