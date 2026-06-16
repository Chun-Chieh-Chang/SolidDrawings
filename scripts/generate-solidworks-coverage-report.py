"""Generate SolidWorks 2010 coverage report from feature matrix CSV + test results."""

import csv
import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
CSV_PATH = PROJECT_ROOT / "docs" / "solidworks-2010-feature-matrix.csv"
REPORT_DIR = PROJECT_ROOT / "reports"
REPORT_PATH = REPORT_DIR / "coverage-solidworks-2010.md"
TEST_RESULTS_DIR = PROJECT_ROOT / "reports" / "test-results"

VALID_STATUSES = ("not_started", "designed", "implemented", "tested", "verified", "out_of_scope_with_reason")
STATUS_LABELS = {
    "not_started": "尚未開始",
    "designed": "已設計",
    "implemented": "已實作",
    "tested": "已測試",
    "verified": "已驗證",
    "out_of_scope_with_reason": "超出範圍",
}

# Test file discovery
TEST_FILES = {
    "frontend": [
        "src/utils/__tests__/EquationEngine.test.ts",
        "src/utils/__tests__/GraphAdapter.test.ts",
        "src/utils/__tests__/ConstraintSolver.test.ts",
    ],
    "backend": [
        "backend/tests/test_phase8_critical.py",
        "backend/tests/test_trim_logic.py",
        "backend/tests/test_thin_feature.py",
        "backend/tests/test_surface_cut.py",
        "backend/tests/test_fill_pattern.py",
        "backend/tests/test_dome_feature.py",
        "backend/tests/test_incremental_rebuild.py",
        "backend/tests/test_angle_limiter.py",
    ],
    "e2e": [
        "tests/e2e/visual-regression.spec.ts",
        "tests/e2e/workflow.spec.ts",
    ],
}


def discover_test_files() -> dict:
    """Discover and count test files by category."""
    results = {}
    for category, files in TEST_FILES.items():
        count = 0
        found = []
        for f in files:
            p = PROJECT_ROOT / f
            if p.exists():
                count += 1
                found.append(f)
        results[category] = {"count": count, "files": found}
    return results


def count_test_cases(test_file: Path) -> int:
    """Estimate test case count from a test file."""
    if not test_file.exists():
        return 0
    content = test_file.read_text(encoding="utf-8")
    # Count describe/it/test blocks
    import re
    frontend_tests = len(re.findall(r'\b(it|test)\s*\(', content))
    backend_tests = len(re.findall(r'def\s+test_', content))
    e2e_tests = len(re.findall(r'test\(\s*[\'"]', content))
    return max(frontend_tests, backend_tests, e2e_tests)


def get_test_case_counts() -> dict:
    """Count test cases per category."""
    counts = {}
    for category, files_info in discover_test_files().items():
        total = 0
        for f in files_info["files"]:
            p = PROJECT_ROOT / f
            total += count_test_cases(p)
        counts[category] = total
    return counts


def read_features(csv_path: Path) -> list[dict]:
    features = []
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            features.append(row)
    return features


def compute_overall(features: list[dict]) -> dict:
    total = len(features)
    verified = sum(1 for f in features if f.get("status") == "verified")
    implemented = sum(1 for f in features if f.get("status") in ("implemented", "tested", "verified"))
    out_of_scope = sum(1 for f in features if f.get("status") == "out_of_scope_with_reason")
    denominator = total - out_of_scope
    pct = (verified / denominator * 100) if denominator > 0 else 0.0
    return {
        "total": total,
        "verified": verified,
        "implemented": implemented,
        "out_of_scope": out_of_scope,
        "completion": pct,
    }


def compute_by_area(features: list[dict]) -> dict:
    areas: dict = {}
    for f in features:
        area = f.get("feature_area", "UNKNOWN").strip()
        if not area:
            area = "UNKNOWN"
        if area not in areas:
            areas[area] = {"total": 0, "verified": 0, "implemented": 0, "out_of_scope": 0}
        areas[area]["total"] += 1
        status = f.get("status", "")
        if status == "verified":
            areas[area]["verified"] += 1
        if status in ("implemented", "tested", "verified"):
            areas[area]["implemented"] += 1
        if status == "out_of_scope_with_reason":
            areas[area]["out_of_scope"] += 1
    for area in areas:
        denom = areas[area]["total"] - areas[area]["out_of_scope"]
        areas[area]["completion"] = (areas[area]["verified"] / denom * 100) if denom > 0 else 0.0
    return areas


def get_unverified_by_area(features: list[dict]) -> dict:
    groups: dict = {}
    for f in features:
        if f.get("status") != "verified":
            area = f.get("feature_area", "UNKNOWN").strip() or "UNKNOWN"
            groups.setdefault(area, []).append(f.get("id", ""))
    return groups


def get_missing_refs(features: list[dict], column: str) -> list[dict]:
    result = []
    for f in features:
        val = f.get(column, "").strip()
        if not val:
            result.append(f)
    return result


def get_features_by_status(features: list[dict], status: str) -> list[dict]:
    return [f for f in features if f.get("status") == status]


