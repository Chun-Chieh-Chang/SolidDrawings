# Task Plan - Phase 29：裝配體模式與配合 (Assembly & Mates)

> **Plan of Record**：[implementation_plan.md](implementation_plan.md)

## [P] Plan
- 目標里程碑：**Phase 3 (Public Beta)** — 組立件配合 (Mates)
- 核心架構：後端 Python 求解器 + Component Registry 快取策略
- 已核准：2026-05-30 使用者明確批准

## Phase 29 裝配體模式與配合求解 (Assembly Mode & Mates)

- [x] **Step 1: 後端裝配體求解服務**
  - [x] 建立 `backend/app/services/component_registry.py` 以快取 B-Rep
  - [x] 擴充 `backend/app/routers/geometry.py` 新增 `/api/geometry/register_component` 路由
- [x] **Step 2: 前端 HeavyEngineClient 擴充**
  - [x] 在 `HeavyEngineClient.ts` 新增 `registerComponent()` 方法
  - [x] 完善 `AssemblyService.ts` 新增 `registerComponent()`
- [x] **Step 3: 狀態管理 (Zustand) 擴充**
  - [x] 新增 `activeComponentId` 與 `components` 陣列至 `useCadStore.ts`
- [x] **Step 4: UI/UX 裝配體介面**
  - [x] 在 Ribbon 新增「ASSEMBLY」分頁與「Insert Comp」按鈕
  - [x] 左側面板根據 `activeTab` 顯示 Component 樹與 `MatePanel`

## [C] Check
- [x] `npx tsc --noEmit` 無錯誤
- [x] UI 面板切換與 Component 狀態讀寫正常 (開發日誌紀錄)無迴歸
- [ ] 後端 pytest 基本 Coincident 約束收斂測試
- [ ] 手動：掛載兩個組件，套用面對面配合，確認幾何吸附

## [A] Act
- 完成後更新 `DEV_LOG.md` 與 `handover_resume_guide.md`。
- 未通過 Check → DEV_LOG RCA/CAPA，不得宣稱 Assembly 可用。
