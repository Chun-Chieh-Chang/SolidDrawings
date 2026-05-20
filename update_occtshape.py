import os

file_path = r"C:\Users\3kids\Downloads\3D-Builder\src\renderer\OcctShape.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Update Props interface
old_props = """interface OcctShapeProps {
  data: MeshData;
  color?: string;
}"""

new_props = """interface OcctShapeProps {
  data: MeshData;
  color?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
}"""

content = content.replace(old_props, new_props)

# Update component signature
old_sig = """export default function OcctShape({ data, color = '#60A5FA' }: OcctShapeProps) {"""
new_sig = """export default function OcctShape({ 
  data, 
  color = '#60A5FA',
  position = [0, 0, 0],
  rotation = [0, 0, 0]
}: OcctShapeProps) {"""

content = content.replace(old_sig, new_sig)

# Update mesh element
content = content.replace("<mesh geometry={geometry}>", "<mesh geometry={geometry} position={position} rotation={rotation}>")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("OcctShape.tsx updated")
