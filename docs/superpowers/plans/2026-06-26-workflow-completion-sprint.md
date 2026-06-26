# Workflow Completion Sprint — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the three biggest workflow gaps (Assembly sub-assemblies, 3D Sketch, BOM multi-level) while fixing the top architectural debt (RibbonController split) and test infrastructure (backend pytest).

**Architecture:** Five independent tasks sequenced by dependency — infrastructure first (test fix + refactor), then three feature tasks that each complete a vertical workflow slice. Each task produces its own testable output.

**Tech Stack:** React 18 + TypeScript + Zustand (frontend), FastAPI + Python + OCC (backend), Jest + pytest (testing).

---

## File Structure Map

### Task 1 — RibbonController 拆分

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/ui/RibbonBar/RibbonController.tsx:1-1457` | 縮減為 tab selector + 佈局容器，import 各 tab 元件 |
| Create | `src/ui/RibbonBar/tabs/FeaturesTab.tsx` | FEATURES tab 所有按鈕 (extract from RibbonController.tsx ~180-280) |
| Create | `src/ui/RibbonBar/tabs/SketchTab.tsx` | SKETCH tab 所有按鈕 |
| Create | `src/ui/RibbonBar/tabs/EvaluateTab.tsx` | EVALUATE tab 所有按鈕 |
| Create | `src/ui/RibbonBar/tabs/AssemblyTab.tsx` | ASSEMBLY tab 所有按鈕 |
| Create | `src/ui/RibbonBar/tabs/DrawingTab.tsx` | DRAWING tab 所有按鈕 |
| Create | `src/ui/RibbonBar/tabs/RenderTab.tsx` | RENDER tab 所有按鈕 |
| Create | `src/ui/RibbonBar/tabs/SurfacingTab.tsx` | SURFACING tab 所有按鈕 |
| Create | `src/ui/RibbonBar/tabs/SheetMetalsTab.tsx` | SHEET_METALS tab 所有按鈕 |
| Test | `src/ui/__tests__/RibbonTabRender.test.tsx` | 各 tab 元件渲染測試 |

### Task 2 — Backend Test Infrastructure 修復

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `backend/tests/conftest.py` | 修正 import chain + OCC mocking |
| Modify | `backend/tests/test_fill_pattern.py` | Fix collection error |
| Modify | `backend/tests/test_thin_feature.py` | Fix collection error |
| Modify | `backend/tests/test_angle_limiter.py` | Fix collection error |
| Modify | `backend/tests/test_api_geometry.py` | Fix collection error |
| Test | Run `pytest backend/tests/ -q` | 全部 passed |

### Task 3 — Sub-assemblies (子組件)

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/store/types.ts:121-135` | CADComponent 增加 children 巢狀結構 |
| Modify | `src/store/assembly-state.ts:57-98` | 新增巢狀 CRUD 動作 (addSubAssembly, addToSubAssembly, removeFromSubAssembly) |
| Create | `src/ui/AssemblyTreePanel.tsx` | 樹狀顯示子組件層級 (+/- 展開摺疊) |
| Modify | backend assembly solver | 支援巢狀 transform 傳播 |
| Test | `src/store/__tests__/assembly-sub.test.ts` | 巢狀組件 CRUD + transform propagation tests |

### Task 4 — 3D Sketch (3D 草圖)

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/store/types.ts:93-108` | SketchNode/SketchEdge 擴充 3D 座標 |
| Modify | `src/store/sketch-state.ts` | 3D sketch mode toggle + 3D 節點操作 |
| Modify | `src/ui/DatumPlanes.tsx` | 3D 草圖模式：三平面顯示 + 空間點選取 |
| Create | `src/ui/tools/Sketch3DTool.ts` | 3D 空間點/線繪製工具 |
| Modify | `src/ui/RibbonBar/tabs/SketchTab.tsx` | 3D Sketch toggle 按鈕 |
| Modify | `backend/api/v1/geometry.py` | 3D sketch solve endpoint |
| Test | `src/utils/__tests__/sketch3d.test.ts` | 3D 約束求解測試 |

### Task 5 — BOM 多階層 (Multi-level BOM)

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/store/types.ts` | BomEntry 型別增加 level/parentId |
| Modify | `src/store/drawing-state.ts` | 階層式 BOM 資料 + update actions |
| Create | `src/ui/DrawingSheet/BomTable.tsx` | 樹狀 BOM 表格 (可展開/摺疊) |
| Modify | `src/ui/DrawingSheet.tsx` | 整合新 BomTable 取代舊 BOM |
| Test | `src/ui/__tests__/BomTable.test.tsx` | BOM 表格渲染 + 層級展開測試 |

