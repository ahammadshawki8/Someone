# Installs a MakeHuman asset pack zip into MPFB's user data folder.
# Run: blender -b -P tools/blender/install_mpfb_assets.py -- <pack.zip>
import sys
import zipfile

from bl_ext.user_default.mpfb.services.locationservice import LocationService

argv = sys.argv[sys.argv.index("--") + 1:]
data_dir = LocationService.get_user_data()
with zipfile.ZipFile(argv[0], "r") as z:
    z.extractall(data_dir)
print("MPFB_DATA", data_dir)
