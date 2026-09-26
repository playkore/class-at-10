# Godot 3D prototype

Anna walking around the bedroom in third person. Godot 4.6.

```bash
/Applications/Godot.app/Contents/MacOS/Godot --path godot
```

Or open `godot/project.godot` in the editor and press F5.

Controls: WASD or arrows to walk (relative to the camera), Shift to run, Space to jump, mouse to orbit the camera, wheel to zoom, Esc to free the mouse, click to grab it again. Near the desk, E sits down at it; E again stands back up. By the bed, E undresses Anna or dresses her again. By the wardrobe, E switches between her outfits (`OUTFITS` in `scripts/main.gd`).

- `scenes/main.tscn`: the bedroom, the player and a `WorldEnvironment`. `scripts/main.gd` adds trimesh collision to every room mesh (except the `Outside` backdrop), switches off the cameras baked into the .glb and scales its lights down.
- `scenes/player.tscn`: a `CharacterBody3D` with a capsule, the Anna model, and a `SpringArm3D` camera that pulls in when a wall is behind it. `scripts/player.gd` holds the controller. When the camera gets closer than 0.4 m, Anna is hidden so the camera doesn't show her from the inside.
- `scenes/desk_view.tscn`: the close-up desk view, seated on the chair. `main.gd` adds it as a child when E is pressed within 0.6 m of the desk (pausing the player) and frees it on the next E. The mouse is free: the view leans towards the cursor, and a click raycasts against the `Area3D`s under `Items` (physics layer 3, `desk_items`). `_pick_up()` in `scripts/desk_view.gd` is a placeholder that just shows the item's `label` metadata.
- Cartoon look: `scripts/toon.gd` swaps every imported material for `shaders/toon.gdshader` (cel bands, toon highlight, rim light; shadow colour comes from the environment's warm ambient). `shaders/outline.gdshader` is a full-screen quad under the camera that draws ink lines from depth and normal jumps. Tweak line colour/width/thresholds on the `Outline` node's material in `player.tscn`, and band/rim settings in `toon.gdshader`.
- `assets/*.glb` are copies of `blender/export/bedroom.glb` and `blender/export/anna_animated.glb`. Re-copy them after rebuilding in Blender.

Dev hooks: `--path godot -- --screenshot=out.png` saves a frame after start-up and quits; add `--desk` to start in the desk view, `--undressed` to start undressed, or `--outfit=street` to start in another outfit.