---

## Task 1: RibbonController 拆分

**Acceptance Criteria:**
- [ ] RibbonController.tsx 從 1200+ 行降至 150 行以下，僅負責 tab selection state 與佈局
- [ ] 每個 tab 獨立檔案，不互相依賴
- [ ] 所有 tab 按鈕功能完全等價於拆分前（回歸測試：逐個點擊確認行為一致）
- [ ] `tsc --noEmit` 零錯誤
- [ ] 每個 tab 元件至少有 1 個 render test (smoke test)
- [ ] `npx jest` 全部通過

### Subtask 1.1: 建立 tabs/ 目錄與骨架元件

- [ ] **Step 1: 建立目錄與 8 個骨架檔案**

建立 `src/ui/RibbonBar/tabs/` 目錄。

```typescript
// src/ui/RibbonBar/tabs/FeaturesTab.tsx — skeleton
import React from 'react';
interface FeaturesTabProps {
  setActiveTab: (tab: string) => void;
  setHint: (hint: string) => void;
  setPendingFeatureCommand: (cmd: string | null) => void;
  pendingFeatureCommand: string | null;
  setSelectedId: (id: string | null) => void;
  setActivePropertyManager: (pm: string | null) => void;
  pushToast: (msg: string, type: 'error' | 'warning' | 'info') => void;
  features: any[];
  addFeature: (f: any) => void;
}
export const FeaturesTab: React.FC<FeaturesTabProps> = (props) => {
  return <div className="flex items-center gap-2 h-full">{/* buttons will be inlined in Step 3 */}</div>;
};
```

依此類推建立其他 7 個骨架。

- [ ] **Step 2: 建立 render test**

```typescript
// src/ui/__tests__/RibbonTabRender.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { FeaturesTab } from '../RibbonBar/tabs/FeaturesTab';

describe('Ribbon tab components', () => {
  it('FeaturesTab renders without crashing', () => {
    const mockProps = {
      setActiveTab: jest.fn(),
      setHint: jest.fn(),
      setPendingFeatureCommand: jest.fn(),
      pendingFeatureCommand: null,
      setSelectedId: jest.fn(),
      setActivePropertyManager: jest.fn(),
      pushToast: jest.fn(),
      features: [],
      addFeature: jest.fn(),
    };
    const { container } = render(<FeaturesTab {...mockProps} />);
    expect(container.firstChild).toBeTruthy();
  });
  // 其他 tab 相同 pattern
});
```

Run tests to verify:
```bash
npx jest src/ui/__tests__/RibbonTabRender.test.tsx -v
```
Expected: 8 tests pass (or 1 if only FeaturesTab for now).

- [ ] **Step 3: 搬移 RibbonController.tsx 的 FEATURES tab 按鈕至 FeaturesTab.tsx**

找出 `RibbonController.tsx` 中 `activeTab === 'FEATURES'` 區塊 (約 line 180-420)，將整段 JSX 與其 handler 搬移至 `FeaturesTab.tsx`。

```typescript
// FeaturesTab.tsx — after extraction
const handleClick = (type: string) => {
  // 直接使用 props，不再依賴外層 closure
};
// ... 移除所有 useCadStore() 呼叫，改為 props 注入
```

移除 `RibbonController.tsx` 中的對應區塊，改為 `<FeaturesTab ...props />`。

- [ ] **Step 4: 搬移 SKETCH、EVALUATE tab 按鈕**

同 Step 3 pattern，搬移至 `SketchTab.tsx` 與 `EvaluateTab.tsx`。

- [ ] **Step 5: 搬移 ASSEMBLY、DRAWING、RENDER tab 按鈕**

同 Step 3 pattern。

- [ ] **Step 6: 搬移 SURFACING、SHEET_METALS tab 按鈕**

