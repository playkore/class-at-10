"""Retarget the Mixamo "Female Locomotion Pack" onto the MPFB Anna and export one .glb.

Run headless from the repo root (after build_anna_mpfb.py):
    /Applications/Blender.app/Contents/MacOS/Blender -b blender/anna_mpfb.blend -P blender/scripts/build_anna_animated.py

Output: blender/export/anna_animated.glb, Anna's rig and meshes plus one glTF
animation per entry in CLIPS.

The Mixamo clips use the same `mixamorig:*` skeleton, but in a T-pose rest with
different bone rolls, while Anna's rest is an A-pose. So the clips are not copied
as-is: each frame, every Anna bone is turned to point the same way (in world
space) as its Mixamo twin, and only the roll difference between the two rigs is
kept. Bone lengths match, so only rotations are keyed, plus the hips location.

Root motion is removed: the hips' horizontal drift from the first to the last
frame is subtracted, so walk and run play in place and Godot moves the body.

Anna_Body has the skin under her clothes masked out, so it can't poke through.
She has several outfits (see OUTFITS in build_anna_mpfb.py), so that skin is
exported in pieces by which outfits cover it: Anna_BodyCovered is under all of
them, Anna_BodyCovered_<outfit> only under one. Godot shows a piece when she
isn't wearing an outfit that covers it.
"""

from pathlib import Path

import bmesh
import bpy
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parent.parent
PACK = ROOT / "Female Locomotion Pack"
GLB_PATH = ROOT / "export" / "anna_animated.glb"

# glTF animation name -> Mixamo file
CLIPS = {
    "idle": "idle.fbx",
    "walk": "walking.fbx",
    "run": "running.fbx",
    "jump": "jump.fbx",
    "strafe_left": "left strafe walk.fbx",
    "strafe_right": "right strafe walk.fbx",
}
HIPS = "mixamorig:Hips"


def bone_order(arm):
    """Bones parents-first."""
    out = []

    def walk(b):
        out.append(b)
        for c in b.children:
            walk(c)

    for b in arm.data.bones:
        if b.parent is None:
            walk(b)
    return out


def roll_offsets(src, tgt):
    """Per bone: C with tgt_world = src_world @ C, ignoring the A/T-pose swing."""
    out = {}
    for b in tgt.data.bones:
        sb = src.data.bones.get(b.name)
        if sb is None:
            continue
        s_rest = (src.matrix_world @ sb.matrix_local).to_quaternion()
        t_rest = (tgt.matrix_world @ b.matrix_local).to_quaternion()
        s_dir = s_rest @ Vector((0, 1, 0))
        t_dir = t_rest @ Vector((0, 1, 0))
        swing = s_dir.rotation_difference(t_dir)  # takes the source bone onto the target's rest
        out[b.name] = s_rest.inverted() @ swing.inverted() @ t_rest
    return out


def import_clip(path):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.fbx(filepath=str(path))
    new = [o for o in bpy.data.objects if o not in before]
    src = next(o for o in new if o.type == "ARMATURE")
    return src, new


