import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw, Check, PenTool, Eraser } from 'lucide-react';

interface SignaturePadProps {
  value?: string;
  onChange: (signatureDataUrl: string | undefined) => void;
  title?: string;
  subtitle?: string;
  height?: number;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  value,
  onChange,
  title = 'Müşteri Dijital Onay İmzası',
  subtitle = 'Lütfen kutu içerisine parmak veya kalem ile imzanızı atınız',
  height = 140
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(Boolean(value));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set display resolution
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // If initial value exists, load image
    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };
      img.src = value;
    }
  }, []);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else if ('clientX' in e) {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
    return { x: 0, y: 0 };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const dataUrl = canvas.toDataURL('image/png');
      onChange(dataUrl);
    } catch (err) {
      console.warn('Signature export error:', err);
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    setHasDrawn(false);
    onChange(undefined);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-700/80 rounded-2xl p-3.5 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
            <PenTool size={14} className="text-orange-400" />
            {title}
          </h4>
          <p className="text-[10px] text-zinc-400 mt-0.5">{subtitle}</p>
        </div>

        <button
          type="button"
          onClick={handleClear}
          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-zinc-400 hover:text-red-400 bg-zinc-800 hover:bg-zinc-750 rounded-lg transition-colors cursor-pointer border border-zinc-700"
          title="İmzayı Temizle"
        >
          <Eraser size={12} />
          <span>Temizle</span>
        </button>
      </div>

      <div
        className="relative bg-white rounded-xl overflow-hidden shadow-inner border border-zinc-300 touch-none cursor-crosshair select-none"
        style={{ height: `${height}px` }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        {/* Baseline guideline */}
        <div className="absolute bottom-4 left-6 right-6 border-b border-dashed border-zinc-300 pointer-events-none flex justify-between text-[9px] text-zinc-400 font-sans pb-0.5">
          <span>İmza Çizgisi ✍️</span>
          <span>{hasDrawn ? '✓ İmza Alındı' : 'Dokunmatik Ekran Destekli'}</span>
        </div>
      </div>
    </div>
  );
};