同 Step 3 pattern。注意 SHEET_METALS 包含最多按鈕 (Edge Flange, Miter Flange, Hem, Flat Pattern, 5 種 Forming Tools, Bend Table, Bend Allowance, Unfold/Fold)。

- [ ] **Step 7: 清理與驗證**

```bash
npx tsc --noEmit
npx jest
```

- [ ] 確認 `RibbonController.tsx` 行數降至 150 行以下。
- [ ] 逐一點擊所有 tab 確認功能無回歸。

---

## Task 2: Backend Test Infrastructure 修復

**Acceptance Criteria:**
- [ ] `pytest backend/tests/ -q --tb=short` 全部通過，0 errors 0 failures
- [ ] import chain 問題根治：確認 OCC import 使用 `HAS_OCC` guard
- [ ] 所有收集錯誤 (collection error) 檔案修正完畢
- [ ] `tsc --noEmit` 零錯誤（前後端分離，通常不受影響）

### Subtask 2.1: 診斷 collection error 根源

- [ ] **Step 1: 收集完整錯誤資訊**

```bash
pytest backend/tests/ --tb=long -q 2>&1
```

分析每個 error 的 import traceback，分類：
- OCC 未安裝 → `HAS_OCC` mock guard
- 相對/絕對 import 錯誤 → 修正 import path
- 缺少 dependency → 補 `requirements.txt` 或 mock

- [ ] **Step 2: 修復 conftest.py 的 OCC mocking**

```python
# backend/tests/conftest.py
import os
import sys

# 在所有 OCC import 前設定 HAS_OCC 環境變數
os.environ.setdefault('HAS_OCC', 'False')

# 如果 OCC 不可用，mock OCC 模組
try:
    import OCC.Core.BRepAlgoAPI
    HAS_OCC = True
except ImportError:
    HAS_OCC = False
    from unittest.mock import MagicMock
    sys.modules['OCC'] = MagicMock()
    sys.modules['OCC.Core'] = MagicMock()
    sys.modules['OCC.Core.BRepAlgoAPI'] = MagicMock()
    # ... 依實際 import 補齊
```

- [ ] **Step 3: 逐個修復 error 檔案**

每個檔案的修復 pattern：

```python
# test_fill_pattern.py 開頭
import pytest
from conftest import HAS_OCC

pytestmark = pytest.mark.skipif(not HAS_OCC, reason="OCC not available")

# 後續 import OCC 模組
from backend.api.v1.geometry import ...  # 修正 import path
```

- [ ] **Step 4: 驗證全綠**

```bash
pytest backend/tests/ -q --tb=short
```
Expected: `96 passed, 1 skipped` 或接近此數字。

---

## Task 3: Sub-assemblies (子組件)

**Acceptance Criteria:**
- [ ] `CADComponent` 支援巢狀 `children: CADComponent[]` 欄位
- [ ] Store 提供 `addSubAssembly(parentId, name)`、`addToSubAssembly(parentId, component)`、`removeFromSubAssembly(parentId, childId)`、`getSubAssemblyTree()` 動作
- [ ] AssemblyTreePanel 顯示樹狀層級（indent + +/- 展開/摺疊）
- [ ] 子組件 transform 繼承父組件（移動父組件 → 子組件跟著移動）
- [ ] 後端 solver 支援巢狀 transform 傳播
- [ ] `tsc --noEmit` 零錯誤
- [ ] 單元測試 10+ cases (CRUD + transform propagation + tree flatten)
- [ ] `npx jest` 全部通過

### Subtask 3.1: 型別擴充

- [ ] **Step 1: 修改 CADComponent 型別**

```typescript
// src/store/types.ts — 修改 CADComponent
export interface CADComponent {
  id: string;
  partId: string;
  instanceName: string;
  isSubAssembly?: boolean; // true = 這是子組件容器
  children?: CADComponent[]; // 巢狀子元件
  transform: {
    position: [number, number, number];
    rotation: [number, number, number];
  };
  visible: boolean;
  isFixed?: boolean;
  isLightweight?: boolean;
  color?: string;
  materialId?: string;
  features?: CADFeature[];
}
```

- [ ] **Step 2: run tsc 確認型別相容**

```bash
npx tsc --noEmit
```
Expected: 零錯誤。如既有程式碼解構 `CADComponent` 時缺少 `children` 相容，修正為 optional field。

