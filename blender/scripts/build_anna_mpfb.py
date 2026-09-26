"""Build Anna, the protagonist, with MPFB (MakeHuman Plugin For Blender).

An alternative to build_anna.py: a MakeHuman body with a game-engine rig,
fitted clothes and hair from the MakeHuman asset packs, recoloured to match
doc/proto.png.

Needs the MPFB extension and these asset packs installed in MPFB:
makehuman_system_assets, hair01, shirts02, shirts03, pants01, underwear04
(https://static.makehumancommunity.org/assets/assetpacks/index.html).

Run headless from the repo root:
    /Applications/Blender.app/Contents/MacOS/Blender -b -P blender/scripts/build_anna_mpfb.py
    ... -- --render <out_dir>   # also render a preview PNG from every camera
    ... -- --no-export          # skip the .glb and Mixamo .fbx exports
    ... -- --proxy <name>       # body proxy mesh (default female1605; female_generic is ~9x denser)
    ... -- --cardigan           # add the buttoned knit cardigan over the red top

Metres, Z up, feet on z = 0, facing -Y. Her left side is +X.
"""

import importlib
import sys
from pathlib import Path

import addon_utils
import bmesh
import bpy
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

ROOT = Path(__file__).resolve().parent.parent
BLEND_PATH = ROOT / "anna_mpfb.blend"
GLB_PATH = ROOT / "export" / "anna_mpfb.glb"
MIXAMO_PATH = ROOT / "export" / "anna_mixamo_upload.fbx"
TEXTURE_DIR = ROOT / "textures" / "anna_mpfb"

ARGS = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []

HEIGHT = 1.68
TEXTURE_SIZE = 1024  # asset textures are up to 4K; cap them to keep the .glb small
PROXY = ARGS[ARGS.index("--proxy") + 1] if "--proxy" in ARGS else "female1605"
CARDIGAN = "--cardigan" in ARGS

# MakeHuman macro sliders, 0..1. Age 0.1875 = 11 years, 0.5 = 25, so 0.37 is about 19.
PHENOTYPE = {
    "gender": 0.0,
    "age": 0.37,
    "muscle": 0.35,
    "weight": 0.0,  # slim; 0.5 is average
    "proportions": 0.6,
    "height": 0.5,  # overall size is fixed afterwards by scaling to HEIGHT
    "cupsize": 0.5,
    "firmness": 0.5,
    "race": {"asian": 0.0, "caucasian": 1.0, "african": 0.0},
}

# Asset file names, found anywhere in MPFB's asset roots.
ASSETS = {
    "skin": "young_caucasian_female.mhmat",
    "eyes": "low-poly.mhclo",
    "eye_texture": "grey_eye.png",
    "eyebrows": "eyebrow001.mhclo",
    "eyelashes": "eyelashes01.mhclo",
    "hair": "cortu_short_messy_hair.mhclo",
}

# Outfits, each inner to outer. All of them are fitted and exported; Godot shows
# one at a time. The first is what she wears by default.
OUTFITS = {
    "home": ["mindfront_tank_top_01.mhclo", "toigo_harem_pants.mhclo", "toigo_leg_warmer_socks.mhclo"],
    "street": ["elvs_lara_tank1.mhclo", "cortu_cargo_pants.mhclo", "joepal_crude_low_socks.mhclo"],
}

# Final object names, keyed by the MPFB asset name.
NAMES = {
    PROXY: "Anna_Body",
    "low-poly": "Anna_Eyes",
    "eyebrow001": "Anna_Eyebrows",
    "eyelashes01": "Anna_Eyelashes",
    "cortu_short_messy_hair": "Anna_Hair",
    "mindfront_tank_top_01": "Anna_TankTop",
    "mindfront_lusekofta": "Anna_Cardigan",
    "toigo_harem_pants": "Anna_Pants",
    "toigo_leg_warmer_socks": "Anna_Socks",
    "elvs_lara_tank1": "Anna_BlackTop",
    "cortu_cargo_pants": "Anna_Jeans",
    "joepal_crude_low_socks": "Anna_BlackSocks",
}

