extends Node3D
## Sets up the imported bedroom for walking: collision on every mesh, and the
## camera baked into the .glb switched off so the player's camera is used, and
## the lights tamed (glTF export turns Blender watts into huge candela values).
## Every imported material is swapped for the cel shader (see toon.gd).
##
## Walking up to the desk and pressing E swaps to the close-up desk view
## (desk_view.tscn); E again returns to walking. By the bed, E takes Anna's
## clothes off, and E again puts them back on.
##
## Dev hooks: `godot --path godot -- --screenshot=/path/out.png` saves a frame and quits;
## `-- --desk` starts in the desk view, `-- --undressed` without her clothes.

const LIGHT_SCALE := 900.0
const DESK_LAMP_DIM := 0.35
const DESK_VIEW := preload("res://scenes/desk_view.tscn")
## Desk top footprint on the floor plane (x, z), and how close counts as "at the desk".
const DESK_RECT := Rect2(1.9, -0.66, 1.3, 0.66)
const DESK_REACH := 0.6
## Bed frame footprint (x, z) and reach, as for the desk.
const BED_RECT := Rect2(2.14, -3.30, 1.04, 2.04)
const BED_REACH := 0.5
## Anna's garments, and the skin under them that is only exported for undressing.
const CLOTHES := ["Anna_TankTop", "Anna_Pants", "Anna_Socks"]
const COVERED_SKIN := "Anna_BodyCovered"

var desk_view: Node3D
var undressed := false

@onready var bedroom: Node3D = $Bedroom
@onready var player: CharacterBody3D = $Player
@onready var help: Label = $Help
@onready var prompt: Label = $Prompt


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
	_set_undressed(false)
	if not InputMap.has_action("interact"):
		InputMap.add_action("interact")
		var ev := InputEventKey.new()
		ev.physical_keycode = KEY_E
		InputMap.action_add_event("interact", ev)

	for arg in OS.get_cmdline_user_args():
		if arg == "--desk":
			_enter_desk()
		elif arg == "--undressed":
			_set_undressed(true)
		elif arg.begins_with("--screenshot="):
			_screenshot(arg.trim_prefix("--screenshot="))


func _process(_delta: float) -> void:
	prompt.visible = desk_view == null and (_near_desk() or _near_bed())
	if _near_desk():
		prompt.text = "E: look at the desk"
	elif _near_bed():
		prompt.text = "E: get dressed" if undressed else "E: undress"


func _unhandled_input(event: InputEvent) -> void:
	if not event.is_action_pressed("interact"):
		return
	if desk_view:
		_leave_desk()
	elif _near_desk():
		_enter_desk()
	elif _near_bed():
		_set_undressed(not undressed)


func _near_desk() -> bool:
	return _near(DESK_RECT, DESK_REACH)


func _near_bed() -> bool:
	return _near(BED_RECT, BED_REACH)


func _near(rect: Rect2, reach: float) -> bool:
	var p := Vector2(player.global_position.x, player.global_position.z)
	return p.distance_to(p.clamp(rect.position, rect.end)) < reach


func _set_undressed(value: bool) -> void:
	undressed = value
	var model: Node3D = $Player/Model
	for garment in CLOTHES:
		model.find_child(garment, true, false).visible = not undressed
	model.find_child(COVERED_SKIN, true, false).visible = undressed


func _enter_desk() -> void:
	desk_view = DESK_VIEW.instantiate()
	add_child(desk_view)
	player.process_mode = Node.PROCESS_MODE_DISABLED
	player.velocity = Vector3.ZERO
	$Player/Model.visible = false  # she would stand in the close-up's shot
	help.visible = false


func _leave_desk() -> void:
	desk_view.queue_free()
	desk_view = null
	player.process_mode = Node.PROCESS_MODE_INHERIT
	$Player/Model.visible = true
	$Player/CameraPivot/SpringArm/Camera.make_current()
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	help.visible = true


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
