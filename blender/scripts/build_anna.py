"""Procedurally build Anna, the protagonist (reference: doc/proto.png).

Run headless from the repo root:
    /Applications/Blender.app/Contents/MacOS/Blender -b -P blender/scripts/build_anna.py
    ... -- --render <out_dir>   # also render a preview PNG from every camera
    ... -- --no-export          # skip the .glb export

Low-poly, static T-pose. Metres, Z up, feet on z = 0, facing -Y.
Her left side is +X.

The body is lofted from cross-section tables (TRUNK, ARM, LEG, FOOT). Each
ring is a superellipse, so the silhouette is set by numbers you can check
against real proportions. The clothes reuse the same generators with an
offset, so they follow the body exactly.
"""

import math
import random
import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parent.parent
BLEND_PATH = ROOT / "anna.blend"
GLB_PATH = ROOT / "export" / "anna.glb"

ARGS = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []

HEIGHT = 1.68
N_TRUNK = 16  # verts around torso / neck / head; k = 0 is front centre, k = 4 is +X


# --------------------------------------------------------------------------
# Body measurements
# --------------------------------------------------------------------------

# Trunk and head cross-sections, bottom to top:
# z, half-width, front depth, back depth, centre y, squareness, front squareness
TRUNK = [
    (0.800, 0.158, 0.080, 0.092, 0.000, 2.4, 2.4),  # crotch / top of thighs
    (0.860, 0.170, 0.084, 0.104, 0.000, 2.5, 2.5),  # hips, widest
    (0.920, 0.160, 0.082, 0.100, 0.000, 2.5, 2.5),
    (0.980, 0.138, 0.078, 0.084, 0.000, 2.4, 2.4),
    (1.035, 0.120, 0.075, 0.075, 0.000, 2.3, 2.3),  # waist, narrowest
    (1.085, 0.121, 0.078, 0.074, 0.000, 2.3, 2.3),
    (1.135, 0.127, 0.086, 0.076, 0.000, 2.4, 2.4),  # under bust
    (1.185, 0.134, 0.094, 0.080, 0.000, 2.5, 2.5),  # bust
    (1.235, 0.136, 0.090, 0.082, 0.000, 2.5, 2.5),
    (1.270, 0.138, 0.078, 0.080, 0.004, 2.5, 2.5),  # armpit
    (1.320, 0.155, 0.068, 0.074, 0.010, 2.6, 2.6),  # shoulder joint
    (1.370, 0.140, 0.054, 0.062, 0.016, 2.8, 2.8),  # shoulder top
    (1.400, 0.098, 0.052, 0.056, 0.018, 2.4, 2.4),  # trapezius
    (1.430, 0.055, 0.050, 0.050, 0.020, 2.0, 2.0),  # neck base
    (1.458, 0.049, 0.047, 0.048, 0.020, 2.0, 2.0),
    (1.474, 0.050, 0.058, 0.050, 0.010, 2.0, 1.5),  # under the jaw
    (1.492, 0.058, 0.078, 0.066, 0.000, 2.1, 1.3),  # chin, jaw angle
    (1.515, 0.064, 0.088, 0.082, -0.002, 2.2, 1.5),  # mouth
    (1.545, 0.070, 0.093, 0.094, -0.002, 2.3, 1.8),  # nose tip, cheekbones
    (1.578, 0.074, 0.093, 0.100, 0.000, 2.4, 2.1),  # eyes, halfway up the head
    (1.608, 0.076, 0.089, 0.101, 0.000, 2.4, 2.3),  # brow
    (1.638, 0.074, 0.082, 0.098, 0.000, 2.4, 2.3),  # forehead
    (1.660, 0.064, 0.070, 0.088, 0.000, 2.3, 2.3),
    (1.674, 0.044, 0.048, 0.062, 0.000, 2.1, 2.1),
]
HEAD_TOP = HEIGHT
TRUNK_RINGS = [row[0] for row in TRUNK]
SOCKET = (1.27, 1.32, 1.37)  # rings the arm sockets are cut between
CROTCH = (0.0, 0.004, 0.772)

# Arm (for +X), along x: x, centre y, centre z, radius y, radius z
ARM = [
    (0.195, 0.012, 1.320, 0.051, 0.051),  # deltoid
    (0.250, 0.012, 1.320, 0.046, 0.049),
    (0.320, 0.012, 1.320, 0.041, 0.042),
    (0.400, 0.012, 1.320, 0.036, 0.037),
    (0.450, 0.012, 1.320, 0.033, 0.034),  # elbow
    (0.505, 0.012, 1.320, 0.036, 0.036),
    (0.580, 0.012, 1.320, 0.031, 0.028),
    (0.650, 0.012, 1.320, 0.026, 0.019),  # wrist
    (0.690, 0.010, 1.319, 0.037, 0.018),  # palm, faces down
    (0.745, 0.008, 1.319, 0.044, 0.015),  # knuckles
    (0.790, 0.008, 1.317, 0.042, 0.012),
    (0.830, 0.008, 1.315, 0.034, 0.010),
]
FINGERTIP = 0.848

