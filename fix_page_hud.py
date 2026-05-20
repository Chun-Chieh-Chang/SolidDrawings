import os
import re

file_path = r"C:\Users\3kids\Downloads\3D-Builder\src\app\page.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# The mess I made:
# <SketchHUD onReset={resetSketchSession} onExit={handleExitAndExtrude} />
#                  type="button"
#                  ...
#           )}

# I need to find the block starting with <SketchHUD and ending with the next )} after it.
# Actually, the old HUD was {isSketchMode && ( ... )}.
# My patch replaced the START but didn't correctly identify the END because of nesting?

# Let's find the specific mess.
mess_start = '<SketchHUD onReset={resetSketchSession} onExit={handleExitAndExtrude} />'
mess_end = '          )}'

if mess_start in content:
    start_idx = content.find(mess_start)
    # Find the next )} after it.
    end_idx = content.find(mess_end, start_idx) + len(mess_end)
    content = content[:start_idx] + mess_start + content[end_idx:]

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("page.tsx fixed")
