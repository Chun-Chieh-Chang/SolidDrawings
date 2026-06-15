'use client';

import React from 'react';
import { useCadStore } from '../store/useCadStore';
import { saveProject, saveProjectAs, openProject, getNewProjectState, getCurrentFileName } from '../services/projectService';

// ─── Types ───────────────────────────────────────────────────────────────────
type MenuAction = () => void;

interface MenuItem {
  label: string;
  shortcut?: string;
  action?: MenuAction;
  disabled?: boolean;
  subMenu?: MenuItem[];
}

interface MenuSeparator { __sep: true; }

const isSep = (i: unknown): i is MenuSeparator =>
  typeof i === 'object' && i !== null && '__sep' in i;

// ─── Helpers ─────────────────────────────────────────────────────────────────
const toast = (msg: string, type: 'info' | 'error' | 'warning' = 'info') =>
  useCadStore.getState().pushToast(msg, type);

// We can't close menus from outside, so we expose via ref.
// Internal handlers will close the menu via React state.
const close = (setter: React.Dispatch<React.SetStateAction<string | null>>, subSetter: React.Dispatch<React.SetStateAction<string | null>>) => {
  setter(null);
  subSetter(null);
};

// ─── Sub-menu builders (pure data) ───────────────────────────────────────────
function buildFileMenu(onExport?: () => void): (MenuItem | MenuSeparator)[] {
  return [
    { label: '新建(N)', shortcut: 'Ctrl+N', action: undefined },  // set via handler
    { label: '開啟(O)...', shortcut: 'Ctrl+O', action: undefined },
    { label: '儲存(S)', shortcut: 'Ctrl+S', action: undefined },
    { label: '另存新檔(A)', shortcut: 'Ctrl+Shift+S', action: undefined },
    { label: "", __sep: true } as MenuSeparator,
    { label: '還原檔案(R)...', action: undefined },
    { label: "", __sep: true } as MenuSeparator,
    { label: '關閉(C)', shortcut: 'Ctrl+W', action: undefined },
    { label: "", __sep: true } as MenuSeparator,
    { label: '最近使用檔案', disabled: true },
    { label: '  ├─ (暫無最近檔案)', disabled: true },
    { label: "", __sep: true } as MenuSeparator,
    { label: '頁面設定(P)...', disabled: true },
    { label: '列印(R)...', shortcut: 'Ctrl+P', disabled: true },
    { label: '列印預覽(V)', disabled: true },
    { label: "", __sep: true } as MenuSeparator,
    { label: '離開(X)', action: undefined },
  ];
}

function buildEditMenu(): (MenuItem | MenuSeparator)[] {
  return [
    { label: '復原(U)', shortcut: 'Ctrl+Z', action: undefined },
    { label: '重做(R)', shortcut: 'Ctrl+Y', action: undefined },
    { label: "", __sep: true } as MenuSeparator,
    { label: '剪下(C)', shortcut: 'Ctrl+X', action: undefined, disabled: true },
    { label: '複製(C)', shortcut: 'Ctrl+C', action: undefined, disabled: true },
    { label: '貼上(P)', shortcut: 'Ctrl+V', action: undefined, disabled: true },
    { label: '刪除(D)', shortcut: 'Delete', action: undefined },
    { label: "", __sep: true } as MenuSeparator,
    { label: '全選(A)', shortcut: 'Ctrl+A', action: undefined },
    { label: '取消選取(S)', shortcut: 'Esc', action: undefined },
    { label: "", __sep: true } as MenuSeparator,
    { label: '偏好設定(O)...', action: undefined },
    { label: '鍵盤自訂(K)...', action: undefined },
  ];
}