# Leg (for +X), along z: z, centre x, centre y, radius x, radius y
LEG = [
    (0.720, 0.088, 0.004, 0.080, 0.082),
    (0.620, 0.085, 0.000, 0.069, 0.071),
    (0.520, 0.082, -0.006, 0.056, 0.057),
    (0.460, 0.080, -0.008, 0.050, 0.050),  # knee
    (0.400, 0.080, 0.006, 0.050, 0.056),
    (0.330, 0.079, 0.016, 0.052, 0.060),  # calf
    (0.240, 0.078, 0.010, 0.041, 0.045),
    (0.150, 0.077, 0.004, 0.032, 0.034),
    (0.085, 0.077, 0.008, 0.029, 0.032),  # ankle
]

# Foot (for +X), along y from heel to toe: y, half-width, bottom z, top z
FOOT = [
    (0.048, 0.022, 0.004, 0.040),
    (0.032, 0.031, 0.000, 0.080),
    (-0.020, 0.035, 0.000, 0.080),
    (-0.080, 0.042, 0.000, 0.052),
    (-0.130, 0.041, 0.000, 0.036),
    (-0.160, 0.030, 0.002, 0.026),
]
FOOT_X = 0.080


def interp(table, t):
    """Catmull-Rom through table rows keyed on column 0 (in either order)."""
    table = sorted(table)
    keys = [row[0] for row in table]
    if t <= keys[0]:
        return table[0][1:]
    if t >= keys[-1]:
        return table[-1][1:]
    i = max(j for j in range(len(keys) - 1) if keys[j] <= t)
    p1, p2 = table[i], table[i + 1]
    p0 = table[max(i - 1, 0)]
    p3 = table[min(i + 2, len(table) - 1)]
    u = (t - p1[0]) / (p2[0] - p1[0])
    out = []
    for c in range(1, len(p1)):
        dt = p2[0] - p1[0]
        m1 = (p2[c] - p0[c]) / (p2[0] - p0[0]) * dt if p0 is not p1 else p2[c] - p1[c]
        m2 = (p3[c] - p1[c]) / (p3[0] - p1[0]) * dt if p3 is not p2 else p2[c] - p1[c]
        u2, u3 = u * u, u * u * u
        out.append((2 * u3 - 3 * u2 + 1) * p1[c] + (u3 - 2 * u2 + u) * m1
                   + (-2 * u3 + 3 * u2) * p2[c] + (u3 - u2) * m2)
    return out


def spow(v, e):
    return math.copysign(abs(v) ** e, v)


def gauss(v, mu, sigma):
    return math.exp(-((v - mu) / sigma) ** 2)


def trunk_point(z, th, off=0.0, fill_cleavage=False):
    """Point on the trunk/head surface. th = 0 is front, th = pi/2 is +X."""
    w, f, b, cy, p, pf = interp(TRUNK, z)
    s, c = math.sin(th), math.cos(th)
    e = 2 / (pf if c > 0 else p)
    x = w * spow(s, e)
    y = cy - (f if c > 0 else b) * spow(c, e)
    if c > 0:  # bust
        ax = abs(x)
        prof = gauss(ax, 0.072, 0.042)
        if fill_cleavage and ax < 0.072:
            prof = 1.0
        y -= 0.024 * gauss(z, 1.19, 0.045) * prof * c
    else:  # seat
        y += 0.026 * gauss(z, 0.87, 0.05) * gauss(abs(x), 0.070, 0.05) * -c
    nx, ny = x / (w * w), (y - cy) / ((f if c > 0 else b) ** 2)
    n = math.hypot(nx, ny) or 1.0
    return Vector((x + nx / n * off, y + ny / n * off, z))


def arm_point(side, x, phi, off=0.0):
    cy, cz, ry, rz = interp(ARM, x)
    return Vector((side * x, cy + (ry + off) * math.cos(phi), cz + (rz + off) * math.sin(phi)))


def leg_point(side, z, phi, off=0.0):
    cx, cy, rx, ry = interp(LEG, z)
    return Vector((side * (cx + (rx + off) * math.cos(phi)), cy + (ry + off) * math.sin(phi), z))


# --------------------------------------------------------------------------
# Materials
# --------------------------------------------------------------------------

def srgb(hex_color):
    hex_color = hex_color.lstrip("#")
    out = []
    for i in range(0, 6, 2):
        c = int(hex_color[i : i + 2], 16) / 255
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return (*out, 1.0)


