'use client';

import React, { useState, useEffect, useRef } from 'react';

interface SKeyMenuItem {
  label: string;
  icon?: string;
  shortcut?: string;
  action: () => void;
}

interface SKeyProps {
  items: SKeyMenuItem[];
  visible: boolean;
  onClose: () => void;
}

export const SKey: React.FC<SKeyProps> = ({ items, visible, onClose }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!visible) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [visible, onClose]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    if (angle < 0) angle += 360;
    
    // Normalize angle based on item count
    const segmentAngle = 360 / items.length;
    const index = Math.round(((angle + segmentAngle / 2) % 360) / segmentAngle) % items.length;
    
    setHoveredIndex(index);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(-1);
  };

  if (!visible) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20"
      onClick={onClose}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div 
        className="relative w-64 h-64"
        onClick={(e) => e.stopPropagation()}
      >
        {items.map((item, index) => {
          const segmentAngle = 360 / items.length;
          const startAngle = index * segmentAngle - 90 - segmentAngle / 2;
          const endAngle = startAngle + segmentAngle;
          
          // Convert polar to cartesian for SVG arc
          const x1 = 128 + 128 * Math.cos(startAngle * Math.PI / 180);
          const y1 = 128 + 128 * Math.sin(startAngle * Math.PI / 180);
          const x2 = 128 + 128 * Math.cos(endAngle * Math.PI / 180);
          const y2 = 128 + 128 * Math.sin(endAngle * Math.PI / 180);
          
          const isHovered = hoveredIndex === index;
          
          return (
            <button
              key={index}
              className={`absolute top-0 left-0 w-full h-full cursor-pointer group`}
              style={{
                clipPath: `polygon(50% 50%, ${x1/128*100}% ${y1/128*100}%, ${x2/128*100}% ${y2/128*100}%)`,
              }}
              onClick={() => {
                item.action();
                onClose();
              }}
            >
              <svg className="w-full h-full" viewBox="0 0 256 256">
                <path
                  d={`M 128 128 L ${x1} ${y1} A 128 128 0 0 1 ${x2} ${y2} Z`}
                  className={`transition-colors duration-150 ${
                    isHovered ? 'fill-[#005B9A] stroke-white' : 'fill-[#E8E8E8] stroke-[#A0A0A0]'
                  }`}
                  strokeWidth="1"
                />
              </svg>
            </button>
          );
        })}
        
        {/* Center circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white border-2 border-[#A0A0A0] rounded-full flex items-center justify-center shadow-lg">
          <span className="text-2xl font-black text-[#005B9A]">S</span>
        </div>
        
        {/* Hovered item label */}
        {hoveredIndex >= 0 && (
          <div className="absolute bottom-[-30px] left-1/2 -translate-x-1/2 bg-[#005B9A] text-white text-[11px] font-bold px-3 py-1 rounded whitespace-nowrap shadow-lg">
            {items[hoveredIndex].label}
            {items[hoveredIndex].shortcut && (
              <span className="ml-2 text-[#E8E8E8]">({items[hoveredIndex].shortcut})</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