### Subtask 3.2: Store 巢狀 CRUD 動作

- [ ] **Step 3: 寫測試（先紅）**

```typescript
// src/store/__tests__/assembly-sub.test.ts
import { createAssemblyState } from '../assembly-state';

describe('Sub-assembly CRUD', () => {
  it('addSubAssembly creates a sub-assembly node under parent', () => {
    const store = createAssemblyState((fn: any) => fn, () => ({}));
    store.addComponent({ id: 'parent', instanceName: 'Parent', transform: { position: [0,0,0], rotation: [0,0,0] }, visible: true, partId: 'p1', isSubAssembly: true, children: [] });
    store.addSubAssembly('parent', 'Sub1');
    const parent = store.components.find(c => c.id === 'parent');
    expect(parent?.children).toHaveLength(1);
    expect(parent?.children![0].instanceName).toBe('Sub1');
  });

  it('addToSubAssembly adds existing component to sub-assembly', () => {
    // ...
  });

  it('removeFromSubAssembly removes child from parent children list', () => {
    // ...
  });

  it('flattenTree returns flat list for rendering', () => {
    // ...
  });

  it('updateComponentTransform on parent also propagates to children through getSubAssemblyTree', () => {
    // ...
  });
});
```

```bash
npx jest src/store/__tests__/assembly-sub.test.ts -v
```
Expected: 測試失敗（函數未實作）。

- [ ] **Step 4: 實作 Store 動作**

```typescript
// src/store/assembly-state.ts — 新增
export type AssemblySlice = {
  // ... 既有 ...
  addSubAssembly: (parentId: string, name: string) => void;
  addToSubAssembly: (parentId: string, component: CADComponent) => void;
  removeFromSubAssembly: (parentId: string, childId: string) => void;
  getFlattenTree: () => { component: CADComponent; depth: number; parentId: string | null }[];
};

// createAssemblyState 內實作
addSubAssembly: (parentId: string, name: string) => {
  get().saveSnapshot();
  set((state: any) => ({
    components: state.components.map((c: CADComponent) =>
      c.id === parentId && c.isSubAssembly
        ? { ...c, children: [...(c.children || []), {
            id: `sub_${uuidv4()}`,
            partId: '',
            instanceName: name,
            transform: { position: [0, 0, 0], rotation: [0, 0, 0] },
            visible: true,
            isSubAssembly: true,
            children: [],
          }] }
        : c
    ),
  }));
},
addToSubAssembly: (parentId: string, component: CADComponent) => {
  get().saveSnapshot();
  set((state: any) => ({
    components: state.components.map((c: CADComponent) =>
      c.id === parentId && c.isSubAssembly
        ? { ...c, children: [...(c.children || []), { ...component }] }
        : c
    ),
    // 從 root list 移除（移入子組件後不再獨立顯示）
    components: state.components.filter((c: CADComponent) => c.id !== component.id),
  }));
},
getFlattenTree: () => {
  const { components } = get();
  const flatten = (items: CADComponent[], depth: number, parentId: string | null): { component: CADComponent; depth: number; parentId: string | null }[] => {
    const result: { component: CADComponent; depth: number; parentId: string | null }[] = [];
    for (const item of items) {
      result.push({ component: item, depth, parentId });
      if (item.children && item.children.length > 0) {
        result.push(...flatten(item.children, depth + 1, item.id));
      }
    }
    return result;
  };
  return flatten(components, 0, null);
},
```

- [ ] **Step 5: 驗證測試通過**

```bash
npx jest src/store/__tests__/assembly-sub.test.ts -v
```
Expected: 全部 passed。

### Subtask 3.3: AssemblyTreePanel 樹狀顯示

- [ ] **Step 6: 改寫 AssemblyTreePanel 支援巢狀**