function buildViewMenu(): (MenuItem | MenuSeparator)[] {
  return [
    { label: '顯示設定(D)...', disabled: true },
    { label: "", __sep: true } as MenuSeparator,
    { label: '前導檢視工具列(H)', disabled: true },
    { label: '工具列(T)', disabled: true },
    { label: '自訂(C)...', disabled: true },
    { label: "", __sep: true } as MenuSeparator,
    { label: '縮放至符合(F)', shortcut: 'F', action: undefined },
    { label: '段落視圖(S)', disabled: true },
    { label: "", __sep: true } as MenuSeparator,
    { label: '面板控制' },
    { label: '  └─ 功能管理器面板', action: undefined },
    { label: '  └─ 屬性管理器面板', action: undefined },
    { label: '  └─ 設計庫面板', action: undefined },
    { label: '  └─ 配置管理器面板', action: undefined },
    { label: '  └─ 測量面板', action: undefined },
  ];
}

function buildInsertMenu(): (MenuItem | MenuSeparator)[] {
  return [
    // Boss/Base
    { label: '凸 base/基準' },
    { label: '  ├─ 拉伸凸基(E)...', action: undefined },
    { label: '  ├─ 旋轉凸基(V)...', action: undefined },
    { label: '  ├─ 掃描凸基(S)...', action: undefined },
    { label: '  └─ 混合凸基(F)...', action: undefined },
    { label: "", __sep: true } as MenuSeparator,
    // Cut
    { label: '切除/基準' },
    { label: '  ├─ 拉伸切除(E)...', action: undefined },
    { label: '  ├─ 旋轉切除(R)...', action: undefined },
    { label: '  ├─ 掃描切除(S)...', action: undefined },
    { label: '  └─ 混合切除(F)...', action: undefined },
    { label: "", __sep: true } as MenuSeparator,
    // Reference Geometry
    { label: '參考幾何' },
    { label: '  ├─ 基準平面(P)...', action: undefined },
    { label: '  ├─ 基準軸(A)', action: undefined },
    { label: '  ├─ 基準點(T)', action: undefined },
    { label: '  └─ 座標系統(C)', action: undefined },
    { label: "", __sep: true } as MenuSeparator,
    // Features
    { label: '特徵' },
    { label: '  ├─ 倒角(C)...', action: undefined },
    { label: '  ├─ 圓角(G)...', action: undefined },
    { label: '  ├─ 抽模斜度(D)...', action: undefined },
    { label: '  ├─ 殼體(H)...', action: undefined },
    { label: '  ├─ 筋(R)...', action: undefined },
    { label: '  ├─ 孔精靈(W)...', action: undefined },
    { label: '  ├─ 圓形Pattern', action: undefined },
    { label: '  ├─ 線性Pattern', action: undefined },
    { label: '  └─ 鏡像(M)', action: undefined },
    { label: "", __sep: true } as MenuSeparator,
    // Patterns
    { label: 'Pattern' },
    { label: '  ├─ 線性 Pattern', action: undefined },
    { label: '  ├─ 圓形 Pattern', action: undefined },
    { label: '  ├─ 陣列參考', action: undefined },
    { label: '  ├─ 步驟式 Pattern', action: undefined },
    { label: '  └─ 鏡像 Pattern', action: undefined },
    { label: "", __sep: true } as MenuSeparator,
    // Surface
    { label: '曲面' },
    { label: '  ├─ 拉伸曲面', action: undefined },
    { label: '  ├─ 旋轉曲面', action: undefined },
    { label: '  ├─ 掃掠曲面', action: undefined },
    { label: '  ├─ 放樣曲面', action: undefined },
    { label: '  ├─ 偏移曲面', action: undefined },
    { label: '  ├─ 基準曲面', action: undefined },
    { label: '  ├─ 邊線面', action: undefined },
    { label: '  └─ 自動曲面', action: undefined },
    { label: "", __sep: true } as MenuSeparator,
    // Sketch Block
    { label: '草圖區塊(B)', disabled: true },
    { label: "", __sep: true } as MenuSeparator,
    // Component
    { label: '組件(C)', disabled: true },
  ];
}

function buildFeaturesMenu(): (MenuItem | MenuSeparator)[] {
  return [
    { label: '編輯特徵(E)', disabled: true },
    { label: '特徵定義表(D)', disabled: true },
    { label: "", __sep: true } as MenuSeparator,
    { label: 'Suppressing特徵(S)', disabled: true },
    { label: '停用特徵(D)', disabled: true },
    { label: "", __sep: true } as MenuSeparator,
    { label: '展開(E)', disabled: true },
    { label: '收合(C)', disabled: true },
  ];
}

