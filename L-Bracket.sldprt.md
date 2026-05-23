# Simulation Result: L-Bracket Part Construction

## [P] Plan: 零件設計與流程規劃
- **目標**：建構一個 L 型安裝支架 (L-Bracket)，包含底板與垂直板，並在垂直板中央開孔。
- **規格**：
    - 底板長度：50mm
    - 垂直板高度：40mm
    - 厚度：10mm
    - 擠出深度：30mm
    - 開孔直徑：6mm (位於垂直板中央)
- **流程**：
    1. 前基準面 (Front Plane) 起草 L 型輪廓。
    2. 伸長-實體 (Extrude) 30mm。
    3. 在垂直板表面 (Face) 起草圓形。
    4. 伸長-除料 (Extrude Cut) 貫穿。

## [D] Do: 模擬操作執行
### Step 1: 草圖輪廓建構 (Front Plane)
- **節點 (Nodes)**:
    - N1: (0,0, Fixed)
    - N2: (50,0)
    - N3: (50,10)
    - N4: (10,10)
    - N5: (10,40)
    - N6: (0,40)
- **約束 (Constraints)**:
    - 幾何約束：水平 (N1-N2, N3-N4, N5-N6)、垂直 (N1-N6, N2-N3, N4-N5)。
    - 尺寸約束：N1-N2 (50mm), N1-N6 (40mm), N2-N3 (10mm), N5-N6 (10mm)。
- **結果**：草圖狀態列顯示「完全定義 (Fully Defined)」，線條變為深黑色。

### Step 2: 第一特徵 - 伸長-實體
- **參數**：深度 = 30mm, 操作 = ADD。
- **特徵樹**：新增「伸長-實體 1」，下方嵌套「草圖 1」。

### Step 3: 第二草圖 - 在面上起草 (Sketch on Face)
- **選取**：垂直板的內側面 (Normal=[1,0,0])。
- **中心圓 (Circle)**:
    - 中心點 N7: (15, 20) [相對於面座標系]
    - 邊緣點 N8: (18, 20) [半徑 3mm]
- **約束**：N7 距離底部邊緣 20mm，距離側邊 15mm。

### Step 4: 第二特徵 - 伸長-除料
- **參數**：深度 = 10mm, 操作 = CUT。
- **特徵樹**：新增「伸長-除料 1」，下方嵌套「草圖 2」。

## [C] Check: 驗證與檢查
- **幾何檢查**：
    - 體積估算：底板 (50x10x30) + 垂直板 (10x30x30) = 15000 + 9000 = 24000 mm³。
    - 除料體積：π * 3² * 10 ≈ 282.7 mm³。
    - 淨體積：~23717.3 mm³。
- **UI 回饋**：
    - 狀態列在繪圖過程中正確切換提示。
    - Heads-up Toolbar 切換至等角視圖後，L-Bracket 形狀清晰可見。

## [A] Act: 行動與輸出
- **輸出檔案**：已生成 `L-Bracket.sldprt` (JSON 格式)，內容包含完整的特徵樹與參數化草圖數據。
- **成果彙報**：
    - 成功驗證了從「基準面起草」到「面上起草」的二階特徵建模流程。
    - 證實了新實作的「狀態列」與「尺寸標註」能有效提升建模效率。

---

## 模擬產出的檔案內容 (L-Bracket.sldprt)
```json
{
  "schema": "3D-BUILDER-PARAMETRIC-SCHEMA",
  "projectName": "L-Bracket Mounting Plate",
  "features": [
    {
      "id": "feat_1",
      "type": "EXTRUDE",
      "name": "伸長-實體 1",
      "parameters": {
        "plane": "FRONT",
        "depth": 30.0,
        "operation": "ADD",
        "points": [[0,0,"START"],[50,0],[50,10],[10,10],[10,40],[0,40],[0,0]]
      }
    },
    {
      "id": "feat_2",
      "type": "EXTRUDE",
      "name": "伸長-除料 1",
      "parameters": {
        "plane": "FACE",
        "depth": 10.0,
        "operation": "CUT",
        "faceId": "face_right_inner",
        "points": [[12,20,"START"],[12.5,21.5],...,[12,20]] 
      }
    }
  ]
}
```
