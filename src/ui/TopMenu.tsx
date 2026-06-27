'use client';

import React from 'react';
import { RecentFilesDropdown } from './RecentFilesDropdown';

interface TopMenuProps {
  onExport?: () => void;
  onOpenFile?: () => void;
  onSaveFile?: () => void;
  onNewFile?: () => void;
  onPrint?: () => void;
  onUndo?: () => void;
  onRebuild?: () => void;
}

// ── Standard Toolbar Inline SVG Icons ──

const IconNew = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#505050" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="12" height="12" rx="1.5" />
    <line x1="8" y1="5" x2="8" y2="11" /><line x1="5" y1="8" x2="11" y2="8" />
  </svg>
);

const IconOpen = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#505050" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 13V3a1 1 0 0 1 1-1h3.5l2 2H13a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z" />
  </svg>
);

const IconSave = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#505050" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 15H3a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h7.5L14 4.5V14a1 1 0 0 1-1 1z" />
    <rect x="4.5" y="9.5" width="7" height="5.5" rx=".5" />
    <line x1="4.5" y1="2" x2="9" y2="2" /><line x1="5" y1="3" x2="5" y2="5.5" />
  </svg>
);

const IconPrint = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#505050" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="10" height="6" rx=".5" />
    <path d="M5 9v4h6V9H5z" /><path d="M5 5V2h6v3" /><line x1="6.5" y1="11" x2="9.5" y2="11" />
  </svg>
);

const IconUndo = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#505050" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 7a5 5 0 1 1 0 5" />
    <polyline points="1,7 4,4 7,7" />
  </svg>
);

const IconRebuild = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#505050" strokeWidth="1.3" strokeLinecap="round">
    <circle cx="8" cy="8" r="6" />
    <polyline points="5,8.5 7.5,11 11,6" strokeLinejoin="round" />
  </svg>
);

const IconSelect = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#505050" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 1l2 13 2.5-4.5L12 12l1-3-7-7L3 1z" />
  </svg>
);

const IconOptions = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#505050" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="2" />
    <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" />
  </svg>
);

// ── TopMenu Component ──