def material(name, color, roughness=0.8, metallic=0.0):
    mat = bpy.data.materials.new(name)
    try:
        mat.use_nodes = True
    except AttributeError:
        pass
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = srgb(color)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    mat.diffuse_color = srgb(color)
    return mat


def make_materials():
    spec = {
        "Anna_Skin": ("#f0c6a8", 0.6),
        "Anna_Lips": ("#d9737a", 0.5),
        "Anna_Eye": ("#3b4a58", 0.3),
        "Anna_Brow": ("#9c7c52", 0.8),
        "Anna_Hair": ("#dcc28e", 0.7),
        "Anna_HairDark": ("#b8986a", 0.75),
        "Anna_Shirt": ("#b8323c", 0.85),
        "Anna_Pants": ("#5e6677", 0.9),
        "Anna_PantsStripe": ("#b3363d", 0.85),
        "Anna_Cord": ("#d8d2c4", 0.9),
        "Anna_Sock": ("#e6ddc8", 0.95),
        "Anna_SockStripe": ("#b3363d", 0.95),
        "Anna_Slipper": ("#a3303a", 0.9),
        "Anna_Sole": ("#3a2e2c", 0.9),
        "Anna_Watch": ("#c0303f", 0.5),
        "Anna_Silver": ("#c8ccd0", 0.3),
        "Anna_Turquoise": ("#38bcc4", 0.25),
    }
    m = {}
    for name, (color, rough) in spec.items():
        m[name.removeprefix("Anna_")] = material(name, color, rough, 0.8 if name == "Anna_Silver" else 0.0)
    return m


# --------------------------------------------------------------------------
# Mesh assembly
# --------------------------------------------------------------------------

class Mesh:
    def __init__(self):
        self.bm = bmesh.new()
        self.mats = []

    def mi(self, mat):
        if mat not in self.mats:
            self.mats.append(mat)
        return self.mats.index(mat)

    def verts(self, pts):
        return [self.bm.verts.new(p) for p in pts]

    def face(self, vs, mat):
        f = self.bm.faces.new(vs)
        f.material_index = self.mi(mat)
        return f

    def bridge(self, a, b, mat, closed=True, skip=()):
        n = len(a)
        for i in range(n if closed else n - 1):
            if i in skip:
                continue
            j = (i + 1) % n
            self.face((a[i], a[j], b[j], b[i]), mat)

    def fan(self, loop, center, mat):
        c = self.bm.verts.new(center)
        for i in range(len(loop)):
            self.face((loop[i], loop[(i + 1) % len(loop)], c), mat)

    def build(self, name, parent, smooth=True):
        bmesh.ops.remove_doubles(self.bm, verts=self.bm.verts[:], dist=1e-6)
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
        obj.parent = parent
        return obj


def ring_angles(loop, center, axes):
    """Angles of loop verts around centre, measured in the plane of the two given axes."""
    a0, a1 = axes
    return [math.atan2(v.co[a1] - center[a1], v.co[a0] - center[a0]) for v in loop]


def body_like(mesh, rings_z, ring_fn, mat_fn, arm_rings=None, leg_rings=None, crotch=None,
              lips=()):
    """Loft the trunk and optionally attach arms and legs.

    ring_fn(z) -> 16 points; mat_fn(z0, z1, k) -> material for a trunk face.
    arm_rings(side, phis) -> list of (points, material) rings going outwards.
    leg_rings(side, phis) -> list of (points, material) rings going down.
    Returns trunk rings and the last arm / leg loops (for caps).
    """
    rings = [mesh.verts(ring_fn(z)) for z in rings_z]
    sock = [rings_z.index(z) for z in SOCKET] if arm_rings else None
    for r in range(len(rings) - 1):
        skip = ()
        if sock and r in (sock[0], sock[1]):
            skip = (3, 4, 11, 12)
        for k in range(N_TRUNK):
            if k in skip:
                continue
            k2 = (k + 1) % N_TRUNK
            mat = mat_fn(rings_z[r], rings_z[r + 1], k)
            mesh.face((rings[r][k], rings[r][k2], rings[r + 1][k2], rings[r + 1][k]), mat)
    ends = {}
    if arm_rings:
        a, m, b = (rings[i] for i in sock)
        for side, ks in ((1, (3, 4, 5)), (-1, (13, 12, 11))):
            hole = [a[ks[0]], a[ks[1]], a[ks[2]], m[ks[2]], b[ks[2]], b[ks[1]], b[ks[0]], m[ks[0]]]
            center = sum((v.co for v in hole), Vector()) / len(hole)
            phis = ring_angles(hole, center, (1, 2))
            prev = hole
            for pts, mat in arm_rings(side, phis):
                cur = mesh.verts(pts)
                mesh.bridge(prev, cur, mat)
                prev = cur
            ends[("arm", side)] = prev
    if leg_rings:
        base = rings[0]
        c = mesh.bm.verts.new(crotch)
        for side, ks in ((1, list(range(0, 9))), (-1, list(range(8, 16)) + [0])):
            loop = [base[k] for k in ks] + [c]
            cx, cy, _, _ = interp(LEG, LEG[0][0])
            phis = [math.atan2(v.co.y - cy, side * v.co.x - cx) for v in loop]
            prev = loop
            ends[("legs", side)] = [loop]
            for pts, mat in leg_rings(side, phis):
                cur = mesh.verts(pts)
                mesh.bridge(prev, cur, mat)
                prev = cur
                ends[("legs", side)].append(cur)
            ends[("leg", side)] = prev
    return rings, ends


