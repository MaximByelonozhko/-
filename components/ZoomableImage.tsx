import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface ZoomableImageProps {
  src: string;
  alt: string;
}

export const ZoomableImage: React.FC<ZoomableImageProps> = ({ src, alt }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleZoomIn = () => setScale(s => Math.min(s + 0.5, 4));
  const handleZoomOut = () => {
    setScale(s => {
      const newScale = Math.max(s - 0.5, 1);
      if (newScale === 1) setPosition({ x: 0, y: 0 }); // Reset pos if zoomed out fully
      return newScale;
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      e.preventDefault();
      const newX = e.clientX - startPos.x;
      const newY = e.clientY - startPos.y;
      
      // Simple boundary checking could go here, but omitted for brevity/smoothness
      setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  // Reset when source changes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [src]);

  return (
    <div className="relative w-full h-80 bg-slate-900 rounded-xl overflow-hidden shadow-inner group">
      <div 
        ref={containerRef}
        className={`w-full h-full flex items-center justify-center cursor-${scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          ref={imageRef}
          src={src}
          alt={alt}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out'
          }}
          className="max-w-full max-h-full object-contain select-none"
          draggable={false}
        />
      </div>
      
      {/* Controls Overlay */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        <button 
          onClick={handleZoomOut} 
          disabled={scale <= 1}
          className="p-2 bg-white/90 text-slate-800 rounded-full shadow-lg hover:bg-white disabled:opacity-50 transition-all backdrop-blur-sm"
          title="Зменшити"
        >
          <ZoomOut size={20} />
        </button>
        <div className="px-3 py-2 bg-slate-800/80 text-white rounded-full text-xs font-mono flex items-center shadow-lg backdrop-blur-sm">
          {Math.round(scale * 100)}%
        </div>
        <button 
          onClick={handleZoomIn} 
          disabled={scale >= 4}
          className="p-2 bg-white/90 text-slate-800 rounded-full shadow-lg hover:bg-white disabled:opacity-50 transition-all backdrop-blur-sm"
          title="Збільшити"
        >
          <ZoomIn size={20} />
        </button>
      </div>

      <div className="absolute top-4 right-4 md:hidden">
          <div className="bg-black/50 text-white text-[10px] px-2 py-1 rounded-md backdrop-blur-md">
            Перетягніть для огляду
          </div>
      </div>
    </div>
  );
};