```typescript
// src/ui/AssemblyTreePanel.tsx — 使用 getFlattenTree
const tree = useCadStore((s) => s.getFlattenTree());
const [expanded, setExpanded] = useState<Set<string>>(new Set());

return (
  <div className="assembly-tree">
    {tree.map(({ component, depth, parentId }) => (
      <div key={component.id}
        className="flex items-center gap-1 px-1 py-0.5 text-[11px] cursor-pointer hover:bg-slate-100"
        style={{ paddingLeft: `${12 + depth * 16}px` }}
        onClick={() => {
          if (component.isSubAssembly) {
            setExpanded(prev => {
              const next = new Set(prev);
              next.has(component.id) ? next.delete(component.id) : next.add(component.id);
              return next;
            });
          }
        }}>
        {component.isSubAssembly && (
          <span className="text-slate-400 w-4">{expanded.has(component.id) ? '▼' : '▶'}</span>
        )}
        <span className="text-slate-600">
          {component.isSubAssembly ? '📁' : '📄'}
        </span>
        <span className="font-medium text-slate-800 truncate">{component.instanceName}</span>
      </div>
    ))}
  </div>
);
```

- [ ] **Step 7: Run tsc + jest 驗證**

```bash
npx tsc --noEmit
npx jest
```

### Subtask 3.4: 後端巢狀 transform 傳播

- [ ] **Step 8: 後端 solver 支援巢狀 transform**

```python
# backend/api/v1/assembly_solver.py 或 geometry.py
def propagate_transforms(components: list, parent_transform=None):
    """遞迴傳播 transform：子組件 transform *= 父組件 transform"""
    result = []
    for comp in components:
        effective = compose_transforms(parent_transform, comp.get('transform')) if parent_transform else comp.get('transform')
        result.append({**comp, 'worldTransform': effective})
        if comp.get('children'):
            result.extend(propagate_transforms(comp['children'], effective))
    return result
```

無需新 endpoint — 在現有 `/solve_assembly` 中調用此函數。

---

## Task 4: 3D Sketch (3D 草圖)

**Acceptance Criteria:**
- [ ] Sketch 分頁出現「3D Sketch」toggle 按鈕
- [ ] 3D 草圖模式下，viewport 顯示三個基準平面 (FRONT/TOP/RIGHT)
- [ ] 使用者可在 3D 空間點擊選取平面 → 在該平面上繪製草圖
- [ ] 支援 3D 點/線基本圖元（空間 Line、3-Point Arc）
- [ ] 3D 草圖節點儲存 xyz 座標（非 2D xy）
- [ ] 後端 `/solve_sketch` 支援 3D constriants
- [ ] `tsc --noEmit` 零錯誤
- [ ] 單元測試 8+ cases
- [ ] `npx jest` 全部通過

### Subtask 4.1: 型別擴充

- [ ] **Step 1: SketchNode 擴充 z 座標**

```typescript
// src/store/types.ts
export interface SketchNode {
  id: string;
  x: number;
  y: number;
  z?: number; // 3D sketch 用
  is3D?: boolean;
  isFixed?: boolean;
  plane?: 'FRONT' | 'TOP' | 'RIGHT'; // 3D 草圖繪製平面
}

export interface SketchEdge {
  id: string;
  type: 'LINE' | 'ARC' | 'CIRCLE' | 'CENTER_LINE' | 'SPLINE' | 'TEXT';
  nodeIds: string[];
  isConstruction?: boolean;
  is3D?: boolean; // 3D sketch 用
  parameters?: any;
}
```

- [ ] **Step 2: SketchConstraint 擴充 3D 約束**

```typescript
export interface SketchConstraint {
  // ...既有...
  is3D?: boolean;
  plane?: 'FRONT' | 'TOP' | 'RIGHT';
}
```

- [ ] **Step 3: tsc 驗證相容性**

```bash
npx tsc --noEmit
```

### Subtask 4.2: 3D Sketch state + toggle

- [ ] **Step 4: 寫測試（先紅）**

```typescript
// src/utils/__tests__/sketch3d.test.ts
import { distance3D, projectOnPlane, isCoincident3D } from '../sketch3d';

describe('3D Sketch utilities', () => {
  it('distance3D computes Euclidean distance', () => {
    expect(distance3D([0,0,0], [1,0,0])).toBe(1);
    expect(distance3D([1,2,3], [4,5,6])).toBeCloseTo(5.196, 2);
  });

  it('projectOnPlane projects point onto FRONT plane', () => {
    const projected = projectOnPlane([10, 20, 30], 'FRONT');
    expect(projected).toEqual([10, 20, 0]);
  });

  it('projectOnPlane projects point onto TOP plane', () => {
    const projected = projectOnPlane([10, 20, 30], 'TOP');
    expect(projected).toEqual([10, 0, 30]);
  });

  it('projectOnPlane projects point onto RIGHT plane', () => {
    const projected = projectOnPlane([10, 20, 30], 'RIGHT');
    expect(projected).toEqual([0, 20, 30]);
  });

  it('isCoincident3D detects coincident points within tolerance', () => {
    expect(isCoincident3D([1,1,1], [1,1,1], 0.01)).toBe(true);
    expect(isCoincident3D([1,1,1], [2,2,2], 0.01)).toBe(false);
  });
});
```

