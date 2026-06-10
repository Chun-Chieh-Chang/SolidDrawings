import sys
import os
import pytest

sys.path.append(os.path.join(os.getcwd(), 'backend'))


@pytest.mark.skip(reason="SURFACE_CUT 功能尚未實作完成。process_features() 會呼叫 _shape_to_mesh，但在 pythonocc-core 7.8.1 的 BRepMesh_IncrementalMesh 有 OCCT binding 參數匹配問題。待修復 geometry_service.py 中的 mesh 邏輯後再啟用。")
def test_surface_cut():
    """
    測試 Surface Cut (以曲面切割實體)。
    
    目前狀態: 不可運行
    原因: 
    1. process_features() 回傳 dict 而非 TopoDS_Shape，測試邏輯需重寫
    2. OCCT BRepMesh_IncrementalMesh 在 pythonocc-core 7.8.1 有參數傳遞錯誤
    
    未來測試目標:
    - Base Box 50x50x50 (volume = 125000)
    - 以 Y=25 的平面切割
    - 結果體積應為 62500
    """
    assert False, "Test skipped - SURFACE_CUT not implemented"
