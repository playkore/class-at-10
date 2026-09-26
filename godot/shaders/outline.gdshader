shader_type spatial;
// Full-screen post pass: draws ink lines where depth or normals jump.
// Lives on a 2x2 QuadMesh parented to the camera (see player.tscn).
render_mode unshaded, fog_disabled, depth_test_disabled, depth_draw_never, cull_disabled;

uniform sampler2D screen_tex : hint_screen_texture, filter_linear;
uniform sampler2D depth_tex : hint_depth_texture, filter_nearest;
uniform sampler2D normal_tex : hint_normal_roughness_texture, filter_nearest;

uniform vec3 line_color : source_color = vec3(0.23, 0.13, 0.09);
uniform float line_opacity : hint_range(0.0, 1.0) = 0.8;
// Line width in pixels at 720p; scales with resolution.
uniform float thickness = 1.2;
// Relative depth jump (fraction of distance) that counts as an edge.
uniform float depth_threshold = 0.08;
// 1 - cos(angle) between neighbouring normals that counts as an edge.
uniform float normal_threshold = 0.5;
// Lines fade out with distance so far-away clutter stays clean.
uniform float fade_start = 4.0;
uniform float fade_end = 12.0;

void vertex() {
	POSITION = vec4(VERTEX.xy, 1.0, 1.0);
}

float linear_depth(vec2 uv, mat4 inv_proj) {
	float d = texture(depth_tex, uv).r;
	vec4 v = inv_proj * vec4(uv * 2.0 - 1.0, d, 1.0);
	return -v.z / v.w;
}

vec3 view_normal(vec2 uv) {
	return normalize(texture(normal_tex, uv).xyz * 2.0 - 1.0);
}

void fragment() {
	vec2 px = thickness * VIEWPORT_SIZE.y / 720.0 / VIEWPORT_SIZE;
	vec2 offs[4] = { vec2(px.x, 0.0), vec2(-px.x, 0.0), vec2(0.0, px.y), vec2(0.0, -px.y) };

	float d0 = linear_depth(SCREEN_UV, INV_PROJECTION_MATRIX);
	vec3 n0 = view_normal(SCREEN_UV);
	float depth_edge = 0.0;
	float normal_edge = 0.0;
	for (int i = 0; i < 4; i++) {
		vec2 uv = SCREEN_UV + offs[i];
		float d = linear_depth(uv, INV_PROJECTION_MATRIX);
		// Only the nearer side draws, so silhouettes don't double up.
		depth_edge = max(depth_edge, (d - d0) / d0);
		normal_edge = max(normal_edge, 1.0 - dot(n0, view_normal(uv)));
	}
	float edge = max(
		smoothstep(depth_threshold, depth_threshold * 2.0, depth_edge),
		smoothstep(normal_threshold, normal_threshold * 1.5, normal_edge));
	edge *= 1.0 - smoothstep(fade_start, fade_end, d0);

	vec3 scene = texture(screen_tex, SCREEN_UV).rgb;
	ALBEDO = mix(scene, line_color * scene * 0.6 + line_color * 0.4, edge * line_opacity);
}
