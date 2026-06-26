#!/usr/bin/env python3
"""
living-roadmap: update_roadmap.py

Aggregates data from multiple sources and generates/updates
docs/DEVELOPMENT_ROADMAP.md — the single source of truth for
project development progress.

Data sources:
  1. gap-analysis-report.md  — domain scores, milestones, priority lists
  2. check_sw_gaps.py        — SCS scanner output
  3. pytest results           — backend test count
  4. Jest results             — frontend test count
  5. tsc --noEmit             — TypeScript compilation status

Usage:
  python skills/dev/living-roadmap/scripts/update_roadmap.py
"""

import os
import re
import subprocess
import sys
import json
from datetime import datetime
from pathlib import Path

# Force UTF-8 for stdout/stderr on Windows (cp950 can't print emoji)
if sys.platform == "win32":
    sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)
    sys.stderr = open(sys.stderr.fileno(), mode='w', encoding='utf-8', buffering=1)

# ── Paths ──────────────────────────────────────────────────────────────────
ROOT = Path(__file__).resolve().parents[4]  # 4 levels up from scripts/ → project root
GAP_REPORT = ROOT / "gap-analysis-report.md"
SCS_SCRIPT = ROOT / "skills" / "dev" / "solidworks-gap-analyzer" / "scripts" / "check_sw_gaps.py"
OUTPUT = ROOT / "docs" / "DEVELOPMENT_ROADMAP.md"
OUTPUT_HTML = ROOT / "docs" / "DEVELOPMENT_ROADMAP.html"
SPRINT_BACKLOG = ROOT / "sprint-backlog.md"

# ── Helpers ────────────────────────────────────────────────────────────────

def run_cmd(cmd, cwd=None, timeout=60, shell=False):
    """Run a shell command, return (returncode, stdout, stderr)."""
    try:
        r = subprocess.run(
            cmd, cwd=cwd or ROOT, capture_output=True, text=True,
            encoding='utf-8', errors='replace', timeout=timeout, shell=shell
        )
        out = r.stdout.strip() if r.stdout else ""
        err = r.stderr.strip() if r.stderr else ""
        return r.returncode, out, err
    except FileNotFoundError:
        return -1, "", "command not found"
    except subprocess.TimeoutExpired:
        return -1, "", "timed out"


def parse_sprint_backlog():
    """
    Parse sprint-backlog.md into structured task list.
    
    Returns:
        tasks: list of dicts with keys: priority, title, domain, status, criteria (list), deps, hours, goal
        completed_tasks: list of completed task titles
    """
    if not SPRINT_BACKLOG.exists():
        return [], []

    text = SPRINT_BACKLOG.read_text(encoding="utf-8")
    tasks = []
    completed_tasks = []

    # Find all Active Tasks (### [Pn] Title)
    # First, find the "## Active Tasks" section
    active_start = text.find("## Active Tasks")
    if active_start < 0:
        return [], []

    # Parse each task block under Active Tasks
    # Tasks start with "### [P2] Title"
    task_pattern = re.compile(r"^### \[(P\d+)\]\s*(.+)$", re.MULTILINE)
    for m in task_pattern.finditer(text[active_start:]):
        full_text = text[active_start + m.start():]
        task_prio = m.group(1)
        task_title = m.group(2).strip()

        # Find where this task block ends (next ### or end of section)
        next_task = re.search(r"^###\s", full_text[len(m.group(0)):], re.MULTILINE)
        if next_task:
            task_text = full_text[:len(m.group(0)) + next_task.start()]
        else:
            # Look for "---" or "## " boundary
            section_end = re.search(r"^---|^##\s", full_text[len(m.group(0)):], re.MULTILINE)
            task_text = full_text[:len(m.group(0)) + section_end.start()] if section_end else full_text

        # Extract fields
        domain = extract_field(task_text, "領域")
        status = extract_field(task_text, "狀態")
        deps = extract_field(task_text, "依賴")
        hours = extract_field(task_text, "估計工時")
        goal = extract_field(task_text, "目標")

        # Extract acceptance criteria (lines with [ ] or [x] after "驗收標準")
        criteria = []
        in_criteria = False
        for line in task_text.split("\n"):
            s = line.strip()
            if "驗收標準" in s:
                in_criteria = True
                continue
            if in_criteria:
                if s.startswith("- [ ]") or s.startswith("- [x]") or s.startswith("- [X]"):
                    checked = s.startswith("- [x]") or s.startswith("- [X]")
                    desc = s[5:].strip()
                    criteria.append({"desc": desc, "done": checked})
                elif s.startswith("- **") or s.startswith("###") or s.startswith("---"):
                    break
                elif not s:
                    continue
                else:
                    # Non-criteria line after criteria started might be another field
                    if s.startswith("- "):
                        break

        task_entry = {
            "priority": task_prio,
            "title": task_title,
            "domain": domain or "",
            "status": status or "pending",
            "criteria": criteria,
            "deps": deps or "",
            "hours": hours or "",
            "goal": goal or "",
        }
        tasks.append(task_entry)

    # Parse completed tasks from "## Completed Tasks"
    completed_start = text.find("## Completed Tasks")
    if completed_start >= 0:
        for line in text[completed_start:].split("\n"):
            m = re.match(r"^### ~~\[(P\d+)\]\s*(.+?)~~\s*[✅]?\s*(.*)$", line.strip())
            if m:
                completed_tasks.append({"priority": m.group(1), "title": m.group(2).strip()})

    return tasks, completed_tasks


def extract_field(text, field_name):
    """Extract a field value like '- **領域**: Assembly' from task text."""
    m = re.search(r"-\s*\*\*" + field_name + r"\*\*\s*:\s*(.+?)$", text, re.MULTILINE)
    if m:
        return m.group(1).strip()
    return ""