function buildModifiersMenu(): (MenuItem | MenuSeparator)[] {
  return [
    { label: '控制鍵 (Ctrl)', disabled: true },
    { label: '  ├─ 用於多選和組合操作' },
    { label: '  └─ 配合其他按鍵執行特殊功能' },
    { label: "", __sep: true } as MenuSeparator,
    { label: 'alt鍵 (Alt)', disabled: true },
    { label: '  ├─ 用於快速切換模式和選項' },
    { label: '  └─ 配合滑鼠拖曳執行特殊功能' },
    { label: "", __sep: true } as MenuSeparator,
    { label: 'Ctrl+Alt 組合鍵', disabled: true },
    { label: '  ├─ 用於進階操作和快速存取' },
    { label: '  └─ 配合其他按鍵執行特殊功能' },
  ];
}

function buildAssemblyMenu(): (MenuItem | MenuSeparator)[] {
  return [
    { label: '組件(C)', disabled: true },
    { label: '配合(M)...', disabled: true },
    { label: '子組件(S)', disabled: true },
    { label: '移動/旋轉(K)', disabled: true },
    { label: "", __sep: true } as MenuSeparator,
    { label: '顯示狀態(D)', disabled: true },
    { label: '干涉檢查(I)...', disabled: true },
    { label: '質量屬性(P)', action: undefined },
  ];
}

function buildToolsMenu(): (MenuItem | MenuSeparator)[] {
  return [
    { label: '測量(M)...', shortcut: 'M', action: undefined },
    { label: '質量屬性(P)', action: undefined },
    { label: "", __sep: true } as MenuSeparator,
    { label: '評估(E)', disabled: true },
    { label: '方程式(E)', disabled: true },
    { label: "", __sep: true } as MenuSeparator,
    { label: '曲面檢查(S)', disabled: true },
    { label: '設計檢查(C)', disabled: true },
  ];
}

function buildWindowMenu(): (MenuItem | MenuSeparator)[] {
  return [
    { label: '全部橫排(T)', disabled: true },
    { label: '全部直排(C)', disabled: true },
    { label: '全部關閉(A)', disabled: true },
    { label: '排列圖示(A)', disabled: true },
    { label: "", __sep: true } as MenuSeparator,
    { label: '貼齊格線(G)', action: undefined },
    { label: '格線顯示(R)', action: undefined },
    { label: '視圖方向(O)', action: undefined },
  ];
}

function buildHelpMenu(): (MenuItem | MenuSeparator)[] {
  return [
    { label: 'SOLIDWORKS 說明(H)', shortcut: 'F1', action: undefined },
    { label: '說明資源(R)', action: undefined },
    { label: "", __sep: true } as MenuSeparator,
    { label: '關於 3D-Builder Pro', action: undefined },
  ];
}

// ─── Event handlers ─────────────────────────────────────────────────────────

