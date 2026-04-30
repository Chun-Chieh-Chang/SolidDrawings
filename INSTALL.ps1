# SkillsBuilder 跨設備一鍵同步腳本 (Bootstrap)
# 用法: 在新電腦 clone 本專案後，對著 PowerShell 執行: .\INSTALL.ps1

$ErrorActionPreference = "Stop"

Write-Host "🚀 正在啟動 SkillsBuilder 全域中樞同步流程..." -ForegroundColor Cyan

# 1. 偵測 Antigravity 路徑
$antigravityPath = "$HOME\.gemini\antigravity"
if (-not (Test-Path $antigravityPath)) {
    Write-Host "❌ 找不到 Antigravity 安裝目錄，請確認已安裝 Antigravity。" -ForegroundColor Red
    exit
}

$currentDir = Get-Location
$skillsDir = Join-Path $antigravityPath "skills"
$knowledgeDir = Join-Path $antigravityPath "knowledge"

# 2. 建立必要目錄
if (-not (Test-Path $skillsDir)) { New-Item -ItemType Directory -Path $skillsDir -Force }
if (-not (Test-Path $knowledgeDir)) { New-Item -ItemType Directory -Path $knowledgeDir -Force }

# 3. 註冊所有技能 (遞迴連結所有分類)
Write-Host "📦 正在建立全域技能圖書館連結..." -ForegroundColor Yellow
$categories = Get-ChildItem -Path (Join-Path $currentDir "skills") -Directory

foreach ($category in $categories) {
    $skillsInCat = Get-ChildItem -Path $category.FullName -Directory
    foreach ($skill in $skillsInCat) {
        $skillSource = $skill.FullName
        $skillDest = Join-Path $skillsDir $skill.Name
        
        Write-Host "🔗 連結技能: $($category.Name)/$($skill.Name)" -ForegroundColor Gray
        if (Test-Path $skillDest) { Remove-Item $skillDest -Recurse -Force }
        New-Item -ItemType SymbolicLink -Path $skillDest -Target $skillSource -Force
    }
}

# 4. 註冊全域知識庫 (KI)
$kiPath = Join-Path $knowledgeDir "skills_builder"
$kiArtifacts = Join-Path $kiPath "artifacts"

Write-Host "🧠 正在建立全域知識索引 (Knowledge Item)..." -ForegroundColor Yellow
if (-not (Test-Path $kiArtifacts)) { New-Item -ItemType Directory -Path $kiArtifacts -Force }

# 產生 metadata.json
$metadata = @{
    title = "SkillsBuilder Architecture & SOP"
    summary = "The master governance system for AI-agentic development."
    created_at = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
    updated_at = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
    references = @("file:///$($currentDir.Path.Replace('\','/'))/wiki/SCHEMA.md")
    tags = @("sop", "wiki", "llm-wiki", "pdca")
} | ConvertTo-Json

$metadata | Out-File -FilePath (Join-Path $kiPath "metadata.json") -Encoding UTF8

# 5. 產出全域規則快照
$rulesContent = @"
# Global Development Rulebook (SkillsBuilder)
- Source Repo: $($currentDir.Path)
- Wiki Schema: file:///$($currentDir.Path.Replace('\','/'))/wiki/SCHEMA.md
- Logic: Karpathy LLM Wiki + PDCA SOP
"@
$rulesContent | Out-File -FilePath (Join-Path $kiArtifacts "global_rules.md") -Encoding UTF8

Write-Host "✅ 同步完成！現在你可以對 Antigravity 說:「啟動 SkillsBuilder 開發模式」" -ForegroundColor Green
