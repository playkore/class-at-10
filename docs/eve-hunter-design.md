Got it. Chapter 1 (the “Eve gets dressed” sequence) in the book is basically: **arrival naked → spot laundry line → steal baggy jeans + cat T-shirt → grab oversized boots + stuff with newspaper → check reflection in a car mirror → move on** 

Below is a clean **scene plan + ready-to-drop SceneDefinition files** that fit your engine (hitboxes + interactions + optional inventory-gated visibility). I’m ignoring your existing chapter01 scenes and building a new “chapter01_clothes” slice that can later hand off to whatever comes next.

---

## Scene flow (first chapter: “Eve finds clothes”)

**Start:** `arrival-lawn`
→ `backyard-clothesline` (steal jeans + shirt)
→ `porch-boots` (steal boots + newspaper stuffing)
→ `car-mirror-check` (quick “disguise check”, sets a flag / message)
→ `street-exit` (handoff scene: “Head toward the bank / next chapter hook”)

### Inventory items you’ll want (new)

Right now your inventory is `car-keys | city-map | duct-tape`. For this chapter you’ll want:

* `stolen-jeans`
* `hang-in-there-shirt`
* `oversized-boots`
* `newspaper-stuffing` (optional, but it’s a nice “micro-goal”)

If you don’t want to expand inventory yet, you can replace these with boolean flags on `GameState` like `hasJeans`, `hasShirt`, `hasBoots`, `bootsStuffed`, but inventory is already there and works nicely.

---

## Minimal engine/state tweaks (so the scenes can gate properly)

### 1) Update `src/types/inventory.ts`

```ts
export type InventoryItemId =
  | "stolen-jeans"
  | "hang-in-there-shirt"
  | "oversized-boots"
  | "newspaper-stuffing"
  // keep your old items too if you want:
  | "car-keys"
  | "city-map"
  | "duct-tape";
```

### 2) Update `src/types/scenes.ts` SceneId union

Add:

* `"arrival-lawn"`
* `"backyard-clothesline"`
* `"porch-boots"`
* `"car-mirror-check"`
* `"street-exit"`

### 3) Pick a new initial scene for this chapter (optional)

In `src/data/scenes.ts`, set:

* `initialSceneId = "arrival-lawn"`

---

## Scene definitions (drop-in TS files)

You’ll need 5 new files under something like:
`src/data/chapter01_clothes/`

And you’ll need images (even placeholders) under:
`public/scenes/chapter01_clothes/`

I’ll reference image paths like `/scenes/chapter01_clothes/<name>.png`.

### A) `arrival-lawn.ts`

```ts
import type { SceneDefinition } from "../../types/scenes";
import { setMessage, setScene } from "../../effects/mutators";

const arrivalLawn: SceneDefinition = {
  id: "arrival-lawn",
  name: "Arrival",
  description:
    "I materialize on a manicured suburban lawn at 2:32 AM. Naked. Alone. Whoever invented time travel had jokes.",
  imageSrc: "/scenes/chapter01_clothes/arrival-lawn.png",
  interactions: [
    {
      label: "Scan for cover",
      effect: (state) => {
        // Optional: if player already has clothes (dev testing), skip ahead.
        const dressed =
          state.inventory.includes("stolen-jeans") &&
          state.inventory.includes("hang-in-there-shirt");
        if (dressed) return setScene("car-mirror-check")(state);

        return setMessage(
          "First priority: acquire clothing. Preferably without meeting law enforcement."
        )(state);
      },
    },
  ],
  objects: [
    {
      id: "streetlamp",
      name: "Flickering street lamp",
      description:
        "A street lamp above me flickers like it’s judging. It’s not wrong.",
      boundingBox: { x: 0.58, y: 0.04, width: 0.35, height: 0.35 },
      interactions: [
        {
          label: "Look where the light doesn’t reach",
          effect: setScene("backyard-clothesline"),
        },
      ],
    },
    {
      id: "houses",
      name: "Silent houses",
      description:
        "Rows of sleeping houses. Inside them: people with opinions. I prefer them asleep.",
      boundingBox: { x: 0.0, y: 0.1, width: 0.55, height: 0.35 },
      interactions: [
        {
          label: "Move toward the backyards",
          effect: setScene("backyard-clothesline"),
        },
      ],
    },
  ],
};

export default arrivalLawn;
```