interface MenuHandlers {
  handleNew: () => void;
  handleOpen: () => void;
  handleSave: () => void;
  handleSaveAs: () => void;
  handleClose: () => void;
  handleUndo: () => void;
  handleRedo: () => void;
  handleDelete: () => void;
  handleDeselectAll: () => void;
  handleZoomToFit: () => void;
  handleMeasure: () => void;
  handleMassProperties: () => void;
  handleAbout: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────
interface TopMenuProps {
  engineStatus: 'CONNECTED' | 'DISCONNECTED';
  onExport?: () => void;
}

export const TopMenu: React.FC<TopMenuProps> = ({ engineStatus, onExport }) => {
  const [openMenu, setOpenMenu] = React.useState<string | null>(null);
  const [hoveredSub, setHoveredSub] = React.useState<string | null>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const activePlane = useCadStore((s) => s.activePlane);
  const projectName = useCadStore((s) => s.projectName);
  const isDirty = useCadStore((s) => s.isDirty);

  // Close on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
        setHoveredSub(null);
      }
    };
    if (openMenu) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openMenu]);

  const displayName = getCurrentFileName() || `${projectName}.3db.json`;

  // Create handlers closure
  const handlersRef = React.useRef<MenuHandlers | null>(null);
  if (!handlersRef.current) {
    const h: MenuHandlers = {
      handleNew: () => {
        const state = useCadStore.getState();
        if (state.isDirty && !window.confirm('目前有未儲存的變更，確定要新建專案嗎？')) return;
        const newState = getNewProjectState();
        useCadStore.setState(newState);
        toast('已建立新專案。', 'warning');
        close(setOpenMenu, setHoveredSub);
      },
      handleOpen: () => {
        const state = useCadStore.getState();
        if (state.isDirty && !window.confirm('目前有未儲存的變更，確定要開啟其他專案嗎？')) return;
        openProject().then((result) => {
          if (result.success && result.data) {
            useCadStore.setState(result.data);
            toast('已開啟檔案。', 'warning');
          } else if (result.error && result.error !== 'Open cancelled by user.') {
            toast('開啟失敗：' + result.error, 'error');
          }
          close(setOpenMenu, setHoveredSub);
        });
      },
      handleSave: () => {
        saveProject(useCadStore.getState()).then((result) => {
          if (result.success) {
            useCadStore.getState().markProjectClean();
            toast('已儲存檔案。', 'warning');
          } else if (result.error && result.error !== 'Save cancelled by user.') {
            toast('儲存失敗：' + result.error, 'error');
          }
          close(setOpenMenu, setHoveredSub);
        });
      },
      handleSaveAs: () => {
        saveProjectAs(useCadStore.getState()).then((result) => {
          if (result.success) {
            useCadStore.getState().markProjectClean();
            toast('已另存新檔。', 'warning');
          } else if (result.error && result.error !== 'Save cancelled by user.') {
            toast('儲存失敗：' + result.error, 'error');
          }
          close(setOpenMenu, setHoveredSub);
        });
      },
      handleClose: () => {
        const state = useCadStore.getState();
        if (state.isDirty && !window.confirm('確定要關閉目前檔案嗎？')) return;
        toast('關閉檔案功能開發中。');
        close(setOpenMenu, setHoveredSub);
      },
      handleUndo: () => {
        const store = useCadStore.getState();
        if (store.history && store.history.past && store.history.past.length > 0) {
          const previous = store.history.past[store.history.past.length - 1];
          const newPast = store.history.past.slice(0, store.history.past.length - 1);
          const current = { ...store, history: undefined as any };
          if (store.history.future) {
            // rebuild: we need current state snapshot
          }
          useCadStore.setState(previous as any);
          toast('已復原。', 'info');
        } else {
          toast('沒有可復原的動作。', 'info');
        }
        close(setOpenMenu, setHoveredSub);
      },
      handleRedo: () => {
        const store = useCadStore.getState();
        toast('重做功能開發中。', 'info');
        close(setOpenMenu, setHoveredSub);
      },
      handleDelete: () => {
        const store = useCadStore.getState();
        if (store.selectedId && store.removeFeature) {
          store.removeFeature(store.selectedId);
          const rebuild = (window as any).__handleRebuild;
          if (rebuild) setTimeout(rebuild, 10);
          toast('已刪除項目。', 'info');
        } else {
          toast('請先選取要刪除的項目。', 'info');
        }
        close(setOpenMenu, setHoveredSub);
      },
      handleDeselectAll: () => {
        const store = useCadStore.getState();
        store.setSelectedId(null);
        toast('已取消選取。', 'info');
        close(setOpenMenu, setHoveredSub);
      },
      handleZoomToFit: () => {
        close(setOpenMenu, setHoveredSub);
        const store = useCadStore.getState();
        if (store.controls) {
          store.controls.reset();
          store.controls.object.position.set(150, 150, 150);
          store.controls.target.set(0, 0, 0);
          store.controls.update();
        }
      },
      handleMeasure: () => {
        close(setOpenMenu, setHoveredSub);
        const store = useCadStore.getState();
        store.setMeasurementMode('DISTANCE' as any);
        store.setMeasurementPoints([]);
        store.setMeasurementResults(null);
        toast('測量工具已啟用。按 Escape 退出。', 'info');
      },
      handleMassProperties: () => {
        close(setOpenMenu, setHoveredSub);
        if (onExport) onExport();
      },
      handleAbout: () => {
        close(setOpenMenu, setHoveredSub);
        alert(
          '3D-Builder Pro v2.0\n' +
          'Aligned with SOLIDWORKS 2010 UX\n\n' +
          '(c) 2026 3D-Builder Project\n' +
          'React + TypeScript + Three.js + OpenCASCADE'
        );
      },
    };
    handlersRef.current = h;
  }
  const handlers = handlersRef.current!;

  // Menu data
  const menus: Record<string, (MenuItem | MenuSeparator)[]> = React.useMemo(() => ({
    '檔案(F)': buildFileMenu(onExport),
    '編輯(E)': buildEditMenu(),
    '檢視(V)': buildViewMenu(),
    '插入(I)': buildInsertMenu(),
    '特徵(F)': buildFeaturesMenu(),
    '修改(M)': buildModifiersMenu(),
    '組件(A)': buildAssemblyMenu(),
    '工具(T)': buildToolsMenu(),
    '視窗(W)': buildWindowMenu(),
    '說明(H)': buildHelpMenu(),
  }), [onExport]);

  // Map menu labels to handler names
  const handlerMap: Record<string, Record<string, () => void>> = {
    '檔案(F)': {
      '新建(N)': handlers.handleNew,
      '開啟(O)...': handlers.handleOpen,
      '儲存(S)': handlers.handleSave,
      '另存新檔(A)': handlers.handleSaveAs,
      '還原檔案(R)...': () => { toast('檔案修復功能開發中。'); close(setOpenMenu, setHoveredSub); },
      '關閉(C)': handlers.handleClose,
      '離開(X)': handlers.handleNew, // placeholder
    },
    '編輯(E)': {
      '復原(U)': handlers.handleUndo,
      '重做(R)': handlers.handleRedo,
      '刪除(D)': handlers.handleDelete,
      '全選(A)': () => { toast('全選功能開發中。'); close(setOpenMenu, setHoveredSub); },
      '取消選取(S)': handlers.handleDeselectAll,
      '偏好設定(O)...': () => { toast('偏好設定對話框開發中。'); close(setOpenMenu, setHoveredSub); },
      '鍵盤自訂(K)...': () => { toast('鍵盤自訂對話框開發中。'); close(setOpenMenu, setHoveredSub); },
    },
    '檢視(V)': {
      '縮放至符合(F)': handlers.handleZoomToFit,
    },
    '插入(I)': {
      '凸 base/基準': undefined,
      '切除/基準': undefined,
      '參考幾何': undefined,
      '特徵': undefined,
      'Pattern': undefined,
      '曲面': undefined,
    },
    '工具(T)': {
      '測量(M)...': handlers.handleMeasure,
      '質量屬性(P)': handlers.handleMassProperties,
    },
    '說明(H)': {
      'SOLIDWORKS 說明(H)': () => { toast('開啟說明文件開發中。'); close(setOpenMenu, setHoveredSub); },
      '說明資源(R)': () => { toast('說明資源開發中。'); close(setOpenMenu, setHoveredSub); },
      '關於 3D-Builder Pro': handlers.handleAbout,
    },
  };

  const getHandler = (menuName: string, label: string): (() => void) | undefined => {
    const menuHandlers = handlerMap[menuName];
    if (menuHandlers && menuHandlers[label]) return menuHandlers[label];
    return undefined;
  };

  return (
    <header
      className="h-[32px] w-full flex items-center justify-between px-3 select-none z-50 shrink-0"
      style={{ background: "linear-gradient(to bottom, #FFFFFF 0%, #E8E8E8 100%)" }}
    >
      <div className="flex items-center gap-6">
        {/* App Logo */}
        <div className="flex items-center gap-2 text-[14px] font-black tracking-tighter text-[#000000]">
          <div className="w-6 h-6 bg-[#005B9A] rounded-sm flex items-center justify-center text-white text-[11px] shadow-sm font-sans">
            3D
          </div>
          3D-Builder Pro
        </div>

        {/* Menu Bar - SW 2010 style */}
        <nav
          className="flex items-center gap-0 text-[12px] text-[#404040] font-semibold relative"
          ref={menuRef}
        >
          {Object.keys(menus).map((menuName) => (
            <div key={menuName} className="relative">
              <span
                onClick={() => setOpenMenu(openMenu === menuName ? null : menuName)}
                onMouseEnter={() => {
                  if (openMenu && openMenu !== menuName) setOpenMenu(menuName);
                }}
                className="hover:text-[#005B9A] cursor-pointer transition-colors px-2 py-1"
              >
                {menuName}
              </span>

              {/* Dropdown */}
              {openMenu === menuName && (
                <div className="absolute top-[28px] left-0 w-[240px] bg-white border border-slate-300 shadow-xl rounded-sm py-1 z-[100]">
                  {(menus[menuName] as (MenuItem | MenuSeparator)[]).map((item, i) => {
                    if (isSep(item)) {
                      return <div key={i} className="h-[1px] bg-slate-200 my-1 mx-2" />;
                    }
                    const mi = item as MenuItem;
                    const hasSub = mi.subMenu && mi.subMenu!.length > 0;
                    const handler = getHandler(menuName, mi.label);

                    return (
                      <div
                        key={i}
                        className="relative flex items-center text-[12px]"
                        onMouseEnter={() => {
                          if (hasSub) setHoveredSub(`${menuName}-${i}`);
                        }}
                      >
                        <button
                          onClick={() => {
                            if (handler) handler();
                            else if (mi.action) mi.action!();
                          }}
                          disabled={mi.disabled || (!handler && !mi.action && !hasSub)}
                          className={`w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white transition-colors flex justify-between items-center disabled:opacity-40 disabled:cursor-not-allowed ${
                            hoveredSub === `${menuName}-${i}` ? 'bg-blue-600 text-white' : ''
                          }`}
                        >
                          <span className="truncate">{mi.label}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            {mi.shortcut && (
                              <span className="opacity-60 text-[10px] ml-4">{mi.shortcut}</span>
                            )}
                            {hasSub && <span className="text-[8px]">{'▶'}</span>}
                          </div>
                        </button>

                        {/* Sub-menu */}
                        {hasSub && hoveredSub === `${menuName}-${i}` && (
                          <div
                            className="absolute top-0 left-[236px] w-[220px] bg-white border border-slate-300 shadow-xl rounded-sm py-1 z-[101]"
                            onMouseLeave={() => setHoveredSub(null)}
                          >
                            {mi.subMenu!.map((sub, j) => {
                              if (isSep(sub)) {
                                return <div key={j} className="h-[1px] bg-slate-200 my-1 mx-2" />;
                              }
                              const smi = sub as MenuItem;
                              return (
                                <button
                                  key={j}
                                  onClick={() => {
                                    if (smi.action) smi.action();
                                  }}
                                  disabled={smi.disabled || !smi.action}
                                  className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white transition-colors text-[12px] disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  {smi.label}
                                  {smi.shortcut && (
                                    <span className="float-right opacity-60 text-[10px]">{smi.shortcut}</span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Right side: filename + kernel status */}
      <div className="flex items-center gap-4">
        <div className="text-[11px] text-[#404040] font-medium bg-[#FFFFFF] px-4 py-1 rounded-sm border border-[#A0A0A0] shadow-inner">
          {displayName}{isDirty ? ' *' : ''}{' '}
          <span className="text-[#005B9A] font-bold">[{activePlane || 'No Active Plane'}]</span>
        </div>
        <div className="flex items-center gap-3 text-[12px]">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full shadow-sm ${engineStatus === 'CONNECTED' ? 'bg-[#28a745]' : 'bg-[#dc3545]'}`} />
            <span className="text-[#404040] font-bold uppercase tracking-widest text-[10px]">
              Kernel: <span className={engineStatus === 'CONNECTED' ? 'text-[#28a745]' : 'text-[#dc3545]'}>{engineStatus}</span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopMenu;