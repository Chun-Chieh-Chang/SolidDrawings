import React from 'react';
import { EquationEngine } from '@/utils/EquationEngine';
import { useCadStore } from '@/store/useCadStore';

interface ParamInputProps {
  label: string;
  value: any;
  onChange: (val: any) => void;
  unit?: string;
  badge?: string;
}

export const ParamInput: React.FC<ParamInputProps> = ({ label, value, onChange, unit = 'mm', badge }) => {
  const { evaluatedVariables } = useCadStore();
  const [localValue, setLocalValue] = React.useState(value?.toString() || '0');
  const isEditing = React.useRef(false);

  React.useEffect(() => {
    if (!isEditing.current) {
      setLocalValue(value?.toString() || '0');
    }
  }, [value]);

  const isFormula = localValue.startsWith('=');
  const evaluated = isFormula
    ? EquationEngine.evaluate(localValue.substring(1), evaluatedVariables)
    : EquationEngine.evaluate(localValue, evaluatedVariables);

  const handleBlur = () => {
    isEditing.current = false;
    if (isFormula) {
      onChange(localValue);
    } else {
      const solved = EquationEngine.evaluate(localValue, evaluatedVariables);
      onChange(solved);
      setLocalValue(solved.toFixed(3));
    }
  };

  const handleFocus = () => {
    isEditing.current = true;
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold text-slate-500 uppercase">{label}</label>
        {isFormula && (
          <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-1 rounded border border-indigo-100">
            PARAMETRIC
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            onFocus={handleFocus}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleBlur();
                (e.target as HTMLInputElement).blur();
              }
            }}
            className={`w-full bg-white border border-slate-300 rounded px-2 py-1 text-[12px] text-right font-mono font-bold transition-all focus:border-[#005B9A] focus:ring-1 focus:ring-[#005B9A]/20 outline-none ${isFormula ? 'text-indigo-700 border-indigo-200' : 'text-slate-800'}`}
          />
          {badge && <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-black">{badge}</span>}
        </div>
        <span className="text-[11px] text-slate-500 font-bold w-6">{unit}</span>
      </div>
      {(isFormula || (localValue !== evaluated.toString() && localValue !== evaluated.toFixed(3))) && (
        <div className="text-[10px] text-emerald-600 font-black text-right pr-8 animate-in fade-in">
          = {evaluated.toFixed(3)} {unit}
        </div>
      )}
    </div>
  );
};
