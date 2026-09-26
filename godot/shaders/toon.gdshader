shader_type spatial;
// Cel shading: a crisp terminator plus a soft mid band instead of smooth
// Lambert, a small cartoon highlight and a rim light. Shadow colour comes from
// the (warm) ambient light in the WorldEnvironment.
render_mode cull_disabled, depth_draw_opaque;

uniform vec4 albedo : source_color = vec4(1.0);
uniform sampler2D albedo_texture : source_color, filter_linear_mipmap, repeat_enable;
uniform bool use_texture = false;
uniform float alpha_cutoff : hint_range(0.0, 1.0) = 0.0;
uniform vec3 emission : source_color = vec3(0.0);
uniform float emission_energy = 1.0;
uniform float roughness : hint_range(0.0, 1.0) = 0.8;

// Lit side: the band edge and how soft it is.
uniform float terminator : hint_range(0.0, 1.0) = 0.05;
uniform float mid_band : hint_range(0.0, 1.0) = 0.45;
uniform float band_softness : hint_range(0.0, 0.5) = 0.04;
// How bright the mid band is relative to full light.
uniform float mid_level : hint_range(0.0, 1.0) = 0.7;
uniform vec3 rim_color : source_color = vec3(1.0, 0.92, 0.78);
uniform float rim_strength : hint_range(0.0, 1.0) = 0.35;
uniform float specular_strength : hint_range(0.0, 1.0) = 0.4;
// Slight saturation boost for the storybook look.
uniform float saturation : hint_range(0.0, 2.0) = 1.1;

void fragment() {
	vec4 c = albedo;
	if (use_texture) {
		c *= texture(albedo_texture, UV);
	}
	float grey = dot(c.rgb, vec3(0.299, 0.587, 0.114));
	ALBEDO = clamp(mix(vec3(grey), c.rgb, saturation), 0.0, 1.0);
	if (alpha_cutoff > 0.0) {
		ALPHA = c.a;
		ALPHA_SCISSOR_THRESHOLD = alpha_cutoff;
	}
	EMISSION = emission * emission_energy;
	ROUGHNESS = roughness;
	SPECULAR = 0.0;  // no PBR reflections; highlights come from light()
}

void light() {
	float ndl = dot(NORMAL, LIGHT);
	float lit = smoothstep(terminator - band_softness, terminator + band_softness, ndl);
	float full = smoothstep(mid_band - band_softness, mid_band + band_softness, ndl);
	float ramp = lit * mix(mid_level, 1.0, full);
	// ATTENUATION holds the (smooth) distance falloff and the shadow.
	vec3 light_col = LIGHT_COLOR * ATTENUATION / PI;
	DIFFUSE_LIGHT += light_col * ramp;

	float rim = smoothstep(0.62, 0.7, 1.0 - dot(NORMAL, VIEW)) * lit;
	DIFFUSE_LIGHT += light_col * rim_color * rim * rim_strength;

	vec3 h = normalize(LIGHT + VIEW);
	float gloss = mix(0.995, 0.93, roughness);
	float spec = smoothstep(gloss - 0.005, gloss + 0.005, dot(NORMAL, h)) * lit;
	SPECULAR_LIGHT += light_col * spec * specular_strength * (1.0 - roughness);
}
