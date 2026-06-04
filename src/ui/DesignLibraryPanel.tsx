'use client';

import React, { useState } from 'react';
import { useCadStore } from '../store/useCadStore';
import { v4 as uuidv4 } from 'uuid';

const STANDARD_HARDWARE = {
  FASTENERS: {
    title: 'Fasteners (ISO Metric)',
    items: [
      { id: 'bolt_hex', name: 'Hex Bolt', partType: 'BOLT', icon: '🔩' },
      { id: 'nut_hex', name: 'Hex Nut', partType: 'NUT', icon: '⬢' },
    ],
    sizes: ['M3', 'M4', 'M5', 'M6', 'M8', 'M10', 'M12']
  },
  BEARINGS: {
    title: 'Bearings',
    items: [
      { id: 'bearing_ball', name: 'Radial Ball Bearing', partType: 'BEARING', icon: '◎' },
    ],
    sizes: ['608', '6200', '6204']
  }
};

export const DesignLibraryPanel: React.FC = () => {
  const { addFeature, features, pushToast } = useCadStore();
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof STANDARD_HARDWARE>('FASTENERS');
  const [selectedSize, setSelectedSize] = useState('M6');
  const [boltLength, setBoltLength] = useState(20);

  const handleInsert = (item: any) => {
    const id = `toolbox_${uuidv4().slice(0, 8)}`;
    const name = `${item.name} (${selectedSize}x${boltLength})`;
    
    addFeature({
      id,
      type: 'TOOLBOX_PART',
      name,
      parameters: {
        partType: item.partType,
        size: selectedSize,
        length: boltLength,
        x: 0, y: 0, z: 0,
        operation: 'ADD'
      }
    });

    pushToast(`Inserted ${name} from Design Library`, 'info');
    
    // Auto-trigger rebuild is handled by addFeature usually, but let's ensure
    const rebuildHook = (window as any).__handleRebuild;
    if (rebuildHook) setTimeout(rebuildHook, 50);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F5F6F9] overflow-hidden border-l border-slate-300">
      {/* Tab Header */}
      <div className="p-3 border-b border-slate-300 bg-white">
        <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider">Design Library</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Category Selector */}
        <div className="grid grid-cols-2 gap-1 bg-slate-200 p-0.5 rounded shadow-inner">
          {Object.keys(STANDARD_HARDWARE).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat as any)}
              className={`py-1 text-[10px] font-bold rounded transition-all ${selectedCategory === cat ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Configuration Rollout */}
        <div className="bg-white rounded border border-slate-200 p-3 shadow-sm space-y-3">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">Configure Component</div>
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Size</label>
            <select 
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-[12px] font-bold outline-none focus:border-primary"
            >
              {STANDARD_HARDWARE[selectedCategory].sizes.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {selectedCategory === 'FASTENERS' && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Length (mm)</label>
              <input 
                type="number"
                value={boltLength}
                onChange={(e) => setBoltLength(parseFloat(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-[12px] font-mono font-bold text-right outline-none focus:border-primary"
              />
            </div>
          )}
        </div>

        {/* Item Grid */}
        <div className="space-y-2">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available Items</div>
          <div className="grid grid-cols-1 gap-2">
            {STANDARD_HARDWARE[selectedCategory].items.map((item) => (
              <button
                key={item.id}
                onClick={() => handleInsert(item)}
                className="flex items-center gap-3 p-2 bg-white rounded border border-slate-200 hover:border-primary hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded text-2xl group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[12px] font-black text-slate-700 leading-tight">{item.name}</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{selectedSize} Standard</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-white border-t border-slate-300 text-[9px] text-slate-400 font-bold text-center uppercase tracking-tighter">
        Standard ISO/DIN components generator
      </div>
    </div>
  );
};
