/** Map backend / kernel strings to user-facing 繁體中文 messages. */
export function formatCadErrorMessage(raw: string): string {
  const text = (raw || '').trim();
  if (!text) return '幾何重建失敗，請檢查特徵樹與草圖輪廓。';

  const lower = text.toLowerCase();

  if (lower.includes('fillet') || lower.includes('圓角')) {
    if (lower.includes('radius') || lower.includes('半徑') || lower.includes('過大')) {
      return '圓角半徑過大或與相鄰面衝突，請減小半徑或變更選邊。';
    }
    return `圓角特徵失敗：${text}`;
  }

  if (lower.includes('chamfer') || lower.includes('倒角')) {
    return '倒角距離過大或無法套用於所選邊，請減小距離或重新選邊。';
  }

  if (lower.includes('edge_not_found') || lower.includes('找不到') && lower.includes('邊')) {
    return '找不到先前選取的邊（可能因重建後拓撲改變）。請重新選邊並套用圓角／倒角。';
  }

  if (lower.includes('profile') || lower.includes('loop') || lower.includes('wire')) {
    if (lower.includes('open') || lower.includes('not closed')) {
      return '草圖輪廓未封閉或無法建立面，請檢查封閉輪廓後再拉伸。';
    }
    return '草圖輪廓無法用於此特徵，請檢查封閉輪廓與自相交。';
  }

  if (lower.includes('extrude') || lower.includes('prism')) {
    return '拉伸失敗：請確認草圖為有效封閉輪廓，且深度為正值。';
  }

  if (lower.includes('revolve')) {
    return '旋轉失敗：請確認草圖為封閉輪廓，且旋轉軸與輪廓不相交。';
  }

  if (lower.includes('boolean') || lower.includes('cut')) {
    return '布林切除失敗：目標實體與工具體不相交或體積為空。';
  }

  return text.length > 120 ? `${text.slice(0, 117)}…` : text;
}

export interface FeatureWarning {
  feature?: string;
  code?: string;
  message: string;
}

export function formatFeatureWarnings(warnings: FeatureWarning[]): string | null {
  if (!warnings?.length) return null;
  const first = warnings[0];
  return formatCadErrorMessage(first.message || String(first.code || ''));
}
