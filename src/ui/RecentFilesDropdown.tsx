'use client';

import React from 'react';
import { getMRUFiles, clearMRU } from '@/utils/mru-storage';

interface RecentFilesDropdownProps {
  visible: boolean;
  onFileSelect: (filePath: string) => void;
  onClose: () => void;
}

export const RecentFilesDropdown: React.FC<RecentFilesDropdownProps> = ({
  visible,
  onFileSelect,
  onClose,
}) => {
  const [mruFiles, setMruFiles] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (visible) {
      setMruFiles(getMRUFiles());
    }
  }, [visible]);

  const handleClear = React.useCallback(() => {
    clearMRU();
    setMruFiles([]);
  }, []);

  if (!visible) return null;

  const displayName = (filePath: string) => {
    try {
      return filePath.split(/[\\/]/).pop() || filePath;
    } catch {
      return filePath;
    }
  };

  const separatorStyle = { height: '1px', background: '#e0e0e0', margin: '2px 0' };

  return (
    <div
      className="absolute top-[22px] left-0 w-[220px] bg-white border border-slate-300 shadow-xl rounded-sm py-1 z-[100]"
      onMouseLeave={onClose}
    >
      {mruFiles.length === 0 ? (
        <div className="px-3 py-2 text-[11px] text-[#808080] italic">
          尚未開啟過檔案
        </div>
      ) : (
        <>
          {mruFiles.map((filePath, index) => (
            <button
              key={`${filePath}-${index}`}
              onClick={() => {
                onFileSelect(filePath);
                onClose();
              }}
              style={{
                background: 'none',
                border: 'none',
                width: '100%',
                textAlign: 'left' as const,
                padding: '4px 12px',
                fontSize: '11px',
                color: '#333',
                cursor: 'pointer',
                fontFamily: "'Microsoft JhengHei', 'PingFang TC', sans-serif",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background = '#005B9A';
                (e.target as HTMLElement).style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = 'none';
                (e.target as HTMLElement).style.color = '#333';
              }}
            >
              {displayName(filePath)}
            </button>
          ))}
          <div style={separatorStyle} />
          <button
            onClick={() => {
              handleClear();
              onClose();
            }}
            style={{
              background: 'none',
              border: 'none',
              width: '100%',
              textAlign: 'left' as const,
              padding: '4px 12px',
              fontSize: '11px',
              color: '#333',
              cursor: 'pointer',
              fontFamily: "'Microsoft JhengHei', 'PingFang TC', sans-serif",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.background = '#005B9A';
              (e.target as HTMLElement).style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.background = 'none';
              (e.target as HTMLElement).style.color = '#333';
            }}
          >
            清除最近檔案
          </button>
        </>
      )}
    </div>
  );
};