### B) `backyard-clothesline.ts`

```ts
import type { SceneDefinition } from "../../types/scenes";
import { addToInventory, setMessage, setScene } from "../../effects/mutators";

const backyardClothesline: SceneDefinition = {
  id: "backyard-clothesline",
  name: "Backyard Clothesline",
  description:
    "Laundry dances on a clothesline in the night breeze. It’s not stylish, but it’s fabric. Fabric is victory.",
  imageSrc: "/scenes/chapter01_clothes/backyard-clothesline.png",
  interactions: [
    { label: "Back away", effect: setScene("arrival-lawn") },
    {
      label: "Go to the porch steps",
      effect: (state) => {
        const dressed =
          state.inventory.includes("stolen-jeans") &&
          state.inventory.includes("hang-in-there-shirt");
        if (!dressed) {
          return setMessage("Not leaving without clothes. I’m not a tourist.")(state);
        }
        return setScene("porch-boots")(state);
      },
    },
  ],
  objects: [
    {
      id: "jeans",
      name: "Baggy jeans",
      description:
        "Loose and clearly not my size. Good. I’m not trying to look like me.",
      visible: (s) => !s.inventory.includes("stolen-jeans"),
      boundingBox: { x: 0.12, y: 0.35, width: 0.28, height: 0.35 },
      interactions: [{ label: "Take jeans", effect: addToInventory("stolen-jeans") }],
    },
    {
      id: "tshirt",
      name: "Cat t-shirt",
      description:
        'A shirt with a cat dangling from a branch: “HANG IN THERE.” The universe is smug.',
      visible: (s) => !s.inventory.includes("hang-in-there-shirt"),
      boundingBox: { x: 0.45, y: 0.34, width: 0.28, height: 0.35 },
      interactions: [
        { label: "Take t-shirt", effect: addToInventory("hang-in-there-shirt") },
      ],
    },
    {
      id: "clothespins",
      name: "Clothespins",
      description:
        "Tiny wooden clamps holding secrets together. Relatable.",
      boundingBox: { x: 0.77, y: 0.38, width: 0.2, height: 0.2 },
      interactions: [
        {
          label: "Ignore (for now)",
          effect: setMessage("No. I’m not starting a craft project at 2:32 AM."),
        },
      ],
    },
  ],
};

export default backyardClothesline;
```

### C) `porch-boots.ts`

```ts
import type { SceneDefinition } from "../../types/scenes";
import { addToInventory, setMessage, setScene } from "../../effects/mutators";

const porchBoots: SceneDefinition = {
  id: "porch-boots",
  name: "Back Steps & Porch",
  description:
    "By the back steps: forgotten boots. Nearby: yesterday’s newspaper. Human carelessness is my supply chain.",
  imageSrc: "/scenes/chapter01_clothes/porch-boots.png",
  interactions: [
    {
      label: "Return to the clothesline",
      effect: setScene("backyard-clothesline"),
    },
    {
      label: "Check reflection in the car",
      effect: (state) => {
        const hasBoots = state.inventory.includes("oversized-boots");
        if (!hasBoots) return setMessage("Bare feet are a liability. Acquire boots.")(state);
        return setScene("car-mirror-check")(state);
      },
    },
  ],
  objects: [
    {
      id: "boots",
      name: "Worn boots",
      description:
        "Men’s size. Too big. Still better than frostbite and police attention.",
      visible: (s) => !s.inventory.includes("oversized-boots"),
      boundingBox: { x: 0.24, y: 0.62, width: 0.36, height: 0.22 },
      interactions: [
        { label: "Take boots", effect: addToInventory("oversized-boots") },
      ],
    },
    {
      id: "newspaper",
      name: "Old newspaper",
      description:
        "Ink, lies, and useful stuffing. Tonight, it’s mostly the third one.",
      visible: (s) => !s.inventory.includes("newspaper-stuffing"),
      boundingBox: { x: 0.62, y: 0.67, width: 0.28, height: 0.18 },
      interactions: [
        {
          label: "Tear for boot stuffing",
          effect: (state) => {
            if (!state.inventory.includes("oversized-boots")) {
              return setMessage("Stuffing is pointless without boots. Acquire boots first.")(state);
            }
            return addToInventory("newspaper-stuffing")(state);
          },
        },
      ],
    },
  ],
};

export default porchBoots;
```

