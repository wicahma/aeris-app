import React, { useState, useRef, useEffect } from 'react';
import { X, Maximize2, Minimize2, Move } from 'lucide-react';

interface DraggableModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  initialWidth?: number;
  initialHeight?: number;
  icon?: React.ReactNode;
}

export const DraggableModal: React.FC<DraggableModalProps> = ({
  title,
  isOpen,
  onClose,
  children,
  initialWidth = 640,
  initialHeight = 480,
  icon,
}) => {
  const [pos, setPos] = useState({ x: 100, y: 80 });
  const [size, setSize] = useState({ width: initialWidth, height: initialHeight });
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ width: 0, height: 0, x: 0, y: 0 });

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const x = Math.max(20, (windowWidth - initialWidth) / 2);
      const y = Math.max(20, (windowHeight - initialHeight) / 2);
      setPos({ x, y });
    }
  }, [isOpen, initialWidth, initialHeight]);

  const handleMouseDownHeader = (e: React.MouseEvent) => {
    if (isMaximized) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pos.x, y: e.clientY - pos.y });
  };

  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMaximized) return;
    setIsResizing(true);
    setResizeStart({
      width: size.width,
      height: size.height,
      x: e.clientX,
      y: e.clientY,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = Math.max(0, Math.min(window.innerWidth - size.width, e.clientX - dragStart.x));
        const newY = Math.max(0, Math.min(window.innerHeight - size.height, e.clientY - dragStart.y));
        setPos({ x: newX, y: newY });
      } else if (isResizing) {
        const newWidth = Math.max(320, resizeStart.width + (e.clientX - resizeStart.x));
        const newHeight = Math.max(240, resizeStart.height + (e.clientY - resizeStart.y));
        setSize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, resizeStart, size.width, size.height]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      <div
        ref={modalRef}
        className={`pointer-events-auto absolute bg-zinc-950/95 border border-zinc-800 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden transition-all ${
          isMaximized ? 'inset-4 !w-auto !h-auto' : ''
        }`}
        style={
          !isMaximized
            ? {
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                width: `${size.width}px`,
                height: `${size.height}px`,
              }
            : undefined
        }
      >
        {/* Header Handle */}
        <div
          onMouseDown={handleMouseDownHeader}
          className="px-4 py-3 bg-zinc-900/90 border-b border-zinc-800/80 flex items-center justify-between cursor-move select-none shrink-0"
        >
          <div className="flex items-center gap-2.5">
            <Move className="w-3.5 h-3.5 text-zinc-500" />
            {icon}
            <span className="font-mono font-bold text-xs text-white tracking-tight">{title}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors"
            >
              {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-auto p-5 font-sans custom-scrollbar">{children}</div>

        {/* Resize Handle Handle */}
        {!isMaximized && (
          <div
            onMouseDown={handleMouseDownResize}
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-center justify-center text-zinc-600 hover:text-emerald-400"
          >
            <div className="w-2 h-2 border-r-2 border-b-2 border-current" />
          </div>
        )}
      </div>
    </div>
  );
};