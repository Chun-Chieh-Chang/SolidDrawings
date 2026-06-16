'use client';

import { useCallback } from 'react';
import { useCadStore, type CADFeature } from '@/store/useCadStore';
import { parsePartFile, serializePartFile } from '@/utils/part-file';
import { addMRUFile } from '@/utils/mru-storage';
import { appAPI } from '../../electron/renderer';

export function usePartDocument(features: CADFeature[]) {
  const loadCadData = useCallback(
    async (content: string, filePath: string, onLoaded?: () => void) => {
      try {
        const parsed = parsePartFile(content);
        if (parsed) {
          useCadStore.setState({
            features: parsed.features,
            sketchNodes: parsed.sketchNodes,
            sketchEdges: parsed.sketchEdges,
            sketchConstraints: parsed.sketchConstraints,
            ...(parsed.projectName ? { projectName: parsed.projectName } : {}),
            ...(parsed.drawingScale ? { drawingScale: parsed.drawingScale } : {}),
            rebuildDirty: true,
          });
          onLoaded?.();
          addMRUFile(filePath);
          appAPI.notify('專案', `已開啟：${filePath}`);
          return true;
        }
        appAPI.notify('專案', '無法辨識的零件檔格式');
        return false;
      } catch {
        const pathLower = filePath.toLowerCase();
        if (pathLower.endsWith('.sldprt') || pathLower.endsWith('.sldasm')) {
          return false;
        }
        appAPI.notify('專案', '請使用 .3dbpart 或從 SolidWorks 匯出 STEP/IGES');
        return false;
      }
    },
    [],
  );

  const handleSaveProject = useCallback(async () => {
    if (typeof window === 'undefined' || !window.electronAPI) {
      alert('儲存功能僅在 Electron 桌面版可用。');
      return;
    }

    const state = useCadStore.getState();
    const payload = serializePartFile({
      projectName: state.projectName,
      drawingScale: state.drawingScale,
      features,
      sketchNodes: state.sketchNodes,
      sketchEdges: state.sketchEdges,
      sketchConstraints: state.sketchConstraints,
    });

    const result = await window.electronAPI.file.save(payload, { format: '3DBPART' });
    if (result?.success && result.path) {
      addMRUFile(result.path);
      appAPI.notify('專案', `已儲存：${result.path}`);
    }
  }, [features]);

  return { loadCadData, handleSaveProject };
}
