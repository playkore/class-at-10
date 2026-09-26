"""Procedurally build the bedroom scene (alarm-ringing + desk views).

Run headless from the repo root:
    /Applications/Blender.app/Contents/MacOS/Blender -b -P blender/scripts/build_bedroom.py
    ... -- --render <out_dir>   # also render a preview PNG from every camera
    ... -- --no-export          # skip the .glb export

Coordinates: metres, Z up. Room interior spans x 0..3.2, y 0..3.6, z 0..2.6.
The window wall is at y = 3.6, and the desk stands against the south wall (y = 0).
"""

import math
import random
import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Euler, Matrix, Vector

ROOT = Path(__file__).resolve().parent.parent
BLEND_PATH = ROOT / "bedroom.blend"
GLB_PATH = ROOT / "export" / "bedroom.glb"

ARGS = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []

ROOM_W, ROOM_D, ROOM_H = 3.2, 3.6, 2.6
WALL_T = 0.35  # Soviet panel walls are thick, giving a deep window niche

# Window opening
WIN_X0, WIN_X1 = 1.1, 2.1
WIN_Z0, WIN_Z1 = 0.78, 2.2


# --------------------------------------------------------------------------
# Materials
# --------------------------------------------------------------------------

def srgb(hex_color):
    """Hex sRGB -> linear RGBA tuple."""
    hex_color = hex_color.lstrip("#")
    out = []
    for i in range(0, 6, 2):
        c = int(hex_color[i : i + 2], 16) / 255
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return (*out, 1.0)


def material(name, color, roughness=0.8, metallic=0.0, emission=None, strength=0.0, alpha=1.0):
    mat = bpy.data.materials.new(name)
    try:
        mat.use_nodes = True
    except AttributeError:
        pass
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    if bsdf is None:
        bsdf = nodes.new("ShaderNodeBsdfPrincipled")
        out = nodes.get("Material Output") or nodes.new("ShaderNodeOutputMaterial")
        mat.node_tree.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    bsdf.inputs["Base Color"].default_value = srgb(color)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if emission:
        bsdf.inputs["Emission Color"].default_value = srgb(emission)
        bsdf.inputs["Emission Strength"].default_value = strength
    if alpha < 1.0:
        bsdf.inputs["Alpha"].default_value = alpha
        if hasattr(mat, "surface_render_method"):
            mat.surface_render_method = "BLENDED"
        else:
            mat.blend_method = "BLEND"
    mat.diffuse_color = srgb(color)
    return mat


def make_materials():
    m = {}
    add = lambda key, *a, **kw: m.__setitem__(key, material(key, *a, **kw))
    # Room
    add("Wallpaper", "#c9a57e", 0.95)
    add("WallpaperBorder", "#a47d58", 0.9)
    add("Baseboard", "#6b4a2e", 0.6)
    add("Floor", "#7d5c3e", 0.5)
    add("Ceiling", "#e8e0d0", 0.95)
    add("Door", "#9c7a58", 0.6)
    add("Metal", "#b8b4ac", 0.3, metallic=1.0)
    # Window
    add("WindowFrame", "#eeeeea", 0.4)
    add("Glass", "#cfd8ff", 0.55, alpha=0.1)
    add("Sill", "#d8d2c6", 0.6)
    add("Radiator", "#e6e2da", 0.5)
    add("Curtain", "#d6b88a", 1.0)
    add("CurtainRod", "#7a5a3a", 0.5)
    # Bed
    add("BedWood", "#7a5634", 0.6)
    add("Sheet", "#e8e0d2", 1.0)
    add("Pillow", "#e0d4c0", 1.0)
    add("Blanket", "#a39079", 1.0)
    # Alarm clock
    add("ClockPlastic", "#1c1a1a", 0.35)
    add("ClockScreen", "#0a0606", 0.15)
    add("ClockDigits", "#ff3a12", 0.4, emission="#ff3a12", strength=8.0)
    add("ClockButtons", "#2e2b29", 0.5)
    # Desk corner
    add("DeskWood", "#b07a3e", 0.55)
    add("ChairFabric", "#cbb89a", 1.0)
    add("LampBase", "#e3d9b8", 0.3)
    add("LampShade", "#f4d98a", 0.9, emission="#ffcf70", strength=1.5)
    add("Paper", "#f2efe6", 0.9)
    add("CalendarPicture", "#5b7a3a", 0.8)
    add("CalendarFlowers", "#e8c23a", 0.8)
    add("Phone", "#d9c79a", 0.4)
    add("GreenClock", "#7fae5a", 0.4)
    add("PencilCup", "#6a7aa8", 0.5)
    add("Cassette", "#2a2a2a", 0.4)
    add("BoxPink", "#d98a8a", 0.6)
    add("BottlePink", "#e8b4b8", 0.3)
    add("BottleYellow", "#e6c85a", 0.3)
    add("BottleDark", "#2c2c34", 0.3)
    add("Rug", "#8a4a3a", 1.0)
    add("RugBorder", "#c9a070", 1.0)
    # Wardrobe
    add("WardrobeWood", "#8a5a34", 0.55)
    add("Mirror", "#c8d4dc", 0.05, metallic=1.0)
    # Outside
    add("Building", "#8a86a0", 0.9)
    add("WindowLit", "#ffcf7a", 0.5, emission="#ffcf7a", strength=4.0)
    add("WindowDark", "#2a2d45", 0.3)
    add("Snow", "#e8ecff", 0.9)
    add("StreetGlow", "#ffae5a", 0.5, emission="#ffae5a", strength=6.0)
    return m


# --------------------------------------------------------------------------
# Mesh building helpers
# --------------------------------------------------------------------------

