import type { SceneDefinition } from "../../types/scenes";

const smithtownMap: SceneDefinition = {
  id: "smithtown-map",
  name: "Smithtown Map",
  description: "A bird’s-eye view of Smithtown and its key locations.",
  imageSrc: "/scenes/maps/smithtown-map-day.png",
  interactions: [],
  objects: [
    {
      id: "bus-station",
      name: "Bus station",
      description: "A modest transit hub on the edge of town.",
      boundingBox: { x: 0.06, y: 0.18, width: 0.28, height: 0.14 },
      interactions: [
        {
          label: "Check bus station",
          effect: (w) => w.setScene("smithtown-map"),
        },
      ],
    },
    {
      id: "city-hall",
      name: "City hall",
      description: "The civic center sits near the river.",
      boundingBox: { x: 0.56, y: 0.43, width: 0.2, height: 0.16 },
      interactions: [
        {
          label: "Check city hall",
          effect: (w) => w.setScene("smithtown-map"),
        },
      ],
    },
    {
      id: "bank",
      name: "Bank",
      description: "The tallest building in the skyline.",
      boundingBox: { x: 0.67, y: 0.16, width: 0.23, height: 0.2 },
      interactions: [
        { label: "Check bank", effect: (w) => w.setScene("smithtown-map") },
      ],
    },
    {
      id: "lawrence-avenue",
      name: "Lawrence Avenue",
      description: "A stretch of quiet residential streets.",
      boundingBox: { x: 0.05, y: 0.55, width: 0.42, height: 0.26 },
      interactions: [
        {
          label: "Check Lawrence Avenue",
          effect: (w) => w.setScene("smithtown-map"),
        },
      ],
    },
  ],
};

export default smithtownMap;
