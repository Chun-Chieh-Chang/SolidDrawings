import re
import os

with open('src/ui/DrawingSheet.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace editingDim states
old_states = """  const [editingDim, setEditingDim] = useState<'NONE' | 'HORIZ' | 'VERT'>('NONE');
  const [editValue, setEditValue] = useState<string>('');"""

new_states = """  const [editingDim, setEditingDim] = useState<{id: string, type: string, param: string} | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [showDimensions, setShowDimensions] = useState<boolean>(true);"""

content = content.replace(old_states, new_states)


# Replace saveDimensionEdit block
start_idx = content.find("  const saveDimensionEdit = (dimType: 'HORIZ' | 'VERT') => {")
end_idx = content.find("  };", start_idx) + 4

new_save_dim = """  const saveDimensionEdit = () => {
    if (!editingDim) return;
    let newValue = parseFloat(editValue);
    if (isNaN(newValue) || newValue <= 0) return;

    if (editingDim.param === 'radius') {
        newValue = newValue / 2;
    }

    const paramUpdates: Record<string, number> = { [editingDim.param]: newValue };
    updateFeatureParams(editingDim.id, paramUpdates);
    setEditingDim(null);
  };
  
  const smartDims: any[] = [];
  if (showDimensions && type !== 'ISO') {
    features.forEach(feat => {
      const p = feat.parameters || {};
      const x = p.x || 0;
      const y = p.y || 0;
      const z = p.z || 0;
      
      if (feat.type === 'BOX' || feat.type === 'EXTRUDE') {
        const w = p.width || 10;
        const h = p.height || 10;
        const d = p.depth || 10;
        
        if (type === 'FRONT') {
           smartDims.push({ id: feat.id, type: 'HORIZ', value: w, u: x, v: y, length: w, param: 'width' });
           smartDims.push({ id: feat.id, type: 'VERT', value: h, u: x, v: y, length: h, param: 'height' });
        } else if (type === 'TOP') {
           smartDims.push({ id: feat.id, type: 'HORIZ', value: w, u: x, v: -z-d, length: w, param: 'width' });
           smartDims.push({ id: feat.id, type: 'VERT', value: d, u: x, v: -z-d, length: d, param: 'depth' });
        } else if (type === 'RIGHT') {
           smartDims.push({ id: feat.id, type: 'HORIZ', value: d, u: z, v: y, length: d, param: 'depth' });
           smartDims.push({ id: feat.id, type: 'VERT', value: h, u: z, v: y, length: h, param: 'height' });
        }
      } else if (feat.type === 'CYLINDER' || feat.type === 'SPHERE' || feat.type === 'HOLE') {
        const r = p.radius || 5;
        const h = p.height || (p.depth || 10);
        if (type === 'TOP') {
           smartDims.push({ id: feat.id, type: 'RADIAL', value: r*2, u: x, v: -z, radius: r, param: 'radius' });
        } else if (type === 'FRONT' && feat.type !== 'SPHERE') {
           smartDims.push({ id: feat.id, type: 'HORIZ', value: r*2, u: x-r, v: y, length: r*2, param: 'radius' });
           smartDims.push({ id: feat.id, type: 'VERT', value: h, u: x-r, v: y, length: h, param: 'height' });
        } else if (type === 'FRONT' && feat.type === 'SPHERE') {
           smartDims.push({ id: feat.id, type: 'RADIAL', value: r*2, u: x, v: y, radius: r, param: 'radius' });
        }
      }
    });
  }"""

content = content[:start_idx] + new_save_dim + content[end_idx:]


# Replace JSX dimensions block
# The block starts with {hasBounds && type !== 'ISO' && (
# and ends right before </svg> </div> </div>
jsx_start_str = "{hasBounds && type !== 'ISO' && ("
jsx_start_idx = content.find(jsx_start_str)

jsx_end_str = "</svg>"
jsx_end_idx = content.find(jsx_end_str, jsx_start_idx)

new_dim_logic = """          {/* Feature-Aware Smart Dimensions */}
          {smartDims.filter(d => d.type === 'HORIZ').map((dim, idx) => {
              const isEditing = editingDim?.id === dim.id && editingDim?.type === dim.type;
              const dimY = dim.v - dimOffset - (idx * extOffset * 0.5);
              return (
                <g key={`horiz-${dim.id}-${idx}`}>
                  <line x1={dim.u} y1={dim.v} x2={dim.u} y2={dimY} stroke="#64748B" strokeWidth={dimStrokeWidth} strokeDasharray={`${dimStrokeWidth*2},${dimStrokeWidth}`} />
                  <line x1={dim.u + dim.length} y1={dim.v} x2={dim.u + dim.length} y2={dimY} stroke="#64748B" strokeWidth={dimStrokeWidth} strokeDasharray={`${dimStrokeWidth*2},${dimStrokeWidth}`} />
                  <line x1={dim.u} y1={dimY} x2={dim.u + dim.length} y2={dimY} stroke="#3B82F6" strokeWidth={dimStrokeWidth} markerStart={`url(#arrow-start-${type})`} markerEnd={`url(#arrow-end-${type})`} />
                  <g transform={`translate(${dim.u + dim.length/2}, ${dimY}) scale(1, -1)`} className="cursor-pointer select-none" onDoubleClick={(e) => { e.stopPropagation(); setEditingDim({id: dim.id, type: dim.type, param: dim.param}); setEditValue(dim.value.toString()); }}>
                    <rect x={-rectW/2} y={-rectH/2} width={rectW} height={rectH} fill="white" stroke={isEditing ? '#3B82F6' : '#E2E8F0'} strokeWidth={isEditing ? dimStrokeWidth : dimStrokeWidth/2} rx={rectH*0.2} className="hover:stroke-blue-500 hover:fill-blue-50/50 transition-all duration-200" />
                    {isEditing ? (
                      <foreignObject x={-rectW/2} y={-rectH/2} width={rectW} height={rectH}>
                        <input type="number" step="any" value={editValue} onChange={(e) => setEditValue(e.target.value)} onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') saveDimensionEdit(); else if (e.key === 'Escape') setEditingDim(null); }} onBlur={saveDimensionEdit} onDoubleClick={(e) => e.stopPropagation()} autoFocus className="w-full h-full text-center font-mono font-bold text-slate-900 bg-white border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 select-all" style={{ fontSize: `${textSize}px`, padding: 0, margin: 0, border: 'none', outline: 'none', background: 'transparent' }} />
                      </foreignObject>
                    ) : (
                      <text x="0" y={rectH * 0.18} textAnchor="middle" fontSize={textSize} fontWeight="bold" fill="#1E293B" fontFamily="monospace" className="pointer-events-none hover:fill-blue-600">{dim.value.toFixed(1)}</text>
                    )}
                  </g>
                </g>
              );
          })}

          {smartDims.filter(d => d.type === 'VERT').map((dim, idx) => {
              const isEditing = editingDim?.id === dim.id && editingDim?.type === dim.type;
              const dimX = dim.u - dimOffset - (idx * extOffset * 0.5);
              return (
                <g key={`vert-${dim.id}-${idx}`}>
                  <line x1={dim.u} y1={dim.v} x2={dimX} y2={dim.v} stroke="#64748B" strokeWidth={dimStrokeWidth} strokeDasharray={`${dimStrokeWidth*2},${dimStrokeWidth}`} />
                  <line x1={dim.u} y1={dim.v + dim.length} x2={dimX} y2={dim.v + dim.length} stroke="#64748B" strokeWidth={dimStrokeWidth} strokeDasharray={`${dimStrokeWidth*2},${dimStrokeWidth}`} />
                  <line x1={dimX} y1={dim.v} x2={dimX} y2={dim.v + dim.length} stroke="#3B82F6" strokeWidth={dimStrokeWidth} markerStart={`url(#arrow-start-${type})`} markerEnd={`url(#arrow-end-${type})`} />
                  <g transform={`translate(${dimX}, ${dim.v + dim.length/2}) scale(1, -1)`} className="cursor-pointer select-none" onDoubleClick={(e) => { e.stopPropagation(); setEditingDim({id: dim.id, type: dim.type, param: dim.param}); setEditValue(dim.value.toString()); }}>
                    <rect x={-rectW/2} y={-rectH/2} width={rectW} height={rectH} fill="white" stroke={isEditing ? '#3B82F6' : '#E2E8F0'} strokeWidth={isEditing ? dimStrokeWidth : dimStrokeWidth/2} rx={rectH*0.2} className="hover:stroke-blue-500 hover:fill-blue-50/50 transition-all duration-200" transform="rotate(-90)" />
                    {isEditing ? (
                      <foreignObject x={-rectH/2} y={-rectW/2} width={rectH} height={rectW} style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}>
                        <input type="number" step="any" value={editValue} onChange={(e) => setEditValue(e.target.value)} onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') saveDimensionEdit(); else if (e.key === 'Escape') setEditingDim(null); }} onBlur={saveDimensionEdit} onDoubleClick={(e) => e.stopPropagation()} autoFocus className="w-full h-full text-center font-mono font-bold text-slate-900 bg-white border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 select-all" style={{ fontSize: `${textSize}px`, padding: 0, margin: 0, border: 'none', outline: 'none', background: 'transparent' }} />
                      </foreignObject>
                    ) : (
                      <text x="0" y={rectH * 0.18} textAnchor="middle" fontSize={textSize} fontWeight="bold" fill="#1E293B" fontFamily="monospace" className="pointer-events-none hover:fill-blue-600" transform="rotate(-90)">{dim.value.toFixed(1)}</text>
                    )}
                  </g>
                </g>
              );
          })}

          {smartDims.filter(d => d.type === 'RADIAL').map((dim, idx) => {
              const isEditing = editingDim?.id === dim.id && editingDim?.type === dim.type;
              const angle = Math.PI / 4 + (idx * 0.2); // slight offset for multiple
              const ex = dim.u + Math.cos(angle) * (dim.radius + dimOffset);
              const ey = dim.v + Math.sin(angle) * (dim.radius + dimOffset);
              return (
                <g key={`rad-${dim.id}-${idx}`}>
                  <line x1={dim.u} y1={dim.v} x2={ex} y2={ey} stroke="#3B82F6" strokeWidth={dimStrokeWidth} markerEnd={`url(#arrow-end-${type})`} />
                  <line x1={ex} y1={ey} x2={ex + dimOffset} y2={ey} stroke="#3B82F6" strokeWidth={dimStrokeWidth} />
                  <g transform={`translate(${ex + dimOffset + rectW/2}, ${ey}) scale(1, -1)`} className="cursor-pointer select-none" onDoubleClick={(e) => { e.stopPropagation(); setEditingDim({id: dim.id, type: dim.type, param: dim.param}); setEditValue((dim.value).toString()); }}>
                    <rect x={-rectW/2} y={-rectH/2} width={rectW} height={rectH} fill="white" stroke={isEditing ? '#3B82F6' : '#E2E8F0'} strokeWidth={isEditing ? dimStrokeWidth : dimStrokeWidth/2} rx={rectH*0.2} className="hover:stroke-blue-500 hover:fill-blue-50/50 transition-all duration-200" />
                    {isEditing ? (
                      <foreignObject x={-rectW/2} y={-rectH/2} width={rectW} height={rectH}>
                        <input type="number" step="any" value={editValue} onChange={(e) => setEditValue(e.target.value)} onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') saveDimensionEdit(); else if (e.key === 'Escape') setEditingDim(null); }} onBlur={saveDimensionEdit} onDoubleClick={(e) => e.stopPropagation()} autoFocus className="w-full h-full text-center font-mono font-bold text-slate-900 bg-white border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 select-all" style={{ fontSize: `${textSize}px`, padding: 0, margin: 0, border: 'none', outline: 'none', background: 'transparent' }} />
                      </foreignObject>
                    ) : (
                      <text x="0" y={rectH * 0.18} textAnchor="middle" fontSize={textSize} fontWeight="bold" fill="#1E293B" fontFamily="monospace" className="pointer-events-none hover:fill-blue-600">Ø{dim.value.toFixed(1)}</text>
                    )}
                  </g>
                </g>
              );
          })}
        """

content = content[:jsx_start_idx] + new_dim_logic + content[jsx_end_idx:]

with open('src/ui/DrawingSheet.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated DrawingSheet.tsx successfully")