def loft(mesh, rings, mats, closed=True, cap_start=None, cap_end=None):
    vs = [mesh.verts(r) for r in rings]
    for i in range(len(vs) - 1):
        mesh.bridge(vs[i], vs[i + 1], mats[i] if isinstance(mats, list) else mats, closed)
    if cap_start is not None:
        mesh.fan(vs[0], cap_start[0], cap_start[1])
    if cap_end is not None:
        mesh.fan(vs[-1], cap_end[0], cap_end[1])
    return vs


# --------------------------------------------------------------------------
# Body
# --------------------------------------------------------------------------

def thetas(n=N_TRUNK):
    return [2 * math.pi * k / n for k in range(n)]


def build_body(m, parent):
    mesh = Mesh()
    skin = m["Skin"]

    def ring(z):
        pts = [trunk_point(z, th) for th in thetas()]
        if abs(z - 1.545) < 1e-6:  # nose tip
            pts[0].y -= 0.018
        if abs(z - 1.578) < 1e-6:  # bridge of the nose, eye sockets
            pts[0].y -= 0.009
            pts[1].y += 0.004
            pts[15].y += 0.004
        if abs(z - 1.515) < 1e-6:
            pts[0].y -= 0.004
        return pts

    def arms(side, phis):
        xs = [row[0] for row in ARM]
        return [([arm_point(side, x, p) for p in phis], skin) for x in xs]

    def legs(side, phis):
        zs = [row[0] for row in LEG]
        return [([leg_point(side, z, p) for p in phis], skin) for z in zs]

    rings, ends = body_like(mesh, TRUNK_RINGS, ring, lambda *a: skin, arms, legs, CROTCH)
    top = rings[-1]
    mesh.fan(top, (0, 0.004, HEAD_TOP), skin)
    for side in (1, -1):
        cy, cz, _, _ = interp(ARM, FINGERTIP)
        mesh.fan(ends[("arm", side)], (side * FINGERTIP, cy, cz - 0.001), skin)
        cx, cy, _, _ = interp(LEG, 0.085)
        mesh.fan(ends[("leg", side)], (side * cx, cy, 0.07), skin)
        # thumb
        base = Vector((side * 0.668, -0.018, 1.316))
        tip = Vector((side * 0.738, -0.056, 1.308))
        axis = (tip - base).normalized()
        u = axis.cross(Vector((0, 0, 1))).normalized()
        v = u.cross(axis)
        rings_t = []
        for t, r in ((0.0, 0.014), (0.45, 0.012), (0.85, 0.010)):
            c = base.lerp(tip, t)
            rings_t.append([c + (u * math.cos(a) + v * math.sin(a)) * r for a in thetas(6)])
        loft(mesh, rings_t, skin, cap_start=(base - axis * 0.004, skin), cap_end=(tip + axis * 0.004, skin))
        # foot (hidden by the slipper, but keeps the body usable on its own)
        loft(mesh, foot_rings(side, 0.0), skin,
             cap_start=((side * FOOT_X, FOOT[0][0] + 0.004, 0.022), skin),
             cap_end=((side * FOOT_X, FOOT[-1][0] - 0.004, 0.012), skin))
    return mesh.build("Anna_Body", parent)


def foot_rings(side, off, n=8, rows=None):
    rows = rows or FOOT
    out = []
    for y, hw, zb, zt in rows:
        cz, hz = (zb + zt) / 2, (zt - zb) / 2
        out.append([Vector((side * FOOT_X + (hw + off) * spow(math.cos(a), 0.8),
                            y, cz + (hz + off) * spow(math.sin(a), 0.8)))
                    for a in thetas(n)])
    return out


# --------------------------------------------------------------------------
# Face details
# --------------------------------------------------------------------------

