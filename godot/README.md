# Godot 3D prototype

Anna walking around the bedroom in third person. Godot 4.6.

```bash
/Applications/Godot.app/Contents/MacOS/Godot --path godot
```

Or open `godot/project.godot` in the editor and press F5.

Controls: WASD or arrows to walk (relative to the camera), Shift to run, Space to jump, mouse to orbit the camera, wheel to zoom, Esc to free the mouse, click to grab it again.

- `scenes/main.tscn`: the bedroom, the player and a `WorldEnvironment`. `scripts/main.gd` adds trimesh collision to every room mesh (except the `Outside` backdrop), switches off the cameras baked into the .glb and scales its lights down.
- `scenes/player.tscn`: a `CharacterBody3D` with a capsule, the Anna model, and a `SpringArm3D` camera that pulls in when a wall is behind it. `scripts/player.gd` holds the controller. When the camera gets closer than 0.4 m, Anna is hidden so the camera doesn't show her from the inside.
- Cartoon look: `scripts/toon.gd` swaps every imported material for `shaders/toon.gdshader` (cel bands, toon highlight, rim light; shadow colour comes from the environment's warm ambient). `shaders/outline.gdshader` is a full-screen quad under the camera that draws ink lines from depth and normal jumps. Tweak line colour/width/thresholds on the `Outline` node's material in `player.tscn`, and band/rim settings in `toon.gdshader`.
- `assets/*.glb` are copies of `blender/export/bedroom.glb` and `blender/export/anna_animated.glb`. Re-copy them after rebuilding in Blender.

Dev hook: `--path godot -- --screenshot=out.png` saves a frame after start-up and quits.
