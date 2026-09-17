import React, { useState, useRef, useEffect } from 'react';
import { RotateCcw, Check, Sparkles } from 'lucide-react';

interface PatternLockDrawerProps {
  value?: number[];
  onChange: (pattern: number[]) => void;
  size?: number;
}

// 3x3 koordinatlar (1'den 9'a)
const DOT_COORDS: Record<number, { x: number; y: number }> = {
  1: { x: 45, y: 45 },
  2: { x: 125, y: 45 },
  3: { x: 205, y: 45 },
  4: { x: 45, y: 125 },
  5: { x: 125, y: 125 },
  6: { x: 205, y: 125 },
  7: { x: 45, y: 205 },
  8: { x: 125, y: 205 },
  9: { x: 205, y: 205 },
};

export const PatternLockDrawer: React.FC<PatternLockDrawerProps> = ({
  value = [],
  onChange,
  size = 250
}) => {
  const [pattern, setPattern] = useState<number[]>(value);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPointer, setCurrentPointer] = useState<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    setPattern(value);
  }, [value]);

  const getSvgCoordinates = (clientX: number, clientY: number) => {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    const scale = 250 / rect.width;
    return {
      x: (clientX - rect.left) * scale,
      y: (clientY - rect.top) * scale
    };
  };

  const getNearestDot = (x: number, y: number): number | null => {
    const HIT_RADIUS = 28;
    for (let i = 1; i <= 9; i++) {
      const dot = DOT_COORDS[i];
      const dist = Math.sqrt((dot.x - x) ** 2 + (dot.y - y) ** 2);
      if (dist <= HIT_RADIUS) {
        return i;
      }
    }
    return null;
  };

  const handleStart = (clientX: number, clientY: number) => {
    const coords = getSvgCoordinates(clientX, clientY);
    if (!coords) return;
    setIsDrawing(true);
    setCurrentPointer(coords);

    const hit = getNearestDot(coords.x, coords.y);
    if (hit) {
      const newPattern = [hit];
      setPattern(newPattern);
      onChange(newPattern);
    } else {
      setPattern([]);
      onChange([]);
    }
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDrawing) return;
    const coords = getSvgCoordinates(clientX, clientY);
    if (!coords) return;
    setCurrentPointer(coords);

    const hit = getNearestDot(coords.x, coords.y);
    if (hit && !pattern.includes(hit)) {
      const newPattern = [...pattern, hit];
      setPattern(newPattern);
      onChange(newPattern);
    }
  };

  const handleEnd = () => {
    setIsDrawing(false);
    setCurrentPointer(null);
  };

  const handleReset = () => {
    setPattern([]);
    onChange([]);
  };

  return (
    <div className="flex flex-col items-center bg-zinc-950 p-4 rounded-2xl border border-zinc-800 select-none">
      <div className="flex items-center justify-between w-full mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-orange-400">3×3 Dokunmatik Desen</span>
          {pattern.length > 0 && (
            <span className="text-[10px] bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-full font-mono font-bold">
              {pattern.join(' ➔ ')}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 hover:bg-zinc-800 px-2 py-1 rounded-lg transition-colors cursor-pointer"
        >
          <RotateCcw size={12} /> Temizle
        </button>
      </div>

      <div className="relative touch-none cursor-crosshair">
        <svg
          ref={svgRef}
          viewBox="0 0 250 250"
          className="w-[240px] h-[240px] rounded-2xl bg-zinc-900 border border-zinc-700/60 shadow-inner"
          onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
          onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={(e) => {
            if (e.touches.length > 0) {
              handleStart(e.touches[0].clientX, e.touches[0].clientY);
            }
          }}
          onTouchMove={(e) => {
            if (e.touches.length > 0) {
              handleMove(e.touches[0].clientX, e.touches[0].clientY);
            }
          }}
          onTouchEnd={handleEnd}
        >
          {/* Çizilen Hatlar */}
          {pattern.map((dotNum, idx) => {
            if (idx === pattern.length - 1) return null;
            const start = DOT_COORDS[dotNum];
            const end = DOT_COORDS[pattern[idx + 1]];
            return (
              <line
                key={`line-${idx}`}
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke="#ff6b00"
                strokeWidth="6"
                strokeLinecap="round"
              />
            );
          })}

          {/* Aktif sürükleme hattı */}
          {isDrawing && currentPointer && pattern.length > 0 && (
            <line
              x1={DOT_COORDS[pattern[pattern.length - 1]].x}
              y1={DOT_COORDS[pattern[pattern.length - 1]].y}
              x2={currentPointer.x}
              y2={currentPointer.y}
              stroke="#f97316"
              strokeWidth="4"
              strokeDasharray="4 4"
              strokeLinecap="round"
            />
          )}

          {/* 9 Nokta */}
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
            const coord = DOT_COORDS[num];
            const isSelected = pattern.includes(num);
            const order = pattern.indexOf(num) + 1;

            return (
              <g key={`dot-${num}`}>
                {/* Dış halka */}
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r={isSelected ? 18 : 14}
                  fill={isSelected ? 'rgba(249, 115, 22, 0.25)' : 'rgba(255, 255, 255, 0.04)'}
                  stroke={isSelected ? '#ff6b00' : '#52525b'}
                  strokeWidth={isSelected ? '2.5' : '1.5'}
                  className="transition-all duration-150"
                />

                {/* İç çekirdek nokta */}
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r={isSelected ? 7 : 4}
                  fill={isSelected ? '#f97316' : '#a1a1aa'}
                />

                {/* Sıra numarası */}
                {isSelected && (
                  <text
                    x={coord.x}
                    y={coord.y + 3.5}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {order}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <p className="text-[11px] text-zinc-400 mt-2 text-center">
        {pattern.length === 0
          ? 'Noktaları parmağınız veya fareyle birleştirerek deseni çizin.'
          : `${pattern.length} nokta seçildi. Kabul fişine ve teknisyen ekranına basılacaktır.`}
      </p>
    </div>
  );
};

// Termal Fiş ve Detay Ekranı İçin Minyatür 3x3 Desen Önizleyici
export const PatternMiniature: React.FC<{ pattern: number[]; size?: number }> = ({
  pattern,
  size = 54
}) => {
  if (!pattern || pattern.length === 0) return null;

  return (
    <div
      className="inline-flex flex-col items-center p-1 bg-zinc-100 border border-zinc-300 rounded"
      style={{ width: size + 8, height: size + 8 }}
      title={`Desen Dizisi: ${pattern.join('-')}`}
    >
      <svg viewBox="0 0 250 250" width={size} height={size}>
        {/* Çizgiler */}
        {pattern.map((dotNum, idx) => {
          if (idx === pattern.length - 1) return null;
          const start = DOT_COORDS[dotNum];
          const end = DOT_COORDS[pattern[idx + 1]];
          return (
            <line
              key={`mini-line-${idx}`}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke="#000000"
              strokeWidth="12"
              strokeLinecap="round"
            />
          );
        })}

        {/* 9 Nokta */}
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
          const coord = DOT_COORDS[num];
          const isSelected = pattern.includes(num);
          return (
            <circle
              key={`mini-dot-${num}`}
              cx={coord.x}
              cy={coord.y}
              r={isSelected ? 14 : 7}
              fill={isSelected ? '#000000' : '#999999'}
            />
          );
        })}
      </svg>
    </div>
  );
};
