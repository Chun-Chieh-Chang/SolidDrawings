import os

file_path = r"C:\Users\3kids\Downloads\3D-Builder\src\ui\MatePanel.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("???/button>", "取消</button>")
content = content.replace("??? (Add Mate)", "添加配合 (Add Mate)")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("MatePanel.tsx fixed")