export const TopMenu: React.FC<TopMenuProps> = ({
  onExport,
  onOpenFile,
  onSaveFile,
  onNewFile,
  onPrint,
  onUndo,
  onRebuild,
}) => {
  const [showFileMenu, setShowFileMenu] = React.useState(false);
  const [showRecentFiles, setShowRecentFiles] = React.useState(false);
  const [recentKey, setRecentKey] = React.useState(0);

  const handleRecentFileSelect = React.useCallback(
    (filePath: string) => {
      const event = new CustomEvent('3db-mru-file-select', { detail: filePath });
      window.dispatchEvent(event);
    },
    [],
  );

  const menuLabels = ['File', 'Edit', 'View', 'Insert', 'Tools', 'Window', 'Help'] as const;

  const standardToolbarGroups = [
    [
      { icon: IconNew, title: 'New (Ctrl+N)', onClick: onNewFile },
      { icon: IconOpen, title: 'Open (Ctrl+O)', onClick: onOpenFile },
      { icon: IconSave, title: 'Save (Ctrl+S)', onClick: onSaveFile },
      { icon: IconPrint, title: 'Print (Ctrl+P)', onClick: onPrint },
    ],
    [
      { icon: IconUndo, title: 'Undo (Ctrl+Z)', onClick: onUndo },
      { icon: IconRebuild, title: 'Rebuild (Ctrl+B)', onClick: onRebuild },
    ],
    [
      { icon: IconSelect, title: 'Select', onClick: undefined },
      { icon: IconOptions, title: 'Options', onClick: undefined },
    ],
  ];

  const fileMenuItems: (
    | { label: string; shortcut?: string; onClick: () => void }
    | { separator: true }
    | { label: string; submenu: true }
  )[] = [
    { label: 'New', shortcut: 'Ctrl+N', onClick: () => { onNewFile?.(); setShowFileMenu(false); } },
    { label: 'Open...', shortcut: 'Ctrl+O', onClick: () => { onOpenFile?.(); setShowFileMenu(false); } },
    { separator: true },
    { label: 'Save', shortcut: 'Ctrl+S', onClick: () => { onSaveFile?.(); setShowFileMenu(false); } },
    { label: 'Export...', shortcut: 'Ctrl+E', onClick: () => { onExport?.(); setShowFileMenu(false); } },
    { separator: true },
    { label: 'Print...', shortcut: 'Ctrl+P', onClick: () => { onPrint?.(); setShowFileMenu(false); } },
    { separator: true },
    { label: 'Recent Files', submenu: true },
    { separator: true },
    { label: 'Exit', onClick: () => setShowFileMenu(false) },
  ];

  const handleMenuClick = (label: string) => {
    if (label === 'File') {
      setShowFileMenu((prev) => !prev);
      setShowRecentFiles(false);
      setRecentKey((k) => k + 1);
    }
  };

  return (
    <header className="h-[26px] w-full bg-[#E8E8E8] border-b border-[#D0D0D0] flex items-center select-none z-50 shrink-0">
      {/* ── Menu Items ── */}
      <nav className="flex items-center h-full">
        {menuLabels.map((label) => (
          <div key={label} className="relative h-full">
            <span
              onClick={() => handleMenuClick(label)}
              className={`inline-flex items-center h-full px-2 text-[12px] text-[#303030] font-normal cursor-pointer hover:bg-[#D0D0D0] transition-colors ${
                label === 'File' && showFileMenu ? 'bg-[#D0D0D0]' : ''
              }`}
            >
              {label}
            </span>

            {/* File Menu Dropdown */}
            {label === 'File' && showFileMenu && (
              <div className="absolute top-full left-0 w-[200px] bg-white border border-[#C0C0C0] shadow-md py-0.5 z-[100]">
                {fileMenuItems.map((item, idx) => {
                  if ('separator' in item) {
                    return <div key={idx} className="h-[1px] bg-[#E0E0E0] my-0.5" />;
                  }
                  if ('submenu' in item) {
                    return (
                      <div key={idx} className="relative">
                        <span
                          onClick={() => { setShowRecentFiles(!showRecentFiles); }}
                          className="block w-full text-left px-3 py-1 text-[12px] text-[#303030] hover:bg-[#005B9A] hover:text-white cursor-pointer"
                        >
                          {item.label} ▶
                        </span>
                        <RecentFilesDropdown
                          key={recentKey}
                          visible={showRecentFiles}
                          onFileSelect={(fp) => { handleRecentFileSelect(fp); setShowFileMenu(false); }}
                          onClose={() => setShowRecentFiles(false)}
                        />
                      </div>
                    );
                  }
                  const { label, shortcut, onClick } = item;
                  return (
                    <button
                      key={idx}
                      onClick={onClick}
                      className="w-full text-left px-3 py-1 text-[12px] text-[#303030] hover:bg-[#005B9A] hover:text-white flex justify-between items-center"
                    >
                      <span>{label}</span>
                      {shortcut && <span className="text-[#909090] text-[10px]">{shortcut}</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* ── Standard Toolbar ── */}
      <div className="flex items-center h-full ml-2 gap-0.5 border-l border-[#C8C8C8] pl-2">
        {standardToolbarGroups.map((group, gi) => (
          <React.Fragment key={gi}>
            {gi > 0 && <div className="w-[1px] h-[14px] bg-[#C8C8C8] mx-0.5" />}
            {group.map((btn, bi) => (
              <button
                key={`${gi}-${bi}`}
                title={btn.title}
                onClick={btn.onClick}
                className="w-[22px] h-[20px] flex items-center justify-center rounded hover:bg-[#C8C8C8] transition-colors"
              >
                <btn.icon />
              </button>
            ))}
          </React.Fragment>
        ))}
      </div>

      {/* ── Search Bar (right-aligned) ── */}
      <div className="ml-auto flex items-center h-full pr-2">
        <div className="flex items-center h-[18px] w-[160px] bg-white border border-[#B8B8B8] rounded-sm px-1.5 gap-1">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#909090" strokeWidth="1.2" strokeLinecap="round">
            <circle cx="5" cy="5" r="3.5" />
            <line x1="8" y1="8" x2="10.5" y2="10.5" />
          </svg>
          <input
            type="text"
            placeholder="Search Commands..."
            className="flex-1 text-[10px] text-[#505050] outline-none bg-transparent placeholder:text-[#B0B0B0]"
            readOnly
          />
        </div>
      </div>
    </header>
  );
};
