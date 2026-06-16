import React, { useState, useEffect, useRef } from 'react';
import { useCadStore } from '@/store/useCadStore';
import { EquationEngine } from '@/utils/EquationEngine';

const SmartNumericInput: React.FC<{
  label: string;
  value: number;
  onChange: (val: number) => void;
  badge?: string;
  unit?: string;
}> = ({ label, value, onChange, badge, unit = 'mm' }) => {
  const [inputValue, setInputValue] = useState(value.toString());
  const evaluatedVariables = useCadStore(state => state.evaluatedVariables);
  const isEditing = useRef(false);

  useEffect(() => {
    if (!isEditing.current) {
      setInputValue(value.toFixed(2));
    }
  }, [value]);

  const handleBlur = () => {
    isEditing.current = false;
    const solved = EquationEngine.evaluate(inputValue, evaluatedVariables);
    onChange(solved);
    setInputValue(solved.toFixed(2));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase px-0.5">
        <span>{label}</span>
        {badge && <span className="bg-slate-200 text-slate-600 px-1 rounded-[2px]">{badge}</span>}
      </div>
      <div className="relative group">
        <input
          type="text"
          value={inputValue}
          onFocus={() => { isEditing.current = true; }}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 text-[11px] font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all text-right pr-6"
        />
        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300 group-focus-within:text-blue-400 uppercase">{unit}</span>
      </div>
    </div>
  );
};

export { SmartNumericInput };