# Texture recolouring: the asset's luminance, stretched to 0..1, is mapped onto
# a gradient of sRGB stops. This keeps the knit, folds and strands but swaps the
# palette. Stops are (position, hex).
RECOLOR = {
    "Anna_TankTop": [(0.0, "#6e1419"), (0.5, "#a3252c"), (1.0, "#d24a4f")],
    "Anna_Cardigan": [(0.0, "#e4dac4"), (0.35, "#d2c4a6"), (0.6, "#8a3b33"), (1.0, "#2c3550")],
    "Anna_Pants": [(0.0, "#5f6571"), (1.0, "#737985")],  # low contrast hides the floral print
    "Anna_Socks": [(0.0, "#a39c8e"), (1.0, "#ece6d8")],
    "Anna_BlackTop": [(0.0, "#0d0d10"), (1.0, "#3a3a42")],
    "Anna_Jeans": [(0.0, "#1c2940"), (0.5, "#3a5478"), (1.0, "#7390b5")],  # baggy cargo cut, denim blue
    "Anna_BlackSocks": [(0.0, "#0d0d10"), (1.0, "#34343a")],
    "Anna_Hair": [(0.0, "#6f604a"), (0.5, "#b9a47e"), (1.0, "#e9dfc4")],  # ash blonde
    "Anna_Eyebrows": [(0.0, "#6e5231"), (1.0, "#a88557")],
}

# Skin smoothing: surface-blur passes as (radius px, threshold). A neighbour only
# counts if it differs from the centre pixel by less than the threshold, so pores,
# fine hair and red blotches melt away while lips, nipples and ears stay crisp.
SMOOTH = {"Anna_Body": [(6, 0.12), (8, 0.1)]}

# Decimate ratios for dense clothes; applied on export, before skinning.
DECIMATE = {"Anna_Pants": 0.35, "Anna_Socks": 0.3}

# Garments whose asset has no delete group, so the body under them isn't masked:
# fit_delete_groups starts their group from every body vertex in their height range.
SEED_DELETE = {"cortu_cargo_pants"}

# Meshes whose texture alpha cuts out strands.
ALPHA_CLIP = {"Anna_Hair", "Anna_Eyebrows", "Anna_Eyelashes"}


# --------------------------------------------------------------------------
# MPFB
# --------------------------------------------------------------------------

def mpfb_services():
    for mod in addon_utils.modules():
        if mod.__name__.endswith(".mpfb") or mod.__name__ == "mpfb":
            addon_utils.enable(mod.__name__, default_set=True)
            return importlib.import_module(mod.__name__ + ".services")
    sys.exit("MPFB is not installed: get it from https://extensions.blender.org/add-ons/mpfb/")


def build_human(svc, scale):
    human_info = {
        "name": "Anna",
        "phenotype": PHENOTYPE,
        "rig": "mixamo",  # mixamorig:* bone names, so Mixamo animations map 1:1
        "eyes": ASSETS["eyes"],
        "eyebrows": ASSETS["eyebrows"],
        "eyelashes": ASSETS["eyelashes"],
        "teeth": "",
        "tongue": "",
        "hair": ASSETS["hair"],
        "proxy": PROXY + ".proxy",
        "targets": [],
        "clothes": [c for outfit in OUTFITS.values() for c in outfit]
        + (["mindfront_lusekofta.mhclo"] if CARDIGAN else []),
        "skin_mhmat": ASSETS["skin"],
        "skin_material_type": "MAKESKIN",
        "eyes_material_type": "MAKESKIN",
        "skin_material_settings": {},
        "eyes_material_settings": {},
        "expressions": [],
    }
    for key in ("eyes", "eyebrows", "eyelashes", "hair"):
        if svc.AssetService.find_asset_absolute_path(human_info[key], key) is None:
            sys.exit(f"Missing MPFB asset {human_info[key]}: install the asset packs listed at the top of this script")
    settings = svc.HumanService.get_default_deserialization_settings()
    settings["subdiv_levels"] = 0
    settings["scale"] = scale
    return svc.HumanService.deserialize_from_dict(human_info, settings)


