// SOLIDWORKS 2010 Compatible Mouse Gesture Recognition
// Detects drag direction in Graphics Area and triggers commands

import { useCadStore } from '../store/useCadStore';

export interface GestureResult {
  direction: '\''UP'\'' | '\''DOWN'\'' | '\''LEFT'\'' | '\''RIGHT'\'' | '\''NONE'\'';
  distance: number;
  angle: number;
}

export interface GestureConfig {
  threshold: number;        // Minimum distance to trigger (pixels)
  angleSegments: number;    // Number of angular segments
  commands: Record<string, () => void>;  // Command functions
}

const DEFAULT_CONFIG: GestureConfig = {
  threshold: 30,
  angleSegments: 8,
  commands: {
    UP: () => {
      const store = useCadStore.getState();
      if (store.controls) store.controls.object.position.y += 20;
    },
    DOWN: () => {
      const store = useCadStore.getState();
      if (store.controls) store.controls.object.position.y -= 20;
    },
    LEFT: () => {
      const store = useCadStore.getState();
      if (store.controls) store.controls.object.position.x -= 20;
    },
    RIGHT: () => {
      const store = useCadStore.getState();
      if (store.controls) store.controls.object.position.x += 20;
    },
  }
};

export function detectGesture(startX: number, startY: number, endX: number, endY: number): GestureResult {
  const dx = endX - startX;
  const dy = endY - startY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  let direction: '\''UP'\'' | '\''DOWN'\'' | '\''LEFT'\'' | '\''RIGHT'\'' | '\''NONE'\'' = '\''NONE'\'';
  
  if (distance >= DEFAULT_CONFIG.threshold) {
    const normalizedAngle = ((angle % 360) + 360) % 360;
    const segmentAngle = 360 / DEFAULT_CONFIG.angleSegments;
    const segment = Math.round(normalizedAngle / segmentAngle);
    
    switch (segment % DEFAULT_CONFIG.angleSegments) {
      case 0: direction = '\''RIGHT'\''; break;  // 0
      case 1: case 2: direction = '\''DOWN'\''; break;  // 45-135
      case 3: case 4: direction = '\''LEFT'\''; break;  // 135-225
      case 5: case 6: direction = '\''UP'\''; break;  // 225-315
      case 7: direction = '\''RIGHT'\''; break;  // 315-360
    }
  }

  return { direction, distance, angle };
}

export function setupMouseGestures(containerRef: React.RefObject<HTMLElement | null>) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [startPos, setStartPos] = React.useState({ x: 0, y: 0 });

  React.useEffect(() => {
    if (!containerRef.current) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;  // Only left mouse button
      setIsDragging(true);
      setStartPos({ x: e.clientX, y: e.clientY });
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!isDragging) return;
      
      const gesture = detectGesture(
        startPos.x, startPos.y,
        e.clientX, e.clientY
      );

      if (gesture.direction !== '\''NONE'\'') {
        const config = DEFAULT_CONFIG;
        const command = config.commands[gesture.direction];
        if (command) {
          command();
        }
      }

      setIsDragging(false);
    };

    const ref = containerRef.current;
    ref.addEventListener('\''pointerdown'\'', handlePointerDown);
    window.addEventListener('\''pointerup'\'', handlePointerUp);

    return () => {
      ref.removeEventListener('\''pointerdown'\'', handlePointerDown);
      window.removeEventListener('\''pointerup'\'', handlePointerUp);
    };
  }, [containerRef, isDragging, startPos]);
}
