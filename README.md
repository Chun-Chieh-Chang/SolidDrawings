# SkillsBuilder: 全球最大的 AI-Agentic Skill 開源圖書館 (ClawHub All-Star Library)

SkillsBuilder 是一個專為「自動化智慧開發」而設計的元平台。它不僅是打造 AI Agent 技能 (Skills) 的工廠，更是 Antigravity IDE 的**全域智慧來源 (Source of Truth)**，並已全面轉型為 **ClawHub 全明星技能儲備庫**。

本專案融合了 Google 的設計模式、Karpathy 的 Wiki 模式與 Hermes 的代理能力，旨在實現代碼的「外科手術式精準」與知識的「複利式成長」。

---

## 🧠 核心哲學：LLM Wiki 模式

我們不只是在寫程式，我們在構建一個**「會學習的專案大腦」**。
- **持久化知識 (Persistent)**：利用 `wiki/` 目錄捕捉每一項決策、實體與概念，實現跨 Session 的記憶。
- **複利成長 (Compounding)**：每一次任務執行後的見解都會歸檔，讓 AI 對專案的理解隨時間增強。

## 🚀 核心工具

### 1. Skill Architect (技能建築師)
專門用來生產「工業級技能」的元工具。它強制執行 **「探索-執行-驗證-歸檔」** 的四階段生命週期。

### 2. GitNexus (代碼智慧引擎)
為 Antigravity 提供代碼庫的**「上帝視角」**。透過建立知識圖譜，實現精準的「爆炸半徑」分析，讓複雜重構不再危險。

---

## 💎 核心設計模式
Google 5+1 設計模式
- **Tool Wrapper**、**Generator**、**Reviewer**、**Inversion**、**Pipeline**。
- **[NEW] Knowledge Artifact**：自動將任務產出合成為 Wiki 知識。

### 2. 工業級護欄 (Guardrails)
- **Surgical Precision**：嚴格的外科手術式修改，杜絕 Regression。
- **Anti-Hallucination**：Hermes 風格的反幻覺行為邊界定義。
- **Verification Loop**：內建 `[Step] → verify: [check]` 的自體確效邏輯。

---

## 📁 專案架構 (MECE 結構)

```text
SkillsBuilder/
├── wiki/                 # 專案大腦：合成知識庫 (Karpathy Pattern)
│   ├── entities/         # 實體定義：工具、IDE、系統組件
│   ├── concepts/         # 概念定義：設計模式、SOP、哲學
│   └── log.md            # 全局活動日誌
├── skills/               # 技能目錄：可執行的 SKILL.md
│   └── skill-architect/  # 核心生產工具
├── raw/                  # 原始素材：不可變的文檔與參考資料
├── DEV_LOG.md            # 開發日誌：PDCA 執行紀錄與 RCA/CAPA 歸檔
└── README.md             # 本手冊
```

## 🛠️ 如何安裝與遷移 (Cross-Device)

本專案支援一鍵跨設備同步。當您在新的電腦上 Clone 本專案後：

1. **執行安裝**：右鍵以系統管理員身分執行 `INSTALL.ps1`。
2. **喚醒中樞**：對 Antigravity 說「啟動 SkillsBuilder 開發模式」。

> [!TIP]
> 建議使用 **Symbolic Link** (腳本預設) 進行連結，這樣您在 `SkillsBuilder` 目錄下的任何更新都會即時同步到系統級技能庫。

---

## 💎 設計總監規範 (Digital Art Director)

本專案的所有介面優化與文檔產出皆遵循 **Color Master Palette**：
- **深色模式 (Base)**：`#0F172A` (Slate 900)
- **品牌色 (Accent)**：`#60A5FA` (Sky Blue)
- **文字 (Primary)**：`#F1F5F9` (Slate 100)

## 📜 許可證
MIT License