def retarget(name, fbx, tgt, order):
    scene = bpy.context.scene
    src, new_objs = import_clip(PACK / fbx)
    src_action = src.animation_data.action
    f0, f1 = (int(round(v)) for v in src_action.frame_range)
    offsets = roll_offsets(src, tgt)

    s_hips_rest = (src.matrix_world @ src.data.bones[HIPS].matrix_local).to_translation()
    t_hips_rest = (tgt.matrix_world @ tgt.data.bones[HIPS].matrix_local).to_translation()

    def src_hips(f):
        scene.frame_set(f)
        return (src.matrix_world @ src.pose.bones[HIPS].matrix).to_translation()

    drift = src_hips(f1) - src_hips(f0)
    drift.z = 0.0
    if name in ("idle", "jump"):
        drift = Vector()  # keep their small sway; they don't travel anyway

    action = bpy.data.actions.new(name)
    tgt.animation_data_create()
    tgt.animation_data.action = action
    for pb in tgt.pose.bones:
        pb.rotation_mode = "QUATERNION"

    tgt_inv = tgt.matrix_world.inverted()
    for f in range(f0, f1 + 1):
        scene.frame_set(f)
        t = (f - f0) / max(1, f1 - f0)
        posed = {}  # bone name -> armature-space pose matrix
        for b in order:
            pb = tgt.pose.bones[b.name]
            spb = src.pose.bones.get(b.name)
            if spb is None:
                continue
            rot = (src.matrix_world @ spb.matrix).to_quaternion() @ offsets[b.name]
            rot = tgt_inv.to_quaternion() @ rot
            if b.parent is None:
                s_pos = (src.matrix_world @ spb.matrix).to_translation()
                pos = tgt_inv @ (t_hips_rest + (s_pos - s_hips_rest) - drift * t)
                rest_rel = b.matrix_local
            else:
                rest_rel = posed[b.parent.name] @ b.parent.matrix_local.inverted() @ b.matrix_local
                pos = rest_rel.to_translation()
            m = Matrix.LocRotScale(pos, rot, None)
            posed[b.name] = m
            pb.matrix_basis = rest_rel.inverted() @ m
            pb.keyframe_insert("rotation_quaternion", frame=f - f0)
            if b.parent is None:
                pb.keyframe_insert("location", frame=f - f0)

    track = tgt.animation_data.nla_tracks.new()
    track.name = name
    track.strips.new(name, 0, action)
    tgt.animation_data.action = None

    for o in new_objs:
        bpy.data.objects.remove(o, do_unlink=True)
    bpy.data.actions.remove(src_action)
    print(f"Retargeted {name}: {f1 - f0 + 1} frames")


def add_covered_skin(body):
    """Split the skin that body's `Delete.*` masks hide into one mesh per set of outfits hiding it.

    Anna_BodyCovered is under every outfit; Anna_BodyCovered_<outfit> only under that one.
    """
    outfit_of = {o["mpfb_asset"]: o["outfit"] for o in bpy.data.objects if "outfit" in o}
    outfits = sorted(set(outfit_of.values()))
    masks = [m for m in body.modifiers if m.type == "MASK" and m.vertex_group.startswith("Delete.")]
    # vertex group index -> (threshold, outfit)
    groups = {
        body.vertex_groups[m.vertex_group].index: (m.threshold, outfit_of[m.vertex_group[len("Delete.") :]])
        for m in masks
    }
    # A Mask modifier drops every face touching a masked vertex.
    hidden_by = {
        v.index: {groups[g.group][1] for g in v.groups if g.group in groups and g.weight > groups[g.group][0]}
        for v in body.data.vertices
    }

    def face_outfits(face):
        return frozenset().union(*(hidden_by[v.index] for v in face.verts))

    bm = bmesh.new()
    bm.from_mesh(body.data)
    covers = {face_outfits(f) for f in bm.faces} - {frozenset()}
    bm.free()
    for cover in covers:
        name = "Anna_BodyCovered" if len(cover) == len(outfits) else "Anna_BodyCovered_" + "_".join(sorted(cover))
        covered = body.copy()
        covered.data = body.data.copy()
        covered.name = covered.data.name = name
        body.users_collection[0].objects.link(covered)
        for mod in [m for m in covered.modifiers if m.type == "MASK"]:
            covered.modifiers.remove(mod)
        bm = bmesh.new()
        bm.from_mesh(covered.data)
        others = [f for f in bm.faces if face_outfits(f) != cover]
        bmesh.ops.delete(bm, geom=others, context="FACES_ONLY")
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context="VERTS")
        bm.to_mesh(covered.data)
        bm.free()
        print(f"{name}: {len(covered.data.polygons)} faces")


def main():
    tgt = bpy.data.objects["Anna"]
    add_covered_skin(bpy.data.objects["Anna_Body"])
    for pb in tgt.pose.bones:
        pb.matrix_basis = Matrix()
    order = bone_order(tgt)
    for name, fbx in CLIPS.items():
        retarget(name, fbx, tgt, order)
        for pb in tgt.pose.bones:
            pb.matrix_basis = Matrix()

    export_objs = [tgt] + [o for o in tgt.children if o.type == "MESH" and o.name != "Anna_BaseMesh"]
    bpy.ops.object.select_all(action="DESELECT")
    for o in export_objs:
        o.hide_set(False)
        o.select_set(True)
    GLB_PATH.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(GLB_PATH),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_animation_mode="NLA_TRACKS",
        export_anim_single_armature=True,
    )
    print(f"Exported {GLB_PATH}")


main()
