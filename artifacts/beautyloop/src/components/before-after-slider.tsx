import { useState, useRef, useCallback, useEffect } from 'react';
import { Sparkles, SplitSquareVertical } from 'lucide-react';

interface BeforeAfterSliderProps {
  beforeUrl: string;
  afterUrl: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export function BeforeAfterSlider({
  beforeUrl,
  afterUrl,
  beforeLabel = 'Original Selfie',
  afterLabel = 'YouCam AR Try-On',
}: BeforeAfterSliderProps) {
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const clampedPct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(clampedPct);
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  }, [isDragging, handleMove]);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  }, [isDragging, handleMove]);

  const onMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onMouseUp);
    };
  }, [isDragging, onMouseMove, onMouseUp, onTouchMove]);

  return (
    <div
      ref={containerRef}
      className="split-slider-container"
      onMouseDown={() => setIsDragging(true)}
      onTouchStart={() => setIsDragging(true)}
      role="region"
      aria-label="Interactive Before and After Virtual Try-On comparison slider"
    >
      {/* After image (background layer) */}
      <img src={afterUrl} alt={afterLabel} className="split-slider-img" />

      {/* Before image (clipped overlay) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          width: `${sliderPos}%`,
        }}
      >
        <img
          src={beforeUrl}
          alt={beforeLabel}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%',
            maxWidth: 'none',
            objectFit: 'cover',
          }}
        />
      </div>

      {/* Badges */}
      <div className="split-slider-badge left">{beforeLabel}</div>
      <div className="split-slider-badge right">{afterLabel}</div>

      {/* Draggable Divider Line & Knob */}
      <div className="split-slider-handle" style={{ left: `${sliderPos}%` }}>
        <div className="split-slider-knob" title="Drag to compare">
          <SplitSquareVertical size={16} />
        </div>
      </div>
    </div>
  );
}
