# Blender assets

3D scenes for the Godot port. Each scene comes from a Python script, so edit the script and regenerate. Don't edit the `.blend` by hand, because the next build overwrites it.

## Bedroom (`room_bed_view_*`, `room_desk_view`)

```bash
/Applications/Blender.app/Contents/MacOS/Blender -b -P blender/scripts/build_bedroom.py
```

Outputs:
- `blender/bedroom.blend`: the scene, for looking around in Blender.
- `blender/export/bedroom.glb`: the file to import into Godot.

Extra flags go after `--`:
- `-- --render <dir>` writes a preview PNG from every camera.
- `-- --no-export` skips the .glb export.

## Anna, the protagonist (`doc/proto.png`)

```bash
/Applications/Blender.app/Contents/MacOS/Blender -b -P blender/scripts/build_anna.py
```

Outputs:
- `blender/anna.blend`: the model, with preview cameras (`Cam_Anna_Front`, `_Side`, `_ThreeQuarter`, `_Back`, `_Face`) and studio lights.
- `blender/export/anna.glb`: only the `Anna` hierarchy, for Godot. Cameras and lights are left out.

It takes the same `--render <dir>` and `--no-export` flags as the bedroom script.

Notes:
- The model is low-poly (about 6.1k triangles), a static mesh in T-pose with no armature. She is 1.68 m tall, with her feet at the origin, facing -Y in Blender (+Z in Godot). Her left side is +X.
- The body is lofted from measurement tables at the top of the script: `TRUNK` for torso, neck and head cross-sections, and `ARM`, `LEG` and `FOOT`. To change her shape, edit those numbers. The T-shirt and pants are built with the same generators plus an offset, so they follow any change you make.
- Meshes: `Anna_Body` (complete, and usable under other outfits), `Anna_Face` (eyes, brows, lips), `Anna_Shirt` (red T-shirt), `Anna_Pants` (grey joggers with red side stripes, plus `Anna_Drawstring`), `Anna_Feet` (striped socks, slippers), `Anna_Accessories` (watch, pendant), `Anna_Hair` and `Anna_HairCap`.
- There are no textures, only plain Principled BSDF materials named `Anna_*`.

## Anna, MPFB version (`doc/proto.png`)

An alternative Anna built from a MakeHuman body, with a skeleton and fitted clothes.

```bash
/Applications/Blender.app/Contents/MacOS/Blender -b -P blender/scripts/build_anna_mpfb.py
```

