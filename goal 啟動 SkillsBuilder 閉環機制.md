/goal 啟動 SkillsBuilder 閉環機制。
1. 解析影片 https://www.youtube.com/watch?v=sDqD0PRYhJI ，由 [SolidWorks專家] 解析並輸出特徵草圖與步驟。
2. 啟動 [實作機器人] 依混合驗證協議 (Hybrid Verification) 自動在系統中重現影片中第一個 3D 模型的「幾何邏輯」與「UI 響應方式」。
3. 若遭遇系統阻礙，自動啟動 [架構師] 診斷脆弱點，交由 [核心實作] 精準修復，並經 [QA] 單元測試與 regression 驗證無紅色錯誤後，交回機器人重試。
4. 任務完成時，須確保產出：Python E2E 幾何模擬驗證腳本、人工 UI 驗證 SOP 指南，並執行 save_checkpoint.py 更新 DEV_LOG.md 與交接文檔。
5. 需讓我看見機器人實操過程。
