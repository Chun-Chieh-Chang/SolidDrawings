# SkillsBuilder One-Click Sync Bootstrap Script (CP950-immune, pure ASCII)

$ErrorActionPreference = "Stop"

Write-Host "[START] Syncing SkillsBuilder global library..." -ForegroundColor Cyan

# 1. Detect Antigravity Paths (support multiple installations horizontally)
$pathsToSync = @()
if (Test-Path "$HOME\.gemini\antigravity") { $pathsToSync += "$HOME\.gemini\antigravity" }
if (Test-Path "$HOME\.gemini\antigravity-ide") { $pathsToSync += "$HOME\.gemini\antigravity-ide" }

if ($pathsToSync.Count -eq 0) {
    Write-Host "[ERROR] Antigravity installation folder not found." -ForegroundColor Red
    exit 1
}

# --- Auto-provision Graphifyy ---
Write-Host "[INFO] Checking Graphifyy installation status..." -ForegroundColor Cyan
$graphifyInstalled = $false
try {
    $null = Get-Command graphify -ErrorAction Stop
    $graphifyInstalled = $true
    Write-Host "[SUCCESS] Graphify CLI is already installed!" -ForegroundColor Green
} catch {
    Write-Host "[INFO] Graphify CLI not found. Attempting to install graphifyy..." -ForegroundColor Yellow
    
    # Try using 'uv' tool first
    try {
        $null = Get-Command uv -ErrorAction Stop
        Write-Host "[INFO] Detected uv. Installing graphifyy using uv..." -ForegroundColor Cyan
        $null = Start-Process uv -ArgumentList "tool", "install", "graphifyy" -NoNewWindow -Wait -ErrorAction Stop
        $graphifyInstalled = $true
        Write-Host "[SUCCESS] Graphifyy installed successfully via uv!" -ForegroundColor Green
    } catch {
        # Fallback to 'pip'
        try {
            $null = Get-Command pip -ErrorAction Stop
            Write-Host "[INFO] Detected pip. Installing graphifyy using pip..." -ForegroundColor Cyan
            $null = Start-Process pip -ArgumentList "install", "graphifyy" -NoNewWindow -Wait -ErrorAction Stop
            $graphifyInstalled = $true
            Write-Host "[SUCCESS] Graphifyy installed successfully via pip!" -ForegroundColor Green
        } catch {
            Write-Host "[WARNING] Neither uv nor pip was found. Skipping automatic Graphifyy installation." -ForegroundColor Yellow
            Write-Host "[WARNING] Please manually install graphifyy using: pip install graphifyy" -ForegroundColor Yellow
        }
    }
}

if ($graphifyInstalled) {
    try {
        Write-Host "[INFO] Registering global Graphify plugins..." -ForegroundColor Cyan
        $null = Start-Process graphify -ArgumentList "install" -NoNewWindow -Wait -ErrorAction Stop
        
        Write-Host "[INFO] Registering local workspace Git hooks for Graphify..." -ForegroundColor Cyan
        $null = Start-Process graphify -ArgumentList "hook", "install" -NoNewWindow -Wait -ErrorAction Stop
        Write-Host "[SUCCESS] Graphify registered successfully!" -ForegroundColor Green
    } catch {
        Write-Host "[WARNING] Graphify post-install steps failed: $_" -ForegroundColor Yellow
    }
}
# --------------------------------

$currentDir = Get-Location

foreach ($antigravityPath in $pathsToSync) {
    Write-Host "[INFO] Processing Antigravity directory: $antigravityPath" -ForegroundColor Cyan
    
    $skillsDir = Join-Path $antigravityPath "skills"
    $knowledgeDir = Join-Path $antigravityPath "knowledge"

    # 2. Create required directories
    if (-not (Test-Path $skillsDir)) { New-Item -ItemType Directory -Path $skillsDir -Force }
    if (-not (Test-Path $knowledgeDir)) { New-Item -ItemType Directory -Path $knowledgeDir -Force }

    # 3. Register all skills (recursively link all categories)
    Write-Host "[INFO] Linking global skills library..." -ForegroundColor Yellow
    $categories = Get-ChildItem -Path (Join-Path $currentDir "skills") -Directory

    foreach ($category in $categories) {
        $skillsInCat = Get-ChildItem -Path $category.FullName -Directory
        foreach ($skill in $skillsInCat) {
            $skillSource = $skill.FullName
            $skillDest = Join-Path $skillsDir $skill.Name
            
            Write-Host "[LINK] Processing skill: $($category.Name)/$($skill.Name)" -ForegroundColor Gray
            if (Test-Path $skillDest) { Remove-Item $skillDest -Recurse -Force }
            
            try {
                # Try to create symbolic link first
                $null = New-Item -ItemType SymbolicLink -Path $skillDest -Target $skillSource -Force -ErrorAction Stop
                Write-Host "[LINK] Created SymbolicLink for $($skill.Name)" -ForegroundColor DarkGray
            } catch {
                # Fallback to copy directory if symbolic link fails (requires admin privileges)
                Write-Host "[FALLBACK] Symlink failed (elevation required). Copying directory..." -ForegroundColor Yellow
                Copy-Item -Path $skillSource -Destination $skillDest -Recurse -Force
            }
        }
    }

    # 4. Register global Knowledge Item (KI)
    $kiPath = Join-Path $knowledgeDir "skills_builder"
    $kiArtifacts = Join-Path $kiPath "artifacts"

    Write-Host "[INFO] Creating global knowledge index (Knowledge Item)..." -ForegroundColor Yellow
    if (-not (Test-Path $kiArtifacts)) { New-Item -ItemType Directory -Path $kiArtifacts -Force }

    # Generate metadata.json (use double single-quotes or escaped double-quotes for JSON properties)
    # To avoid the & parse issue, let's keep all strings strictly simple ASCII.
    $metadata = @{
        title = "SkillsBuilder Architecture and SOP"
        summary = "The master governance system for AI-agentic development."
        created_at = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
        updated_at = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
        references = @("file:///$($currentDir.Path.Replace('\','/'))/wiki/SCHEMA.md")
        tags = @("sop", "wiki", "llm-wiki", "pdca")
    } | ConvertTo-Json

    $metadata | Out-File -FilePath (Join-Path $kiPath "metadata.json") -Encoding UTF8

    # 5. Output global rules snapshot
    $wikiRulesPath = Join-Path $currentDir "wiki\global_rules.md"
    if (Test-Path $wikiRulesPath) {
        Copy-Item -Path $wikiRulesPath -Destination (Join-Path $kiArtifacts "global_rules.md") -Force
        Write-Host "[INFO] Copied version-controlled global rules to KI artifacts." -ForegroundColor DarkGray
    } else {
        $rulesContent = "## Global Development Rulebook (SkillsBuilder)`r`n- Source Repo: $($currentDir.Path)`r`n- Wiki Schema: file:///$($currentDir.Path.Replace('\','/'))/wiki/SCHEMA.md`r`n- Logic: Karpathy LLM Wiki + PDCA SOP`r`n"
        $rulesContent | Out-File -FilePath (Join-Path $kiArtifacts "global_rules.md") -Encoding UTF8
    }
}

Write-Host "[SUCCESS] SkillsBuilder global sync complete!" -ForegroundColor Green