def generate_report(
    overall: dict,
    areas: dict,
    unverified: dict,
    missing_manual: list[dict],
    missing_test: list[dict],
    test_counts: dict,
    test_files: dict,
) -> str:
    lines: list[str] = []
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    lines.append("# SolidWorks 2010 完成度報告")
    lines.append("")
    lines.append(f"> 生成日期：{now}")
    lines.append("> 基準：solidworks-2010-feature-matrix.csv")
    lines.append("")

    # ── Overall ──
    lines.append("## 總覽")
    lines.append("")
    lines.append("| 指標 | 數值 |")
    lines.append("|------|------|")
    lines.append(f"| 總功能數 | {overall['total']} |")
    lines.append(f"| 已實作 | {overall['implemented']} |")
    lines.append(f"| 已驗證 | {overall['verified']} |")
    lines.append(f"| 超出範圍 | {overall['out_of_scope']} |")
    lines.append(f"| 完成度 | {overall['completion']:.1f}% |")
    lines.append("")

    # ── Test Infrastructure ──
    lines.append("## 測試基礎設施")
    lines.append("")
    lines.append("| 類別 | 測試檔案數 | 測試用例數 |")
    lines.append("|------|-----------|-----------|")
    for cat in ["frontend", "backend", "e2e"]:
        info = test_files.get(cat, {"count": 0})
        count = test_counts.get(cat, 0)
        lines.append(f"| {cat} | {info['count']} | {count} |")
    lines.append("")

    lines.append("### 測試檔案清單")
    lines.append("")
    for cat, info in test_files.items():
        lines.append(f"**{cat}:**")
        for f in info["files"]:
            lines.append(f"- `{f}`")
        lines.append("")

    # ── By Area ──
    lines.append("## 各功能區域")
    lines.append("")
    lines.append("| 區域 | 總數 | 已實作 | 已驗證 | 完成度 |")
    lines.append("|------|------|--------|--------|--------|")
    for area, stats in sorted(areas.items()):
        lines.append(
            f"| {area} | {stats['total']} | {stats['implemented']} | {stats['verified']} | {stats['completion']:.1f}% |"
        )
    lines.append("")

    # ── Implemented features detail ──
    all_features = read_features(CSV_PATH)
    implemented_features = get_features_by_status(all_features, "implemented")
    if implemented_features:
        lines.append("## 已實作功能詳情")
        lines.append("")
        lines.append("| ID | 功能名稱 | 區域 | UI Entry |")
        lines.append("|----|---------|------|----------|")
        for f in implemented_features:
            lines.append(
                f"| {f['id']} | {f['feature_name']} | {f['feature_area']} | {f.get('ui_entry', '-') } |"
            )
        lines.append("")

    # ── Unverified ──
    lines.append("## 未完成功能清單")
    lines.append("")
    lines.append("### 未驗證功能（按區域分組）")
    lines.append("")
    if unverified:
        for area in sorted(unverified.keys()):
            ids = ", ".join(unverified[area][:10])
            if len(unverified[area]) > 10:
                ids += f" ... (共 {len(unverified[area])} 項)"
            lines.append(f"- **{area}**: {ids}")
    else:
        lines.append("- 全部功能已驗證")
    lines.append("")

    # ── Missing refs ──
    lines.append("## 缺失引用")
    lines.append("")
    lines.append("### 缺少 manualRef 的功能")
    lines.append("")
    if missing_manual:
        for f in missing_manual[:20]:
            fid = f.get("id", "")
            fname = f.get("feature_name", "")
            lines.append(f"- {fid}: {fname}")
        if len(missing_manual) > 20:
            lines.append(f"- ... 還有 {len(missing_manual) - 20} 項")
    else:
        lines.append("- 無")
    lines.append("")

    lines.append("### 缺少 test_id 的功能")
    lines.append("")
    if missing_test:
        for f in missing_test:
            fid = f.get("id", "")
            fname = f.get("feature_name", "")
            lines.append(f"- {fid}: {fname}")
    else:
        lines.append("- 無")
    lines.append("")

    # ── Gap Analysis ──
    lines.append("## 缺口分析")
    lines.append("")
    not_started = get_features_by_status(all_features, "not_started")
    lines.append(f"| 項目 | 數量 |")
    lines.append(f"|------|------|")
    lines.append(f"| 尚未開始 | {len(not_started)} |")
    lines.append(f"| 缺少 manualRef | {len(missing_manual)} |")
    lines.append(f"| 缺少 test_id | {len(missing_test)} |")
    lines.append(f"| 已驗證但無測試 | {len(get_missing_refs([f for f in all_features if f.get('status') == 'verified'], 'test_id'))} |")
    lines.append("")

    # ── Next Steps ──
    lines.append("## 下一步建議")
    lines.append("")
    lines.append("1. 優先處理 **草圖** 和 **特徵** 區域的 verified 狀態")
    lines.append("2. 為所有 verified 功能補上 `manualRef` 引用")
    lines.append("3. 為所有 verified 功能關聯 `test_id`")
    lines.append("4. 執行視覺回歸測試收集基準截圖")
    lines.append("5. 更新 feature-matrix.csv 狀態為 `verified`")
    lines.append("")

    return "\n".join(lines)


def main():
    features = read_features(CSV_PATH)
    overall = compute_overall(features)
    areas = compute_by_area(features)
    unverified = get_unverified_by_area(features)
    missing_manual = get_missing_refs(features, "manualRef")
    missing_test = get_missing_refs(features, "test_id")
    test_files = discover_test_files()
    test_counts = get_test_case_counts()

    report = generate_report(overall, areas, unverified, missing_manual, missing_test, test_counts, test_files)
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text(report, encoding="utf-8")
    print(f"Report generated: {REPORT_PATH}")
    print(f"Completion: {overall['completion']:.1f}% | Verified: {overall['verified']}/{overall['total']}")


if __name__ == "__main__":
    main()
