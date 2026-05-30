import re

with open('src/ui/DrawingSheet.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

start_str = "{hasBounds && type !== 'ISO' && ("
end_str = "          )}

        </svg>"

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
                  <g transform={`translate(${ex + dimOffset + rectW/2}, ${ey}) scale(1, -1)`} className="cursor-pointer select-none" onDoubleClick={(e) => { e.stopPropagation(); setEditingDim({id: dim.id, type: dim.type, param: dim.param}); setEditValue(dim.value.toString()); }}>
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
        </svg>"""

idx_start = content.find(start_str)
idx_end = content.find("</svg>", idx_start)

if idx_start != -1 and idx_end != -1:
    new_content = content[:idx_start] + new_dim_logic + content[idx_end+6:]
    with open('src/ui/DrawingSheet.tsx', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Replaced dimensions logic successfully.")
else:
    print("Could not find start/end bounds for dimension logic replacement.")
