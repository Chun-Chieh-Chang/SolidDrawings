'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { v4 as uuidv4 } from 'uuid';
import { HeavyEngineClient, type MeshData } from '@/kernel/HeavyEngineClient';
import { useCadStore } from '@/store/useCadStore';

type Tab = 'EDITOR' | 'IMPORT' | 'TEXT_TO_CAD';

interface PreviewState {
  mesh?: MeshData;
  filepath?: string;
  scadCode?: string;
}

const DEFAULT_SCAD = `// OpenSCAD parametric model
cube([20, 20, 20]);`;

// ── Mesh preview: renders MeshData in a small auto-rotating canvas ──────────

function MeshPreview({ mesh, height = 180 }: { mesh: MeshData; height?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !mesh?.vertices?.length) return;
    const width = container.clientWidth || 240;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1e293b);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 100000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Mirror the OcctShape mesh → BufferGeometry conversion
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(mesh.vertices, 3));
    if (mesh.normals?.length) {
      geom.setAttribute('normal', new THREE.Float32BufferAttribute(mesh.normals, 3));
    } else {
      geom.computeVertexNormals();
    }
    if (mesh.colors?.length) {
      geom.setAttribute('color', new THREE.Float32BufferAttribute(mesh.colors, 3));
    }
    geom.computeBoundingSphere();

    scene.add(new THREE.AmbientLight(0xffffff, 0.65));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(1, 2, 1.5);
    scene.add(dirLight);

    const material = new THREE.MeshStandardMaterial({
      color: 0x60a5fa,
      metalness: 0.25,
      roughness: 0.45,
    });
    const meshObj = new THREE.Mesh(geom, material);
    scene.add(meshObj);

    // Frame the camera around the model's bounding sphere
    const sphere = geom.boundingSphere;
    if (sphere) {
      camera.position.set(sphere.radius * 2.5, sphere.radius * 1.8, sphere.radius * 2.5);
      camera.lookAt(sphere.center);
      camera.near = Math.max(sphere.radius / 100, 0.001);
      camera.far = sphere.radius * 100;
      camera.updateProjectionMatrix();
    }

    let raf = 0;
    const animate = () => {
      meshObj.rotation.y += 0.008;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      renderer.dispose();
      geom.dispose();
      material.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [mesh, height]);

  return (
    <div
      ref={containerRef}
      style={{ height }}
      className="w-full rounded border border-slate-600 overflow-hidden bg-slate-800"
    />
  );
}

// ── Panel ────────────────────────────────────────────────────────────────────