def ellipsoid(mesh, center, radii, normal, mat, seg=8, rings=4):
    """Low-poly ellipsoid whose local -Y (its front) faces along normal."""
    f = normal.normalized()
    right = Vector((0, 0, 1)).cross(f).normalized()
    rot = Matrix((right, -f, right.cross(-f))).transposed()
    grid = []
    for i in range(1, rings):
        la = -math.pi / 2 + math.pi * i / rings
        grid.append(mesh.verts([center + rot @ Vector((radii[0] * math.cos(la) * math.cos(a),
                                                        radii[1] * math.cos(la) * math.sin(a),
                                                        radii[2] * math.sin(la)))
                                for a in thetas(seg)]))
    for i in range(len(grid) - 1):
        mesh.bridge(grid[i], grid[i + 1], mat)
    mesh.fan(grid[0], center + rot @ Vector((0, 0, -radii[2])), mat)
    mesh.fan(grid[-1], center + rot @ Vector((0, 0, radii[2])), mat)


def surface_normal(z, th):
    d = 1e-3
    p = trunk_point(z, th)
    t1 = trunk_point(z, th + d) - p
    t2 = trunk_point(z + d, th) - p
    return t1.cross(t2).normalized()


EYE_Z = 1.578
MOUTH_Z = 1.515


def build_face(m, parent):
    mesh = Mesh()
    for side in (1, -1):
        th = side * 0.44
        n = surface_normal(EYE_Z, th)
        ellipsoid(mesh, trunk_point(EYE_Z, th) + n * 0.001, (0.013, 0.004, 0.0065), n, m["Eye"])
        th = side * 0.46
        n = surface_normal(EYE_Z + 0.021, th)
        ellipsoid(mesh, trunk_point(EYE_Z + 0.021, th) + n * 0.002, (0.017, 0.003, 0.003), n, m["Brow"])
    n = surface_normal(MOUTH_Z, 0.0)
    ellipsoid(mesh, trunk_point(MOUTH_Z, 0.0) + Vector((0, -0.004, 0)), (0.019, 0.006, 0.0045), n, m["Lips"])
    return mesh.build("Anna_Face", parent)


# --------------------------------------------------------------------------
# T-shirt
# --------------------------------------------------------------------------

SHIRT_OFF = 0.008
SHIRT_HEM = 1.040
SLEEVE_END = 0.33


def build_shirt(m, parent):
    mesh = Mesh()
    red = m["Shirt"]
    zs = [SHIRT_HEM, 1.085, 1.135, 1.185, 1.235, 1.27, 1.32, 1.37, 1.40]

    def ring(z):
        off = SHIRT_OFF + 0.004 * gauss(z, SHIRT_HEM, 0.03)
        return [trunk_point(z, th, off, fill_cleavage=True) for th in thetas()]

    def sleeves(side, phis):
        out = []
        for x, off in ((0.20, 0.010), (0.26, 0.012), (SLEEVE_END, 0.015)):
            out.append(([arm_point(side, x, p, off) for p in phis], red))
        out.append(([arm_point(side, SLEEVE_END - 0.006, p, 0.003) for p in phis], red))
        return out

    rings, ends = body_like(mesh, zs, ring, lambda *a: red, sleeves)
    # Crew neck: partway from the shoulder ring up the neck, lower at the front
    collar = []
    for k, th in enumerate(thetas()):
        t = 0.30 + 0.35 * (1 - math.cos(th)) / 2
        p0 = trunk_point(1.40, th, SHIRT_OFF)
        p1 = trunk_point(1.43, th, 0.006)
        collar.append(p0.lerp(p1, t))
    cv = mesh.verts(collar)
    mesh.bridge(rings[-1], cv, red)
    inner = mesh.verts([trunk_point(v.co.z - 0.004, th, 0.002) for v, th in zip(cv, thetas())])
    mesh.bridge(cv, inner, red)
    hem_in = mesh.verts([trunk_point(SHIRT_HEM + 0.004, th, 0.002, True) for th in thetas()])
    mesh.bridge(rings[0], hem_in, red)
    return mesh.build("Anna_Shirt", parent)


# --------------------------------------------------------------------------
# Track pants
# --------------------------------------------------------------------------

PANTS_TOP = 0.985
CUFF_Z = 0.215


def pants_leg_off(z, phi):
    """Loose joggers: roomy below the knee, gathered at the cuff, less on the inseam."""
    base = interp([(0.17, 0.014), (0.195, 0.016), (0.215, 0.026), (0.25, 0.031), (0.33, 0.032),
                   (0.42, 0.031), (0.52, 0.028), (0.62, 0.024), (0.72, 0.018)], z)[0]
    inner = max(0.0, -math.cos(phi))
    squeeze = 0.7 * min(1.0, max(0.0, (z - 0.45) / 0.2))
    return base * (1 - squeeze * inner)


