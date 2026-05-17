# 手動續寫指南 (Handover Resume Guide)

> **最後更新**: 2026-05-17  
> **當前版本**: v2.0.0-alpha (Topology Selection System)  
> **開發進度**: Phase 3 (Measurement & Mass Properties) - 初始階段

---

## 📋 專案概覽

### 專案定位
對標 SolidWorks 的專業 3D CAD 建模工具，採用 Client-Server 架構：
- **前端**: Next.js 14+ + React Three Fiber
- **後端**: FastAPI + PythonOCC (OpenCASCADE)
- **狀態管理**: Zustand

### 技術棧
| 層級 | 技術 | 用途 |
|------|------|------|
| Frontend | Next.js 14+ | App Router, Server Components |
| 3D Rendering | React Three Fiber + Three.js | 3D viewport, mesh rendering |
| State | Zustand | Feature tree, sketch state |
| Backend | FastAPI | REST API, session management |
| Kernel | PythonOCC | B-Rep modeling, boolean ops |
| Styling | Glass Order Tokens | SolidWorks-style UI |

---

## 🏗️ 當前系統架構

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Viewport    │  │  FeatureTree │  │  PropertyManager │  │
│  │  (Three.js)  │  │  (Sidebar)   │  │  (Properties)    │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
│         │                  │                   │              │
│         └──────────────────┴───────────────────┘              │
│                            │                                  │
│                  ┌─────────▼─────────┐                       │
│                  │  Zustand Store    │                       │
│                  │  (State Mgmt)     │                       │
│                  └─────────┬─────────┘                       │
└────────────────────────────┼────────────────────────────────┘
                             │ HTTP API
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend (FastAPI)                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  /api/v1/geometry Router                             │   │
│  │  - /box, /cylinder, /sphere                          │   │
│  │  - /rebuild (Feature Tree Processing)                │   │
│  └───────────────────────┬──────────────────────────────┘   │
│                          │                                   │
│                  ┌───────▼───────┐                           │
│                  │  Geometry     │                           │
│                  │  Service      │                           │
│                  └───────┬───────┘                           │
└──────────────────────────┼──────────────────────────────────┘
                           │ OCCT Calls
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  PythonOCC Kernel                           │
│  - BRepPrimAPI (Primitives)                                 │
│  - BRepAlgoAPI (Boolean Ops)                                │
│  - GC_MakeArcOfCircle (Arcs)                                │
│  - TopExp_Explorer (Topology)                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 專案目錄結構

```
3D-Builder/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # Main UI (CommandManager, FeatureTree, etc.)
│   │   ├── layout.tsx
│   │   └── globals.css        # Glass Order tokens
│   ├── kernel/                # Backend communication
│   │   ├── HeavyEngineClient.ts
│   │   └── TopologySelector.ts  # [NEW] v2.0.0-alpha
│   ├── renderer/              # Three.js components
│   │   ├── Viewport.tsx
│   │   ├── OcctShape.tsx
│   │   ├── DatumPlanes.tsx
│   │   └── SketchPreview.tsx
│   ├── store/                 # Zustand state
│   │   └── useCadStore.ts
│   ├── ui/                    # UI components (future)
│   └── utils/                 # CAD utilities (future)
├── backend/
│   └── app/
│       ├── main.py           # FastAPI app
│       ├── routers/
│       │   └── geometry.py   # API endpoints
│       └── services/
│           └── geometry_service.py  # OCCT kernel
├── docs/
│   ├── plans/                # Development plans
│   │   ├── 2026-05-16-3d-modeler-bootstrap.md
│   │   └── 2026-05-17-handover-continuation.md  # [NEW]
│   ├── architecture/
│   │   ├── SYSTEM_DESIGN.md
│   │   └── SOLIDWORKS_FEATURE_ROADMAP.md
│   └── handover_resume_guide.md  # This file
├── assets/                    # Images, icons
├── .github/workflows/         # CI/CD
└── next.config.ts
```

---

## 🎯 開發階段 (PDCA Cycle)

### Phase 1: Infrastructure & Core Kernel ✅
- [x] Thin Client UI (Next.js)
- [x] Render Engine (Three.js)
- [x] PythonOCC Backend Server
- [x] B-Rep to Mesh Pipeline

### Phase 2: Basic Part Modeling ✅
- [x] 2D Sketch Engine (Lines, Arcs)
- [x] Geometric Constraints (Horizontal, Vertical, etc.)
- [x] Base Features (Extrude, Revolve)
- [x] Boolean Operations (ADD, CUT)

### Phase 3: Selection & Measurement 🔄 **CURRENT**
- [ ] Topology Selection (Face/Edge/Vertex)
- [ ] Measurement Tool (Distance, Angle, Area, Volume)
- [ ] Mass Properties (CoG, Inertia)

### Phase 4: Advanced Feature Engineering (Future)
- [ ] Fillet, Chamfer
- [ ] Sweep, Loft, Shell
- [ ] Patterning

### Phase 5: Assembly Architecture (Future)
- [ ] Assembly Tree
- [ ] Mates (Coincident, Parallel, etc.)

### Phase 6: 2D Drafting (Future)
- [ ] Orthographic Projection
- [ ] Hidden Line Removal
- [ ] BOM Generation

---

## 🔧 當前開發狀態 (v2.0.0-alpha)

### 已完成
- [x] Topology Selection System foundation
- [x] Raycaster-based selection infrastructure
- [x] Zustand state extension (`selectedTopology`)
- [x] Viewport click handler integration
- [x] TypeScript compilation (Exit code 0)

### 待完成
- [ ] Topology highlighting (visual feedback)
- [ ] OCCT TopoDS mapping (Three.js → OCCT)
- [ ] Measurement tool implementation
- [ ] Mass properties calculation

