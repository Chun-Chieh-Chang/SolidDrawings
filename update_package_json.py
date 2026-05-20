import json

file_path = r"C:\Users\3kids\Downloads\3D-Builder\package.json"

with open(file_path, "r", encoding="utf-8") as f:
    data = json.load(f)

if "fileAssociations" not in data["build"]:
    data["build"]["fileAssociations"] = [
        {
            "ext": ["step", "stp"],
            "name": "STEP File",
            "role": "Editor"
        },
        {
            "ext": ["iges", "igs"],
            "name": "IGES File",
            "role": "Editor"
        },
        {
            "ext": ["stl"],
            "name": "STL File",
            "role": "Editor"
        },
        {
            "ext": ["sldprt"],
            "name": "SolidWorks Part",
            "role": "Editor"
        }
    ]

with open(file_path, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2)

print("package.json updated with fileAssociations")
