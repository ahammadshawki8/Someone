# Builds the Someone victim: a realistic middle-aged man (MakeHuman / MPFB,
# CC0 assets) lying on his back, and exports a GLB for Lens Studio with a
# "Compress" shape key: the sternum dips about 3 cm with a smooth falloff
# while the back stays on the ground. The Lens plays it on every push.
#
# Run: blender -b -P tools/blender/build_human.py -- <out.glb> [preview.png]
#
# Output coordinates (Blender, meters): X along the body (head toward -X),
# Y lateral, Z up, floor at Z = 0, sternum (hand position) at X = Y = 0.
import math
import os
import sys

import bpy
from mathutils import Vector

from bl_ext.user_default.mpfb.services.humanservice import HumanService
from bl_ext.user_default.mpfb.services.locationservice import LocationService
from bl_ext.user_default.mpfb.services.targetservice import TargetService

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[0] if argv else "human.glb"
PREVIEW = argv[1] if len(argv) > 1 else None
D = LocationService.get_user_data()
TEX_MAX = 1024
COMPRESS_DEPTH = 0.03  # meters; a visual cue only, never reported as depth
COMPRESS_SIGMA = 0.085

bpy.ops.wm.read_factory_settings(use_empty=True)

macro = TargetService.get_default_macro_info_dict()
macro.update({"gender": 1.0, "age": 0.69, "muscle": 0.45, "weight": 0.6, "height": 0.5})
macro["race"] = {"asian": 0.1, "caucasian": 0.8, "african": 0.1}
basemesh = HumanService.create_human(mask_helpers=True, detailed_helpers=False, extra_vertex_groups=True,
                                     feet_on_ground=True, scale=0.1, macro_detail_dict=macro)
HumanService.set_character_skin(os.path.join(D, "skins/middleage_caucasian_male/middleage_caucasian_male.mhmat"),
                                basemesh, skin_type="GAMEENGINE")
for rel, kind in [
    ("eyes/low-poly/low-poly.mhclo", "Eyes"),
    ("eyebrows/eyebrow001/eyebrow001.mhclo", "Eyebrows"),
    ("hair/short02/short02.mhclo", "Hair"),
    ("clothes/male_casualsuit06/male_casualsuit06.mhclo", "Clothes"),
    ("clothes/shoes02/shoes02.mhclo", "Clothes"),
]:
    try:
        HumanService.add_mhclo_asset(os.path.join(D, rel), basemesh, asset_type=kind, subdiv_levels=0,
                                     material_type="MAKESKIN", set_up_rigging=False)
    except Exception as e:  # keep going without an optional asset
        print("ASSET_FAIL", rel, e)

# Apply every modifier (fitting, helper mask), then join into one mesh.
meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
for o in meshes:
    bpy.context.view_layer.objects.active = o
    # Bake the body targets first: modifiers cannot apply over shape keys.
    if o.data.shape_keys:
        bpy.ops.object.shape_key_remove(all=True, apply_mix=True)
    for m in list(o.modifiers):
        try:
            bpy.ops.object.modifier_apply(modifier=m.name)
        except Exception as e:
            print("MOD_FAIL", o.name, m.name, e)
bpy.ops.object.select_all(action="DESELECT")
for o in meshes:
    o.select_set(True)
bpy.context.view_layer.objects.active = basemesh
bpy.ops.object.join()
body = bpy.context.active_object
body.name = "VictimHuman"
for o in [o for o in bpy.context.scene.objects if o.type != "MESH"]:
    bpy.data.objects.remove(o, do_unlink=True)

# Stand -> lie on the back, head toward -X.
body.rotation_euler = (math.radians(-90), 0.0, math.radians(90))
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

vs = body.data.vertices
xs = [v.co.x for v in vs]
height = max(xs) - min(xs)
head_x = min(xs)
# Sternum (CPR hand position, lower half of the breastbone) at about 28% of
# body length below the top of the head.
sx = head_x + 0.28 * height
zmin = min(v.co.z for v in vs)
cy = sum(v.co.y for v in vs) / len(vs)
for v in vs:
    v.co.x -= sx
    v.co.y -= cy
    v.co.z -= zmin
top = max(v.co.z for v in vs if abs(v.co.x) < 0.03 and abs(v.co.y) < 0.03)
print("HEIGHT", round(height, 3), "CHEST_TOP_AT_STERNUM", round(top, 4))


