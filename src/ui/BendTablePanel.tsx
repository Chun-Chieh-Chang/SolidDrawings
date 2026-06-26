'use client';

import React, { useReducer, useEffect, useCallback } from 'react';
import { useCadStore } from '../store/useCadStore';
import { CAD_API } from '../lib/cad-api';

type FetchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string };

type FetchAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_DONE' }
  | { type: 'FETCH_ERROR'; message: string };

const fetchReducer = (_state: FetchState, action: FetchAction): FetchState => {
  switch (action.type) {
    case 'FETCH_START':
      return { status: 'loading' };
    case 'FETCH_DONE':
      return { status: 'idle' };
    case 'FETCH_ERROR':
      return { status: 'error', message: action.message };
    default:
      return { status: 'idle' };
  }
};

export const BendTablePanel = () => {
  const {
    features,
    showBendTable, setShowBendTable,
    bendTableData, setBendTableData,
    updateBendTableKFactor,
  } = useCadStore();

  const [fetchState, dispatch] = useReducer(fetchReducer, { status: 'idle' });

  const fetchBendTable = useCallback(async () => {
    dispatch({ type: 'FETCH_START' });
    try {
      const result = await fetch(`${CAD_API.baseUrl}/bend_table`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features }),
      });
      const data = await result.json();
      if (data.success && data.bends) {
        setBendTableData(data.bends);
        dispatch({ type: 'FETCH_DONE' });
      } else {
        dispatch({ type: 'FETCH_ERROR', message: 'Failed to load bend table' });
      }
    } catch (e: any) {
      dispatch({ type: 'FETCH_ERROR', message: e.message || 'Network error' });
    }
  }, [features, setBendTableData]);

  useEffect(() => {
    if (!showBendTable || features.length === 0) return;
    fetchBendTable();
  }, [showBendTable, features.length, fetchBendTable]);

  const handleKFactorChange = (id: string, value: string) => {
    const kf = parseFloat(value);
    if (isNaN(kf) || kf < 0 || kf > 1) return;
    updateBendTableKFactor(id, kf);
  };

  if (!showBendTable) return null;

  const loading = fetchState.status === 'loading';
  const error = fetchState.status === 'error' ? fetchState.message : null;

  return (
    <div className="fixed right-4 top-20 w-96 bg-white border border-slate-300 rounded-lg shadow-xl z-50 flex flex-col max-h-[70vh]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800 rounded-t-lg">
        <span className="text-[10px] font-black text-white uppercase tracking-wider">Bend Table</span>
        <button onClick={() => setShowBendTable(false)}
          className="text-white/60 hover:text-white text-[10px] font-bold px-1.5 py-0.5 rounded hover:bg-white/10">
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-2">
        {loading && <div className="text-[10px] text-slate-500 text-center py-4">Loading bend data...</div>}
        {error && <div className="text-[10px] text-error text-center py-2">{error}</div>}

        {!loading && !error && bendTableData.length === 0 && (
          <div className="text-[10px] text-slate-400 text-center py-4">No bend features found.</div>
        )}

        {bendTableData.length > 0 && (
          <table className="w-full text-[9px] border-collapse">
            <thead>
              <tr className="border-b border-slate-300 text-slate-600 font-bold uppercase">
                <th className="text-left px-1 py-1">#</th>
                <th className="text-left px-1 py-1">Type</th>
                <th className="text-right px-1 py-1">Angle</th>
                <th className="text-right px-1 py-1">Radius</th>
                <th className="text-right px-1 py-1">Dir</th>
                <th className="text-right px-1 py-1">K-Factor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bendTableData.map((bend, idx) => (
                <tr key={bend.id} className="hover:bg-slate-50">
                  <td className="px-1 py-1 font-bold text-slate-500">{idx + 1}</td>
                  <td className="px-1 py-1 font-medium text-slate-700">{bend.type.replace('_', ' ')}</td>
                  <td className="px-1 py-1 text-right font-mono text-slate-700">{bend.bend_angle}°</td>
                  <td className="px-1 py-1 text-right font-mono text-slate-700">{bend.bend_radius.toFixed(2)}</td>
                  <td className="px-1 py-1 text-right font-mono text-slate-700">{bend.direction}</td>
                  <td className="px-1 py-1 text-right">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      defaultValue={bend.k_factor}
                      onChange={(e) => handleKFactorChange(bend.id, e.target.value)}
                      className="w-14 text-right font-mono text-[9px] px-1 py-0.5 border border-slate-200 rounded hover:border-blue-400 focus:border-blue-500 focus:outline-none"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 px-3 py-1.5 flex items-center justify-between bg-slate-50 rounded-b-lg">
        <span className="text-[8px] text-slate-400">
          {bendTableData.length} bend{bendTableData.length !== 1 ? 's' : ''}
        </span>
        <button onClick={fetchBendTable}
          className="text-[9px] px-2 py-0.5 bg-blue-500 text-white rounded font-bold hover:bg-blue-600 transition-colors">
          Refresh
        </button>
      </div>
    </div>
  );
};
