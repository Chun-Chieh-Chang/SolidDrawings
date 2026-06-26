'use client';

import React, { useState } from 'react';
import type { BomEntry } from '../../store/types';

interface BomTableProps {
  entries: BomEntry[];
  onUpdate: (id: string, updates: Partial<BomEntry>) => void;
  onRemove: (id: string) => void;
}

export const BomTable: React.FC<BomTableProps> = ({ entries, onUpdate, onRemove }) => {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  // Build tree: top-level entries are those without parentId, children are matched by parentId
  const topLevel = entries.filter((e) => !e.parentId);
  const childrenOf = (parentId: string) => entries.filter((e) => e.parentId === parentId);

  const isCollapsed = (id: string) => collapsed.has(id);
  const toggleCollapse = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderRow = (entry: BomEntry, depth: number = 0) => {
    const children = childrenOf(entry.id);
    const hasChildren = children.length > 0;
    const col = isCollapsed(entry.id);

    return (
      <React.Fragment key={entry.id}>
        <tr
          className={`hover:bg-slate-50 ${entry.isSubAssembly ? 'bg-slate-50 font-bold' : ''}`}
          style={{ display: entry.parentId && isCollapsed(entry.parentId) ? 'none' : undefined }}
        >
          {/* Expand/Collapse */}
          <td className="px-1 py-1 w-6 text-center" style={{ paddingLeft: `${8 + depth * 16}px` }}>
            {hasChildren ? (
              <button onClick={() => toggleCollapse(entry.id)} className="text-slate-500 hover:text-slate-900 focus:outline-none text-[10px] w-4 h-4 flex items-center justify-center">
                {col ? '▸' : '▾'}
              </button>
            ) : (
              <span className="text-slate-300 text-[10px]">·</span>
            )}
          </td>
          <td className="px-2 py-1 font-black text-slate-400 text-[10px]">{entry.itemNo}</td>
          <td className="font-bold text-slate-900 text-[10px]">{entry.partNo}</td>
          <td className="text-slate-600 text-[10px] max-w-[120px] truncate">{entry.description}</td>
          <td className="text-right px-2 font-mono font-black text-[10px]">{entry.qty}</td>
          <td className="italic text-slate-500 text-[10px]">{entry.material}</td>
          <td className="text-slate-400 text-[10px] max-w-[80px] truncate">{entry.note}</td>
          <td className="px-1 w-8">
            <button
              onClick={() => onRemove(entry.id)}
              className="text-red-400 hover:text-red-700 text-[10px] opacity-0 hover:opacity-100 transition-opacity"
              title="Remove"
            >
              ✕
            </button>
          </td>
        </tr>
        {hasChildren &&
          !col &&
          children.map((child) => renderRow(child, depth + 1))}
      </React.Fragment>
    );
  };

  if (entries.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-[10px] text-slate-400 italic">
        No components — BOM will auto-populate when components are added
      </div>
    );
  }

  return (
    <table className="w-full text-left text-[10px]">
      <thead className="sticky top-0 bg-white">
        <tr className="border-b-2 border-slate-900 text-slate-900 uppercase font-black text-[8px]">
          <th className="w-6"></th>
          <th className="px-2 py-0.5 w-10">Item</th>
          <th>Part Number</th>
          <th>Description</th>
          <th className="text-right px-2">QTY</th>
          <th>Material</th>
          <th>Note</th>
          <th className="w-8"></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {topLevel.map((entry) => renderRow(entry))}
      </tbody>
    </table>
  );
};