def build_pants(m, parent):
    mesh = Mesh()
    grey, stripe = m["Pants"], m["PantsStripe"]
    zs = [0.80, 0.86, 0.92, PANTS_TOP - 0.03, PANTS_TOP]
    offs = {0.80: 0.020, 0.86: 0.016, 0.92: 0.012, PANTS_TOP - 0.03: 0.011, PANTS_TOP: 0.011}

    def ring(z):
        return [trunk_point(z, th, offs[z]) for th in thetas()]

    leg_z = [0.72, 0.62, 0.52, 0.42, 0.33, 0.25, 0.215, 0.195, 0.17]

    def legs(side, phis):
        out = []
        for z in leg_z:
            pts = [leg_point(side, z, p, pants_leg_off(z, p)) for p in phis]
            out.append((pts, grey))
        out.append(([leg_point(side, 0.174, p, 0.004) for p in phis], grey))
        return out

    crotch = Vector(CROTCH) + Vector((0, 0, -0.012))
    rings, ends = body_like(mesh, zs, ring, lambda *a: grey, leg_rings=legs, crotch=crotch)
    inner = mesh.verts([trunk_point(PANTS_TOP - 0.006, th, 0.002) for th in thetas()])
    mesh.bridge(rings[-1], inner, grey)
    # Side stripes: a narrow ribbon along the outer vertex column of each leg,
    # which is index 4 of every leg loop and k = 4 / 12 of the trunk rings.
    for side, k in ((1, 4), (-1, 12)):
        col = [(r[k], r[k - 1], r[k + 1]) for r in reversed(rings[1:])]
        col += [(lp[4], lp[3], lp[5]) for lp in ends[("legs", side)][:-2]]
        strip = []
        for v, a, b in col:
            out = Vector((side * 0.0025, 0, 0))
            strip.append([v.co + (a.co - v.co).normalized() * 0.011 + out, v.co + out,
                          v.co + (b.co - v.co).normalized() * 0.011 + out])
        loft(mesh, strip, stripe, closed=False)
    obj = mesh.build("Anna_Pants", parent)
    add_drawstring(m, obj)
    return obj


def add_drawstring(m, pants):
    mesh = Mesh()
    cord = m["Cord"]
    for side in (1, -1):
        top = trunk_point(PANTS_TOP - 0.012, side * 0.10, 0.013)
        pts = [top + Vector((side * 0.004 * t, -0.004 * t, -0.075 * t)) for t in (0, 0.33, 0.66, 1.0)]
        rings = [[p + Vector((0.0028 * math.cos(a), 0.0028 * math.sin(a), 0)) for a in thetas(5)] for p in pts]
        loft(mesh, rings, cord, cap_end=(pts[-1] + Vector((0, 0, -0.004)), cord))
    return mesh.build("Anna_Drawstring", pants)


# --------------------------------------------------------------------------
# Socks and slippers
# --------------------------------------------------------------------------

def build_feet(m, parent):
    mesh = Mesh()
    sock, sock_red = m["Sock"], m["SockStripe"]
    slipper, sole = m["Slipper"], m["Sole"]
    ph = thetas(10)
    for side in (1, -1):
        # Slouchy sock: z, offset, material of the band above
        bands = [(0.050, 0.004, sock), (0.085, 0.006, sock), (0.110, 0.011, sock_red),
                 (0.118, 0.011, sock), (0.135, 0.010, sock_red), (0.143, 0.011, sock),
                 (0.165, 0.012, sock), (0.200, 0.006, sock)]
        rings = [[leg_point(side, z, p, off) for p in ph] for z, off, _ in bands]
        loft(mesh, rings, [b[2] for b in bands[1:]])
        # Slipper: an oversized foot, plus a flat sole
        rows = [(y, hw + 0.002, max(zb, 0.012), min(zt, 0.070)) for y, hw, zb, zt in FOOT]
        rows[0] = (rows[0][0] + 0.004, rows[0][1], 0.012, 0.050)
        rs = foot_rings(side, 0.010, rows=rows)
        loft(mesh, rs, slipper,
             cap_start=((side * FOOT_X, rows[0][0] + 0.014, 0.034), slipper),
             cap_end=((side * FOOT_X, rows[-1][0] - 0.014, 0.024), slipper))
        so = [(y, hw + 0.006, 0.0, 0.016) for y, hw, _, _ in rows]
        so[0] = (so[0][0] + 0.006, so[0][1], 0.0, 0.016)
        so[-1] = (so[-1][0] - 0.008, so[-1][1], 0.0, 0.016)
        rs = foot_rings(side, 0.004, rows=so)
        for r in rs:
            for v in r:
                v.z = max(v.z, 0.0)
        loft(mesh, rs, sole,
             cap_start=((side * FOOT_X, so[0][0] + 0.010, 0.008), sole),
             cap_end=((side * FOOT_X, so[-1][0] - 0.010, 0.008), sole))
    return mesh.build("Anna_Feet", parent)


# --------------------------------------------------------------------------
# Accessories
# --------------------------------------------------------------------------