def parse_gap_report():
    """Extract domain scores and milestones from gap-analysis-report.md."""
    if not GAP_REPORT.exists():
        return {}, [], "", "", "", []

    text = GAP_REPORT.read_text(encoding="utf-8")

    # Parse the overview score table
    scores = {}
    table_pattern = re.compile(
        r"\|\s*([^|]+?)\s*\|\s*(\d+)%\s*\|\s*(.*?)\s*\|\s*([🟢🟡🔴⚪])\s*(.*?)\s*\|"
    )
    for m in table_pattern.finditer(text):
        domain = m.group(1).strip("| ").strip()
        score = int(m.group(2))
        change = m.group(3).strip()
        icon = m.group(4)
        status = m.group(5).strip()
        if domain and domain not in ("領域", "---", "技術債清理") and not domain.startswith(":"):
            scores[domain] = {"score": score, "change": change, "icon": icon, "status": status}

    overall = ""
    maturity_m = re.search(r"\*\*總體成熟度\*\*:\s*~(\d+)%", text)
    if maturity_m:
        overall = maturity_m.group(1)

    # Parse milestones from section 13
    milestones = []
    in_milestones = False
    for line in text.split("\n"):
        if "## 13. 近期完成里程碑" in line:
            in_milestones = True
            continue
        if in_milestones and line.startswith("## "):
            break
        if in_milestones and line.startswith("| **"):
            parts = [p.strip() for p in line.split("|") if p.strip()]
            if len(parts) >= 3:
                name = parts[0].strip("* ")
                date = parts[1] if len(parts) > 1 else ""
                cat = parts[2] if len(parts) > 2 else ""
                milestones.append({"name": name, "date": date, "category": cat})

    # Parse P2 remaining (skip header placeholder "項目")
    p2_remaining = []
    in_p2 = False
    for line in text.split("\n"):
        if "### P2 — 本月 (Medium)" in line:
            in_p2 = True
            continue
        if in_p2 and ("### P3" in line or line.startswith("## ")):
            break
        if in_p2 and line.startswith("| ") and "已完成" not in line:
            parts = [p.strip() for p in line.split("|") if p.strip()]
            if parts and not parts[0].startswith("~~") and parts[0] != "項目":
                p2_remaining.append(parts[0].strip("* "))
            elif parts and parts[0].startswith("~~"):
                pass

    # Parse test counts
    pytest_count = ""
    jest_count = ""
    for line in text.split("\n"):
        if "Backend pytest" in line:
            m = re.search(r"\*\*(\d+)\s*(?:passed|pass)", line)
            if m:
                pytest_count = m.group(1)
        if "Frontend Jest" in line or "Jest tests" in line:
            m = re.search(r"\*\*(\d+)\s*passed", line)
            if m:
                jest_count = m.group(1)

    return scores, milestones, overall, pytest_count, jest_count, p2_remaining


def parse_domain_details(text):
    """
    Parse per-domain ✅/❌ details from gap report sections 2-7.
    Line-by-line parsing for robustness against different table formats.
    """
    domains = []
    section_pattern = re.compile(
        r"^##\s+(\d+)\.\s*(.*?)\s*[—\-]\s*([🟢🟡🔴⚪])\s*(\d+)%",
        re.MULTILINE
    )
    for m in section_pattern.finditer(text):
        sec_num = m.group(1)
        name_raw = m.group(2).strip()
        icon = m.group(3)
        score = int(m.group(4))

        skip_sections = {"測試覆蓋率", "後端 API 完整覆盤", "優先級行動建議", "架構風險", "評分總覽",
                         "未開始模組", "技術債與基礎建設", "結論"}
        if name_raw in skip_sections or int(sec_num) < 2 or int(sec_num) > 7:
            continue

        sec_start = m.start()
        next_sec = re.search(r"^##\s+\d+", text[sec_start + len(m.group(0)):], re.MULTILINE)
        sec_text = text[sec_start:sec_start + next_sec.start()] if next_sec else text[sec_start:]

        done_start = sec_text.find("### 已實作")
        miss_start = sec_text.find("### 缺失")

        # Parse ✅ items
        completed = []
        if done_start >= 0:
            done_end = miss_start if miss_start > done_start else len(sec_text)
            for line in sec_text[done_start:done_end].split("\n"):
                s = line.strip()
                if not s or s.startswith("###") or s.startswith("|:") or s == "|---" or s.startswith("|-"):
                    continue
                if s.startswith("- "):
                    # Bullet: "- **Feature** — notes" or "- Feature"
                    # Skip indented sub-bullets (they're descriptions, not features)
                    raw_line = line
                    if raw_line.startswith("  - ") or raw_line.startswith("    - "):
                        continue
                    item = s[2:].strip("* ").rstrip("*").strip()
                    # Take everything before "—", "–", or "-" separator
                    for sep in (" — ", " – ", " - "):
                        if sep in item:
                            item = item.split(sep)[0]
                            break
                    item = item.strip().rstrip(".")
                    if item and len(item) > 1:
                        completed.append(item)
                elif s.startswith("|") and "✅" in s:
                    # Table: | Feature | ✅ | Notes |
                    cells = [c.strip().strip("* ") for c in s.split("|")]
                    if len(cells) >= 3:
                        feat = cells[1]
                        if feat and feat not in ("功能", "特徵") and len(feat) > 1:
                            # Filter out note-description captures
                            if not any(feat.startswith(w) for w in
                                       ("含 ", "端到", "以 ", "同上", "面移除", "球面", "鏡射", "四種",
                                        "螺距", "Counterbore", "曲面加厚", "中性面", "新實裝",
                                        "**已拆分")):
                                completed.append(feat)

        # Parse ❌ items from "缺失" subsection
        missing = []
        if miss_start >= 0:
            next_sub = re.search(r"^###[^#]", sec_text[miss_start + 1:], re.MULTILINE)
            miss_text = sec_text[miss_start:miss_start + next_sub.start() + 1] if next_sub else sec_text[miss_start:]
            for line in miss_text.split("\n"):
                s = line.strip()
                if s.startswith("|") and not s.startswith("|:"):
                    cells = [c.strip().strip("* ") for c in s.split("|")]
                    if len(cells) >= 3:
                        feat = cells[1]
                        prio = cells[2]
                        if feat and feat not in ("功能", "優先級", "說明") and len(feat) > 1 and prio in ("Low", "Medium", "High"):
                            missing.append(feat)

        name_clean = re.sub(r"\s*\((Sketch|3D Part|Sheet Metal|Surfacing|Assembly|Drawing)\)", "", name_raw).strip()
        status_map = {"🟢": "對齊/完成", "🟡": "部分完成", "🔴": "差距較大", "⚪": "未開始"}

        domains.append({
            "name": name_clean, "score": score, "icon": icon,
            "status": status_map.get(icon, ""),
            "completed": completed, "missing": missing,
        })

    return domains


