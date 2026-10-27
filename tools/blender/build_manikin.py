# Builds the Someone victim stand-in: a seamless, stylized CPR manikin lying
# on its back, at real adult scale, and exports it as a GLB for Lens Studio.
#
# Run: blender -b -P tools/blender/build_manikin.py -- <out.glb> [preview.png]
#
# Coordinates (Blender, meters): X along the body (head toward -X), Y lateral,
# Z up, floor at Z = 0. The sternum (CPR hand position) is at X = 0, Y = 0;
# the chest top there is about 0.22 m. Body parts are ellipsoids, unioned by
# a voxel remesh and smoothed, so the joins read as one sculpted surface.
import math
import sys

import bpy

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[0] if argv else "manikin.glb"
PREVIEW = argv[1] if len(argv) > 1 else None

bpy.ops.wm.read_factory_settings(use_empty=True)

# name: (center xyz, radii xyz, rotation about Y in degrees)
PARTS = {
    "head": ((-0.335, 0.0, 0.100), (0.105, 0.080, 0.098), -12),
    "jaw": ((-0.300, 0.0, 0.085), (0.060, 0.058, 0.070), -25),
    "neck": ((-0.225, 0.0, 0.082), (0.060, 0.055, 0.058), 0),
    "shoulders": ((-0.150, 0.0, 0.088), (0.075, 0.205, 0.080), 0),
    "chest": ((-0.030, 0.0, 0.112), (0.200, 0.178, 0.108), 0),
    "abdomen": ((0.160, 0.0, 0.098), (0.185, 0.158, 0.094), 0),
    "pelvis": ((0.330, 0.0, 0.092), (0.135, 0.166, 0.088), 0),
}
for s, side in (("r", 1), ("l", -1)):
    PARTS.update({
        f"upperarm_{s}": ((-0.005, side * 0.226, 0.056), (0.175, 0.050, 0.050), 0),
        f"forearm_{s}": ((0.245, side * 0.240, 0.046), (0.165, 0.043, 0.041), 0),
        f"hand_{s}": ((0.420, side * 0.246, 0.034), (0.085, 0.044, 0.022), 0),
        f"thigh_{s}": ((0.580, side * 0.090, 0.078), (0.260, 0.080, 0.075), 0),
        f"shin_{s}": ((1.000, side * 0.088, 0.058), (0.250, 0.058, 0.055), 0),
        f"foot_{s}": ((1.240, side * 0.090, 0.075), (0.040, 0.040, 0.072), -15),
    })

objs = []
for name, (c, r, rot_y) in PARTS.items():
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=24, radius=1.0, location=c)
    o = bpy.context.active_object
    o.name = name
    o.scale = r
    o.rotation_euler = (0.0, math.radians(rot_y), 0.0)
    objs.append(o)

bpy.ops.object.select_all(action="DESELECT")
for o in objs:
    o.select_set(True)
bpy.context.view_layer.objects.active = objs[0]
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
bpy.ops.object.join()
body = bpy.context.active_object
body.name = "VictimManikin"

# Union into one surface, then soften the creases where parts meet.
rem = body.modifiers.new("remesh", "REMESH")
rem.mode = "VOXEL"
rem.voxel_size = 0.006
sm = body.modifiers.new("smooth", "CORRECTIVE_SMOOTH")
sm.factor = 0.8
sm.iterations = 40
sm.use_only_smooth = True
dec = body.modifiers.new("decimate", "DECIMATE")
dec.ratio = 0.12
bpy.ops.object.modifier_apply(modifier="remesh")
bpy.ops.object.modifier_apply(modifier="smooth")
bpy.ops.object.modifier_apply(modifier="decimate")
bpy.ops.object.shade_smooth()

# Nothing below the floor.
mn = min((body.matrix_world @ v.co).z for v in body.data.vertices)
if mn < 0:
    for v in body.data.vertices:
        v.co.z -= mn

mat = bpy.data.materials.new("SomeoneFigure")
mat.diffuse_color = (0.80, 0.78, 0.75, 1.0)
body.data.materials.append(mat)

print("faces", len(body.data.polygons))
xs = [v.co.x for v in body.data.vertices]
ys = [v.co.y for v in body.data.vertices]
zs = [v.co.z for v in body.data.vertices]
print("bounds x", min(xs), max(xs), "y", min(ys), max(ys), "z", min(zs), max(zs))
top_at_sternum = max(v.co.z for v in body.data.vertices if abs(v.co.x) < 0.02 and abs(v.co.y) < 0.02)
print("chest top at sternum", top_at_sternum)

bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", use_selection=True, export_yup=True, export_apply=True)

if PREVIEW:
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.display.shading.light = "STUDIO"
    scene.render.resolution_x = 1200
    scene.render.resolution_y = 700
    scene.render.filepath = PREVIEW
    cam_data = bpy.data.cameras.new("cam")
    cam = bpy.data.objects.new("cam", cam_data)
    scene.collection.objects.link(cam)
    cam.location = (0.55, 1.55, 1.05)
    target = (0.45, 0.0, 0.05)
    d = [target[i] - cam.location[i] for i in range(3)]
    cam.rotation_euler = (math.atan2(math.hypot(d[0], d[1]), -d[2]), 0.0, math.atan2(d[1], d[0]) - math.pi / 2)
    cam_data.lens = 35
    scene.camera = cam
    bpy.ops.render.render(write_still=True)