```bash
npx jest src/utils/__tests__/sketch3d.test.ts -v
```
Expected: 失敗（module not found）。

- [ ] **Step 5: 實作 3D 幾何工具**

```typescript
// src/utils/sketch3d.ts
export const distance3D = (a: [number, number, number], b: [number, number, number]): number => {
  const dx = a[0] - b[0], dy = a[1] - b[1], dz = a[2] - b[2];
  return Math.sqrt(dx*dx + dy*dy + dz*dz);
};

export const projectOnPlane = (point: [number, number, number], plane: 'FRONT' | 'TOP' | 'RIGHT'): [number, number, number] => {
  switch (plane) {
    case 'FRONT': return [point[0], point[1], 0]; // Z=0
    case 'TOP': return [point[0], 0, point[2]];   // Y=0
    case 'RIGHT': return [0, point[1], point[2]];  // X=0
  }
};

export const isCoincident3D = (a: [number, number, number], b: [number, number, number], tol = 0.01): boolean => {
  return distance3D(a, b) < tol;
};
```

- [ ] **Step 6: 驗證測試通過**

```bash
npx jest src/utils/__tests__/sketch3d.test.ts -v
```
Expected: 5 passed。

### Subtask 4.3: SketchTab 3D Sketch toggle

- [ ] **Step 7: SketchTab 加入 3D Sketch 按鈕**

找到 `SketchTab.tsx` 中「3D Sketch」按鈕位置（或新增），使用既有的 `sketch3DMode` / `setSketch3DMode`（或新增到 store）。

```typescript
// 在 store 新增（或在 useCadStore 檢查是否已有）
isSketch3DMode: boolean;
setSketch3DMode: (mode: boolean) => void;
```

```typescript
// SketchTab.tsx — 3D Sketch toggle 按鈕
<button onClick={() => setSketch3DMode(!isSketch3DMode)}
  className={`flex flex-col items-center justify-center gap-0.5 px-3 h-[78px] ...`}>
  <div className="w-10 h-10 flex items-center justify-center ...">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="2" y1="2" x2="22" y2="22"/><line x1="6" y1="2" x2="6" y2="6"/><line x1="2" y1="6" x2="6" y2="6"/>
      <line x1="18" y1="18" x2="22" y2="18"/><line x1="2" y1="18" x2="2" y2="22"/>
    </svg>
  </div>
  <span className="text-[10px] font-bold text-slate-800 leading-none uppercase">3D<br/>Sketch</span>
</button>
```

### Subtask 4.4: Viewport 3D 草圖模式

- [ ] **Step 8: DatumPlanes.tsx 3D 草圖平面渲染**

3D Sketch mode 啟動時，在 viewport 繪製半透明的 FRONT/TOP/RIGHT 基準平面（參考既有 `DatumPlanes.tsx` 的 grid 渲染 pattern）。

### Subtask 4.5: 3D 繪圖工具

- [ ] **Step 9: Sketch3DTool 實作**

```typescript
// src/ui/tools/Sketch3DTool.ts
// 三階段：選 plane → 在該平面上繪製 2D → 儲存為 3D 座標
```

---

## Task 5: BOM 多階層 (Multi-level BOM)

**Acceptance Criteria:**
- [ ] BOM 表格支援階層式顯示（indent + expand/collapse）
- [ ] 子組件的零件正確出現在 BOM 中，有正確的層級數字
- [ ] BOM 數量欄位根據組裝數量正確計算（子組件數量 × 父組件數量）
- [ ] `tsc --noEmit` 零錯誤
- [ ] 單元測試 5+ cases (ranking calculation, hierarchy flatten, quantity propagation)
- [ ] `npx jest` 全部通過

