import type { SceneDefinition } from "../../types/scenes";

const arrivalLawn: SceneDefinition = {
  id: "arrival-lawn",
  name: "Прибытие",
  description:
    "... Шар исчезает, я растягиваюсь на траве. Голая. У того, кто придумал путешествия во времени, дурацкое чувство юмора. Поэтому нас выбрасывают ночью.",
  imageSrc: "/scenes/chapter01/arrival-lawn.png",
  interactions: [
    {
      label: "Искать укрытие, пока меня не заметили",
      effect: (wrapper) => wrapper.setScene("backyard-clothesline"),
    },
  ],
  objects: [],
};

export default arrivalLawn;
