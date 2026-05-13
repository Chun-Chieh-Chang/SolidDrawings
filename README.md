# SkillsBuilder: 全球最大的 AI-Agentic Skill 開源圖書館 (ClawHub All-Star Library)

SkillsBuilder 是一個專為「自動化智慧開發」而設計的元平台。它不僅是打造 AI Agent 技能 (Skills) 的工廠，更是 Antigravity IDE 的**全域智慧來源 (Source of Truth)**，並已全面轉型為 **ClawHub 全明星技能儲備庫**。

本專案融合了 Google 的設計模式、Karpathy 的 Wiki 模式與 Hermes 的代理能力，旨在實現代碼的「外科手術式精準」與知識的「複利式成長」。

---

## 🎯 本專案能做什麼？(核心能力)

### 1. 為 AI 裝備「工業級技能」 (Skill Library)
專案內建了從 ClawHub 與開源社群嚴選的**頂尖 AI 技能庫**（位於 `skills/` 目錄），涵蓋兩大類：
- **Core (生產力)**：例如 `tavily` (深度網頁研究)、`youtube` (影音分析)、`last30days` (社群情報總結)、`summarize` (長文總結)。
- **Dev (開發專用)**：例如 `gitnexus` (代碼圖譜與關聯分析)、`github-manager` (自動化 PR/Issue 管理)、`web-coder` (前端開發)。
當這些技能被掛載後，AI 就能直接調用這些外部工具來幫您完成複雜任務。

### 2. 「會學習」的專案大腦 (Karpathy LLM Wiki 模式)
- **記憶複利**：傳統 AI 的記憶會在對話結束後消失，但 SkillsBuilder 實作了「持久化知識庫 (`wiki/`)」。您與 AI 共同制定過的架構決策、UI 規範（如莫蘭迪色系、SOP流程），都會被寫入 `wiki/` 當中。下次開新對話或新專案時，AI 只要讀取這裡的資料，就能立刻繼承過去的「開發智慧」，不需重新教導。

### 3. 生產新技能 (Skill Architect)
- 內建 `skill-architect` 技能，您可以直接命令 AI：「幫我寫一個能夠自動化備份資料庫的 Skill」。系統會運用標準化流程（探索-執行-驗證-歸檔）為您自動生成、測試並封裝成一個新技能。

---

## 🚀 如何使用本專案？(操作指南)

### 步驟一：一鍵安裝與環境綁定 (只需做一次)
當您在任何電腦上下載本專案後：
1. **執行安裝腳本**：對 `INSTALL.ps1` 點擊右鍵，選擇**「以系統管理員身分執行」**。
2. **它的作用**：這個腳本會建立 **Symbolic Link (符號連結)**，把本專案 `skills/` 資料夾裡的技能，直接「映射」到 Antigravity IDE 系統隱藏的技能池裡 (`~/.gemini/antigravity/skills`)。這樣您在專案裡更新技能，系統級的 AI 都會同步生效。

### 步驟二：喚醒與調用 (在對話框中)
安裝完成後，您可以在任何對話框中透過以下指令來使用：
- **啟動全局護欄與標準化開發**：「啟動 SkillsBuilder 開發模式」
- **調用特定工具**：「幫我用 tavily-research 技能深入研究...」
- **建造新工具**：「我想創建一個新技能...」

---

## 💡 如何應用於新開發專案？

您不需要複製本專案，只需透過以下方式在新專案中繼承智慧：

1. **繼承全域技能**：只要執行過 `INSTALL.ps1`，您在任何新資料夾開發時，我（AI 助理）都能直接調用 `tavily`、`gitnexus` 等工具，無需重複安裝。
2. **初始化智慧環境**：在新專案目錄對我說**「啟動 SkillsBuilder 開發模式」**，我會自動為新專案建立 `DEV_LOG.md` 與 `wiki/` 架構，並載入所有設計規範與 PDCA 流程。
3. **跨專案智慧共享**：您在 SkillsBuilder 中維護的通用規則（如 UI 規範或 SOP），會自動應用到您的所有新專案中，實現開發經驗的「複利成長」。

---

## 📁 專案架構 (MECE 結構)

```text
SkillsBuilder/
├── wiki/                 # 專案大腦：合成知識庫 (Karpathy Pattern)
│   ├── entities/         # 實體定義：工具、IDE、系統組件
│   ├── concepts/         # 概念定義：設計模式、SOP、哲學
│   └── log.md            # 全局活動日誌
├── skills/               # 技能目錄：包含 core (生產力) 與 dev (開發) 技能
├── raw/                  # 原始素材：不可變的文檔與參考資料
├── DEV_LOG.md            # 開發日誌：PDCA 執行紀錄與 RCA/CAPA 歸檔
└── README.md             # 本手冊
```

---

## 💎 設計總監規範 (Digital Art Director)

本專案的所有介面優化與文檔產出皆遵循 **Color Master Palette**：
- **深色模式 (Base)**：`#0F172A` (Slate 900)
- **品牌色 (Accent)**：`#60A5FA` (Sky Blue)
- **文字 (Primary)**：`#F1F5F9` (Slate 100)

## 📜 許可證
MIT License