def build_accessories(m, parent):
    mesh = Mesh()
    # Watch on her left wrist (+X)
    x0, x1 = 0.615, 0.640
    ph = thetas(8)
    rings = [[arm_point(1, x, p, 0.005) for p in ph] for x in (x0, x1)]
    inner = [[arm_point(1, x, p, 0.001) for p in ph] for x in (x1, x0)]
    loft(mesh, rings + inner + [rings[0]], m["Watch"])
    face_c = arm_point(1, (x0 + x1) / 2, math.pi / 2, 0.006)
    ellipsoid(mesh, face_c, (0.011, 0.009, 0.004), Vector((0, 0, 1)), m["Silver"], seg=8, rings=3)
    # Pendant on a thin chain, resting on the shirt
    chain = []
    for i in range(13):
        t = i / 12
        th = -math.pi * 0.62 + t * math.pi * 1.24
        z = 1.428 - 0.12 * (math.cos(th / 1.24) ** 2)
        chain.append(trunk_point(z, th, SHIRT_OFF + 0.004) if abs(th) < 1.4 else trunk_point(1.428, th, 0.006))
    back = [trunk_point(1.428, th, 0.006) for th in (math.pi * 0.75, math.pi, math.pi * 1.25)]
    path = chain + back
    for i in range(len(path)):
        a, b = path[i], path[(i + 1) % len(path)]
        d = (b - a).normalized()
        u = d.cross(Vector((0, 0, 1))).normalized() * 0.0012
        v = d.cross(u).normalized() * 0.0012
        loft(mesh, [[a + u, a + v, a - u, a - v], [b + u, b + v, b - u, b - v]], m["Silver"])
    tip = trunk_point(1.300, 0.0, SHIRT_OFF + 0.006, True)
    ellipsoid(mesh, tip + Vector((0, 0, -0.008)), (0.008, 0.004, 0.012), Vector((0, -1, 0)),
              m["Turquoise"], seg=6, rings=3)
    return mesh.build("Anna_Accessories", parent)


# --------------------------------------------------------------------------
# Hair: a cap over the scalp plus layered clumps (shaggy 90s mullet)
# --------------------------------------------------------------------------

SCALP_TOP = 1.674  # highest trunk ring; the pole above it is too flat to grow hair from


def head_point(th, z, off):
    z = min(z, SCALP_TOP)
    return trunk_point(z, th) + surface_normal(z, th) * off


def hair_surface(th, z, off):
    """Scalp surface, but falling straight down below the skull instead of hugging the neck."""
    zc = max(z, 1.53)
    p = head_point(th, zc, off)
    p.z -= zc - z
    return p


def wrap(th):
    return abs(math.atan2(math.sin(th), math.cos(th)))


def front_hairline(th):
    a = wrap(th)
    return 1.636 if a < 1.05 else 1.636 - (a - 1.05) * 0.3


