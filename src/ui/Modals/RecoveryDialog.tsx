'use client';

import React, { useEffect, useState } from 'react';
import { getRecoverableSessions, clearSession } from '../../services/recoveryService';
import { useCadStore } from '../../store/useCadStore';

interface RecoverableSession {
  sessionId: string;
  timestamp: number;
  projectName: string;
  featureCount: number;
  stateJson: string;
}

export const RecoveryDialog: React.FC = () => {
  const [sessions, setSessions] = useState<RecoverableSession[]>([]);
  const [visible, setVisible] = useState(false);
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    // Check for recoverable sessions on mount
    getRecoverableSessions().then(result => {
      if (result.length > 0) {
        setSessions(result);
        setVisible(true);
      }
    }).catch(() => {});
  }, []);

  const handleRecover = async (session: RecoverableSession) => {
    setRecovering(true);
    try {
      const parsed = JSON.parse(session.stateJson);
      // Apply recovered state to store
      useCadStore.setState({
        ...parsed,
        rebuildDirty: true,
        dirtyFromFeatureIndex: 0,
        isDirty: true,
      });
      // Clean up the recovered session
      await clearSession(session.sessionId);
      useCadStore.getState().pushToast(`專案已恢復：${session.projectName}（${session.featureCount} 個特徵）`, 'info');
    } catch (err) {
      useCadStore.getState().pushToast('恢復失敗：資料格式損壞。', 'error');
    }
    setVisible(false);
    setRecovering(false);
  };

  const handleDiscard = async (session: RecoverableSession) => {
    await clearSession(session.sessionId);
    const remaining = sessions.filter(s => s.sessionId !== session.sessionId);
    setSessions(remaining);
    if (remaining.length === 0) setVisible(false);
  };

  const handleDiscardAll = async () => {
    for (const session of sessions) {
      await clearSession(session.sessionId);
    }
    setSessions([]);
    setVisible(false);
  };

  if (!visible || sessions.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center animate-in fade-in duration-300">
      <div className="bg-white rounded-lg shadow-2xl w-[520px] max-h-[80vh] overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#005B9A] to-[#0078D4] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="M12 8v4"/>
                <path d="M12 16h.01"/>
              </svg>
            </div>
            <div>
              <h2 className="text-white font-bold text-[16px]">自動復原 (Auto-Recovery)</h2>
              <p className="text-white/80 text-[12px]">偵測到未正常關閉的工作階段</p>
            </div>
          </div>
        </div>

        {/* Session List */}
        <div className="px-6 py-4 max-h-[400px] overflow-y-auto">
          <p className="text-slate-600 text-[12px] mb-4">
            以下工作階段未正常儲存。您可以選擇恢復或捨棄：
          </p>
          {sessions.map((session) => {
            const date = new Date(session.timestamp);
            const timeStr = date.toLocaleString('zh-TW', {
              month: '2-digit', day: '2-digit',
              hour: '2-digit', minute: '2-digit'
            });
            return (
              <div
                key={session.sessionId}
                className="border border-slate-200 rounded-lg p-4 mb-3 hover:border-[#005B9A]/50 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-[14px] text-slate-800">{session.projectName}</div>
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-3">
                      <span>⏰ {timeStr}</span>
                      <span>📐 {session.featureCount} 個特徵</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRecover(session)}
                      disabled={recovering}
                      className="px-4 py-1.5 bg-[#005B9A] text-white text-[12px] font-bold rounded hover:bg-[#004A7F] transition-colors disabled:opacity-50"
                    >
                      {recovering ? '恢復中...' : '恢復'}
                    </button>
                    <button
                      onClick={() => handleDiscard(session)}
                      className="px-3 py-1.5 bg-slate-100 text-slate-600 text-[12px] font-semibold rounded hover:bg-slate-200 transition-colors"
                    >
                      捨棄
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <button
            onClick={handleDiscardAll}
            className="text-[11px] text-red-500 hover:text-red-700 font-semibold transition-colors"
          >
            捨棄全部
          </button>
          <button
            onClick={() => setVisible(false)}
            className="px-4 py-1.5 text-[12px] text-slate-600 hover:bg-slate-200 rounded transition-colors font-semibold"
          >
            稍後再說
          </button>
        </div>
      </div>
    </div>
  );
};