class MeshBuilder:
    """Accumulates primitives (in object-local coords) into a single mesh."""

    def __init__(self):
        self.bm = bmesh.new()
        self.mats = []

    def _mi(self, mat):
        if mat not in self.mats:
            self.mats.append(mat)
        return self.mats.index(mat)

    def _tag(self, verts, mat):
        mi = self._mi(mat)
        for f in {f for v in verts for f in v.link_faces}:
            f.material_index = mi

    def box(self, center, size, mat, rot=(0, 0, 0)):
        m = Matrix.Translation(center) @ Euler(rot).to_matrix().to_4x4() @ Matrix.Diagonal((*size, 1))
        self._tag(bmesh.ops.create_cube(self.bm, size=1.0, matrix=m)["verts"], mat)

    def box_minmax(self, lo, hi, mat):
        lo, hi = Vector(lo), Vector(hi)
        self.box((lo + hi) / 2, hi - lo, mat)

    def box_matrix(self, matrix, mat):
        self._tag(bmesh.ops.create_cube(self.bm, size=1.0, matrix=matrix)["verts"], mat)

    def cyl(self, center, r1, r2, depth, mat, segments=20, rot=(0, 0, 0), cap=True):
        m = Matrix.Translation(center) @ Euler(rot).to_matrix().to_4x4()
        res = bmesh.ops.create_cone(
            self.bm, cap_ends=cap, cap_tris=False, segments=segments,
            radius1=r1, radius2=r2, depth=depth, matrix=m,
        )
        self._tag(res["verts"], mat)

    def grid(self, nx, ny, fn, mat):
        """Surface patch; fn(u, v) -> (x, y, z) with u, v in [0, 1]."""
        mi = self._mi(mat)
        vs = [[self.bm.verts.new(fn(i / nx, j / ny)) for j in range(ny + 1)] for i in range(nx + 1)]
        for i in range(nx):
            for j in range(ny):
                f = self.bm.faces.new((vs[i][j], vs[i + 1][j], vs[i + 1][j + 1], vs[i][j + 1]))
                f.material_index = mi

    def polyhedron(self, verts, faces, mat):
        mi = self._mi(mat)
        bv = [self.bm.verts.new(v) for v in verts]
        for face in faces:
            self.bm.faces.new([bv[i] for i in face]).material_index = mi

    def build(self, name, parent=None, location=(0, 0, 0), rotation=(0, 0, 0),
              smooth=False, bevel=0.0, subdiv=0, recalc=True):
        if recalc:
            bmesh.ops.recalc_face_normals(self.bm, faces=self.bm.faces[:])
        mesh = bpy.data.meshes.new(name)
        self.bm.to_mesh(mesh)
        self.bm.free()
        for mat in self.mats:
            mesh.materials.append(mat)
        for p in mesh.polygons:
            p.use_smooth = smooth
        obj = bpy.data.objects.new(name, mesh)
        bpy.context.scene.collection.objects.link(obj)
        obj.location = location
        obj.rotation_euler = rotation
        obj.parent = parent
        if bevel:
            mod = obj.modifiers.new("Bevel", "BEVEL")
            mod.width = bevel
            mod.segments = 2
            mod.limit_method = "ANGLE"
        if subdiv:
            mod = obj.modifiers.new("Subdivision", "SUBSURF")
            mod.levels = subdiv
            mod.render_levels = subdiv
        return obj


def empty(name, parent=None, location=(0, 0, 0), rotation=(0, 0, 0)):
    obj = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(obj)
    obj.empty_display_size = 0.2
    obj.location = location
    obj.rotation_euler = rotation
    obj.parent = parent
    return obj


def hitbox(name, parent, center, size):
    """Invisible collision box; Godot's -colonly suffix makes it a StaticBody3D."""
    mb = MeshBuilder()
    mb.box(center, size, None)
    obj = mb.build(f"{name}-colonly", parent=parent)
    obj.display_type = "WIRE"
    obj.hide_render = True
    return obj


def light(name, kind, parent, location, color, energy, size=0.1, rotation=(0, 0, 0)):
    data = bpy.data.lights.new(name, type=kind)
    data.color = srgb(color)[:3]
    data.energy = energy
    if kind == "AREA":
        data.shape = "RECTANGLE"
        data.size, data.size_y = size if isinstance(size, tuple) else (size, size)
    else:
        data.shadow_soft_size = size
    obj = bpy.data.objects.new(name, data)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = location
    obj.rotation_euler = rotation
    obj.parent = parent
    return obj


def look_at(obj, target):
    direction = Vector(target) - Vector(obj.location)
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


# --------------------------------------------------------------------------
# Room shell
# --------------------------------------------------------------------------

