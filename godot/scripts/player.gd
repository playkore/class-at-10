extends CharacterBody3D
## Third-person controller: keyboard moves relative to the camera, the mouse
## orbits the camera, and Anna turns to face where she walks.

const WALK_SPEED := 1.5
const RUN_SPEED := 3.2
const ACCEL := 10.0
const TURN_SPEED := 10.0
const MOUSE_SENSITIVITY := 0.0025
const PITCH_MIN := deg_to_rad(-70.0)
const PITCH_MAX := deg_to_rad(40.0)
const ZOOM_MIN := 0.6
const ZOOM_MAX := 3.0
const BLEND := 0.2
## Below this camera distance the camera would sit inside Anna, so she is hidden.
const HIDE_DISTANCE := 0.4

var gravity: float = ProjectSettings.get_setting("physics/3d/default_gravity")
var jumping := false

@onready var model: Node3D = $Model
@onready var pivot: Node3D = $CameraPivot
@onready var spring_arm: SpringArm3D = $CameraPivot/SpringArm
@onready var anim: AnimationPlayer = model.find_children("*", "AnimationPlayer", true, false)[0]


func _ready() -> void:
	_add_input_actions()
	spring_arm.add_excluded_object(get_rid())
	for loop_name in ["idle", "walk", "run", "strafe_left", "strafe_right"]:
		if anim.has_animation(loop_name):
			anim.get_animation(loop_name).loop_mode = Animation.LOOP_LINEAR
	anim.animation_finished.connect(_on_animation_finished)
	anim.play("idle")
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
		pivot.rotation.y -= event.relative.x * MOUSE_SENSITIVITY
		pivot.rotation.x = clampf(pivot.rotation.x - event.relative.y * MOUSE_SENSITIVITY, PITCH_MIN, PITCH_MAX)
	elif event is InputEventMouseButton and event.pressed:
		match event.button_index:
			MOUSE_BUTTON_WHEEL_UP:
				spring_arm.spring_length = maxf(ZOOM_MIN, spring_arm.spring_length - 0.15)
			MOUSE_BUTTON_WHEEL_DOWN:
				spring_arm.spring_length = minf(ZOOM_MAX, spring_arm.spring_length + 0.15)
			MOUSE_BUTTON_LEFT:
				Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	elif event.is_action_pressed("ui_cancel"):
		Input.mouse_mode = Input.MOUSE_MODE_VISIBLE


func _process(_delta: float) -> void:
	model.visible = spring_arm.get_hit_length() > HIDE_DISTANCE


func _physics_process(delta: float) -> void:
	if not is_on_floor():
		velocity.y -= gravity * delta

	var input := Input.get_vector("move_left", "move_right", "move_forward", "move_back")
	# Camera-relative direction on the floor plane.
	var dir := (Basis(Vector3.UP, pivot.global_rotation.y) * Vector3(input.x, 0, input.y)).normalized()
	var running := Input.is_action_pressed("run")
	var speed := RUN_SPEED if running else WALK_SPEED

	if Input.is_action_just_pressed("jump") and is_on_floor() and not jumping:
		jumping = true
		anim.play("jump", BLEND)
	if jumping:
		dir = Vector3.ZERO  # standing jump: the clip does the leap in place

	var target := dir * speed
	velocity.x = move_toward(velocity.x, target.x, ACCEL * delta * speed)
	velocity.z = move_toward(velocity.z, target.z, ACCEL * delta * speed)
	move_and_slide()

	if dir != Vector3.ZERO:
		# The model faces +Z, so its yaw is atan2(x, z) of the heading.
		var yaw := atan2(dir.x, dir.z)
		model.rotation.y = lerp_angle(model.rotation.y, yaw, TURN_SPEED * delta)

	if not jumping:
		var clip := "idle"
		if dir != Vector3.ZERO:
			clip = "run" if running else "walk"
		if anim.current_animation != clip:
			anim.play(clip, BLEND)


func _on_animation_finished(clip: StringName) -> void:
	if clip == "jump":
		jumping = false


func _add_input_actions() -> void:
	var keys := {
		"move_forward": [KEY_W, KEY_UP],
		"move_back": [KEY_S, KEY_DOWN],
		"move_left": [KEY_A, KEY_LEFT],
		"move_right": [KEY_D, KEY_RIGHT],
		"run": [KEY_SHIFT],
		"jump": [KEY_SPACE],
	}
	for action in keys:
		if InputMap.has_action(action):
			continue
		InputMap.add_action(action)
		for key in keys[action]:
			var ev := InputEventKey.new()
			ev.physical_keycode = key
			InputMap.action_add_event(action, ev)