### 最近變更
1. **TopologySelector.ts** - 新增核心選取模組
2. **useCadStore.ts** - 擴展 `selectedTopology` 狀態
3. **Viewport.tsx** - 添加點擊處理器
4. **handover_resume_guide.md** - 建立續寫文檔

---

## 🚀 快速開始

### 環境準備
```bash
# 前端
npm install
npm run dev  # Start Next.js dev server

# 後端
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install fastapi uvicorn pythonocc-core
uvicorn app.main:app --reload --port 8000
```

### 開發流程
1. 修改前端代碼 → Next.js 自動重載
2. 修改後端代碼 → Uvicorn 自動重載
3. 重啟前端以測試 API 變更

### 重要端點
- `GET /` - Engine health check
- `POST /api/v1/geometry/box` - Create box primitive
- `POST /api/v1/geometry/rebuild` - Process feature tree

---

## 📝 開發規範

### PDCA 循環
所有變更必須遵循:
1. **Plan** - 在 `docs/plans/` 建立計畫文件
2. **Do** - 實作變更
3. **Check** - 驗證 (TypeScript, build, manual test)
4. **Act** - 更新文檔 (`DEV_LOG.md`, `handover_resume_guide.md`)

### 代碼標準
- **前端**: TypeScript, React, Zustand
- **後端**: Python, FastAPI, PythonOCC
- **命名**: 
  - 前端: camelCase
  - 後端: snake_case
- **提交**: 每次變更必須更新 `DEV_LOG.md`

### 禁止事項
- ❌ Vibe Coding (猜測性修復)
- ❌ TODO/TBD (零佔位符計畫)
- ❌ 未記錄的變更

---

## 🔍 診斷與除錯

### 常見問題

#### 1. 後端連線失敗
**現象**: `OCCT 幾何引擎: DISCONNECTED`
**解決**:
```bash
# 檢查後端是否運行
curl http://localhost:8000/
# 應返回: {"message": "3D-Builder Heavy Engine is running", "engine": "OCCT"}
```

#### 2. TypeScript 編譯錯誤
**解決**:
```bash
npx tsc --noEmit
```

#### 3. 3D 視口不顯示
**檢查**:
- 瀏覽器控制台是否有 Three.js 錯誤
- `npm run dev` 是否成功啟動
- `src/renderer/OcctShape.tsx` 是否正確渲染

---

## 📚 關鍵文件

| 文件 | 用途 |
|------|------|
| `docs/plans/2026-05-17-handover-continuation.md` | 本次開發計畫 |
| `docs/architecture/SYSTEM_DESIGN.md` | 系統架構 |
| `docs/architecture/SOLIDWORKS_FEATURE_ROADMAP.md` | 功能藍圖 |
| `DEV_LOG.md` | 開發日誌 (RCA/CAPA) |
| `docs/karpathy_coding_standards.md` | 編程準則 |

---

## 🎓 技術要點

### OCCT 核心類別
- `BRepPrimAPI_MakeBox` - 立方體
- `BRepPrimAPI_MakeCylinder` - 圓柱
- `BRepPrimAPI_MakeSphere` - 球體
- `BRepPrimAPI_MakePrism` - 拉伸 (草圖→實體)
- `BRepAlgoAPI_Fuse` - 布林 ADD
- `BRepAlgoAPI_Cut` - 布林 CUT

### Three.js 核心類別
- `BufferGeometry` - 網格幾何
- `MeshStandardMaterial` - 標準材質
- `Raycaster` - 射線選取
- `OrbitControls` - 視角控制

### Zustand State
```typescript
{
  features: CADFeature[];           // 特徵樹
  sketchPoints: any[];              // 草圖頂點
  sketchRelations: string[];        // 幾何約束
  selectedTopology: any;            // [NEW] 選取的拓撲
  meshData: any[];                  // 網格數據
}
```

---

## 🔄 下一步任務

### 立即 (This Week)
1. **Topology Highlighting**
   - 實作選取時的視覺反饋
   - Face/Edge/Vertex 不同顏色標示

2. **OCCT TopoDS Mapping**
   - 建立 Three.js → OCCT 映射
   - 支援拓撲層級選取

3. **Measurement Tools**
   - 距離測量 (Two vertices)
   - 角度測量 (Two edges)
   - 面積/體積計算

### 本週 (This Week)
4. **Mass Properties**
   - 質心 (Center of Gravity)
   - 慣性矩 (Inertia Tensor)

---

## 📞 支援與資源

### OCCT 文檔
- [Official Documentation](https://dev.opencascade.org/doc/overview/html)
- [PythonOCC Examples](https://github.com/pythonocc/pythonocc-core)

### Three.js 文檔
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction)
- [Three.js Manual](https://threejs.org/docs/)

### FastAPI 文檔
- [FastAPI Tutorial](https://fastapi.tiangolo.com/)
- [PythonOCC with FastAPI](https://github.com/traversaro/pythonocc-fastapi-example)

---

## 📄 版本歷史

| 版本 | 日期 | 變更 |
|------|------|------|
| v1.9.0 | 2026-05-17 | Feature History Sketch Re-entry |
| v1.8.0 | 2026-05-17 | Smart Dimension Solver |
| v1.7.0 | 2026-05-17 | Geometric Constraints Persistence |
| v1.6.0 | 2026-05-17 | Geometric Constraint Solver |
| v1.5.0 | 2026-05-17 | Sketch Tools (Circle, Rectangle, Centerline) |
| v1.4.0 | 2026-05-17 | SolidWorks Light Mode Environment |
| v1.0.0 | 2026-05-16 | Initial Release |

---

**最後更新**: 2026-05-17  
**維護者**: Antigravity AI  
**狀態**: 🔄 Phase 3 Development (Topology Selection)