### D) `car-mirror-check.ts`

```ts
import type { SceneDefinition } from "../../types/scenes";
import { setMessage, setScene } from "../../effects/mutators";

const carMirrorCheck: SceneDefinition = {
  id: "car-mirror-check",
  name: "Car Mirror",
  description:
    "I check my reflection in a parked car’s side mirror. Baggy clothes, oversized boots. Runaway teenager: plausible cover.",
  imageSrc: "/scenes/chapter01_clothes/car-mirror-check.png",
  interactions: [
    { label: "Leave the yard", effect: setScene("street-exit") },
    { label: "Go back to the porch", effect: setScene("porch-boots") },
  ],
  objects: [
    {
      id: "mirror",
      name: "Side mirror",
      description:
        "A warped, slightly dirty mirror that still does its job: tell me what humans will assume.",
      boundingBox: { x: 0.58, y: 0.23, width: 0.36, height: 0.26 },
      interactions: [
        {
          label: "Confirm disguise",
          effect: (state) => {
            const dressed =
              state.inventory.includes("stolen-jeans") &&
              state.inventory.includes("hang-in-there-shirt") &&
              state.inventory.includes("oversized-boots");

            if (!dressed) {
              return setMessage("Not convincing yet. I’m missing key components: fabric.")(state);
            }

            const stuffed = state.inventory.includes("newspaper-stuffing");
            return setMessage(
              stuffed
                ? "Disguise acceptable. Boots still ridiculous, but less dangerous."
                : "Disguise acceptable. Boots are too big. Consider stuffing them."
            )(state);
          },
        },
      ],
    },
  ],
};

export default carMirrorCheck;
```

### E) `street-exit.ts` (handoff)

```ts
import type { SceneDefinition } from "../../types/scenes";
import { setMessage, setScene } from "../../effects/mutators";

const streetExit: SceneDefinition = {
  id: "street-exit",
  name: "Suburban Street",
  description:
    "Now dressed, I can think about money, transport, and my target. One crisis at a time.",
  imageSrc: "/scenes/chapter01_clothes/street-exit.png",
  interactions: [
    { label: "Look back", effect: setScene("car-mirror-check") },
    {
      label: "Head toward town",
      effect: (state) =>
        setMessage("Next objective: cash. There’s a bank in town. The night is young.")(state),
      // Later you can swap this to setScene("bank-atm") when you add it.
    },
  ],
  objects: [],
};

export default streetExit;
```

---

## Notes (so it matches the book *and* plays well)

* This keeps the beats faithful: **clothesline → boots → newspaper stuffing → mirror check** 
* It’s “micro-goal” driven: each scene gives a clear next action without ever needing a tutorial popup.
* You can later extend this same chapter with “Bank ATM” scenes right after `street-exit` (paperclip lockpicking, etc.)—the book goes there next. 

If you want, I can also provide:

* a `src/data/scenes.ts` block that registers these 5 scenes (in the right order), and
* a tiny set of placeholder prompts for generating the 5 background images in your 1980s comic-book style (so you can keep visual consistency across the chapter).