def parse_testing_details(text):
    """Parse test coverage by module."""
    tests = []
    in_tests = False
    for line in text.split("\n"):
        if "### 測試覆蓋率" in line:
            in_tests = True
            continue
        if in_tests and line.startswith("## "):
            break
        if in_tests and line.startswith("|"):
            parts = [p.strip() for p in line.split("|") if p.strip()]
            if len(parts) >= 2 and parts[0] not in ("Backend pytest", "Frontend Jest tests", "E2E tests", "測試涵蓋模組"):
                if "**" in parts[0]:
                    name = parts[0].strip("* ")
                    count = parts[1] if len(parts) > 1 else ""
                    tests.append({"name": name, "count": count})
    return tests


def parse_api_endpoints(text):
    """Parse API endpoint list from section 10."""
    endpoints = []
    sec_start = text.find("## 10. 後端 API")
    if sec_start < 0:
        return endpoints
    sec_end = text.find("## 11.", sec_start)
    sec_text = text[sec_start:sec_end] if sec_end > sec_start else text[sec_start:]
    for line in sec_text.split("\n"):
        # Match: | `/endpoint` | description |
        # Or: | `/ep1`, `/ep2` | description |
        if line.strip().startswith("| `") and "|" in line:
            parts = [p.strip() for p in line.split("|") if p.strip()]
            if len(parts) >= 2:
                # First cell contains endpoint(s) with backticks
                ep_cell = parts[0]
                desc = parts[1]
                # Extract all backtick-quoted paths
                quoted_paths = re.findall(r"`(/[^`]+)`", ep_cell)
                for path in quoted_paths:
                    endpoints.append({"endpoint": path, "desc": desc})
    return endpoints


def parse_risks(text):
    """Parse architecture risks."""
    risks = []
    in_risks = False
    for line in text.split("\n"):
        if "## 12. 架構風險" in line:
            in_risks = True
            continue
        if in_risks and line.startswith("## "):
            break
        if in_risks and line.startswith("|"):
            parts = [p.strip() for p in line.split("|") if p.strip()]
            if len(parts) >= 3 and parts[0] not in ("風險", "---", ":---"):
                risk = parts[0].strip("* ")
                severity = parts[1].strip("* ")
                mitigation = parts[2].strip("* ")
                risks.append({"risk": risk, "severity": severity, "mitigation": mitigation})
    return risks


def parse_p3_backlog(text):
    """Parse P3 backlog items."""
    items = []
    in_p3 = False
    for line in text.split("\n"):
        if "### P3 — Backlog" in line or "### P3 — Backlog (Low)" in line:
            in_p3 = True
            continue
        if in_p3 and (line.startswith("## ") or line.startswith("---")):
            break
        if in_p3 and line.startswith("|"):
            parts = [p.strip() for p in line.split("|") if p.strip()]
            if parts and not parts[0].startswith(":") and parts[0] not in ("項目", "---"):
                items.append(parts[0].strip("* "))
    return items


def parse_tech_debt(text):
    """Parse tech debt items."""
    debts = []
    in_debt = False
    for line in text.split("\n"):
        if "### 程式碼品質" in line:
            in_debt = True
            continue
        if in_debt and (line.startswith("## ") or line.startswith("### 測試覆蓋率")):
            break
        if in_debt and line.startswith("|"):
            parts = [p.strip() for p in line.split("|") if p.strip()]
            if len(parts) >= 2 and parts[0] not in ("項目", "---"):
                item = parts[0].strip("* ")
                status = parts[1].strip("* ") if len(parts) > 1 else ""
                if item and len(item) > 1:
                    debts.append({"item": item, "status": status})
    return debts


def run_scs_scanner(text):
    """Run the SCS scanner and parse the score."""
    if not SCS_SCRIPT.exists():
        return None, f"script not found"

    # Use shell=True on Windows to avoid cp950 encoding issues with emoji
    rc, out, err = run_cmd(
        f'"{sys.executable}" "{SCS_SCRIPT}"', shell=True, timeout=30
    )
    if rc != 0:
        return None, err[:100] if err else "non-zero exit"

    # Parse score line: "Total SolidWorks Compatibility Score (SCS): 100/100 (100.0%)"
    m = re.search(r"SCS\):\s*(\d+)/(\d+)\s*\((\d+\.?\d*)%\)", out)
    if m:
        return {"score": int(m.group(1)), "max": int(m.group(2)), "pct": float(m.group(3))}, out
    # Fallback: try from gap report directly
    m2 = re.search(r"SCS\).*?\|\s*(\d+)%\s*\|", text)
    if m2:
        return {"score": int(m2.group(1)), "max": 100, "pct": float(m2.group(1))}, "from gap report"
    return None, "parse failed - check SCS scanner output format"


def run_pytest():
    """Run pytest and extract pass count."""
    rc, out, err = run_cmd(
        [sys.executable, "-m", "pytest", "-x", "--tb=line", "-q"],
        cwd=ROOT / "backend",
        timeout=120,
    )
    if rc != 0 and rc != 1:  # pytest returns 1 for test failures
        return None, err or "pytest failed to run"

    # "104 passed" or "100 passed, 1 failed"
    m = re.search(r"(\d+)\s*passed", out)
    if m:
        total = int(m.group(1))
        # Check for failures
        failed_m = re.search(r"(\d+)\s*failed", out)
        failed = int(failed_m.group(1)) if failed_m else 0
        return {"passed": total, "failed": failed, "total": total + failed}, ""
    return None, "could not parse pytest output"


