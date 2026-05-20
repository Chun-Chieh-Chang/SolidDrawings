import os

file_path = r\"C:\Users\3kids\Downloads\3D-Builder\src\app\page.tsx\"

with open(file_path, \"r\", encoding=\"utf-8\") as f:
    content = f.read()

# 1. Add SketchHUD import
content = content.replace(
    \"import { MeasurementPanel } from '@/ui/MeasurementPanel';\",
    \"import { MeasurementPanel } from '@/ui/MeasurementPanel';\\nimport { SketchHUD } from '@/renderer/SketchHUD';\"
)

# 2. Integrate MeasurementPanel in sidebar
old_sidebar = \"\"\"            {isSketchMode ? (
              /* Active Sketch Editor Panel */\"\"\"
new_sidebar = \"\"\"            {isSketchMode ? (
              /* Active Sketch Editor Panel */\"\"\"
# Wait, I need a more unique string for replacement.
# Let's look at the sidebar again.

# Actually, let's replace the specific mode switch logic.
content = content.replace(
    \") : (\",
    \") : measurementMode !== 'NONE' ? (\\n              <MeasurementPanel />\\n            ) : (\"
)
# This might be too generic. I should use the comments.

content = content.replace(
    \"            {isSketchMode ? (\",
    \"            {isSketchMode ? (\"
)

# Let's use the line before FeatureManager Design Tree.
content = content.replace(
    \"            ) : (\\n              /* FeatureManager Design Tree */\",
    \"            ) : measurementMode !== 'NONE' ? (\\n              <MeasurementPanel />\\n            ) : (\\n              /* FeatureManager Design Tree */\"
)

# 3. Replace inline Sketch HUD with SketchHUD component
# I will use a regex-like approach or just find the block.
# The block starts with \"{isSketchMode && (\".
# Since there might be multiple, I'll find the one followed by the HUD div.

hud_start = \"          {isSketchMode && (\\n            <div className=\\\"absolute top-6 left-1/2\"
hud_end = \"          )}\\n\\n          {/* Floating Camera View Orientation Toolbar (Right side) */\"

# I need to be careful with the exact whitespace and content.
# I'll read the file in the script and find the indexes.

start_marker = \"{isSketchMode && (\\n            <div className=\\\"absolute top-6 left-1/2\"
end_marker = \"          )}\\n\\n          {/* Floating Camera View Orientation Toolbar (Right side) */\"

if start_marker in content and end_marker in content:
    start_idx = content.find(start_marker)
    end_idx = content.find(end_marker) + len(\"          )}\")
    new_hud = \"          <SketchHUD onReset={resetSketchSession} onExit={handleExitAndExtrude} />\"
    content = content[:start_idx] + new_hud + content[end_idx:]

with open(file_path, \"w\", encoding=\"utf-8\") as f:
    f.write(content)

