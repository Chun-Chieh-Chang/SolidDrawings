import { useState, useMemo, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useCadStore } from '@/store/useCadStore';
import { previewSolve, commitPreciseSketchSolve } from '@/kernel/SketchSolverService';

export function useSketchLogic() {
  const {
    selectedEntityIds, setSelectedEntityIds,
    sketchNodes, setSketchNodes,
    sketchEdges, setSketchEdges,
    sketchConstraints, setSketchConstraints,
    solverReport, sketchTool, setSketchTool,
    setHoveredEntityId,
  } = useCadStore();

  const [isEditName, setIsEditName] = useState<string | null>(null);
  const [mirrorAxisId, setMirrorAxisId] = useState<string | null>(null);
  const [patternAxisId, setPatternAxisId] = useState<string | null>(null);
  const [patternCount, setPatternCount] = useState(3);
  const [patternSpacing, setPatternSpacing] = useState(20);
  const [patternAngle, setPatternAngle] = useState(360);

  const triggerRebuild = useCallback(() => {
    const h = (window as any).__handleRebuild;
    h?.();
  }, []);

  const activeEntity = useMemo(() => {
    if (selectedEntityIds.length === 1) {
      const id = selectedEntityIds[0];
      return sketchNodes[id] || sketchEdges[id] || sketchConstraints[id];
    }
    return null;
  }, [selectedEntityIds, sketchNodes, sketchEdges, sketchConstraints]);

  const updateEntityProperty = useCallback((id: string, key: string, value: any) => {
    if (sketchNodes[id]) setSketchNodes({ ...sketchNodes, [id]: { ...sketchNodes[id], [key]: value } });
    else if (sketchEdges[id]) setSketchEdges({ ...sketchEdges, [id]: { ...sketchEdges[id], [key]: value } });
    else if (sketchConstraints[id]) setSketchConstraints({ ...sketchConstraints, [id]: { ...sketchConstraints[id], [key]: value } });
    commitPreciseSketchSolve().then(() => triggerRebuild());
  }, [sketchNodes, sketchEdges, sketchConstraints, setSketchNodes, setSketchEdges, setSketchConstraints, triggerRebuild]);

  const selectedNodes = useMemo(() => selectedEntityIds.filter(id => sketchNodes[id]).map(id => sketchNodes[id]), [selectedEntityIds, sketchNodes]);
  const selectedEdges = useMemo(() => selectedEntityIds.filter(id => sketchEdges[id]).map(id => sketchEdges[id]), [selectedEntityIds, sketchEdges]);
  const selectedConstraints = useMemo(() => Object.values(sketchConstraints).filter(c => {
    return selectedEntityIds.includes(c.id) || c.nodeIds?.some(id => selectedEntityIds.includes(id)) || c.edgeIds?.some(id => selectedEntityIds.includes(id));
  }), [selectedEntityIds, sketchConstraints]);

  const handleAutoDefine = useCallback(async () => {
    if (!solverReport) return;
    const next = { ...sketchConstraints }; let added = 0;
    Object.entries(solverReport.nodes).forEach(([nid, status]: [string, any]) => {
      if (status === 'UNDER') {
        const node = sketchNodes[nid];
        if (!node || node.id === 'origin') return;
        const cxId = `dim_fds_x_${nid.slice(-4)}`;
        next[cxId] = { id: cxId, type: 'DISTANCE', nodeIds: [nid], value: node.x, label: 'X' };
        const cyId = `dim_fds_y_${nid.slice(-4)}`;
        next[cyId] = { id: cyId, type: 'DISTANCE', nodeIds: [nid], value: node.y, label: 'Y' };
        added += 2;
      }
    });
    if (added > 0) { setSketchConstraints(next); await commitPreciseSketchSolve(); triggerRebuild(); }
  }, [solverReport, sketchConstraints, sketchNodes, setSketchConstraints, triggerRebuild]);

  const handleDeleteEntities = useCallback(async () => {
    const nn = { ...sketchNodes }, ne = { ...sketchEdges }, nc = { ...sketchConstraints };
    new Set(selectedEntityIds).forEach(id => { delete nn[id]; delete ne[id]; delete nc[id]; });
    Object.values(ne).forEach(e => { if (e.nodeIds.some(nid => !nn[nid])) delete ne[e.id]; });
    Object.values(nc).forEach(c => { if (c.nodeIds?.some(nid => !nn[nid])) delete nc[c.id]; if (c.edgeIds?.some(eid => !ne[eid])) delete nc[c.id]; });
    setSketchNodes(nn); setSketchEdges(ne); setSketchConstraints(nc);
    setSelectedEntityIds([]); await commitPreciseSketchSolve(); triggerRebuild();
  }, [sketchNodes, sketchEdges, sketchConstraints, selectedEntityIds, setSketchNodes, setSketchEdges, setSketchConstraints, setSelectedEntityIds, triggerRebuild]);

  const handleFixSelection = useCallback(async (fixed: boolean) => {
    const next = { ...sketchNodes }; let changed = false;
    selectedNodes.forEach(n => { if (next[n.id]) { next[n.id] = { ...next[n.id], isFixed: fixed }; changed = true; } });
    selectedEdges.forEach(e => { e.nodeIds.forEach(nid => { if (next[nid]) { next[nid] = { ...next[nid], isFixed: fixed }; changed = true; } }); });
    if (changed) { setSketchNodes(next); await commitPreciseSketchSolve(); triggerRebuild(); }
  }, [selectedNodes, selectedEdges, sketchNodes, setSketchNodes, triggerRebuild]);

  const applyConstraint = useCallback(async (type: string) => {
    if (type === 'FIX') { handleFixSelection(true); return; }
    if (type === 'UNFIX') { handleFixSelection(false); return; }
    const cid = `c_${uuidv4().slice(0, 8)}`;
    const nc: any = { id: cid, type };
    if (type === 'HORIZONTAL' || type === 'VERTICAL') { if (selectedEdges.length === 1) nc.edgeIds = [selectedEdges[0].id]; else return; }
    else if (type === 'COINCIDENT') { if (selectedNodes.length === 2) nc.nodeIds = [selectedNodes[0].id, selectedNodes[1].id]; else if (selectedNodes.length === 1 && selectedEdges.length === 1) { nc.nodeIds = [selectedNodes[0].id]; nc.edgeIds = [selectedEdges[0].id]; } else return; }
    else if (type === 'DISTANCE') {
      if (selectedNodes.length === 2) { nc.nodeIds = [selectedNodes[0].id, selectedNodes[1].id]; nc.value = Math.hypot(selectedNodes[0].x - selectedNodes[1].x, selectedNodes[0].y - selectedNodes[1].y); }
      else if (selectedEdges.length === 1) { nc.edgeIds = [selectedEdges[0].id]; const e = selectedEdges[0]; const n1 = sketchNodes[e.nodeIds[0]]; const n2 = sketchNodes[e.nodeIds[1]]; if (n1 && n2) nc.value = Math.hypot(n2.x - n1.x, n2.y - n1.y); }
      else if (selectedNodes.length === 1 && selectedEdges.length === 1) { nc.nodeIds = [selectedNodes[0].id]; nc.edgeIds = [selectedEdges[0].id]; nc.value = 50; if (selectedEdges[0].type === 'CIRCLE') nc.arcCondition = 'CENTER'; }
      else if (selectedEdges.length === 2) { const e1 = selectedEdges[0], e2 = selectedEdges[1]; const hl = e1.type === 'LINE' || e1.type === 'CENTER_LINE' || e2.type === 'LINE' || e2.type === 'CENTER_LINE'; const hc = e1.type === 'CIRCLE' || e2.type === 'CIRCLE'; if (hl && hc) { nc.edgeIds = [e1.id, e2.id]; nc.value = 50; nc.arcCondition = 'CENTER'; } else return; }
      else return;
    }
    else if (type === 'EQUAL') { if (selectedEdges.length === 2) { const t1 = selectedEdges[0].type, t2 = selectedEdges[1].type; if ((t1 === 'LINE' || t1 === 'CENTER_LINE') && (t2 === 'LINE' || t2 === 'CENTER_LINE')) nc.edgeIds = [selectedEdges[0].id, selectedEdges[1].id]; else if (t1 === 'CIRCLE' && t2 === 'CIRCLE') nc.edgeIds = [selectedEdges[0].id, selectedEdges[1].id]; else return; } else return; }
    else if (type === 'CONCENTRIC') { if (selectedEdges.length === 2 && selectedEdges.every(e => e.type === 'CIRCLE' || e.type === 'ARC')) nc.edgeIds = [selectedEdges[0].id, selectedEdges[1].id]; else return; }
    else if (type === 'TANGENT') { if (selectedEdges.length === 2) { const t1 = selectedEdges[0].type, t2 = selectedEdges[1].type; const hs = t1 === 'SPLINE' || t2 === 'SPLINE'; const hl = t1 === 'LINE' || t1 === 'CENTER_LINE' || t2 === 'LINE' || t2 === 'CENTER_LINE'; const hc = t1 === 'CIRCLE' || t1 === 'ARC' || t2 === 'CIRCLE' || t2 === 'ARC'; if ((hl && hc) || (hc && hc) || (hs && (hl || hc))) nc.edgeIds = [selectedEdges[0].id, selectedEdges[1].id]; else return; } else return; }
    else if (type === 'ANGLE') { if (selectedEdges.length === 2 && selectedEdges.every(e => e.type === 'LINE')) { nc.edgeIds = [selectedEdges[0].id, selectedEdges[1].id]; nc.value = 90; } else return; }
    else if (['PARALLEL', 'PERPENDICULAR', 'COLLINEAR'].includes(type)) { if (selectedEdges.length === 2 && selectedEdges.every(e => e.type === 'LINE' || e.type === 'CENTER_LINE')) nc.edgeIds = [selectedEdges[0].id, selectedEdges[1].id]; else return; }
    const nextConstraints = { ...sketchConstraints, [cid]: nc };
    setSketchConstraints(nextConstraints);
    const pn = previewSolve(sketchNodes, sketchEdges, nextConstraints, 6);
    setSketchNodes(pn); await commitPreciseSketchSolve(); triggerRebuild();
  }, [selectedNodes, selectedEdges, sketchNodes, sketchEdges, sketchConstraints, setSketchNodes, setSketchEdges, setSketchConstraints, handleFixSelection, triggerRebuild]);

  const deleteConstraint = useCallback(async (cid: string) => {
    const next = { ...sketchConstraints }; delete next[cid];
    setSketchConstraints(next); await commitPreciseSketchSolve(); triggerRebuild();
  }, [sketchConstraints, setSketchConstraints, triggerRebuild]);

  const executeSketchMirror = useCallback(async () => {
    if (!mirrorAxisId) return;
    const axisEdge = sketchEdges[mirrorAxisId];
    if (!axisEdge || axisEdge.type !== 'CENTER_LINE') return;
    const a1 = sketchNodes[axisEdge.nodeIds[0]], a2 = sketchNodes[axisEdge.nodeIds[1]];
    if (!a1 || !a2) return;
    const nn = { ...sketchNodes }, ne = { ...sketchEdges }, nc = { ...sketchConstraints };
    const nm = new Map<string, string>();
    const dx = a2.x - a1.x, dy = a2.y - a1.y, lq = dx * dx + dy * dy;
    if (lq < 1e-6) return;
    selectedNodes.forEach(n => {
      const t = ((n.x - a1.x) * dx + (n.y - a1.y) * dy) / lq;
      const px = a1.x + t * dx, py = a1.y + t * dy;
      if (Math.hypot(n.x - px, n.y - py) < 1e-3) nm.set(n.id, n.id);
      else {
        const mid = `n_m_${uuidv4().slice(0, 8)}_${n.id.slice(-4)}`;
        nn[mid] = { id: mid, x: n.x + 2 * (px - n.x), y: n.y + 2 * (py - n.y), isFixed: false };
        nm.set(n.id, mid);
        const cId = `c_sym_${uuidv4().slice(0, 8)}_${n.id.slice(-4)}`;
        nc[cId] = { id: cId, type: 'SYMMETRIC', nodeIds: [n.id, mid], edgeIds: [mirrorAxisId] };
      }
    });
    selectedEdges.forEach(e => {
      if (e.id === mirrorAxisId) return;
      const mid = `e_m_${uuidv4().slice(0, 8)}_${e.id.slice(-4)}`;
      const mn = e.nodeIds.map(nid => nm.get(nid) || nid);
      if (mn.every((id, idx) => id === e.nodeIds[idx])) return;
      ne[mid] = { ...e, id: mid, nodeIds: mn as [string, string] };
    });
    setSketchNodes(nn); setSketchEdges(ne); setSketchConstraints(nc);
    setSketchTool('SELECT'); setSelectedEntityIds([]); setMirrorAxisId(null);
    await commitPreciseSketchSolve(); triggerRebuild();
  }, [mirrorAxisId, sketchNodes, sketchEdges, selectedNodes, selectedEdges, setSketchNodes, setSketchEdges, setSketchConstraints, setSketchTool, setSelectedEntityIds, triggerRebuild]);

  const executeLinearPattern = useCallback(async () => {
    if (!patternAxisId || patternCount < 2) return;
    const axisEdge = sketchEdges[patternAxisId];
    if (!axisEdge) return;
    const a1 = sketchNodes[axisEdge.nodeIds[0]], a2 = sketchNodes[axisEdge.nodeIds[1]];
    if (!a1 || !a2) return;
    const dx = a2.x - a1.x, dy = a2.y - a1.y, mag = Math.hypot(dx, dy);
    if (mag < 1e-6) return;
    const ux = dx / mag, uy = dy / mag;
    const nn = { ...sketchNodes }, ne = { ...sketchEdges }, nc = { ...sketchConstraints };
    for (let i = 1; i < patternCount; i++) {
      const off = i * patternSpacing;
      const nm = new Map<string, string>();
      selectedNodes.forEach(n => {
        const nid = `n_lp_${uuidv4().slice(0, 8)}_${i}_${n.id.slice(-4)}`;
        nn[nid] = { id: nid, x: n.x + ux * off, y: n.y + uy * off, isFixed: false };
        nm.set(n.id, nid);
      });
      selectedEdges.forEach(e => {
        const eid = `e_lp_${uuidv4().slice(0, 8)}_${i}_${e.id.slice(-4)}`;
        ne[eid] = { ...e, id: eid, nodeIds: e.nodeIds.map(n => nm.get(n) || n) as [string, string] };
        if (e.type === 'LINE' || e.type === 'CIRCLE') { const cId = `c_eq_lp_${uuidv4().slice(0, 8)}_${i}_${e.id.slice(-4)}`; nc[cId] = { id: cId, type: 'EQUAL', edgeIds: [e.id, eid] }; }
      });
    }
    setSketchNodes(nn); setSketchEdges(ne); setSketchConstraints(nc);
    setSketchTool('SELECT'); setSelectedEntityIds([]);
    await commitPreciseSketchSolve(); triggerRebuild();
  }, [patternAxisId, patternCount, patternSpacing, sketchNodes, sketchEdges, sketchConstraints, selectedNodes, selectedEdges, setSketchNodes, setSketchEdges, setSketchConstraints, setSketchTool, setSelectedEntityIds, triggerRebuild]);

  const executeCircularPattern = useCallback(async () => {
    if (selectedNodes.length === 0 || patternCount < 2) return;
    const center = selectedNodes[0];
    const nn = { ...sketchNodes }, ne = { ...sketchEdges }, nc = { ...sketchConstraints };
    const step = (patternAngle * Math.PI / 180) / patternCount;
    for (let i = 1; i < patternCount; i++) {
      const th = i * step, co = Math.cos(th), si = Math.sin(th);
      const nm = new Map<string, string>();
      selectedNodes.filter(n => n.id !== center.id).forEach(n => {
        const nid = `n_cp_${uuidv4().slice(0, 8)}_${i}_${n.id.slice(-4)}`;
        const rx = n.x - center.x, ry = n.y - center.y;
        nn[nid] = { id: nid, x: center.x + rx * co - ry * si, y: center.y + rx * si + ry * co, isFixed: false };
        nm.set(n.id, nid);
      });
      selectedEdges.forEach(e => {
        const eid = `e_cp_${uuidv4().slice(0, 8)}_${i}_${e.id.slice(-4)}`;
        const fn = e.nodeIds.map((n, idx) => nm.has(n) ? nm.get(n)! : n);
        ne[eid] = { ...e, id: eid, nodeIds: fn as [string, string] };
        if (e.type === 'LINE' || e.type === 'CIRCLE') { const cId = `c_eq_cp_${uuidv4().slice(0, 8)}_${i}_${e.id.slice(-4)}`; nc[cId] = { id: cId, type: 'EQUAL', edgeIds: [e.id, eid] }; }
      });
    }
    setSketchNodes(nn); setSketchEdges(ne); setSketchConstraints(nc);
    setSketchTool('SELECT'); setSelectedEntityIds([]);
    await commitPreciseSketchSolve(); triggerRebuild();
  }, [selectedNodes, patternCount, patternAngle, sketchNodes, sketchEdges, sketchConstraints, setSketchNodes, setSketchEdges, setSketchConstraints, setSketchTool, setSelectedEntityIds, triggerRebuild]);

  const onDeleteAllRelations = useCallback(async () => {
    setSketchConstraints({}); await commitPreciseSketchSolve(); triggerRebuild();
  }, [setSketchConstraints, triggerRebuild]);

  const hasActiveTool = sketchTool === 'LINEAR_PATTERN' || sketchTool === 'CIRCULAR_PATTERN' || sketchTool === 'MIRROR';
  const showText = sketchTool === 'TEXT';
  const showAllRelations = !hasActiveTool && !showText && selectedEntityIds.length === 0 && activeEntity === null;

  return {
    isEditName, setIsEditName,
    mirrorAxisId, setMirrorAxisId,
    patternAxisId, setPatternAxisId,
    patternCount, setPatternCount,
    patternSpacing, setPatternSpacing,
    patternAngle, setPatternAngle,
    activeEntity, updateEntityProperty,
    selectedNodes, selectedEdges, selectedConstraints,
    handleAutoDefine, handleDeleteEntities,
    applyConstraint, deleteConstraint,
    executeSketchMirror, executeLinearPattern, executeCircularPattern,
    onDeleteAllRelations, hasActiveTool, showText, showAllRelations,
    solverReport, sketchNodes, sketchEdges, sketchConstraints,
    selectedEntityIds, sketchTool, setHoveredEntityId, setSelectedEntityIds,
  };
}