def run_jest():
    """Run Jest and extract pass count."""
    rc, out, err = run_cmd(
        "npx jest --passWithNoTests --no-color",
        timeout=120, shell=True
    )
    # Jest outputs to stderr, not stdout. Check both.
    combined = out + "\n" + err
    m = re.search(r"Tests:\s+(\d+)\s*passed,\s*(\d+)\s*total", combined)
    if m:
        passed = int(m.group(1))
        total = int(m.group(2))
        return {"passed": passed, "total": total, "failed": total - passed}, ""
    return None, "could not parse jest output"


def run_tsc():
    """Run TypeScript compiler check."""
    rc, out, err = run_cmd("npx tsc --noEmit", timeout=120, shell=True)
    errors = []
    if rc != 0:
        for line in out.split("\n"):
            if "error TS" in line:
                errors.append(line.strip())
    return {"pass": rc == 0, "errors": len(errors), "error_lines": errors[:10]}


def format_roadmap(scores, milestones, overall_pct, pytest_data, jest_data, tsc_data, scs_data, p2_remaining,
                   domains=None, tests=None, endpoints=None, risks=None, p3_backlog=None, tech_debts=None,
                   tasks=None, completed_tasks=None):
    """Generate a comprehensive DEVELOPMENT_ROADMAP.md with per-domain detail."""
    now = datetime.now().strftime("%Y-%m-%d %H:%M")

    # Compute overall maturity excluding intentionally deferred domains (0% = Tolerancing, Weldments)
    if scores:
        active = {k: v for k, v in scores.items() if v["score"] > 0}
        computed_overall = round(sum(v["score"] for v in active.values()) / len(active)) if active else 0
    else:
        computed_overall = int(overall_pct) if overall_pct else 0

    def badge(v):
        if v >= 90: return "🟢"
        if v >= 50: return "🟡"
        if v > 0: return "🔴"
        return "⚪"

    tsc_badge = "✅" if tsc_data["pass"] else f"❌ ({tsc_data['errors']} errors)"
    scs_pct = scs_data["pct"] if scs_data and scs_data["pct"] else 0
    scs_str = f"{scs_pct:.0f}%" if scs_data else "N/A"

    lines = []
    lines.append("# 🗺️ 3D-Builder 開發路線圖（即時更新）")
    lines.append("")
    lines.append(f"> **最後更新**: {now}")
    lines.append(f"> **自動產生自**: `skills/dev/living-roadmap/scripts/update_roadmap.py`")
    lines.append(f"> **基準**: SOLIDWORKS 2010 Chinese Edition")
    lines.append("")
    lines.append("---")
    lines.append("")

    # ── Dashboard ──
    lines.append("## 📊 現況儀表板")
    lines.append("")
    lines.append("| 指標 | 數值 |")
    lines.append("|:---|---:|")
    lines.append(f"| 總體成熟度（活躍領域） | **~{computed_overall}%** |")
    lines.append(f"| SCS (UI/UX 相容性) | **{scs_str}** |")
    lines.append(f"| TypeScript 編譯 | {tsc_badge} |")
    if pytest_data:
        lines.append(f"| 後端測試 (pytest) | **{pytest_data['passed']}** passed / {pytest_data['total']} total |")
    if jest_data:
        lines.append(f"| 前端測試 (Jest) | **{jest_data['passed']}** passed / {jest_data['total']} total |")
    lines.append("")
    lines.append("### 領域成熟度")
    lines.append("")
    lines.append("| 領域 | 分數 | 狀態 |")
    lines.append("|:---|:---:|:---:|")
    for domain, data in sorted(scores.items(), key=lambda x: x[1]["score"]):
        bar_len = max(1, data["score"] // 5)
        bar = "█" * bar_len + "░" * (20 - bar_len)
        lines.append(f"| **{domain}** | {data['score']}% `{bar}` | {badge(data['score'])} {data['status']} |")
    lines.append("")
    lines.append("---")
    lines.append("")

    # ── Per-Domain Detailed Breakdown ──
    lines.append("## 🎯 領域詳細狀態")
    lines.append("")
    if domains:
        for d in domains:
            icon = d["icon"]
            score = d["score"]
            name = d["name"]
            lines.append(f"### {icon} {name} — {score}%")
            lines.append("")
            if d["completed"]:
                lines.append("#### ✅ 已實作")
                lines.append("")
                for item in d["completed"][:20]:  # cap at 20 items
                    lines.append(f"- {item}")
                lines.append("")
            if d["missing"]:
                lines.append("#### ❌ 尚未實作")
                lines.append("")
                for item in d["missing"][:15]:
                    lines.append(f"- {item}")
                lines.append("")
            lines.append("---")
            lines.append("")
    else:
        lines.append("*資料未就緒*")
        lines.append("")
        lines.append("---")
        lines.append("")

    # ── Test Coverage (with module breakdown) ──
    lines.append("## 🧪 測試覆蓋率")
    lines.append("")
    lines.append("| 項目 | 本次 | 備註 |")
    lines.append("|:---|---:|:---|")
    if pytest_data:
        lines.append(f"| pytest | {pytest_data['passed']}/{pytest_data['total']} | 後端 API + 特徵 + 繪圖測試 |")
    if jest_data:
        lines.append(f"| Jest | {jest_data['passed']}/{jest_data['total']} | 前端 utility + 元件測試 |")
    lines.append(f"| tsc --noEmit | {'✅ PASS' if tsc_data['pass'] else '❌ FAIL'} | TypeScript 編譯檢查 |")
    if tsc_data["errors"] > 0 and tsc_data["error_lines"]:
        lines.append("")
        lines.append("**目前 tsc 錯誤：**")
        for err in tsc_data["error_lines"]:
            lines.append(f"- `{err}`")

    if tests:
        lines.append("")
        lines.append("### 測試涵蓋模組")
        lines.append("")
        for t in tests:
            lines.append(f"- {t['name']}: {t['count']}")
    lines.append("")
    lines.append("---")
    lines.append("")

    # ── API Inventory ──
    if endpoints:
        lines.append("## 🔌 API 端點庫存")
        lines.append("")
        lines.append(f"共 {len(endpoints)} 個端點：")
        lines.append("")
        # Group by prefix
        groups = {}
        for ep in endpoints:
            path = ep["endpoint"]
            prefix = path.strip("/").split("/")[0].split("_")[0] if "/" in path else "other"
            if prefix not in groups:
                groups[prefix] = []
            groups[prefix].append(ep)
        for prefix in sorted(groups.keys()):
            eps = groups[prefix]
            lines.append(f"**/{prefix}/** ({len(eps)} 個)")
            # Deduplicate display: group same-desc endpoints
            seen_descs = {}
            for e in eps:
                if e['desc'] not in seen_descs:
                    seen_descs[e['desc']] = []
                seen_descs[e['desc']].append(e['endpoint'])
            for desc, ep_list in seen_descs.items():
                joined = ", ".join(ep_list)
                lines.append(f"- `{joined}` — {desc}")
            lines.append("")
        lines.append("---")
        lines.append("")

    # ── Architecture Risks ──
    if risks:
        lines.append("## ⚠️ 架構風險")
        lines.append("")
        lines.append("| 風險 | 嚴重度 | 緩解狀態 |")
        lines.append("|:---|:---:|:---|")
        for r in risks:
            sev_icon = "🟢" if "🟢" in r['severity'] else "🟡" if "🟡" in r['severity'] else "🔴"
            lines.append(f"| {r['risk']} | {sev_icon} | {r['mitigation']} |")
        lines.append("")
        lines.append("---")
        lines.append("")

    # ── Priority Actions ──
    lines.append("## 🎯 優先級行動")
    lines.append("")
    lines.append("| 優先級 | 狀態 |")
    lines.append("|:---|---:|")
    lines.append("| P0 (Critical) | 全部 ✅ |")
    lines.append("| P1 (High) | 全部 ✅ |")
    if p2_remaining:
        lines.append(f"| P2 (Medium) | {len(p2_remaining)} 項待完成 |")
    else:
        lines.append("| P2 (Medium) | 全部 ✅ |")
    lines.append("| P3 (Low) | Backlog |")
    lines.append("")

    # ── Sprint Tasks (from sprint-backlog.md) ──
    if tasks:
        lines.append("### 📋 目前 Sprint 任務")
        lines.append("")
        active_tasks = [t for t in tasks if t["status"] != "done"]
        for t in active_tasks:
            status_icon = {"pending": "⏳", "in_progress": "🔄", "done": "✅"}.get(t["status"], "⏳")
            lines.append(f"#### {status_icon} [{t['priority']}] {t['title']}")
            lines.append("")
            if t["domain"]:
                lines.append(f"- **領域**: {t['domain']}")
            if t["status"]:
                lines.append(f"- **狀態**: {t['status']}")
            if t["deps"]:
                lines.append(f"- **依賴**: {t['deps']}")
            if t["hours"]:
                lines.append(f"- **估計工時**: {t['hours']}")
            if t["goal"]:
                lines.append(f"- **目標**: {t['goal']}")
            if t["criteria"]:
                lines.append(f"- **驗收標準**:")
                for c in t["criteria"]:
                    check = "x" if c["done"] else " "
                    lines.append(f"  - [{check}] {c['desc']}")
            lines.append("")

    if p2_remaining:
        lines.append("### 待完成 P2")
        lines.append("")
        for item in p2_remaining:
            lines.append(f"- [ ] {item}")
        lines.append("")
    if p3_backlog:
        lines.append("### P3 Backlog")
        lines.append("")
        for item in p3_backlog:
            lines.append(f"- [ ] {item}")
        lines.append("")
    lines.append("---")
    lines.append("")

    # ── Completed Milestones ──
    if milestones:
        lines.append("## ✅ 近期完成里程碑")
        lines.append("")
        lines.append("| 項目 | 日期 | 類別 |")
        lines.append("|:---|---:|:---|")
        for m in milestones[-25:]:
            lines.append(f"| **{m['name']}** | {m['date']} | {m['category']} |")
        lines.append("")
        lines.append("---")
        lines.append("")

    # ── Tech Debt ──
    lines.append("## 🔧 技術債")
    lines.append("")
    if tech_debts:
        lines.append("| 項目 | 狀態 |")
        lines.append("|:---|---:|")
        for d in tech_debts:
            if d['item'] not in ("---",) and not d['item'].startswith(":"):
                lines.append(f"| {d['item']} | {d['status']} |")
    else:
        lines.append("- [ ] `geometry_service.py` 拆分 (目前 ~5500 行)")
        lines.append("- [ ] HOLE/HOLE_WIZARD 重複消除")
        lines.append("- [ ] FeatureManagerPanel.tsx 拆分 (目前 1000+ 行)")
        lines.append("- [ ] 統一錯誤處理層")
        lines.append("- [ ] STEP 匯入 UI")
        lines.append("- [ ] E2E 測試骨架 (Playwright)")
    lines.append("")
    lines.append("---")
    lines.append("")

    # ── Footer ──
    lines.append("*此文件由 `living-roadmap` 技能自動維護。執行下列指令以更新：*")
    lines.append("")
    lines.append("```bash")
    lines.append("python skills/dev/living-roadmap/scripts/update_roadmap.py")
    lines.append("```")

    return "\n".join(lines)


def format_html_roadmap(scores, milestones, overall_pct, pytest_data, jest_data, tsc_data, scs_data, p2_remaining,
                        domains=None, tests=None, endpoints=None, risks=None, p3_backlog=None, tech_debts=None,
                        tasks=None, completed_tasks=None):
    """Generate a self-contained HTML dashboard."""
    now = datetime.now().strftime("%Y-%m-%d %H:%M")

    if scores:
        active = {k: v for k, v in scores.items() if v["score"] > 0}
        computed_overall = round(sum(v["score"] for v in active.values()) / len(active)) if active else 0
    else:
        computed_overall = int(overall_pct) if overall_pct else 0

    def bar_html(v, label=""):
        color = "#22c55e" if v >= 90 else "#eab308" if v >= 50 else "#ef4444" if v > 0 else "#888"
        return f'<div style="background:#e5e7eb;border-radius:8px;height:22px;overflow:hidden;position:relative">' \
               f'<div style="width:{v}%;background:{color};height:100%;border-radius:8px;transition:width .5s"></div>' \
               f'<span style="position:absolute;top:0;left:8px;line-height:22px;font-size:12px;color:#1f2937;font-weight:600">{v}%{label}</span></div>'

    def icon(v):
        return "🟢" if v >= 90 else "🟡" if v >= 50 else "🔴" if v > 0 else "⚪"

    # ── Dashboard metrics ──
    tsc_text = "✅ PASS" if tsc_data["pass"] else f"❌ {tsc_data['errors']} errors"
    tsc_color = "#22c55e" if tsc_data["pass"] else "#ef4444"
    pytest_text = f"{pytest_data['passed']}/{pytest_data['total']}" if pytest_data else "N/A"
    jest_text = f"{jest_data['passed']}/{jest_data['total']}" if jest_data else "N/A"
    scs_pct = scs_data['pct'] if scs_data else 0
    scs_text = f"{scs_pct:.0f}%" if scs_data else "N/A"

    # ── Domain table ──
    domain_rows = ""
    for domain, data in sorted(scores.items(), key=lambda x: x[1]["score"]):
        domain_rows += f"""
            <tr>
                <td style="padding:6px 12px;font-weight:600">{domain}</td>
                <td style="padding:6px 12px;width:250px">{bar_html(data['score'])}</td>
                <td style="padding:6px 12px;text-align:center">{icon(data['score'])}</td>
                <td style="padding:6px 12px;color:#6b7280;font-size:13px">{data['status']}</td>
            </tr>"""

    # ── Per-domain detail cards ──
    domain_cards = ""
    if domains:
        for d in domains:
            completed_items = "".join(f"<li>{item}</li>" for item in d["completed"][:20])
            missing_items = "".join(f"<li style='color:#ef4444'>{item}</li>" for item in d["missing"][:15])
            domain_cards += f"""
            <div class="card" style="border-left:4px solid {'#22c55e' if d['score']>=90 else '#eab308' if d['score']>=50 else '#ef4444'}">
                <h2>{d['icon']} {d['name']} — {d['score']}%</h2>
                {f'<h3>✅ 已實作</h3><ul style="padding-left:20px;line-height:1.8">{completed_items}</ul>' if d['completed'] else ''}
                {f'<h3 style="color:#ef4444">❌ 尚未實作</h3><ul style="padding-left:20px;line-height:1.8">{missing_items}</ul>' if d['missing'] else ''}
            </div>"""

    # ── Test modules ──
    test_rows = ""
    if tests:
        for t in tests:
            test_rows += f"<tr><td style='padding:4px 12px'>{t['name']}</td><td style='padding:4px 12px'>{t['count']}</td></tr>"

    # ── API endpoints ──
    api_html = ""
    if endpoints:
        groups = {}
        for ep in endpoints:
            prefix = ep["endpoint"].split("/")[1] if "/" in ep["endpoint"] else "other"
            prefix = prefix.split("_")[0]
            groups.setdefault(prefix, []).append(ep)
        for prefix in sorted(groups.keys()):
            eps = groups[prefix]
            ep_items = "".join(f"<li><code>{e['endpoint']}</code> — {e['desc']}</li>" for e in eps)
            api_html += f"<h3 style='margin:8px 0'>/{prefix}/ ({len(eps)})</h3><ul style='padding-left:20px;line-height:1.8'>{ep_items}</ul>"

    # ── Risks table ──
    risk_rows = ""
    if risks:
        for r in risks:
            sev_icon = "🟢" if "🟢" in r['severity'] else "🟡" if "🟡" in r['severity'] else "🔴"
            risk_rows += f"<tr><td style='padding:6px 12px'>{r['risk']}</td><td style='padding:6px 12px;text-align:center'>{sev_icon}</td><td style='padding:6px 12px'>{r['mitigation']}</td></tr>"

    # ── Milestones ──
    ms_rows = ""
    for m in milestones[-20:]:
        ms_rows += f"<tr><td style='padding:4px 12px'><b>{m['name']}</b></td><td style='padding:4px 12px'>{m['date']}</td><td style='padding:4px 12px'>{m['category']}</td></tr>"

    # ── Tech debt ──
    debt_rows = ""
    if tech_debts:
        for d in tech_debts:
            debt_rows += f"<tr><td style='padding:4px 12px'>{d['item']}</td><td style='padding:4px 12px'>{d['status']}</td></tr>"

    # ── P2 / P3 ──
    p2_items = "".join(f"<li style='margin:6px 0;padding:8px 12px;background:#fefce8;border-left:3px solid #eab308;border-radius:4px;font-size:14px'>{item}</li>" for item in p2_remaining) if p2_remaining else "<li style='color:#6b7280'>所有 P2 項目已完成</li>"
    p3_items = "".join(f"<li style='margin:4px 0;color:#6b7280'>{item}</li>" for item in p3_backlog) if p3_backlog else ""

    # ── Sprint Tasks HTML ──
    sprint_task_cards = ""
    if tasks:
        active_tasks = [t for t in tasks if t["status"] != "done"]
        for t in active_tasks:
            status_icon = {"pending": "⏳", "in_progress": "🔄", "done": "✅"}.get(t["status"], "⏳")
            criteria_html = ""
            for c in t["criteria"]:
                cb = "checked" if c["done"] else ""
                criteria_html += f'<li style="margin:2px 0"><input type="checkbox" {cb} disabled> {c["desc"]}</li>'
            sprint_task_cards += f"""
            <div class="card" style="border-left:4px solid {'#22c55e' if t['status']=='done' else '#eab308' if t['status']=='in_progress' else '#6b7280'};margin-bottom:12px;padding:16px">
                <h3 style="margin:0 0 8px;font-size:15px">{status_icon} [{t['priority']}] {t['title']}</h3>
                <div style="font-size:13px;color:#6b7280;display:grid;grid-template-columns:auto 1fr;gap:2px 12px">
                    {f'<span>領域:</span><span>{t["domain"]}</span>' if t["domain"] else ''}
                    <span>狀態:</span><span style="font-weight:600">{t["status"]}</span>
                    {f'<span>工時:</span><span>{t["hours"]}</span>' if t["hours"] else ''}
                    {f'<span>目標:</span><span>{t["goal"]}</span>' if t["goal"] else ''}
                </div>
                {f'<div style="margin-top:8px;font-size:13px"><strong>驗收標準:</strong><ul style="padding-left:20px;margin:4px 0;list-style:none">{criteria_html}</ul></div>' if t['criteria'] else ''}
            </div>"""

    html = f"""<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>3D-Builder 開發路線圖</title>
<style>
* {{ margin:0; padding:0; box-sizing:border-box }}
body {{ font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; background:#f8fafc; color:#1f2937; padding:20px }}
.container {{ max-width:960px; margin:0 auto }}
h1 {{ font-size:24px; margin-bottom:4px }}
.subtitle {{ color:#6b7280; font-size:13px; margin-bottom:20px }}
.card {{ background:#fff; border-radius:12px; padding:20px; margin-bottom:16px; box-shadow:0 1px 3px rgba(0,0,0,.08) }}
.card h2 {{ font-size:16px; margin-bottom:12px; color:#374151 }}
.card h3 {{ font-size:14px; margin:12px 0 8px; color:#6b7280 }}
.metric-grid {{ display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:12px }}
.metric {{ text-align:center; padding:16px; border-radius:8px; background:#f8fafc }}
.metric .value {{ font-size:32px; font-weight:700 }}
.metric .label {{ font-size:12px; color:#6b7280; margin-top:4px }}
table {{ width:100%; border-collapse:collapse }}
th {{ text-align:left; padding:8px 12px; font-size:12px; color:#6b7280; text-transform:uppercase; border-bottom:2px solid #e5e7eb }}
td {{ border-bottom:1px solid #f3f4f6 }}
.footer {{ text-align:center; font-size:12px; color:#9ca3af; padding:20px 0 }}
</style>
</head>
<body>
<div class="container">
    <h1>🗺️ 3D-Builder 開發路線圖</h1>
    <div class="subtitle">最後更新: {now} · 自動產生自 living-roadmap 技能</div>

    <!-- Metrics -->
    <div class="card">
        <h2>📊 現況儀表板</h2>
        <div class="metric-grid">
            <div class="metric">
                <div class="value" style="color:#3b82f6">{computed_overall}%</div>
                <div class="label">總體成熟度</div>
            </div>
            <div class="metric">
                <div class="value" style="color:{'#22c55e' if scs_pct >= 90 else '#eab308'}">{scs_text}</div>
                <div class="label">SCS (UI/UX 相容性)</div>
            </div>
            <div class="metric">
                <div class="value" style="color:{tsc_color}">{tsc_text}</div>
                <div class="label">TypeScript 編譯</div>
            </div>
            <div class="metric">
                <div class="value" style="color:#3b82f6">{pytest_text}</div>
                <div class="label">pytest (後端)</div>
            </div>
            <div class="metric">
                <div class="value" style="color:#3b82f6">{jest_text}</div>
                <div class="label">Jest (前端)</div>
            </div>
        </div>
    </div>

    <!-- Domain scores -->
    <div class="card">
        <h2>🎯 領域成熟度</h2>
        <table>
            <tr><th>領域</th><th>分數</th><th style="text-align:center">狀態</th><th>備註</th></tr>
            {domain_rows}
        </table>
    </div>

    <!-- Per-domain detail -->
    {domain_cards}

    <!-- Test coverage -->
    {f'''
    <div class="card">
        <h2>🧪 測試涵蓋模組</h2>
        <table>
            <tr><th>模組</th><th>測試</th></tr>
            {test_rows}
        </table>
    </div>
    ''' if test_rows else ''}

    <!-- API endpoints -->
    {f'''
    <div class="card">
        <h2>🔌 API 端點庫存</h2>
        {api_html}
    </div>
    ''' if api_html else ''}

    <!-- Risks -->
    {f'''
    <div class="card">
        <h2>⚠️ 架構風險</h2>
        <table>
            <tr><th>風險</th><th style="text-align:center">嚴重度</th><th>緩解</th></tr>
            {risk_rows}
        </table>
    </div>
    ''' if risk_rows else ''}

    <!-- Priority + Sprint Tasks -->
    <div class="card">
        <h2>🎯 優先級行動</h2>
        <table>
            <tr><th>優先級</th><th>狀態</th></tr>
            <tr><td>P0 (Critical)</td><td>全部 ✅</td></tr>
            <tr><td>P1 (High)</td><td>全部 ✅</td></tr>
            <tr><td>P2 (Medium)</td><td>{len(p2_remaining)} 項待完成</td></tr>
            <tr><td>P3 (Low)</td><td>Backlog</td></tr>
        </table>
        <h3 style="margin-top:12px">📋 待完成 P2</h3>
        <ul style="list-style:none;padding:0">{p2_items}</ul>
        {f'<h3 style="margin-top:12px">📋 P3 Backlog</h3><ul style="padding-left:20px;line-height:1.8;color:#6b7280">{p3_items}</ul>' if p3_items else ''}
    </div>

    {f'''
    <h2 style="font-size:18px;margin:16px 0 8px">📋 目前 Sprint 任務</h2>
    {sprint_task_cards}
    ''' if sprint_task_cards else ''}

    <!-- Milestones -->
    {f'''
    <div class="card">
        <h2>✅ 近期完成里程碑</h2>
        <table>
            <tr><th>項目</th><th>日期</th><th>類別</th></tr>
            {ms_rows}
        </table>
    </div>
    ''' if ms_rows else ''}

    <!-- Tech debt -->
    {f'''
    <div class="card">
        <h2>🔧 技術債</h2>
        <table>
            <tr><th>項目</th><th>狀態</th></tr>
            {debt_rows}
        </table>
    </div>
    ''' if debt_rows else ''}

    <div class="footer">由 <code>skills/dev/living-roadmap/scripts/update_roadmap.py</code> 自動維護 · 執行該腳本以更新</div>
</div>
</body>
</html>"""
    return html


def main():
    print("=" * 60)
    print("  Living Roadmap — Auto Updater")
    print("=" * 60)
    print()

    # Debug: check paths
    print(f"       ROOT = {ROOT}")
    print(f"       GAP_REPORT = {GAP_REPORT}")
    print(f"       GAP_REPORT exists = {GAP_REPORT.exists()}")
    print(f"       SCS_SCRIPT = {SCS_SCRIPT}")
    print(f"       SCS_SCRIPT exists = {SCS_SCRIPT.exists()}")

    # Read gap text once
    gap_text = GAP_REPORT.read_text(encoding="utf-8") if GAP_REPORT.exists() else ""

    # 1. Parse gap report
    print("[1/5] Parsing gap-analysis-report.md ...")
    scores, milestones, overall_pct, pytest_count, jest_count, p2_remaining = parse_gap_report()
    if scores:
        print(f"       → {len(scores)} domains, {len(milestones)} milestones, {len(p2_remaining)} P2 remaining")
    else:
        print("       → gap report not found, using defaults")

    # Parse additional details from gap report
    domains = parse_domain_details(gap_text)
    tests = parse_testing_details(gap_text)
    endpoints = parse_api_endpoints(gap_text)
    risks = parse_risks(gap_text)
    p3_backlog = parse_p3_backlog(gap_text)
    tech_debts = parse_tech_debt(gap_text)
    print(f"       → {len(domains)} detailed domains, {len(endpoints)} API endpoints, {len(risks)} risks, {len(p3_backlog)} P3 items")

    # Parse sprint backlog
    tasks, completed_tasks = parse_sprint_backlog()
    if tasks:
        active = sum(1 for t in tasks if t["status"] != "done")
        print(f"       → {len(tasks)} sprint tasks ({active} active, {len(completed_tasks)} completed)")

    # 2. Run SCS scanner
    print("[2/5] Running SCS scanner ...")
    scs_data, scs_raw = run_scs_scanner(gap_text)
    if scs_data:
        print(f"       → SCS: {scs_data['score']}/{scs_data['max']} ({scs_data['pct']:.1f}%)")
    else:
        print(f"       → SCS scan failed: {scs_raw}")

    # 3. Run pytest
    print("[3/5] Running pytest ...")
    pytest_data = None
    try:
        pytest_data, err = run_pytest()
        if pytest_data:
            print(f"       → {pytest_data['passed']} passed / {pytest_data['total']} total")
        else:
            print(f"       → pytest issue: {err}")
    except Exception as e:
        print(f"       → pytest error: {e}")

    # 4. Run Jest
    print("[4/5] Running Jest ...")
    jest_data = None
    try:
        jest_data, err = run_jest()
        if jest_data:
            print(f"       → {jest_data['passed']} passed / {jest_data['total']} total")
        else:
            print(f"       → jest issue: {err}")
    except Exception as e:
        print(f"       → jest error: {e}")

    # 5. Run tsc
    print("[5/5] Running tsc --noEmit ...")
    tsc_data = run_tsc()
    if tsc_data["pass"]:
        print(f"       → ✅ 0 errors")
    else:
        print(f"       → ❌ {tsc_data['errors']} errors")

    print()
    print("─" * 60)
    print("  Generating roadmap document ...")

    # Shared kwargs for both format functions
    kwargs = dict(
        scores=scores,
        milestones=milestones,
        overall_pct=overall_pct,
        pytest_data=pytest_data,
        jest_data=jest_data,
        tsc_data=tsc_data,
        scs_data=scs_data,
        p2_remaining=p2_remaining,
        domains=domains,
        tests=tests,
        endpoints=endpoints,
        risks=risks,
        p3_backlog=p3_backlog,
        tech_debts=tech_debts,
        tasks=tasks,
        completed_tasks=completed_tasks,
    )

    # Write markdown output
    content = format_roadmap(**kwargs)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(content, encoding="utf-8")
    print(f"  ✅ Written to {OUTPUT}")
    print(f"     ({len(content)} chars)")

    # Write HTML output
    html_content = format_html_roadmap(**kwargs)
    OUTPUT_HTML.write_text(html_content, encoding="utf-8")
    print(f"  ✅ Written to {OUTPUT_HTML}")
    print(f"     ({len(html_content)} chars)")

    # Summary
    print()
    print("=" * 60)
    print("  Summary")
    print("=" * 60)
    if tsc_data["pass"]:
        print(f"  ✅ tsc: PASS (0 errors)")
    else:
        print(f"  ❌ tsc: {tsc_data['errors']} errors")
    if pytest_data:
        print(f"  ✅ pytest: {pytest_data['passed']}/{pytest_data['total']}")
    else:
        print(f"  ⚠️  pytest: not available")
    if jest_data:
        print(f"  ✅ Jest: {jest_data['passed']}/{jest_data['total']}")
    else:
        print(f"  ⚠️  Jest: not available")
    print()
    if scores:
        active = {k: v for k, v in scores.items() if v["score"] > 0}
        avg = sum(v['score'] for v in active.values()) // len(active) if active else 0
        print(f"  Total maturity: ~{avg}%")
    else:
        print(f"  Total maturity: ~?%")
    print(f"  SCS: {scs_data['pct']:.0f}%" if scs_data else "  SCS: N/A")
    print()

    return 0 if tsc_data["pass"] else 1


if __name__ == "__main__":
    sys.exit(main())
