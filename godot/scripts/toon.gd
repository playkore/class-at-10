class_name Toon
## Swaps the StandardMaterial3Ds that come out of the .glb imports for the cel
## shader, carrying over colour, texture, alpha cut-off and emission.
## Alpha-blended materials (the window glass) are left alone.

const SHADER := preload("res://shaders/toon.gdshader")

static var _cache := {}


static func apply(root: Node) -> void:
	for node in root.find_children("*", "MeshInstance3D", true, false):
		var mi := node as MeshInstance3D
		for i in mi.mesh.get_surface_count():
			var mat := mi.get_active_material(i)
			if mat is BaseMaterial3D:
				var toon := _convert(mat)
				if toon:
					mi.set_surface_override_material(i, toon)


static func _convert(src: BaseMaterial3D) -> ShaderMaterial:
	if _cache.has(src):
		return _cache[src]
	var alpha_blend := src.transparency in [
		BaseMaterial3D.TRANSPARENCY_ALPHA, BaseMaterial3D.TRANSPARENCY_ALPHA_DEPTH_PRE_PASS]
	if alpha_blend:
		return null
	var m := ShaderMaterial.new()
	m.shader = SHADER
	m.set_shader_parameter("albedo", src.albedo_color)
	if src.albedo_texture:
		m.set_shader_parameter("albedo_texture", src.albedo_texture)
		m.set_shader_parameter("use_texture", true)
	if src.transparency in [BaseMaterial3D.TRANSPARENCY_ALPHA_SCISSOR, BaseMaterial3D.TRANSPARENCY_ALPHA_HASH]:
		m.set_shader_parameter("alpha_cutoff", src.alpha_scissor_threshold)
	if src.emission_enabled:
		m.set_shader_parameter("emission", src.emission)
		m.set_shader_parameter("emission_energy", src.emission_energy_multiplier)
	m.set_shader_parameter("roughness", src.roughness)
	_cache[src] = m
	return m
