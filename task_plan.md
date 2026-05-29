# Task Plan - Phase 20：M1 Alpha-usable 零件（對標 Usable Parity）

> **Plan of Record**：[SOLIDWORKS_USABLE_PARITY_ROADMAP.md](docs/productization/SOLIDWORKS_USABLE_PARITY_ROADMAP.md) · [SOLIDWORKS_GAP_AUDIT.md](docs/productization/SOLIDWORKS_GAP_AUDIT.md)

## [P] Plan
- 目標里程碑：**M1**（工程師可在本產品內完成 6/8 標準測試件，CI Golden 必跑 OCC）。
- 對標基準：**SolidWorks 2015** 零件模式核心（非 2024+）。
- Phase 19 已閉環：GAP 查核、`viewportDisplayMode`、`PartFeaturePropertyManager` 拆分。

## [D] Do — 下一輪 5 項工程優先級（非 Demo 打磨）

| 優先 | 工作項 | 對應驗收 | 說明 |
|------|--------|----------|------|
| **P1** | Golden + pythonocc 進 CI 必跑 | M0-T*, M1-T1 | `run_golden.py` 在無 OCC 時 fail 或標記；禁止 mock 冒充 B-Rep 發佈 |
| **P2** | 封閉輪廓 + Extrude 可讀錯誤 | M1-T2, M1-T5 | 擠出前檢查；Fillet 半徑過大等後端訊息進 UI toast |
| **P3** | Fillet/Chamfer 拓撲 + `geometric-signature` | M1-T4, M1-T3 | 重建後邊解析；打通選邊 → 特徵參數鏈 |
| **P4** | Extrude/Fillet PropertyManager 嚮導式 Rollout | M1-T1 | 取代 raw parameters key 列表 |
| **P5** | 刪除父特徵 SW 式確認 + 連帶刪除 | M1-T6 | FeatureManager 刪除流 |

**刻意延後（M2/M3）**：STEP 匯入 UI、`.3dbasm`、工程圖標題欄、ShortcutBox 全補（P2  backlog）。

## [C] Check
- [ ] `python tests/regression/run_golden.py`（需 OCC 全綠）
- [ ] `npx tsc --noEmit`
- [ ] 手動：M1-T1 L-Bracket 從零到存檔（檢查清單見 ROADMAP §4 M1）
- [ ] `npm run pdca:check`（若變更 plan 文件）

## [A] Act
- 完成 P1–P3 後更新 GAP_AUDIT §2–4 狀態表與 ROADMAP M1 勾選。
- 未通過 Golden → DEV_LOG RCA/CAPA，不得宣稱 Alpha-usable。