Before you run it, you need:
- the [MPFB](https://extensions.blender.org/add-ons/mpfb/) extension in Blender (Get Extensions, then search for MPFB).
- these [asset packs](https://static.makehumancommunity.org/assets/assetpacks/index.html): `makehuman_system_assets`, `hair01`, `shirts02`, `shirts03`, `pants01` and `underwear04`. Install each one in Blender with MPFB sidebar tab → Apply assets → Library settings → Load pack from zip file.

Outputs:
- `blender/anna_mpfb.blend`: the model, with the same studio and preview cameras as `anna.blend`.
- `blender/export/anna_mpfb.glb`: only the rig and the meshes, for Godot.
- `blender/textures/anna_mpfb/*.png`: the recoloured 1024 px textures that `anna_mpfb.blend` uses. The .glb embeds its own copies.
- `blender/export/anna_mixamo_upload.fbx`: the file to upload to Mixamo (see below).

It takes the same `--render <dir>` and `--no-export` flags as the other scripts. `--cardigan` adds the buttoned knit cardigan over the red tank top, which is her outer layer by default. `--proxy <name>` chooses the body mesh. The default is `female1605`, about 3k triangles. `female_generic` gives a smoother body at about 27k triangles.

Notes:
- She is 1.68 m tall, with her feet at the origin, facing -Y. The script builds her once, measures her, then rebuilds her at the scale that gives exactly `HEIGHT`.
- The rig is MPFB's `mixamo` skeleton: 52 bones named `mixamorig:*`, with every mesh skinned to it. The export is about 10.8k triangles in total, or 12.4k with the cardigan.
- To change her, edit the tables at the top of the script:
  - `PHENOTYPE` holds the MakeHuman sliders.
  - `ASSETS` holds the asset file names.
  - `RECOLOR` sets each garment's palette. The asset texture's brightness is mapped onto a gradient, so the knit and fold detail survives the colour change.
  - `SMOOTH` sets the edge-preserving blur on the skin texture. It removes the photo skin's pores and blotches, which look dirty under the cel shader, but keeps lips, nipples and ears.
  - `DECIMATE` sets how much the dense meshes are thinned.
- Parts of inner layers that would poke through are deleted (see `trim_hidden_layers`). The body under each garment is hidden by MPFB's `Delete.*` mask. `fit_delete_groups` shrinks those masks to the skin the garment really covers, minus one ring of vertices at the edge. Without that, the coarse proxy loses whole faces past the garment's edge, which opened a hole above the tank top's back neckline. The pants waist stops just under the tank top's hem, and the socks stop just above the pants cuffs. With `--cardigan`, the tank top only shows at the neckline and the pants stop under the cardigan's hem.
- Materials are image-texture → Principled BSDF. Hair, eyebrows and eyelashes export with glTF `alphaMode: MASK`.
- There are no slippers, watch or pendant yet, and the joggers have no red side stripe.
- License: the tank top (`mindfront_tank_top_01`) and cardigan (`mindfront_lusekofta`) are CC-BY by Mindfront, so they need a credit in the game. Everything else is CC0.

### Animating with Mixamo

Mixamo can't read a character with clothes, hair and a proxy body, so the script also exports a "reduced doll". It does what MPFB's Operations → Animation → Reduced doll button does: it keeps only the rig and the full base mesh, deletes the helper geometry and bakes the shape keys.

1. Upload `blender/export/anna_mixamo_upload.fbx` at [mixamo.com](https://www.mixamo.com) with Upload Character. Mixamo recognises the `mixamorig` skeleton, so it skips the auto-rigger.
2. Choose an animation and download it as FBX with **Skin: Without Skin**.
3. Apply it to Anna. Both skeletons have the same `mixamorig:*` bone names, so there are two ways:
   - In Godot, import the animation FBX and use its animation on Anna's skeleton, or retarget it through a `BoneMap`.
   - In Blender, import the FBX into `anna_mpfb.blend` with "Automatic Bone Orientation" on. Select both armatures, then click MPFB's Operations → Animation → Map mixamo → Snap to mixamo.

### Animated Anna (`Female Locomotion Pack`)

```bash
/Applications/Blender.app/Contents/MacOS/Blender -b blender/anna_mpfb.blend -P blender/scripts/build_anna_animated.py
```

Output: `blender/export/anna_animated.glb`, Anna's rig and meshes plus the animations `idle`, `walk`, `run`, `jump`, `strafe_left` and `strafe_right`, retargeted from the Mixamo FBX files in `blender/Female Locomotion Pack/`. Add clips in `CLIPS` at the top of the script.

- The Mixamo clips come with a T-pose rest while Anna's rest is an A-pose, so each bone is turned to point the same way in world space as its Mixamo twin, keeping only Anna's bone roll.
- Root motion is removed: the hips' horizontal drift over the clip is subtracted, so walk and run play in place.
- The turn clips are not used yet.

## Conventions for Godot

- **Cameras** are named `Cam_<web scene id>`, for example `Cam_room_bed_view` for the alarm-ringing and alarm-muted states, and `Cam_room_desk_view`.
- **Hitboxes** end in `-colonly`, which makes Godot import them as a `StaticBody3D` with collision only, ready for mouse-pick raycasts. Current ones: `AlarmClock_Hitbox`, `Desk_Drawer_Hitbox`, `Schedule_Hitbox`, `Door_Hitbox`.
- **Animations** (glTF actions):
  - `AlarmClock_Ring` is a 24-frame shake on `AlarmClock_Rig`. Set it to loop in the import settings.
  - `Desk_DrawerOpen` slides `Desk_Drawer` out along +Y.
- **Toggleable pieces**:
  - `AlarmClock_Display` (the emissive 08:00 digits) and `AlarmClock_Glow` (a point light) can be dimmed for the muted state.
  - `DeskLamp_Light` sits under `DeskLamp`.
- **Materials** are plain Principled BSDF (colour, roughness, emission), so they convert 1:1 to `StandardMaterial3D`. There are no textures yet.
- **World and sky** colour are not part of glTF. Recreate them in Godot with a `WorldEnvironment`, using a dusk blue of roughly `#4c5486`.
