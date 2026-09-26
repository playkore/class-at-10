extends Node3D
## Sets up the imported bedroom for walking: collision on every mesh, and the
## camera baked into the .glb switched off so the player's camera is used, and
## the lights tamed (glTF export turns Blender watts into huge candela values).
## Every imported material is swapped for the cel shader (see toon.gd).
##
## Dev hook: `godot --path godot -- --screenshot=/path/out.png` saves a frame and quits.

const LIGHT_SCALE := 900.0
const DESK_LAMP_DIM := 0.35

@onready var bedroom: Node3D = $Bedroom


func _ready() -> void:
	_add_collision(bedroom)
	Toon.apply(bedroom)
	Toon.apply($Player/Model)
	for cam in bedroom.find_children("*", "Camera3D", true, false):
		(cam as Camera3D).current = false
	for light in bedroom.find_children("*", "OmniLight3D", true, false):
		light.light_energy /= LIGHT_SCALE
		light.omni_range = 5.0
		if light.name.begins_with("DeskLamp"):
			# Sits a few cm above the desk, so it blows the desktop out to white.
			light.light_energy *= DESK_LAMP_DIM
		light.shadow_enabled = true
	$Player/CameraPivot/SpringArm/Camera.make_current()

	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--screenshot="):
			_screenshot(arg.trim_prefix("--screenshot="))


func _add_collision(node: Node) -> void:
	if node.name == "Outside":  # the backdrop beyond the window
		return
	if node is MeshInstance3D:
		(node as MeshInstance3D).create_trimesh_collision()
	for child in node.get_children():
		_add_collision(child)


func _screenshot(path: String) -> void:
	for i in 30:
		await get_tree().process_frame
	get_viewport().get_texture().get_image().save_png(path)
	get_tree().quit()
