extends Node3D
## Close-up, first-person view of the desk. The mouse is free: moving it leans
## the view a little towards the cursor, hovering an item names it, and a click
## "picks it up" (placeholder for now). main.gd adds and removes this scene.

signal item_picked(item: Area3D)

## Collision layer 3, "desk_items" (see project.godot).
const ITEM_MASK := 1 << 2
const LOOK_YAW := deg_to_rad(22.0)
const LOOK_PITCH := deg_to_rad(28.0)
const LOOK_SMOOTH := 6.0

## Seated on the chair, eyes a bit above the desk top, looking at the clutter.
@export var eye := Vector3(2.55, 1.18, -0.95)
@export var look_target := Vector3(2.45, 0.95, -0.1)

var _base: Basis
var _look := Vector2.ZERO
var _hovered: Area3D

@onready var camera: Camera3D = $Camera
@onready var hover_label: Label = $UI/Hover
@onready var message_label: Label = $UI/Message
@onready var message_timer: Timer = $UI/MessageTimer


func _ready() -> void:
	camera.look_at_from_position(eye, look_target)
	_base = camera.basis
	camera.make_current()
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	hover_label.text = ""
	message_label.text = ""
	message_timer.timeout.connect(func(): message_label.text = "")


func _process(delta: float) -> void:
	# Cursor position in -1..1 from the screen centre steers the view.
	var vp := get_viewport()
	var size := vp.get_visible_rect().size
	var m := (vp.get_mouse_position() / size) * 2.0 - Vector2.ONE
	m = m.clamp(-Vector2.ONE, Vector2.ONE)
	_look = _look.lerp(m, clampf(LOOK_SMOOTH * delta, 0.0, 1.0))
	camera.basis = _base * Basis.from_euler(Vector3(-_look.y * LOOK_PITCH, -_look.x * LOOK_YAW, 0))


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseMotion:
		_set_hovered(_item_at(event.position))
	elif event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		var item := _item_at(event.position)
		if item:
			_pick_up(item)


func _item_at(screen_pos: Vector2) -> Area3D:
	var from := camera.project_ray_origin(screen_pos)
	var query := PhysicsRayQueryParameters3D.create(from, from + camera.project_ray_normal(screen_pos) * 5.0, ITEM_MASK)
	query.collide_with_areas = true
	query.collide_with_bodies = false
	var hit := get_world_3d().direct_space_state.intersect_ray(query)
	return hit.collider as Area3D if hit else null


func _set_hovered(item: Area3D) -> void:
	if item == _hovered:
		return
	_hovered = item
	hover_label.text = _label(item) if item else ""
	Input.set_default_cursor_shape(Input.CURSOR_POINTING_HAND if item else Input.CURSOR_ARROW)


## Placeholder: real pick-up (inventory, close-up of the item) comes later.
func _pick_up(item: Area3D) -> void:
	print("Picked up: ", item.name)
	message_label.text = "Picked up: %s" % _label(item)
	message_timer.start()
	item_picked.emit(item)


func _label(item: Area3D) -> String:
	return item.get_meta("label", item.name)


func _exit_tree() -> void:
	Input.set_default_cursor_shape(Input.CURSOR_ARROW)