def build_room(m):
    grp = empty("Room")

    mb = MeshBuilder()
    mb.box_minmax((0, 0, -0.05), (ROOM_W, ROOM_D, 0), m["Floor"])
    mb.build("Floor", grp)

    mb = MeshBuilder()
    mb.box_minmax((0, 0, ROOM_H), (ROOM_W, ROOM_D, ROOM_H + 0.05), m["Ceiling"])
    mb.build("Ceiling", grp)

    t = WALL_T
    mb = MeshBuilder()
    wp = m["Wallpaper"]
    mb.box_minmax((-t, -t, 0), (0, ROOM_D + t, ROOM_H), wp)            # west
    mb.box_minmax((ROOM_W, -t, 0), (ROOM_W + t, ROOM_D + t, ROOM_H), wp)  # east
    mb.box_minmax((0, -t, 0), (ROOM_W, 0, ROOM_H), wp)                 # south
    # North (window) wall, built around the opening
    y0, y1 = ROOM_D, ROOM_D + t
    mb.box_minmax((0, y0, 0), (WIN_X0, y1, ROOM_H), wp)
    mb.box_minmax((WIN_X1, y0, 0), (ROOM_W, y1, ROOM_H), wp)
    mb.box_minmax((WIN_X0, y0, 0), (WIN_X1, y1, WIN_Z0 - 0.04), wp)
    mb.box_minmax((WIN_X0, y0, WIN_Z1), (WIN_X1, y1, ROOM_H), wp)
    mb.build("Walls", grp)

    # Baseboards + wallpaper border strip at mid height (seen in the desk art)
    mb = MeshBuilder()
    for z0, z1, d, mat in ((0, 0.08, 0.015, m["Baseboard"]), (1.28, 1.31, 0.004, m["WallpaperBorder"])):
        mb.box_minmax((0, 0, z0), (d, ROOM_D, z1), mat)
        mb.box_minmax((ROOM_W - d, 0, z0), (ROOM_W, ROOM_D, z1), mat)
        mb.box_minmax((0, 0, z0), (ROOM_W, d, z1), mat)
        mb.box_minmax((0, ROOM_D - d, z0), (WIN_X0, ROOM_D, z1), mat)
        mb.box_minmax((WIN_X1, ROOM_D - d, z0), (ROOM_W, ROOM_D, z1), mat)
    mb.build("Trim", grp)

    # Door on the west wall (leads to the corridor later)
    mb = MeshBuilder()
    mb.box((0.02, 0, 1.0), (0.04, 0.85, 2.0), m["Door"])
    mb.box((0.012, 0, 1.03), (0.024, 0.95, 2.1), m["Baseboard"])  # casing
    mb.cyl((0.055, -0.33, 1.0), 0.02, 0.02, 0.03, m["Metal"], rot=(0, math.pi / 2, 0))
    mb.build("Door", grp, location=(0, 1.6, 0))
    hitbox("Door_Hitbox", grp, (0.04, 1.6, 1.0), (0.08, 0.9, 2.0))
    return grp


# --------------------------------------------------------------------------
# Window wall: frame, glass, sill, radiator, curtains
# --------------------------------------------------------------------------

def build_window(m):
    grp = empty("Window")
    fy0, fy1 = 3.74, 3.80
    fw = 0.07
    mb = MeshBuilder()
    fr = m["WindowFrame"]
    mb.box_minmax((WIN_X0, fy0, WIN_Z0), (WIN_X0 + fw, fy1, WIN_Z1), fr)
    mb.box_minmax((WIN_X1 - fw, fy0, WIN_Z0), (WIN_X1, fy1, WIN_Z1), fr)
    mb.box_minmax((WIN_X0, fy0, WIN_Z0), (WIN_X1, fy1, WIN_Z0 + fw), fr)
    mb.box_minmax((WIN_X0, fy0, WIN_Z1 - fw), (WIN_X1, fy1, WIN_Z1), fr)
    # Inner sash lip
    s = 0.02
    mb.box_minmax((WIN_X0 + fw, fy0 - 0.01, WIN_Z0 + fw), (WIN_X0 + fw + s, fy0 + 0.02, WIN_Z1 - fw), fr)
    mb.box_minmax((WIN_X1 - fw - s, fy0 - 0.01, WIN_Z0 + fw), (WIN_X1 - fw, fy0 + 0.02, WIN_Z1 - fw), fr)
    mb.box_minmax((WIN_X0 + fw, fy0 - 0.01, WIN_Z1 - fw - s), (WIN_X1 - fw, fy0 + 0.02, WIN_Z1 - fw), fr)
    mb.build("WindowFrame", grp, bevel=0.004)

    mb = MeshBuilder()
    mb.box_minmax((WIN_X0 + fw, 3.768, WIN_Z0 + fw), (WIN_X1 - fw, 3.772, WIN_Z1 - fw), m["Glass"])
    mb.build("WindowGlass", grp)

    mb = MeshBuilder()
    mb.box_minmax((WIN_X0 - 0.06, 3.47, WIN_Z0 - 0.04), (WIN_X1 + 0.06, 3.76, WIN_Z0), m["Sill"])
    mb.build("Windowsill", grp, bevel=0.005)

    # Cast-iron radiator under the sill
    mb = MeshBuilder()
    x = 1.28
    while x < 1.93:
        mb.box((x, 3.54, 0.38), (0.05, 0.07, 0.46), m["Radiator"])
        x += 0.065
    mb.box_minmax((1.25, 3.53, 0.2), (1.96, 3.55, 0.24), m["Radiator"])
    mb.box_minmax((1.25, 3.53, 0.52), (1.96, 3.55, 0.56), m["Radiator"])
    mb.build("Radiator", grp, bevel=0.008)

    # Curtains: wavy cloth panels either side of the sill
    def curtain(x0, x1, phase):
        def fn(u, v):
            x = x0 + (x1 - x0) * u
            folds = 7
            y = 3.42 - 0.035 * math.sin(u * folds * 2 * math.pi + phase) * (0.6 + 0.4 * v)
            z = 0.12 + (2.42 - 0.12) * v
            return (x, y, z)
        return fn

    mb = MeshBuilder()
    mb.grid(56, 24, curtain(0.5, 1.03, 0.0), m["Curtain"])
    mb.build("Curtain_Left", grp, smooth=True, recalc=False)
    mb = MeshBuilder()
    mb.grid(56, 24, curtain(2.17, 2.7, 1.3), m["Curtain"])
    mb.build("Curtain_Right", grp, smooth=True, recalc=False)

    mb = MeshBuilder()
    mb.cyl((1.6, 3.42, 2.45), 0.012, 0.012, 2.4, m["CurtainRod"], rot=(0, math.pi / 2, 0))
    for x in (0.4, 2.8):
        mb.cyl((x, 3.42, 2.45), 0.025, 0.025, 0.04, m["CurtainRod"], rot=(0, math.pi / 2, 0))
        mb.box((x, 3.51, 2.45), (0.015, 0.18, 0.015), m["CurtainRod"])
    mb.build("CurtainRod", grp)
    return grp