def body_top(body):
    """Highest point of the evaluated body mesh, in world space."""
    depsgraph = bpy.context.evaluated_depsgraph_get()
    obj = body.evaluated_get(depsgraph)
    mesh = obj.to_mesh()
    top = max((obj.matrix_world @ v.co).z for v in mesh.vertices)
    obj.to_mesh_clear()
    return top


def find_body(rig):
    return next(o for o in rig.children if o.name.endswith("." + PROXY))


def world_z(obj):
    """Z of every vertex of the evaluated (fitted, rest pose) mesh."""
    depsgraph = bpy.context.evaluated_depsgraph_get()
    ev = obj.evaluated_get(depsgraph)
    mesh = ev.to_mesh()
    zs = [(ev.matrix_world @ v.co).z for v in mesh.vertices]
    ev.to_mesh_clear()
    return zs


def trim(obj, keep):
    """Delete the vertices of obj whose world Z fails keep(z)."""
    zs = world_z(obj)
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bm.verts.ensure_lookup_table()
    doomed = [bm.verts[i] for i, z in enumerate(zs) if not keep(z)]
    bmesh.ops.delete(bm, geom=doomed, context="VERTS")
    bm.to_mesh(obj.data)
    bm.free()


def trim_hidden_layers():
    """Cut away the parts of inner layers that poke through outer ones."""
    for socks, pants, top in (("Anna_Socks", "Anna_Pants", None), ("Anna_BlackSocks", "Anna_Jeans", "Anna_BlackTop")):
        pants_cuff = min(world_z(bpy.data.objects[pants]))
        trim(bpy.data.objects[socks], lambda z: z < pants_cuff + 0.06)
        if top:
            top_hem = min(world_z(bpy.data.objects[top]))
            trim(bpy.data.objects[pants], lambda z: z < top_hem + 0.03)
    if CARDIGAN:
        cardigan_hem = min(world_z(bpy.data.objects["Anna_Cardigan"]))
        # The cardigan is buttoned, so only the tank's neckline shows.
        trim(bpy.data.objects["Anna_TankTop"], lambda z: z > cardigan_hem + 0.18)
        trim(bpy.data.objects["Anna_Pants"], lambda z: z < cardigan_hem + 0.01)
    else:
        tank_hem = min(world_z(bpy.data.objects["Anna_TankTop"]))
        trim(bpy.data.objects["Anna_Pants"], lambda z: z < tank_hem + 0.03)


def fit_delete_groups(body, reach=0.15):
    """Only hide the skin a garment really covers.

    Each garment's `Delete.<asset>` group masks the body under it (SEED_DELETE
    garments get one here). The Mask
    modifier drops every face touching a masked vertex, and the proxy body is
    coarse, so the skin can stop centimetres short of the garment's edge: with
    the tank top that leaves a see-through gap above the back neckline.

    So a body vertex stays in the group only if a ray along its normal hits the
    garment within `reach` metres, and then the group is shrunk by one ring of
    edge neighbours, so the faces across the garment's edge are kept.
    """
    depsgraph = bpy.context.evaluated_depsgraph_get()
    for asset in SEED_DELETE:
        zs = world_z(bpy.data.objects[NAMES[asset]])
        group = body.vertex_groups.get("Delete." + asset) or body.vertex_groups.new(name="Delete." + asset)
        seed = [v.index for v in body.data.vertices if min(zs) <= (body.matrix_world @ v.co).z <= max(zs)]
        group.add(seed, 1.0, "REPLACE")
    for mod in body.modifiers:
        if mod.type != "MASK" or not mod.vertex_group.startswith("Delete."):
            continue
        garment = bpy.data.objects.get(NAMES.get(mod.vertex_group[len("Delete.") :], ""))
        group = body.vertex_groups.get(mod.vertex_group)
        if garment is None or group is None:
            continue
        ev = garment.evaluated_get(depsgraph)
        mesh = ev.to_mesh()
        bvh = BVHTree.FromPolygons(
            [ev.matrix_world @ v.co for v in mesh.vertices], [p.vertices for p in mesh.polygons]
        )
        ev.to_mesh_clear()
        normal_mat = body.matrix_world.to_3x3().inverted().transposed()
        uncovered = []
        for v in body.data.vertices:
            if not any(g.group == group.index and g.weight > 0.5 for g in v.groups):
                continue
            co = body.matrix_world @ v.co
            n = (normal_mat @ v.normal).normalized()
            if bvh.ray_cast(co - n * 0.005, n, reach)[0] is None:
                uncovered.append(v.index)
        group.remove(uncovered)
        masked = {
            v.index for v in body.data.vertices
            if any(g.group == group.index and g.weight > 0.5 for g in v.groups)
        }
        edge = set()
        for e in body.data.edges:
            a, b = e.vertices
            if (a in masked) != (b in masked):
                edge.add(a if a in masked else b)
        group.remove(list(edge))
        print(f"{group.name}: {len(uncovered)} uncovered and {len(edge)} edge body vertices shown again")