### Subtask 5.1: BOM 型別定義 + store

- [ ] **Step 1: 定義 BomEntry 型別**

```typescript
// src/store/types.ts — 新增
export interface BomEntry {
  id: string;
  itemNo: number;
  partNo: string;
  description: string;
  qty: number;
  material: string;
  note: string;
  level: number;       // 0 = top-level, 1 = 子組件層, 2 = 子子組件層
  parentId?: string;   // 父級 BOM entry id, null = top-level
  componentId: string; // 對應 CADComponent.id
  isSubAssembly?: boolean;
  children?: BomEntry[]; // 展開用
}
```

- [ ] **Step 2: Store BOM actions**

```typescript
// src/store/drawing-state.ts — 新增
bomData: BomEntry[];
setBomData: (data: BomEntry[]) => void;
generateBomFromAssembly: (components: CADComponent[]) => void;
updateBomQty: (id: string, qty: number) => void;
```

`generateBomFromAssembly` 遞迴遍歷組件樹，產出 flat list with level：

```typescript
generateBomFromAssembly: (components: CADComponent[]) => {
  const flat: BomEntry[] = [];
  let itemNo = 0;
  const walk = (items: CADComponent[], level: number, parentId?: string) => {
    for (const comp of items) {
      itemNo++;
      const entry: BomEntry = {
        id: `bom_${comp.id}`,
        itemNo,
        partNo: comp.isSubAssembly ? `SA-${comp.instanceName}` : comp.partId,
        description: comp.instanceName,
        qty: 1,
        material: '',
        note: '',
        level,
        parentId,
        componentId: comp.id,
        isSubAssembly: comp.isSubAssembly,
      };
      flat.push(entry);
      if (comp.children && comp.children.length > 0) {
        walk(comp.children, level + 1, entry.id);
      }
    }
  };
  walk(components, 0);
  // 計算 qty：子組件內零件 qty *= 父組件數量
  const propagateQty = (entries: BomEntry[], parentQty = 1) => {
    for (const e of entries) {
      if (e.parentId) e.qty *= parentQty;
      if (e.children) propagateQty(e.children, e.qty);
    }
  };
  // Build tree structure for quantity propagation
  const tree = buildTree(flat);
  propagateQty(tree);
  set({ bomData: tree });
},
```

### Subtask 5.2: BomTable UI

- [ ] **Step 3: BomTable 元件**

```typescript
// src/ui/DrawingSheet/BomTable.tsx
import React, { useState } from 'react';
import type { BomEntry } from '../../store/types';

interface BomTableProps {
  data: BomEntry[];
  onUpdateQty?: (id: string, qty: number) => void;
  onUpdateNote?: (id: string, note: string) => void;
}

export const BomTable: React.FC<BomTableProps> = ({ data, onUpdateQty, onUpdateNote }) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [collapsedAll, setCollapsedAll] = useState(false);

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const renderRows = (entries: BomEntry[], depth = 0): React.ReactNode[] => {
    return entries.flatMap(entry => {
      const isExpanded = expanded.has(entry.id);
      const hasChildren = entry.children && entry.children.length > 0;

      const thisRow = (
        <tr key={entry.id} className="border-b border-slate-200 hover:bg-slate-50 text-[10px]">
          <td className="px-1 py-0.5 text-center w-8">
            {hasChildren && (
              <button onClick={() => toggleExpand(entry.id)}
                className="text-slate-400 hover:text-slate-700 w-4">
                {isExpanded ? '−' : '+'}
              </button>
            )}
            <span className="ml-1">{entry.itemNo}</span>
          </td>
          <td className="px-1 py-0.5 font-mono text-slate-600">{entry.partNo}</td>
          <td className="px-1 py-0.5" style={{ paddingLeft: `${8 + entry.level * 16}px` }}>
            {entry.isSubAssembly ? '📁 ' : '📄 '}{entry.description}
          </td>
          <td className="px-1 py-0.5 text-center">{entry.qty}</td>
          <td className="px-1 py-0.5">{entry.material}</td>
          <td className="px-1 py-0.5">
            <input className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-400 outline-none text-[10px]"
              defaultValue={entry.note}
              onBlur={(e) => onUpdateNote?.(entry.id, e.target.value)} />
          </td>
        </tr>
      );

      if (!hasChildren || isExpanded) {
        return [thisRow, ...(hasChildren && isExpanded ? renderRows(entry.children!, depth + 1) : [])];
      }
      return [thisRow]; // collapsed — hide children
    });
  };

  return (
    <table className="w-full text-[10px] border-collapse">
      <thead>
        <tr className="border-b-2 border-slate-700 bg-slate-100 text-[9px] font-bold uppercase text-slate-600">
          <th className="px-1 py-1 text-left w-8">#</th>
          <th className="px-1 py-1 text-left">Part No.</th>
          <th className="px-1 py-1 text-left">Description</th>
          <th className="px-1 py-1 text-center w-10">Qty</th>
          <th className="px-1 py-1 text-left">Material</th>
          <th className="px-1 py-1 text-left">Note</th>
        </tr>
      </thead>
      <tbody>{renderRows(data)}</tbody>
    </table>
  );
};
```