def surface_z(x, y, r=0.025):
    zs = [v.co.z for v in vs if abs(v.co.x - x) < r and abs(v.co.y - y) < r]
    return round(max(zs), 4) if zs else None


# AED pad spots, in Lens Studio terms: victim's upper right chest and lower
# left side. Lens z = -Blender y, so the victim's right is Blender -y.
print("PAD_UPPER_RIGHT_Z", surface_z(-0.10, -0.09), "PAD_LOWER_LEFT_Z", surface_z(0.12, 0.13))

# Compress shape key: front of the chest dips, back stays on the ground.
body.shape_key_add(name="Basis")
sk = body.shape_key_add(name="Compress")
for i, v in enumerate(vs):
    p = v.co
    r2 = p.x * p.x + p.y * p.y
    fall = math.exp(-r2 / (2 * COMPRESS_SIGMA ** 2))
    lift = max(0.0, min(1.0, p.z / max(top, 1e-4)))  # 0 at the back, 1 at the front
    sk.data[i].co = p + Vector((0.0, 0.0, -COMPRESS_DEPTH * fall * lift * lift))

# No logos: paint the small print on the T-shirt chest out to plain shirt white.
import numpy as np  # bundled with Blender

# The print sits on the wearer's upper left chest (Blender +y side), so find
# those shirt faces in 3D and paint their patch of the texture.
shirt_slot = next((i for i, m in enumerate(body.data.materials) if "casualsuit06" in m.name), None)
uv_layer = body.data.uv_layers.active
for img in bpy.data.images:
    if shirt_slot is None or "casualsuit06_diffuse" not in img.name:
        continue
    w, h = img.size
    us, ws_ = [], []
    for poly in body.data.polygons:
        c = poly.center
        if poly.material_index != shirt_slot or not (-0.24 < c.x < 0.0 and 0.0 < c.y < 0.17 and c.z > 0.17):
            continue
        for li in poly.loop_indices:
            uv = uv_layer.data[li].uv
            us.append(uv.x)
            ws_.append(uv.y)
    if not us:
        print("LOGO_REGION_NOT_FOUND")
        continue
    x0, x1 = max(0, int(min(us) * w)), min(w, int(max(us) * w) + 1)
    y0, y1 = max(0, int(min(ws_) * h)), min(h, int(max(ws_) * h) + 1)
    px = np.array(img.pixels[:], dtype=np.float32).reshape(h, w, 4)
    box = px[y0:y1, x0:x1]
    lum = box[..., :3].mean(axis=2)
    shirt = np.median(box[lum > np.percentile(lum, 50)][:, :3], axis=0)
    # Replace only what differs from the shirt cloth (the print), keep the weave.
    diff = np.abs(box[..., :3] - shirt).max(axis=2)
    box[diff > 0.12, :3] = shirt
    px[y0:y1, x0:x1] = box
    img.pixels[:] = px.ravel()
    img.update()
    print("LOGO_REMOVED", (x0, y0, x1, y1), shirt)

# Keep textures light for the Lens.
for img in bpy.data.images:
    if img.size[0] > TEX_MAX or img.size[1] > TEX_MAX:
        s = TEX_MAX / max(img.size)
        img.scale(max(1, int(img.size[0] * s)), max(1, int(img.size[1] * s)))

print("FACES", len(body.data.polygons), "MATERIALS", [m.name for m in body.data.materials])
bpy.ops.object.select_all(action="DESELECT")
body.select_set(True)
bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", use_selection=True, export_yup=True,
                          export_apply=False, export_morph=True, export_image_format="JPEG")

if PREVIEW:
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1200
    scene.render.resolution_y = 700
    scene.render.filepath = PREVIEW
    world = bpy.data.worlds.new("w")
    world.color = (0.6, 0.6, 0.6)
    scene.world = world
    sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
    sun.data.energy = 3.0
    sun.rotation_euler = (math.radians(40), 0, math.radians(30))
    scene.collection.objects.link(sun)
    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
    scene.collection.objects.link(cam)
    cam.location = (0.35, 0.9, 1.6)
    target = Vector((0.3, 0.0, 0.1))
    cam.rotation_euler = (target - cam.location).to_track_quat("-Z", "Y").to_euler()
    cam.data.lens = 35
    scene.camera = cam
    bpy.ops.render.render(write_still=True)