# --------------------------------------------------------------------------
# Materials
# --------------------------------------------------------------------------

def hex_to_srgb(hex_color):
    hex_color = hex_color.lstrip("#")
    return np.array([int(hex_color[i : i + 2], 16) / 255 for i in (0, 2, 4)])


def hex_to_linear(hex_color):
    c = hex_to_srgb(hex_color)
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def recolor_image(image, stops, name):
    """Map the image's luminance onto a gradient, as a new image."""
    w, h = image.size
    px = np.empty(w * h * 4, dtype=np.float32)
    image.pixels.foreach_get(px)
    px = px.reshape(-1, 4)
    alpha = px[:, 3]
    lum = px[:, :3] @ np.array([0.2126, 0.7152, 0.0722])
    visible = lum[alpha > 0.5] if (alpha > 0.5).any() else lum
    lo, hi = np.percentile(visible, [2, 98])
    t = np.clip((lum - lo) / max(hi - lo, 1e-4), 0, 1)
    positions = [p for p, _ in stops]
    colors = np.array([hex_to_srgb(c) for _, c in stops])  # 8-bit image pixels are sRGB
    rgb = np.stack([np.interp(t, positions, colors[:, i]) for i in range(3)], axis=1)
    out = np.concatenate([rgb, alpha[:, None]], axis=1).astype(np.float32)

    new = bpy.data.images.new(name, w, h, alpha=True, float_buffer=False)
    new.pixels.foreach_set(out.ravel())
    return new


def smooth_image(image, passes):
    """Edge-preserving blur of image's pixels, in place."""
    w, h = image.size
    px = np.empty(w * h * 4, dtype=np.float32)
    image.pixels.foreach_get(px)
    px = px.reshape(h, w, 4)
    rgb = px[..., :3]
    for r, threshold in passes:
        pad = np.pad(rgb, ((r, r), (r, r), (0, 0)), mode="edge")
        acc = np.zeros_like(rgb)
        weights = np.zeros((h, w, 1), dtype=np.float32)
        for dy in range(-r, r + 1):
            for dx in range(-r, r + 1):
                if dx * dx + dy * dy > r * r:
                    continue
                n = pad[r + dy : r + dy + h, r + dx : r + dx + w]
                wt = np.clip(1 - np.abs(n - rgb).max(axis=2, keepdims=True) / threshold, 0, None)
                acc += n * wt
                weights += wt
        rgb = acc / weights
    px[..., :3] = rgb
    image.pixels.foreach_set(px.ravel())


def save_texture(image, name):
    """Copy image into TEXTURE_DIR as <name>.png, capped at TEXTURE_SIZE."""
    # Copying a generated (recoloured) image loses its pixels, so edit those in place.
    copy = image.copy() if image.source == "FILE" else image
    copy.name = name
    w, h = copy.size
    if max(w, h) > TEXTURE_SIZE:
        k = TEXTURE_SIZE / max(w, h)
        copy.scale(max(1, round(w * k)), max(1, round(h * k)))
    if name in SMOOTH:
        smooth_image(copy, SMOOTH[name])  # after the size cap, to keep it fast
    TEXTURE_DIR.mkdir(parents=True, exist_ok=True)
    copy.filepath_raw = str(TEXTURE_DIR / f"{name}.png")
    copy.file_format = "PNG"
    copy.save()
    # Reload from the PNG, relative to BLEND_PATH, so the .blend stays portable.
    copy.source = "FILE"
    copy.filepath = "//" + (TEXTURE_DIR / f"{name}.png").relative_to(BLEND_PATH.parent).as_posix()
    return copy