export function OpenScadPanel({ onAddFeature }: { onAddFeature?: (feature: any) => void }) {
  const [tab, setTab] = useState<Tab>('EDITOR');
  const [scadCode, setScadCode] = useState(DEFAULT_SCAD);
  const [description, setDescription] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [stlFileName, setStlFileName] = useState('Imported STL');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const client = HeavyEngineClient.getInstance();
  const addFeature = useCadStore((s: any) => s.addFeature);

  const pushToast = useCallback((message: string, type: 'error' | 'info' = 'info') => {
    useCadStore.getState().pushToast(message, type);
  }, []);

  const handleAddFeature = useCallback(
    (feature: any) => {
      addFeature(feature);
      if (onAddFeature) {
        onAddFeature(feature);
      } else {
        setTimeout(() => (window as any).__handleRebuild?.(), 50);
      }
      pushToast(`${feature.name} added.`);
    },
    [addFeature, onAddFeature, pushToast],
  );

  const handleCompile = async () => {
    if (!scadCode.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const result = await client.compileOpenScad(scadCode);
      if (!result.ok) {
        setError(result.error || 'Compile failed.');
        setPreview(null);
      } else {
        setPreview({ mesh: result.mesh, filepath: result.filepath });
      }
    } catch (e: any) {
      setError(e.message || 'Compile failed.');
      setPreview(null);
    } finally {
      setBusy(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const uploaded = await client.uploadStlFile(file);
      const result = await client.importStlPreview(uploaded.filepath);
      if (!result.ok) {
        setError(result.error || 'STL import failed.');
        setPreview(null);
      } else {
        setStlFileName(file.name);
        setPreview({ mesh: result.mesh, filepath: uploaded.filepath });
      }
    } catch (err: any) {
      setError(err.message || 'STL upload failed.');
      setPreview(null);
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };

  const handleGenerate = async () => {
    if (!description.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const result = await client.textToCad(description);
      if (!result.ok) {
        setError(result.error || 'Generation failed.');
        setPreview(null);
      } else {
        setGeneratedCode(result.scadCode || '');
        setShowCode(true);
        setPreview({ mesh: result.mesh, scadCode: result.scadCode });
      }
    } catch (err: any) {
      setError(err.message || 'Generation failed.');
      setPreview(null);
    } finally {
      setBusy(false);
    }
  };

  const addOpenScadFeature = (code: string) => {
    handleAddFeature({
      id: `openscad_${uuidv4()}`,
      name: 'OpenSCAD Script',
      type: 'OPENSCAD',
      parameters: { scad_code: code, x: 0, y: 0, z: 0 },
    });
  };

  const addStlFeature = () => {
    if (!preview?.filepath) return;
    handleAddFeature({
      id: `stl_${uuidv4()}`,
      name: stlFileName,
      type: 'IMPORTED_STL',
      parameters: { filepath: preview.filepath, x: 0, y: 0, z: 0 },
    });
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'EDITOR', label: 'Editor' },
    { id: 'IMPORT', label: 'Import' },
    { id: 'TEXT_TO_CAD', label: 'Text-to-CAD' },
  ];

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
          OpenSCAD / Import / Text-to-CAD
        </span>
      </div>

      {/* Tab switcher */}
      <div className="flex px-2 border-b border-slate-200 bg-white">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setError(null); }}
            className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-tighter border-b-2 transition-all ${
              tab === t.id
                ? 'border-[#005B9A] text-[#005B9A]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-2 pb-4 space-y-2 custom-scrollbar">
        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 rounded px-2 py-1.5 text-[11px] font-medium break-words">
            {error}
          </div>
        )}

        {/* ── Tab 1: Editor ── */}
        {tab === 'EDITOR' && (
          <>
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">OpenSCAD Code</span>
              <textarea
                value={scadCode}
                onChange={(e) => setScadCode(e.target.value)}
                rows={12}
                spellCheck={false}
                className="w-full bg-slate-900 text-emerald-300 text-[11px] font-mono leading-snug rounded border border-slate-600 p-2 resize-y focus:outline-none focus:border-[#005B9A]"
                placeholder="// Write OpenSCAD code..."
              />
            </div>
            <button
              onClick={handleCompile}
              disabled={busy || !scadCode.trim()}
              className="w-full py-1.5 bg-[#005B9A] hover:bg-[#004A7C] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2"
            >
              {busy && <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              Compile & Preview
            </button>
            {preview?.mesh && (
              <>
                <MeshPreview mesh={preview.mesh} />
                <button
                  onClick={() => addOpenScadFeature(scadCode)}
                  className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-black uppercase tracking-wider transition-all"
                >
                  + Add as Feature
                </button>
              </>
            )}
          </>
        )}

        {/* ── Tab 2: Import ── */}
        {tab === 'IMPORT' && (
          <>
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">STL File</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".stl"
                onChange={handleUpload}
                disabled={busy}
                className="w-full text-[11px] text-slate-600 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-[#005B9A] file:text-white file:text-[10px] file:font-black file:uppercase file:cursor-pointer hover:file:bg-[#004A7C] disabled:opacity-40"
              />
              <p className="text-[10px] text-slate-400">Upload an STL mesh and import it into the feature tree.</p>
            </div>
            {busy && (
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <span className="w-3 h-3 border-2 border-slate-300 border-t-[#005B9A] rounded-full animate-spin" />
                Importing...
              </div>
            )}
            {preview?.mesh && (
              <>
                <MeshPreview mesh={preview.mesh} />
                <button
                  onClick={addStlFeature}
                  className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-black uppercase tracking-wider transition-all"
                >
                  + Add as Feature
                </button>
              </>
            )}
          </>
        )}

        {/* ── Tab 3: Text-to-CAD ── */}
        {tab === 'TEXT_TO_CAD' && (
          <>
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Description</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                spellCheck={false}
                className="w-full bg-white text-slate-800 text-[12px] rounded border border-slate-300 p-2 resize-y focus:outline-none focus:border-[#005B9A]"
                placeholder="e.g. A bracket with two mounting holes and a 90-degree bend"
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={busy || !description.trim()}
              className="w-full py-1.5 bg-[#005B9A] hover:bg-[#004A7C] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2"
            >
              {busy && <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              Generate
            </button>
            {generatedCode && (
              <div className="space-y-1">
                <button
                  onClick={() => setShowCode(!showCode)}
                  className="w-full text-left text-[10px] font-black uppercase tracking-wider text-[#005B9A] hover:text-[#004A7C]"
                >
                  {showCode ? '▾' : '▸'} Generated OpenSCAD Code
                </button>
                {showCode && (
                  <pre className="w-full bg-slate-900 text-emerald-300 text-[10px] font-mono leading-snug rounded border border-slate-600 p-2 overflow-x-auto max-h-40 overflow-y-auto">
                    {generatedCode}
                  </pre>
                )}
              </div>
            )}
            {preview?.mesh && (
              <>
                <MeshPreview mesh={preview.mesh} />
                <button
                  onClick={() => addOpenScadFeature(generatedCode)}
                  className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-black uppercase tracking-wider transition-all"
                >
                  + Add as Feature
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}