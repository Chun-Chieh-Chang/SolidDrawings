
import sys, os, ctypes, traceback

env = r"C:\Users\USER\AppData\Local\Miniconda3\envs\ocp-env"
dll_dir = r"C:\Users\USER\AppData\Local\Miniconda3\envs\ocp-env\Library\bin"
site = r"C:\Users\USER\AppData\Local\Miniconda3\envs\ocp-env\Lib\site-packages"

# Step 1: Add DLL paths
os.environ['PATH'] = dll_dir + ';' + site + ';' + os.environ.get('PATH', '')

# Step 2: Set DLL directory
try:
    os.add_dll_directory(dll_dir)
    os.add_dll_directory(site)
    os.add_dll_directory(env)
except OSError as e:
    print(f"add_dll_directory failed: {e}")

# Step 3: Try loading the .pyd directly via importlib
import importlib.util
pyd_path = os.path.join(site, 'OCP.cp311-win_amd64.pyd')
print(f"Trying to load: {pyd_path}")
print(f"File exists: {os.path.exists(pyd_path)}")

# Step 4: Try ctypes first
print("Loading OCP.pyd via ctypes...")
try:
    ctypes.CDLL(pyd_path)
    print("ctypes.CDLL: OK")
except OSError as e:
    print(f"ctypes.CDLL: FAILED - {e}")
    print(f"GetLastError: {ctypes.GetLastError()}")

# Step 5: Check what MSVC runtime DLLs are present
msvc_dlls = ['vcruntime140.dll', 'vcruntime140_1.dll', 'msvcp140.dll']
for dll in msvc_dlls:
    found = False
    for p in [os.path.join(dll_dir, dll), os.path.join(site, dll), os.path.join(env, 'Scripts', dll)]:
        if os.path.exists(p):
            found = True
            print(f"{dll}: FOUND at {p}")
            break
    if not found:
        # Check system32
        system32 = os.path.join(os.environ.get('SystemRoot', 'C:\Windows'), 'System32', dll)
        print(f"{dll}: system32={os.path.exists(system32)}")

# Step 6: Check if OCP module subdirectories exist
ocp_dir = os.path.join(site, 'OCP')
if os.path.isdir(ocp_dir):
    subdirs = [d for d in os.listdir(ocp_dir) if os.path.isdir(os.path.join(ocp_dir, d))]
    print(f"OCP subdirs: {subdirs[:5]}... ({len(subdirs)} total)")
else:
    print(f"OCP module directory missing!")