def average_color(image):
    """Mean linear RGBA of the image's opaque pixels, for a material's viewport colour."""
    px = np.empty(image.size[0] * image.size[1] * 4, dtype=np.float32)
    image.pixels.foreach_get(px)
    px = px.reshape(-1, 4)
    opaque = px[px[:, 3] > 0.5] if (px[:, 3] > 0.5).any() else px
    c = opaque[:, :3].mean(axis=0)  # 8-bit pixels are sRGB
    return (*np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4), 1.0)


def find_image(mat):
    for node in mat.node_tree.nodes:
        if node.type == "TEX_IMAGE" and node.image and "norm" not in node.image.name.lower():
            return node.image
    return None


def simple_material(name, image, alpha_clip):
    """Image -> Principled BSDF, which glTF exports 1:1."""
    mat = bpy.data.materials.new(name)
    try:
        mat.use_nodes = True
    except AttributeError:
        pass
    nt = mat.node_tree
    bsdf = nt.nodes.get("Principled BSDF")
    bsdf.inputs["Roughness"].default_value = 0.85
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = image
    tex.location = (-400, 200)
    nt.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    if alpha_clip:
        # 1 - (alpha < 0.5): the node pattern the glTF exporter turns into alphaMode MASK
        below = nt.nodes.new("ShaderNodeMath")
        below.operation = "LESS_THAN"
        below.inputs[1].default_value = 0.5
        below.location = (-200, -100)
        invert = nt.nodes.new("ShaderNodeMath")
        invert.operation = "SUBTRACT"
        invert.inputs[0].default_value = 1.0
        invert.location = (-50, -100)
        nt.links.new(tex.outputs["Alpha"], below.inputs[0])
        nt.links.new(below.outputs[0], invert.inputs[1])
        nt.links.new(invert.outputs[0], bsdf.inputs["Alpha"])
        if hasattr(mat, "surface_render_method"):
            mat.surface_render_method = "DITHERED"
    return mat


def restyle_materials(rig, svc):
    eye_png = svc.AssetService.find_asset_absolute_path(ASSETS["eye_texture"], "eyes")
    for obj in rig.children:
        if obj.type != "MESH" or not obj.material_slots or obj.name == "Anna_BaseMesh":
            continue
        image = find_image(obj.material_slots[0].material)
        if obj.name == "Anna_Eyes" and eye_png:
            image = bpy.data.images.load(eye_png)
        if image is None:
            print(f"No texture on {obj.name}, keeping its MPFB material")
            continue
        if obj.name in RECOLOR:
            image = recolor_image(image, RECOLOR[obj.name], obj.name)
        color = average_color(image)
        image = save_texture(image, obj.name)
        mat = simple_material(obj.name, image, obj.name in ALPHA_CLIP)
        mat.diffuse_color = color  # what Solid-mode viewport shows
        obj.data.materials.clear()
        obj.data.materials.append(mat)


# --------------------------------------------------------------------------
# Scene: lights, cameras (same studio as build_anna.py)
# --------------------------------------------------------------------------

def srgb(hex_color):
    return (*hex_to_linear(hex_color), 1.0)


def empty(name, parent=None):
    obj = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(obj)
    obj.empty_display_size = 0.2
    obj.parent = parent
    return obj


def look_at(obj, target):
    direction = Vector(target) - Vector(obj.location)
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def light(name, parent, location, energy, size, color="#ffffff"):
    data = bpy.data.lights.new(name, type="AREA")
    data.energy = energy
    data.size = size
    data.color = srgb(color)[:3]
    obj = bpy.data.objects.new(name, data)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = location
    obj.parent = parent
    look_at(obj, (0, 0, 1.0))
    return obj


