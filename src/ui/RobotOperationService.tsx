'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useCadStore } from '../store/useCadStore';

export const RobotOperationService: React.FC = () => {
  const { 
    addAutomationLog, 
    setActiveAutomationStep, 
    setRobotStatus,
    addFeature,
    setFeatures,
    features,
    setMode,
    setActiveTab,
    setSelectedId,
    setSketchNodes,
    setSketchEdges,
    setSketchConstraints
  } = useCadStore();

  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [isCursorVisible, setIsCursorVisible] = useState(false);
  
  // Local queue for sequential processing
  const commandQueue = useRef<any[]>([]);
  const isProcessing = useRef(false);
  const lastProcessedId = useRef(0);

  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:8400/api/v1/robot/status?last_id=${lastProcessedId.current}`);
        const data = await response.json();
        
        if (data.new_events && data.new_events.length > 0) {
          data.new_events.forEach((ev: any) => {
            if (ev.id > lastProcessedId.current) {
              commandQueue.current.push(ev);
              lastProcessedId.current = ev.id;
            }
          });
          
          if (!isProcessing.current) {
            processNextCommand();
          }
        }
      } catch (err) {}
    }, 500);

    const processNextCommand = async () => {
      if (commandQueue.current.length === 0) {
        isProcessing.current = false;
        return;
      }

      isProcessing.current = true;
      const { type, payload } = commandQueue.current.shift();
      console.log(`[Robot Sequencer] Executing: ${type}`, payload);

      if (type === 'START_MODELING') {
        setRobotStatus('WORKING');
        setIsCursorVisible(true);
        // Clear all
        const { resetStore } = useCadStore.getState();
        resetStore();
        setMode('PART');
        setActiveTab('FEATURES');
        addAutomationLog(`🚀 Project Reset & Plan Started: ${payload.name}`);
        await new Promise(r => setTimeout(r, 1000));
      } else if (type === 'STEP_START') {
        setActiveAutomationStep(payload.step);
        addAutomationLog(`>>> Executing: ${payload.step}`);
        
        // 1. Cursor Movement & UI Selection
        if (payload.selector) {
          let el: HTMLElement | null = null;
          
          // Strategy A: Try standard querySelector
          try {
            el = document.querySelector(payload.selector);
          } catch (e) {
            console.warn('[Robot] Invalid selector, falling back to text search:', payload.selector);
          }

          // Strategy B: Fallback to text search if selector contains 'contains' or el not found
          if (!el) {
            const searchText = payload.selector.match(/contains\(['"](.*)['"]\)/)?.[1] || payload.selector;
            const buttons = Array.from(document.querySelectorAll('button, div, span'));
            el = buttons.find(b => b.textContent?.trim().toUpperCase() === searchText.toUpperCase()) as HTMLElement;
          }

          if (el) {
            const rect = el.getBoundingClientRect();
            setCursorPos({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
            await new Promise(r => setTimeout(r, 1500)); // Travel time
            el.classList.add('robot-highlight');
            el.click();
            setTimeout(() => el.classList.remove('robot-highlight'), 1000);
          }
        }

        // 2. Feature Sync (Deduplicated)
        if (payload.feature) {
          const currentFeatures = useCadStore.getState().features;
          const exists = currentFeatures.find(f => f.id === payload.feature.id);
          if (!exists) {
            addFeature({
              ...payload.feature,
              name: `🤖 ${payload.feature.name || payload.step}`
            });
            setSelectedId(payload.feature.id);
          }
          
          // 3. Guaranteed Rebuild Wait
          await new Promise(r => setTimeout(r, 500)); // Wait for State
          if ((window as any).__handleRebuild) {
             console.log('[Robot] Forcing Rebuild Step');
             await (window as any).__handleRebuild();
          }
          await new Promise(r => setTimeout(r, 1000)); // Observability pause
        }
      } else if (type === 'STEP_SUCCESS') {
        addAutomationLog(`✓ Step Success: ${payload.step}`);
      } else if (type === 'STEP_ERROR') {
        setRobotStatus('ERROR');
        const errorMsg = payload.error || 'Unknown kernel error';
        addAutomationLog(`❌ Kernel Error: ${errorMsg}`);
        await new Promise(r => setTimeout(r, 3000));
        setRobotStatus('PAUSED');
      } else if (type === 'FINISH') {
        setRobotStatus('IDLE');
        setActiveAutomationStep('Mission Accomplished 🎓');
        addAutomationLog('Robot has finished the modeling plan.');
        setIsCursorVisible(false);
      }

      // Chain next command
      processNextCommand();
    };

    return () => clearInterval(pollInterval);
  }, [addAutomationLog, setActiveAutomationStep, setRobotStatus, addFeature, setFeatures, setMode, setActiveTab, setSelectedId, setSketchNodes, setSketchEdges, setSketchConstraints]);

  return (
    <>
      {isCursorVisible && (
        <div 
          className="fixed pointer-events-none z-[10000] transition-all duration-1000 ease-in-out"
          style={{ left: cursorPos.x, top: cursorPos.y }}
        >
          <div className="relative">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-amber-500 drop-shadow-xl scale-150">
              <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" fill="currentColor" stroke="white" strokeWidth="2"/>
            </svg>
            <div className="absolute top-8 left-8 px-2 py-1 bg-amber-600 text-white text-[10px] font-black rounded-lg shadow-xl whitespace-nowrap border-2 border-white/50 animate-bounce">
              AGENT OPERATING
            </div>
            <div className="absolute top-0 left-0 w-8 h-8 bg-amber-500/30 rounded-full animate-ping -translate-x-1 -translate-y-1" />
          </div>
        </div>
      )}
      <style jsx global>{`
        .robot-highlight {
          outline: 6px solid #F59E0B !important;
          outline-offset: 4px;
          box-shadow: 0 0 40px #F59E0B !important;
          transition: all 0.4s;
          z-index: 9999;
          background-color: #FFFBEB !important;
          transform: scale(1.05);
        }
      `}</style>
    </>
  );
};
