import os
import re

file_path = r"C:\Users\3kids\Downloads\3D-Builder\src\app\page.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add DrawingSheet import
if "import { DrawingSheet }" not in content:
    content = content.replace(
        "import { MatePanel } from '@/ui/MatePanel';",
        "import { MatePanel } from '@/ui/MatePanel';\nimport { DrawingSheet } from '@/ui/DrawingSheet';"
    )

# 2. Update activeTab type
content = content.replace(
    "useState<'FEATURES' | 'SKETCH' | 'EVALUATE' | 'ASSEMBLY'>",
    "useState<'FEATURES' | 'SKETCH' | 'EVALUATE' | 'ASSEMBLY' | 'DRAWING'>"
)

# 3. Add DRAWING tab to ribbon
drawing_tab = """          <button
            onClick={() => {
              setActiveTab('DRAWING');
              setMode('DRAWING');
              setMeasurementMode('NONE');
            }}
            className={`px-4 py-1 text-[14px] font-bold tracking-wider transition-all border-b-2 uppercase ${
              activeTab === 'DRAWING'
                ? 'border-primary text-primary bg-[#F5F6F9]/60'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            ?漲 (Drawing)
          </button>"""

if "setActiveTab('DRAWING')" not in content:
    content = content.replace(
        "          <button\n            onClick={() => {\n              setActiveTab('ASSEMBLY')",
        drawing_tab + "\n" + "          <button\n            onClick={() => {\n              setActiveTab('ASSEMBLY')"
    )

# 4. Add DRAWING ribbon content
drawing_content = """          ) : activeTab === 'DRAWING' ? (
            <div className="flex items-center gap-1.5 h-full">
              <button
                onClick={() => {
                  alert('Generate HLR Projections...');
                }}
                className="h-[52px] px-3 rounded hover:bg-slate-200/80 active:bg-slate-300 transition-all flex flex-col items-center justify-center gap-1 group"
              >
                <span className="text-lg">??</span>
                <span className="text-[13px] text-slate-800 font-bold leading-none">???潘撩</span>
              </button>
              
              <button
                onClick={() => {
                  alert('Export to PDF...');
                }}
                className="h-[52px] px-3 rounded hover:bg-slate-200/80 active:bg-slate-300 transition-all flex flex-col items-center justify-center gap-1 group"
              >
                <span className="text-lg">??</span>
                <span className="text-[13px] text-slate-800 font-bold leading-none">?? PDF</span>
              </button>
            </div>"""

if "activeTab === 'DRAWING'" not in content:
    content = content.replace(
        "          ) : activeTab === 'ASSEMBLY' ? (",
        drawing_content + "\n" + "          ) : activeTab === 'ASSEMBLY' ? ("
    )

# 5. Add DrawingSheet to main viewport area
# We need to replace the Viewport with DrawingSheet if activeTab is DRAWING
old_viewport_block = """          <Viewport>
            {activeTab === 'ASSEMBLY' && components.length > 0 ? ("""

new_viewport_block = """          {activeTab === 'DRAWING' ? (
            <DrawingSheet />
          ) : (
            <Viewport>
              {activeTab === 'ASSEMBLY' && components.length > 0 ? ("""

# Need to find the end of the Viewport to add the closing parenthesis
if "activeTab === 'DRAWING' ?" not in content:
    content = content.replace(old_viewport_block, new_viewport_block)
    # Close the Viewport block
    content = content.replace("</Viewport>", "</Viewport>\n          )}")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("page.tsx updated for 2D Drafting")