def build_studio():
    grp = empty("Studio")
    light("Light_Key", grp, (-2.0, -3.0, 2.6), 160, 2.0, "#fff4e6")
    light("Light_Fill", grp, (2.6, -2.2, 1.4), 60, 2.5, "#e6eeff")
    light("Light_Rim", grp, (0.5, 3.0, 2.4), 140, 1.5)

    world = bpy.data.worlds.new("Studio")
    try:
        world.use_nodes = True
    except AttributeError:
        pass
    bg = world.node_tree.nodes.get("Background")
    bg.inputs["Color"].default_value = srgb("#d8d4cc")
    bg.inputs["Strength"].default_value = 0.6
    bpy.context.scene.world = world

    def cam(name, location, target, ortho=None, lens=50):
        data = bpy.data.cameras.new(name)
        if ortho:
            data.type = "ORTHO"
            data.ortho_scale = ortho
        data.lens = lens
        data.clip_start = 0.05
        obj = bpy.data.objects.new(name, data)
        bpy.context.scene.collection.objects.link(obj)
        obj.location = location
        obj.parent = grp
        look_at(obj, target)
        return obj

    front = cam("Cam_Anna_Front", (0, -6, 0.86), (0, 0, 0.86), ortho=1.9)
    cam("Cam_Anna_Side", (6, 0, 0.86), (0, 0, 0.86), ortho=1.9)
    cam("Cam_Anna_Back", (0, 6, 0.86), (0, 0, 0.86), ortho=1.9)
    cam("Cam_Anna_ThreeQuarter", (-1.6, -2.9, 1.35), (0, 0, 0.88), lens=40)
    cam("Cam_Anna_Face", (-0.25, -0.9, 1.6), (0, 0, 1.57), lens=60)
    bpy.context.scene.camera = front


def setup_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.name = "Anna"
    scene.render.resolution_x = 1000
    scene.render.resolution_y = 1000
    scene.view_settings.view_transform = "Standard"
    for engine in ("BLENDER_EEVEE", "BLENDER_EEVEE_NEXT"):
        try:
            scene.render.engine = engine
            break
        except TypeError:
            continue
    if hasattr(scene, "eevee"):
        scene.eevee.taa_render_samples = 32


def wear(outfit):
    """Render only outfit's clothes, and the body skin they don't cover. None renders every outfit.

    Only render visibility changes, so the exports, which use viewport settings, keep every outfit.
    """
    body = bpy.data.objects["Anna_Body"]
    for garments in OUTFITS.values():
        for mhclo in garments:
            asset = mhclo.removesuffix(".mhclo")
            shown = outfit is None or mhclo in OUTFITS[outfit]
            bpy.data.objects[NAMES[asset]].hide_render = not shown
            mask = body.modifiers.get("Delete." + asset)
            if mask:
                mask.show_render = shown


def render_previews(out_dir):
    scene = bpy.context.scene
    out_dir = Path(out_dir).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)
    for outfit in OUTFITS:
        wear(outfit)
        for cam in (o for o in scene.objects if o.type == "CAMERA"):
            scene.camera = cam
            scene.render.filepath = str(out_dir / f"{cam.name}_{outfit}.png")
            bpy.ops.render.render(write_still=True)
            print(f"Rendered {scene.render.filepath}")
    wear(None)
    scene.camera = bpy.data.objects["Cam_Anna_Front"]


# --------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------