def build_hair(m, parent):
    rnd = random.Random(7)
    light, dark = m["Hair"], m["HairDark"]

    cap = Mesh()
    cols = 20
    zs = [1.50, 1.53, 1.56, 1.59, 1.612, 1.636, 1.655, 1.668, SCALP_TOP]
    grid = [[head_point(2 * math.pi * k / cols, z, 0.010) for k in range(cols)] for z in zs]
    vs = [cap.verts(r) for r in grid]
    for i in range(len(zs) - 1):
        for k in range(cols):
            th = 2 * math.pi * (k + 0.5) / cols
            zmid = (zs[i] + zs[i + 1]) / 2
            if zmid < front_hairline(th) and wrap(th) < 1.3:
                continue
            if zmid < 1.53 and wrap(th) < 1.7:
                continue
            k2 = (k + 1) % cols
            cap.face((vs[i][k], vs[i][k2], vs[i + 1][k2], vs[i + 1][k]), dark)
    cap.fan(vs[-1], (0, 0.004, HEAD_TOP + 0.012), dark)
    cap_obj = cap.build("Anna_HairCap", parent, smooth=False)

    mesh = Mesh()

    def clump(th0, z1, width, flare, lift, twist=0.0, z0=SCALP_TOP, segs=4, crown=True):
        """A tapered, triangular lock from the scalp at th0 down to height z1.

        Crown locks start at the top of the head and lie over it, so the top
        stays round instead of turning into a ring of spikes.
        """
        pts, norms = [], []
        if crown:
            pts.append(Vector((0.018 * math.sin(th0), 0.004 - 0.018 * math.cos(th0), HEAD_TOP + 0.010)))
            norms.append(Vector((0, 0, 1)))
        for i in range(segs + 1):
            t = i / segs
            th = th0 + twist * t
            z = z0 + (z1 - z0) * t
            off = 0.012 + lift * math.sin(math.pi * min(1.0, t * 1.4)) ** 0.7 + flare * t ** 1.5
            pts.append(hair_surface(th, z, off))
            norms.append(surface_normal(max(min(z, SCALP_TOP), 1.53), th))
        rings = []
        segs = len(pts) - 1
        for i, (p, n) in enumerate(zip(pts, norms)):
            t = i / segs
            along = pts[min(i + 1, segs)] - pts[max(i - 1, 0)]
            side = along.cross(n).normalized()
            w = width * (1 - 0.9 * t ** 1.3)
            h = width * 0.4 * (1 - 0.8 * t)
            rings.append([p + side * w - n * 0.004, p + n * h, p - side * w - n * 0.004])
        vs = [mesh.verts(r) for r in rings[:-1]]
        tip = mesh.bm.verts.new(pts[-1])
        mat = light if rnd.random() < 0.72 else dark
        for i in range(len(vs) - 1):
            mesh.bridge(vs[i], vs[i + 1], mat)
        for i in range(3):
            mesh.face((vs[-1][i], vs[-1][(i + 1) % 3], tip), mat)
        mesh.face((vs[0][0], vs[0][1], vs[0][2]), mat)

    j = rnd.uniform
    # Crown: short layers radiating from the top give the rounded volume
    for i in range(18):
        th = 2 * math.pi * i / 18 + j(-0.1, 0.1)
        clump(th, 1.630 + j(-0.01, 0.01), 0.030, 0.010, 0.012, j(-0.2, 0.2), segs=2)
    # Bangs: choppy, down to the brows
    for i in range(12):
        th = -0.95 + 1.9 * i / 11 + j(-0.04, 0.04)
        clump(th, 1.598 + 0.012 * abs(th) + j(-0.006, 0.006), 0.020, 0.010, 0.016, j(-0.12, 0.12))
    for side in (1, -1):
        # Sides: long feathered layer to the jaw, flicking outwards
        for i in range(8):
            th = side * (1.0 + 0.95 * i / 7 + j(-0.04, 0.04))
            clump(th, 1.495 - 0.035 * i / 7 + j(-0.01, 0.01), 0.026, 0.036 + j(0, 0.012), 0.016,
                  side * j(-0.12, 0.08))
        # ...and a shorter shag layer over it
        for i in range(6):
            th = side * (1.05 + 0.9 * i / 5 + j(-0.05, 0.05))
            clump(th, 1.555 + j(-0.01, 0.012), 0.026, 0.034, 0.02, side * j(-0.1, 0.1), segs=3, crown=False)
    # Back: the mullet, past the nape
    for i in range(12):
        th = math.pi * (0.62 + 0.76 * i / 11) + j(-0.04, 0.04)
        clump(th, 1.415 + j(-0.012, 0.02) + 0.035 * abs(math.cos(th)) ** 3, 0.028,
              0.030 + j(0, 0.012), 0.018, j(-0.1, 0.1))
    for i in range(9):
        th = math.pi * (0.64 + 0.72 * i / 8) + j(-0.05, 0.05)
        clump(th, 1.515 + j(-0.01, 0.02), 0.028, 0.038, 0.022, j(-0.1, 0.1), segs=3, crown=False)

    hair = mesh.build("Anna_Hair", parent, smooth=False)
    return cap_obj, hair


# --------------------------------------------------------------------------
# Scene: lights, cameras
# --------------------------------------------------------------------------

def empty(name, parent=None):
    obj = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(obj)
    obj.empty_display_size = 0.2
    obj.parent = parent
    return obj


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


def look_at(obj, target):
    direction = Vector(target) - Vector(obj.location)
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


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


def render_previews(out_dir):
    scene = bpy.context.scene
    out_dir = Path(out_dir).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)
    for cam in (o for o in scene.objects if o.type == "CAMERA"):
        scene.camera = cam
        scene.render.filepath = str(out_dir / f"{cam.name}.png")
        bpy.ops.render.render(write_still=True)
        print(f"Rendered {scene.render.filepath}")
    scene.camera = bpy.data.objects["Cam_Anna_Front"]


def main():
    setup_scene()
    m = make_materials()
    root = empty("Anna")
    build_body(m, root)
    build_face(m, root)
    build_shirt(m, root)
    build_pants(m, root)
    build_feet(m, root)
    build_accessories(m, root)
    build_hair(m, root)
    build_studio()

    tris = sum(len(p.vertices) - 2 for o in bpy.data.objects if o.type == "MESH" for p in o.data.polygons)
    print(f"Anna: {tris} triangles")

    BLEND_PATH.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))
    print(f"Saved {BLEND_PATH}")

    if "--no-export" not in ARGS:
        GLB_PATH.parent.mkdir(parents=True, exist_ok=True)
        bpy.ops.object.select_all(action="DESELECT")
        for obj in [root, *root.children_recursive]:
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


main()