# --------------------------------------------------------------------------
# Outside: a Soviet apartment block across a snowy courtyard at dusk
# --------------------------------------------------------------------------

def build_outside(m):
    grp = empty("Outside")
    rnd = random.Random(1999)

    def block(name, x0, x1, y_front, depth, z0, z1, floors_step=3.0, win_step=2.2):
        mb = MeshBuilder()
        mb.box_minmax((x0, y_front, z0), (x1, y_front + depth, z1), m["Building"])
        mb.box_minmax((x0 - 0.3, y_front - 0.3, z1), (x1 + 0.3, y_front + depth + 0.3, z1 + 0.4), m["Snow"])
        z = z0 + 1.5
        while z + 1.3 < z1:
            x = x0 + 1.2
            while x + 0.9 < x1:
                lit = rnd.random() < 0.45
                mb.box_minmax((x, y_front - 0.02, z), (x + 0.9, y_front, z + 1.2),
                              m["WindowLit"] if lit else m["WindowDark"])
                x += win_step
            z += floors_step
        return mb.build(name, grp)

    block("Building_Front", -10, 14, 36, 12, -14, 12)
    block("Building_Left", -40, -14, 52, 12, -14, 9)
    mb = MeshBuilder()
    mb.box_minmax((-60, 4, -14.2), (60, 80, -14), m["Snow"])
    mb.build("Ground", grp)
    mb = MeshBuilder()
    for x in (-4, 3, 9):
        mb.cyl((x, 24, -10.5), 0.25, 0.25, 0.3, m["StreetGlow"], segments=10)
        mb.box((x, 24, -12.3), (0.08, 0.08, 3.5), m["Building"])
    mb.build("StreetLamps", grp)
    return grp


# --------------------------------------------------------------------------
# Bed along the east wall, headboard beside the desk chair, foot towards the
# window wall, with a lumpy blanket
# --------------------------------------------------------------------------

BED_X0, BED_X1 = 2.14, 3.18  # frame; the east side touches the wall
BED_Y0, BED_Y1 = 1.26, 3.30  # headboard back to foot end (clear of the curtain)


def build_bed(m):
    grp = empty("Bed")
    x0, x1, y0, y1 = BED_X0, BED_X1, BED_Y0, BED_Y1
    cx = (x0 + x1) / 2
    mb = MeshBuilder()
    mb.box_minmax((x0, y0 + 0.06, 0.1), (x1, y1, 0.3), m["BedWood"])
    mb.box_minmax((x0, y0, 0.0), (x1, y0 + 0.06, 0.95), m["BedWood"])  # headboard
    for x in (x0 + 0.03, x1 - 0.03):
        for y in (y0 + 0.09, y1 - 0.03):
            mb.box((x, y, 0.05), (0.05, 0.05, 0.1), m["BedWood"])
    mb.build("BedFrame", grp, bevel=0.01)

    mb = MeshBuilder()
    mb.box_minmax((x0 + 0.04, y0 + 0.08, 0.3), (x1 - 0.04, y1 - 0.02, 0.5), m["Sheet"])
    mb.build("Mattress", grp, bevel=0.03)

    mb = MeshBuilder()
    mb.box((0, 0, 0), (0.62, 0.34, 0.12), m["Pillow"])
    mb.build("Pillow", grp, location=(cx, y0 + 0.26, 0.57), rotation=(0.25, 0, 0), smooth=True, subdiv=2)

    humps = [  # (dx from centre, dy from headboard, height, sx, sy)
        (-0.38, 0.75, 0.17, 0.24, 0.30),
        (0.28, 1.00, 0.19, 0.30, 0.36),
        (-0.15, 1.60, 0.11, 0.30, 0.26),
        (0.30, 1.70, 0.06, 0.22, 0.25),
    ]
    humps = [(cx + dx, y0 + dy, h, sx, sy) for dx, dy, h, sx, sy in humps]
    foot = y1 - 0.02  # mattress foot edge
    # Drapes over the open west side and the foot end; tucked against the wall
    bx0, bx1, by0, by1 = x0 - 0.15, x1 - 0.01, y0 + 0.48, foot + 0.1

    def blanket(u, v):
        x = bx0 + (bx1 - bx0) * u
        y = by0 + (by1 - by0) * v
        z = 0.54
        for hx, hy, h, sx, sy in humps:
            z += h * math.exp(-(((x - hx) / sx) ** 2 + ((y - hy) / sy) ** 2))
        # Drape over the mattress edges and the foot end
        over = max(0.0, abs(x - cx) - 0.46)
        z -= (over / 0.21) ** 1.4 * 0.26
        over_y = max(0.0, y - foot)
        z -= (over_y / 0.1) ** 1.4 * 0.2
        # Loose wrinkles
        z += 0.008 * math.sin(x * 23 + y * 7) * math.sin(y * 17)
        return (x, y, z)

    mb = MeshBuilder()
    mb.grid(48, 64, blanket, m["Blanket"])
    mb.build("Blanket", grp, smooth=True, subdiv=1, recalc=False)
    return grp


# --------------------------------------------------------------------------
# Alarm clock on the windowsill (the first interactive object)
# --------------------------------------------------------------------------

SEGMENTS = {  # 7-segment layout: a top, b top-right, c bottom-right, d bottom, e bottom-left, f top-left, g middle
    "0": "abcdef", "1": "bc", "2": "abged", "3": "abgcd", "4": "fgbc",
    "5": "afgcd", "6": "afgedc", "7": "abc", "8": "abcdefg", "9": "abcdfg",
}