def export_mixamo_doll(rig, basemesh):
    """Write the FBX to upload to Mixamo, like MPFB's "Mixamo reduced doll" button.

    Mixamo gets confused by clothes, hair, eyes, proxies and helper geometry, so
    the doll is only a copy of the rig and the full base mesh with its shape
    keys baked. Run after the .blend is saved: the doll is not kept.
    """
    doll_rig = rig.copy()
    doll_rig.data = rig.data.copy()
    doll_rig.name = "Anna"
    bpy.context.scene.collection.objects.link(doll_rig)
    rig.name = "Anna_Original"
    doll = basemesh.copy()
    doll.data = basemesh.data.copy()
    doll.name = "Anna_Doll"
    bpy.context.scene.collection.objects.link(doll)
    doll.parent = doll_rig
    for mod in list(doll.modifiers):
        if mod.type == "ARMATURE":
            mod.object = doll_rig
        else:
            doll.modifiers.remove(mod)

    bpy.ops.object.select_all(action="DESELECT")
    bpy.context.view_layer.objects.active = doll
    doll.select_set(True)
    bpy.ops.mpfb.delete_helpers()
    bpy.ops.mpfb.bake_shapekeys()

    doll_rig.select_set(True)
    bpy.ops.export_scene.fbx(filepath=str(MIXAMO_PATH), use_selection=True, add_leaf_bones=False)
    print(f"Exported {MIXAMO_PATH} ({len(doll.data.vertices)} vertices)")


def main():
    setup_scene()
    svc = mpfb_services()

    # MPFB sizes the body from the phenotype; build once to measure, then
    # rebuild at the scale that makes her HEIGHT tall.
    basemesh = build_human(svc, 0.1)
    scale = 0.1 * HEIGHT / body_top(find_body(basemesh.parent))
    setup_scene()
    svc = mpfb_services()
    basemesh = build_human(svc, scale)
    rig = basemesh.parent

    basemesh.name = "Anna_BaseMesh"
    for obj in rig.children:
        asset = obj.name.split(".")[-1]
        if asset in NAMES:
            obj.name = NAMES[asset]
            obj.data.name = NAMES[asset]
    for outfit, clothes in OUTFITS.items():
        for mhclo in clothes:
            obj = bpy.data.objects[NAMES[mhclo.removesuffix(".mhclo")]]
            obj["outfit"] = outfit  # build_anna_animated.py splits the skin by outfit
            obj["mpfb_asset"] = mhclo.removesuffix(".mhclo")
    restyle_materials(rig, svc)
    basemesh.data.materials.clear()
    basemesh.data.materials.append(bpy.data.materials["Anna_Body"])
    bpy.data.orphans_purge(do_recursive=True)  # the MPFB materials and their 4K source images
    trim_hidden_layers()
    fit_delete_groups(bpy.data.objects["Anna_Body"])
    for name, ratio in DECIMATE.items():
        obj = bpy.data.objects[name]
        mod = obj.modifiers.new("Decimate", "DECIMATE")
        mod.ratio = ratio
        obj.modifiers.move(len(obj.modifiers) - 1, 0)  # before the Armature modifier
    build_studio()

    body = bpy.data.objects["Anna_Body"]
    print(f"Anna: {body_top(body):.3f} m tall, rig '{rig.name}' with {len(rig.data.bones)} bones")
    export_objs = [rig] + [o for o in rig.children if o is not basemesh]
    depsgraph = bpy.context.evaluated_depsgraph_get()
    tris = 0
    for obj in (o for o in export_objs if o.type == "MESH"):
        mesh = obj.evaluated_get(depsgraph).to_mesh()
        tris += sum(len(p.vertices) - 2 for p in mesh.polygons)
        obj.evaluated_get(depsgraph).to_mesh_clear()
    print(f"Anna: {tris} triangles in the export")

    # Open in Material Preview, so the textures show without switching modes.
    for screen in bpy.data.screens:
        for area in screen.areas:
            if area.type == "VIEW_3D":
                area.spaces[0].shading.type = "MATERIAL"

    BLEND_PATH.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))
    print(f"Saved {BLEND_PATH}")

    if "--no-export" not in ARGS:
        GLB_PATH.parent.mkdir(parents=True, exist_ok=True)
        bpy.ops.object.select_all(action="DESELECT")
        for obj in export_objs:
            obj.select_set(True)
        bpy.ops.export_scene.gltf(
            filepath=str(GLB_PATH),
            export_format="GLB",
            use_selection=True,
            export_apply=True,
            export_yup=True,
        )
        print(f"Exported {GLB_PATH}")

    if "--render" in ARGS:
        render_previews(ARGS[ARGS.index("--render") + 1])

    if "--no-export" not in ARGS:
        export_mixamo_doll(rig, basemesh)


main()