### Subtask 5.3: 測試

- [ ] **Step 4: BomTable 渲染測試**

```typescript
// src/ui/__tests__/BomTable.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BomTable } from '../DrawingSheet/BomTable';
import type { BomEntry } from '../../store/types';

const mockData: BomEntry[] = [
  {
    id: 'bom_1', itemNo: 1, partNo: 'BASE-001', description: 'Base Plate',
    qty: 1, material: 'Steel', note: '', level: 0, componentId: 'c1',
    children: [
      { id: 'bom_2', itemNo: 2, partNo: 'BRACKET-001', description: 'Mounting Bracket',
        qty: 2, material: 'Aluminum', note: '', level: 1, componentId: 'c2', parentId: 'bom_1' },
    ],
  },
  { id: 'bom_3', itemNo: 3, partNo: 'COVER-001', description: 'Top Cover',
    qty: 1, material: 'Steel', note: 'paint black', level: 0, componentId: 'c3' },
];

describe('BomTable', () => {
  it('renders all top-level entries', () => {
    render(<BomTable data={mockData} />);
    expect(screen.getByText('Base Plate')).toBeInTheDocument();
    expect(screen.getByText('Top Cover')).toBeInTheDocument();
  });

  it('shows child entries when parent is expanded', () => {
    render(<BomTable data={mockData} />);
    // clicking + button expands
    const expandBtns = screen.getAllByText('+');
    fireEvent.click(expandBtns[0]);
    expect(screen.getByText('Mounting Bracket')).toBeInTheDocument();
  });

  it('shows correct quantities', () => {
    render(<BomTable data={mockData} />);
    expect(screen.getByText('2')).toBeInTheDocument(); // bracket qty
  });
});
```

```bash
npx jest src/ui/__tests__/BomTable.test.tsx -v
```
Expected: 3 passed。

### Subtask 5.4: 整合進 DrawingSheet

- [ ] **Step 5: 取代既有 BOM**

在 `src/ui/DrawingSheet.tsx` 約 line 1321-1340 的 BOM 渲染區塊，將靜態 BOM table 替換為 `<BomTable data={bomData} />`，並在 `useEffect` 中當組件資料變更時呼叫 `generateBomFromAssembly`。

- [ ] **Step 6: 最終驗證**

```bash
npx tsc --noEmit
npx jest
```

---

## Execution Order

```
Task 2 (Backend test fix)  ─┐ 獨立，可並行
                            ├── 都完成後 → Task 3, 4, 5 (並行)
Task 1 (RibbonController)  ─┘
```

Each feature task (3, 4, 5) is fully independent and can be dispatched in parallel after infrastructure tasks pass.

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|:---|---:|:---|---:|
| RibbonController 拆分遺漏某個 handler | Medium | High (功能遺失) | 逐一對照原始程式碼，確認每個 button 的 onClick 完整搬移 |
| Backend OCC import 無法 mock | Medium | High (測試無法跑) | 先確認 CI 環境有 OCC，用 env var 控制 skip |
| 3D Sketch 平面選取 UX 不佳 | Medium | Medium | 第一步先支援最簡單的 plane pick (點擊三個基準面圖示) |
| BOM 數量計算邏輯錯誤 | Low | Medium | 測試覆蓋 edge case (單層、雙層、混合) |