def seven_segment(text, width, height, thick, gap):
    """Yield (u, v, w, h) rectangles centred on (0, 0) for the given digits and ':'."""
    advance = width + gap
    total = sum(advance * (0.4 if ch == ":" else 1.0) for ch in text) - gap
    u = -total / 2
    hw, hh = width / 2, height / 2
    for ch in text:
        if ch == ":":
            cu = u + advance * 0.2 - gap / 2
            yield (cu, height * 0.2, thick, thick)
            yield (cu, -height * 0.2, thick, thick)
            u += advance * 0.4
            continue
        cu = u + hw
        seg = {
            "a": (cu, hh - thick / 2, width - thick, thick),
            "d": (cu, -hh + thick / 2, width - thick, thick),
            "g": (cu, 0, width - thick, thick),
            "b": (cu + hw - thick / 2, hh / 2, thick, hh - thick),
            "c": (cu + hw - thick / 2, -hh / 2, thick, hh - thick),
            "f": (cu - hw + thick / 2, hh / 2, thick, hh - thick),
            "e": (cu - hw + thick / 2, -hh / 2, thick, hh - thick),
        }
        for s in SEGMENTS[ch]:
            yield seg[s]
        u += advance


def build_alarm_clock(m):
    # Root sits at the front-bottom-centre of the clock on the sill.
    root = empty("AlarmClock", location=(1.6, 3.53, WIN_Z0))
    rig = empty("AlarmClock_Rig", root)  # animated for the "ringing" shake

    w_bot, w_top, depth, height, lean = 0.18, 0.163, 0.14, 0.12, 0.03
    verts = [
        (-w_bot, 0, 0), (w_bot, 0, 0), (w_bot, depth, 0), (-w_bot, depth, 0),
        (-w_top, lean, height), (w_top, lean, height), (w_top, depth - 0.015, height), (-w_top, depth - 0.015, height),
    ]
    faces = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
    mb = MeshBuilder()
    mb.polyhedron(verts, faces, m["ClockPlastic"])
    mb.build("AlarmClock_Body", rig, bevel=0.01)

    # Front face frame of reference: U across, V up the leaning face, N outward.
    U = Vector((1, 0, 0))
    V = Vector((0, lean, height)).normalized()
    N = U.cross(V)
    rot = Matrix((U, V, N)).transposed().to_4x4()
    face_len = Vector((0, lean, height)).length

    def on_face(u, v, off, size):
        pos = u * U + v * V + off * N
        return Matrix.Translation(pos) @ rot @ Matrix.Diagonal((*size, 1))

    mb = MeshBuilder()
    mb.box_matrix(on_face(0, face_len / 2, 0.001, (0.29, face_len * 0.72, 0.004)), m["ClockScreen"])
    mb.build("AlarmClock_Screen", rig)

    mb = MeshBuilder()
    for u, v, w, h in seven_segment("08:00", 0.047, 0.066, 0.009, 0.013):
        mb.box_matrix(on_face(u, face_len / 2 + v, 0.0035, (w, h, 0.002)), m["ClockDigits"])
    mb.build("AlarmClock_Display", rig)

    mb = MeshBuilder()
    mb.box_minmax((-0.1, 0.045, height), (0.1, 0.1, height + 0.014), m["ClockButtons"])
    for i in range(5):
        x = -0.08 + i * 0.04
        mb.box((x, 0.072, height + 0.019), (0.03, 0.02, 0.01), m["ClockPlastic"])
    mb.build("AlarmClock_TopButtons", rig, bevel=0.002)

    light("AlarmClock_Glow", "POINT", rig, (0, -0.06, 0.06), "#ff4a1a", 1.2, size=0.03)
    hitbox("AlarmClock_Hitbox", root, (0, depth / 2, height / 2 + 0.01), (0.36, depth + 0.04, height + 0.06))

    # "Ringing" shake, 12 frames, meant to loop in Godot.
    for frame, (rz, dx) in enumerate([(0, 0), (0.05, 0.004), (-0.05, -0.004)] * 4 + [(0, 0)]):
        rig.rotation_euler = (0, 0, rz)
        rig.location = (dx, 0, 0.003 if frame % 2 else 0)
        rig.keyframe_insert("rotation_euler", frame=frame * 2)
        rig.keyframe_insert("location", frame=frame * 2)
    rig.animation_data.action.name = "AlarmClock_Ring"
    rig.rotation_euler = (0, 0, 0)
    rig.location = (0, 0, 0)
    return root


# --------------------------------------------------------------------------
# Desk corner (south-east corner; seen in room_desk_view)
# --------------------------------------------------------------------------

