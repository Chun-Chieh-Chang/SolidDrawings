
import os, ctypes

env = r"C:\Users\USER\AppData\Local\Miniconda3\envs\ocp-env"
dll_dir = r"C:\Users\USER\AppData\Local\Miniconda3\envs\ocp-env\Library\bin"
site = r"C:\Users\USER\AppData\Local\Miniconda3\envs\ocp-env\Lib\site-packages"

# Set PATH first (for DLLs that use GetProcAddress + LoadLibrary)
os.environ['PATH'] = dll_dir + ';' + site + ';' + os.environ.get('PATH', '')

# Use SetDllDirectoryW to modify DLL search order for ALL processes
kernel32 = ctypes.windll.kernel32
kernel32.SetDllDirectoryW(dll_dir)
kernel32.SetDllDirectoryW(site)

# Now try loading OCP.pyd via ctypes with full path
pyd_path = os.path.join(site, 'OCP.cp311-win_amd64.pyd')
print(f"SetDllDirectoryW set to: {dll_dir}")

try:
    ctypes.CDLL(pyd_path)
    print('OCP.pyd via CDLL: OK')
except OSError as e:
    err = ctypes.GetLastError()
    print(f'OCP.pyd via CDLL: FAILED - {e} (error {err})')

# Also try with LoadLibraryEx
h = kernel32.LoadLibraryW(pyd_path)
if h:
    print(f'LoadLibraryW: OK (handle {hex(h)})')
else:
    err = kernel32.GetLastError()
    print(f'LoadLibraryW: FAILED (error {err})')
    
# List what's in site-packages
import os
pyd_files = [f for f in os.listdir(site) if f.endswith('.pyd')]
print(f'Pyd files in site-packages: {pyd_files[:10]}')