def build_desk(m):
    grp = empty("Desk")
    w = m["DeskWood"]

    mb = MeshBuilder()
    mb.box_minmax((1.9, 0.0, 0.72), (3.2, 0.66, 0.75), w)            # top
    for y in (0.05, 0.6):
        mb.box_minmax((3.1, y - 0.025, 0), (3.15, y + 0.025, 0.72), w)  # legs, open side
    mb.box_minmax((2.42, 0.01, 0.4), (3.12, 0.03, 0.72), w)          # modesty panel
    # Cabinet with drawer slot above a door
    mb.box_minmax((1.92, 0.01, 0.0), (1.94, 0.64, 0.72), w)
    mb.box_minmax((2.40, 0.01, 0.0), (2.42, 0.64, 0.72), w)
    mb.box_minmax((1.92, 0.01, 0.0), (2.42, 0.03, 0.72), w)
    mb.box_minmax((1.94, 0.03, 0.0), (2.40, 0.64, 0.06), w)
    mb.box_minmax((1.94, 0.03, 0.575), (2.40, 0.64, 0.59), w)
    mb.build("DeskBody", grp, bevel=0.004)

    # Drawer: origin at its front centre so Godot can slide it along +Y.
    mb = MeshBuilder()
    mb.box((0, -0.01, 0), (0.45, 0.02, 0.11), w)
    mb.box((-0.205, -0.3, -0.01), (0.015, 0.56, 0.08), w)
    mb.box((0.205, -0.3, -0.01), (0.015, 0.56, 0.08), w)
    mb.box((0, -0.57, -0.01), (0.41, 0.015, 0.08), w)
    mb.box((0, -0.3, -0.045), (0.41, 0.56, 0.01), w)
    mb.cyl((0, 0.022, 0), 0.007, 0.007, 0.2, m["Metal"], segments=10, rot=(0, math.pi / 2, 0))
    for x in (-0.09, 0.09):
        mb.box((x, 0.012, 0), (0.012, 0.02, 0.012), m["Metal"])
    drawer = mb.build("Desk_Drawer", grp, location=(2.17, 0.64, 0.655), bevel=0.002)
    hitbox("Desk_Drawer_Hitbox", drawer, (0, 0.0, 0), (0.46, 0.05, 0.12))
    drawer.keyframe_insert("location", frame=0)
    drawer.location.y += 0.35
    drawer.keyframe_insert("location", frame=15)
    drawer.animation_data.action.name = "Desk_DrawerOpen"
    drawer.location.y -= 0.35

    # Cabinet door, origin at its hinge (right-hand side as seen from the room).
    mb = MeshBuilder()
    mb.box((0.23, 0.01, 0.26), (0.46, 0.02, 0.5), w)
    mb.box((0.41, 0.03, 0.4), (0.015, 0.02, 0.08), m["Metal"])
    mb.build("Desk_CabinetDoor", grp, location=(1.94, 0.64, 0.07), bevel=0.003)

    build_chair(m, grp)
    build_lamp(m, grp)

    # Wall items on the south wall
    mb = MeshBuilder()
    mb.box_minmax((2.0, 0.003, 1.1), (2.68, 0.008, 2.25), m["Paper"])
    mb.box_minmax((2.04, 0.008, 1.62), (2.64, 0.011, 2.1), m["CalendarPicture"])
    for fx, fz in ((2.1, 1.9), (2.55, 1.95), (2.5, 1.7), (2.13, 1.68)):
        mb.box((fx, 0.012, fz), (0.06, 0.004, 0.06), m["CalendarFlowers"])
    for i in range(8):  # month blocks
        cx = 2.1 + (i % 4) * 0.16
        cz = 1.5 - (i // 4) * 0.17
        mb.box((cx, 0.009, cz), (0.13, 0.002, 0.12), m["WallpaperBorder"])
    mb.build("Calendar1999", grp)

    mb = MeshBuilder()
    mb.box_minmax((2.8, 0.003, 1.7), (3.08, 0.007, 1.9), m["Paper"])
    for i in range(6):
        mb.box((2.94, 0.008, 1.86 - i * 0.027), (0.24, 0.002, 0.006), m["PencilCup"])
    sched = mb.build("Schedule", grp)
    hitbox("Schedule_Hitbox", sched, (2.94, 0.02, 1.8), (0.32, 0.04, 0.24))

    mb = MeshBuilder()
    mb.box((0, 0.03, 0), (0.11, 0.06, 0.24), m["Phone"])
    mb.box((0.0, 0.075, 0.0), (0.05, 0.035, 0.22), m["Phone"])
    mb.cyl((0.0, 0.075, -0.19), 0.012, 0.012, 0.12, m["Phone"], segments=8)  # coiled cord stub
    mb.build("WallPhone", grp, location=(1.8, 0.0, 1.45), bevel=0.01)

    # Desk clutter
    top = 0.75
    mb = MeshBuilder()
    mb.cyl((0, 0, 0), 0.07, 0.07, 0.05, m["GreenClock"], rot=(math.pi / 2, 0, 0))
    mb.cyl((0, 0.027, 0), 0.058, 0.058, 0.004, m["Paper"], rot=(math.pi / 2, 0, 0))
    mb.box((0.0, 0.031, 0.02), (0.006, 0.002, 0.04), m["BottleDark"])
    mb.box((0.015, 0.031, 0.0), (0.03, 0.002, 0.005), m["BottleDark"])
    for x in (-0.045, 0.045):
        mb.cyl((x, 0, 0.07), 0.022, 0.022, 0.012, m["GreenClock"])
        mb.box((x, 0, -0.07), (0.02, 0.03, 0.02), m["GreenClock"])
    mb.build("GreenClock", grp, location=(2.02, 0.14, top + 0.08), rotation=(0, 0, 0.3), smooth=False)

    mb = MeshBuilder()
    mb.cyl((0, 0, 0.05), 0.04, 0.04, 0.1, m["PencilCup"])
    for i, (dx, dy) in enumerate(((0.01, 0.0), (-0.012, 0.01), (0.0, -0.012))):
        mb.box((dx, dy, 0.12), (0.008, 0.008, 0.16), m["BottleYellow" if i % 2 else "BottleDark"], rot=(dy * 8, dx * 8, 0))
    mb.build("PencilCup", grp, location=(2.72, 0.12, top))

    mb = MeshBuilder()
    for i in range(3):
        mb.box((0, 0, 0.012 + i * 0.025), (0.19, 0.12, 0.024), m["Cassette"], rot=(0, 0, 0.05 * i))
    mb.box((0.0, 0.0, 0.1), (0.16, 0.09, 0.05), m["BoxPink"])
    mb.build("Cassettes", grp, location=(2.5, 0.14, top))

    mb = MeshBuilder()
    bottles = [(-0.12, 0.10, 0.03, "BottleYellow"), (-0.05, 0.16, 0.028, "BottleDark"),
               (0.02, 0.12, 0.018, "BottlePink"), (0.08, 0.2, 0.03, "BottlePink"),
               (-0.2, 0.07, 0.04, "Paper")]
    for x, h, r, mat in bottles:
        mb.cyl((x, 0, h / 2), r, r, h, m[mat], segments=14)
        mb.cyl((x, 0, h + 0.012), r * 0.5, r * 0.5, 0.024, m["BottleDark"], segments=10)
    mb.build("Cosmetics", grp, location=(2.28, 0.12, top))

    # Under-desk VHS stack and the rug
    mb = MeshBuilder()
    for i in range(5):
        mb.box((0, 0, 0.015 + i * 0.03), (0.2, 0.11, 0.028), m["Cassette"], rot=(0, 0, 0.06 * (i % 3 - 1)))
    mb.build("VHSStack", grp, location=(2.62, 0.2, 0))

    mb = MeshBuilder()
    mb.box_minmax((2.0, 0.45, 0.0), (3.1, 1.24, 0.008), m["RugBorder"])
    mb.box_minmax((2.06, 0.51, 0.0), (3.04, 1.18, 0.01), m["Rug"])
    mb.build("Rug", grp)
    return grp


def build_chair(m, parent):
    w, f = m["DeskWood"], m["ChairFabric"]
    mb = MeshBuilder()
    mb.box((0, 0, 0.415), (0.44, 0.44, 0.03), w)
    for x in (-0.19, 0.19):
        mb.box((x, -0.19, 0.2), (0.035, 0.035, 0.4), w)
        mb.box((x, 0.19, 0.475), (0.04, 0.04, 0.95), w)
        mb.box((x, 0, 0.12), (0.025, 0.38, 0.025), w)
    mb.box((0, 0.19, 0.88), (0.4, 0.03, 0.09), w)
    mb.box((0, 0.19, 0.6), (0.4, 0.025, 0.04), w)
    for x in (-0.1, 0, 0.1):
        mb.box((x, 0.19, 0.74), (0.04, 0.02, 0.24), w)
    mb.build("Chair", parent, location=(2.72, 0.98, 0), rotation=(0, 0, -0.12), bevel=0.005)
    mb = MeshBuilder()
    mb.box((0, 0, 0), (0.42, 0.42, 0.06), f)
    mb.build("Chair_Cushion", bpy.data.objects["Chair"], location=(0, -0.01, 0.46), smooth=True, bevel=0.02)


def build_lamp(m, parent):
    mb = MeshBuilder()
    mb.cyl((0, 0, 0.01), 0.075, 0.075, 0.02, m["LampBase"], segments=24)
    mb.cyl((0, 0, 0.07), 0.035, 0.06, 0.1, m["LampBase"], segments=24)
    mb.cyl((0, 0, 0.16), 0.06, 0.025, 0.08, m["LampBase"], segments=24)
    mb.cyl((0, 0, 0.23), 0.008, 0.008, 0.06, m["Metal"], segments=8)
    mb.build("DeskLamp", parent, location=(2.95, 0.2, 0.75), smooth=True)
    lamp = bpy.data.objects["DeskLamp"]
    mb = MeshBuilder()
    mb.cyl((0, 0, 0.0), 0.15, 0.09, 0.17, m["LampShade"], segments=32, cap=False)
    mb.build("DeskLamp_Shade", lamp, location=(0, 0, 0.3), smooth=True, recalc=False)
    light("DeskLamp_Light", "POINT", lamp, (0, 0, 0.28), "#ffc870", 25, size=0.05)


# --------------------------------------------------------------------------
# Wardrobe on the west wall, facing the bed, between the door and the window
# --------------------------------------------------------------------------

CLOSET_X0, CLOSET_X1 = 0.0, 0.58   # back against the west wall
CLOSET_Y0, CLOSET_Y1 = 2.2, 3.3    # clear of the door casing and the curtain
CLOSET_H = 2.15


def build_closet(m):
    grp = empty("Closet")
    w = m["WardrobeWood"]
    x0, x1, y0, y1, h = CLOSET_X0, CLOSET_X1, CLOSET_Y0, CLOSET_Y1, CLOSET_H
    t = 0.02
    front = x1 - t  # doors sit in front of the carcass
    plinth, shelf_z = 0.08, 1.72  # mezzanine compartment above shelf_z

    mb = MeshBuilder()
    mb.box_minmax((x0, y0, 0), (front, y0 + t, h), w)                  # sides
    mb.box_minmax((x0, y1 - t, 0), (front, y1, h), w)
    mb.box_minmax((x0, y0, 0), (x0 + t, y1, h), w)                     # back
    mb.box_minmax((x0, y0 - 0.015, h), (x1 + 0.015, y1 + 0.015, h + 0.03), w)  # top with overhang
    mb.box_minmax((x0 + 0.03, y0 + 0.03, 0), (front - 0.04, y1 - 0.03, plinth), w)  # recessed plinth
    mb.box_minmax((x0, y0, plinth), (front, y1, plinth + t), w)        # bottom
    mb.box_minmax((x0, y0, shelf_z), (front, y1, shelf_z + t), w)      # mezzanine floor
    mb.box_minmax((x0, (y0 + y1) / 2 - t / 2, plinth), (front, (y0 + y1) / 2 + t / 2, h), w)  # divider
    mb.cyl((0.3, (3 * y0 + y1) / 4, shelf_z - 0.07), 0.01, 0.01, (y1 - y0) / 2 - 0.04,
           m["Metal"], segments=10, rot=(math.pi / 2, 0, 0))            # hanging rail
    mb.build("ClosetBody", grp, bevel=0.003)

    # Doors, origin at the hinge so Godot can swing them about Z.
    gap = 0.004
    ym = (y0 + y1) / 2
    for name, hinge_y, width, z0, z1, sign in (
        ("Closet_DoorLeft", y0, ym - y0, plinth, shelf_z + t, 1),
        ("Closet_DoorRight", y1, y1 - ym, plinth, shelf_z + t, -1),
        ("Closet_TopDoorLeft", y0, ym - y0, shelf_z + t, h, 1),
        ("Closet_TopDoorRight", y1, y1 - ym, shelf_z + t, h, -1),
    ):
        dw, dh = width - gap, z1 - z0 - gap
        cy = sign * dw / 2
        mb = MeshBuilder()
        mb.box((t / 2, cy, dh / 2), (t, dw, dh), w)
        # Raised panel frame
        for dz in (0.05, dh - 0.05):
            mb.box((t + 0.004, cy, dz), (0.008, dw - 0.06, 0.02), w)
        for dy in (0.04, dw - 0.04):
            mb.box((t + 0.004, sign * dy, dh / 2), (0.008, 0.02, dh - 0.08), w)
        handle_y = sign * (dw - 0.05)
        if name.startswith("Closet_Top"):
            mb.cyl((t + 0.015, handle_y, dh / 2), 0.012, 0.012, 0.025, m["Metal"], segments=12,
                   rot=(0, math.pi / 2, 0))
        else:
            mb.box((t + 0.02, handle_y, dh * 0.55), (0.015, 0.015, 0.16), m["Metal"])
            if sign < 0:  # full-length mirror on the right-hand door
                mb.box((t + 0.002, cy, dh / 2), (0.004, dw - 0.14, dh - 0.3), m["Mirror"])
        mb.build(name, grp, location=(front, hinge_y + sign * gap / 2, z0 + gap / 2), bevel=0.002)

    # Suitcase on top
    mb = MeshBuilder()
    mb.box((0, 0, 0.1), (0.45, 0.62, 0.2), m["Baseboard"])
    mb.box((0.23, 0, 0.12), (0.02, 0.14, 0.03), m["ClockPlastic"])
    mb.build("Closet_Suitcase", grp, location=(0.28, 2.6, h + 0.03), rotation=(0, 0, 0.05), bevel=0.015)
    return grp


# --------------------------------------------------------------------------
# Lights, world, cameras
# --------------------------------------------------------------------------

def build_lighting():
    grp = empty("Lights")
    light("Light_Ceiling", "AREA", grp, (1.6, 1.8, ROOM_H - 0.02), "#ffd9a8", 25, size=(1.2, 1.2))
    light("Light_WindowDusk", "AREA", grp, (1.6, 3.9, 1.5), "#8090d0", 50, size=(0.9, 1.3),
          rotation=(-math.pi / 2, 0, 0))
    light("Light_StreetBounce", "AREA", grp, (1.6, 4.2, 0.4), "#ffa050", 70, size=(1.2, 0.3),
          rotation=(-math.pi / 2 - 0.5, 0, 0))

    world = bpy.data.worlds.new("Dusk")
    try:
        world.use_nodes = True
    except AttributeError:
        pass
    bg = world.node_tree.nodes.get("Background")
    bg.inputs["Color"].default_value = srgb("#4c5486")
    bg.inputs["Strength"].default_value = 1.4
    bpy.context.scene.world = world
    return grp


def build_cameras():
    grp = empty("Cameras")

    def cam(name, location, lens):
        data = bpy.data.cameras.new(name)
        data.lens = lens
        data.sensor_fit = "AUTO"
        data.clip_start = 0.05
        data.clip_end = 200
        obj = bpy.data.objects.new(name, data)
        bpy.context.scene.collection.objects.link(obj)
        obj.location = location
        obj.parent = grp
        return obj

    # Lying on the pillow, looking past the foot of the bed at the alarm clock
    bed = cam("Cam_room_bed_view", ((BED_X0 + BED_X1) / 2, BED_Y0 + 0.42, 0.84), 28)
    look_at(bed, (1.75, 3.55, 0.92))
    desk = cam("Cam_room_desk_view", (1.75, 2.3, 1.6), 24)  # standing beside the bed
    look_at(desk, (2.6, 0.2, 0.95))
    bpy.context.scene.camera = bed
    return grp


# --------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------

def setup_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.name = "Bedroom"
    scene.render.resolution_x = 1024
    scene.render.resolution_y = 1536
    scene.frame_start, scene.frame_end = 0, 24
    scene.view_settings.view_transform = "Standard"
    for engine in ("BLENDER_EEVEE", "BLENDER_EEVEE_NEXT"):
        try:
            scene.render.engine = engine
            break
        except TypeError:
            continue
    if hasattr(scene, "eevee"):
        scene.eevee.taa_render_samples = 32


def render_previews(out_dir):
    scene = bpy.context.scene
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    scene.render.resolution_percentage = 50
    scene.frame_set(0)
    for cam in (o for o in scene.objects if o.type == "CAMERA"):
        scene.camera = cam
        scene.render.filepath = str(out_dir / f"{cam.name}.png")
        bpy.ops.render.render(write_still=True)
        print(f"Rendered {scene.render.filepath}")
    scene.render.resolution_percentage = 100
    scene.camera = bpy.data.objects["Cam_room_bed_view"]


def main():
    setup_scene()
    m = make_materials()
    build_room(m)
    build_window(m)
    build_outside(m)
    build_bed(m)
    build_alarm_clock(m)
    build_desk(m)
    build_closet(m)
    build_lighting()
    build_cameras()
    bpy.context.scene.frame_set(0)

    BLEND_PATH.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))
    print(f"Saved {BLEND_PATH}")

    if "--no-export" not in ARGS:
        GLB_PATH.parent.mkdir(parents=True, exist_ok=True)
        bpy.ops.export_scene.gltf(
            filepath=str(GLB_PATH),
            export_format="GLB",
            export_apply=True,
            export_cameras=True,
            export_lights=True,
            export_yup=True,
        )
        print(f"Exported {GLB_PATH}")

    if "--render" in ARGS:
        render_previews(ARGS[ARGS.index("--render") + 1])


main()
