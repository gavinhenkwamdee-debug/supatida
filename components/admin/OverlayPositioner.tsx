"use client";

import { useEffect, useRef, useState } from "react";

export default function OverlayPositioner({
  baseImage,
  overlayImage,
  x,
  y,
  width,
  rotation,
  onChange,
}: {
  baseImage: string;
  overlayImage: string;
  x: number;
  y: number;
  width: number;
  rotation: number;
  onChange: (x: number, y: number, width: number, rotation: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [containerSize, setContainerSize] = useState(320);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setContainerSize(el.getBoundingClientRect().width);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  function clamp(n: number) {
    return Math.max(0, Math.min(100, n));
  }

  function pxToPct(px: number) {
    return clamp((px / containerSize) * 100);
  }

  function posFromEvent(clientX: number, clientY: number) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      x: clamp(((clientX - rect.left) / rect.width) * 100),
      y: clamp(((clientY - rect.top) / rect.height) * 100),
    };
  }

  function handleMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    setDragging(true);
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!dragging) return;
    const pos = posFromEvent(e.clientX, e.clientY);
    if (pos) onChange(pos.x, pos.y, width, rotation);
  }

  function handleMouseUp() {
    setDragging(false);
  }

  function handleClick(e: React.MouseEvent) {
    if (dragging) return;
    const pos = posFromEvent(e.clientX, e.clientY);
    if (pos) onChange(pos.x, pos.y, width, rotation);
  }

  function handleTouchStart(e: React.TouchEvent) {
    setDragging(true);
    const t = e.touches[0];
    const pos = t && posFromEvent(t.clientX, t.clientY);
    if (pos) onChange(pos.x, pos.y, width, rotation);
  }

  function handleTouchMove(e: React.TouchEvent) {
    e.preventDefault();
    const t = e.touches[0];
    const pos = t && posFromEvent(t.clientX, t.clientY);
    if (pos) onChange(pos.x, pos.y, width, rotation);
  }

  function handleTouchEnd() {
    setDragging(false);
  }

  return (
    <div>
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative w-full overflow-hidden select-none"
        style={{ aspectRatio: "1/1", backgroundColor: "var(--img-bg)", border: "1px solid var(--border)", cursor: "crosshair", touchAction: "none" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={baseImage} alt="" className="absolute inset-0 w-full h-full object-contain pointer-events-none" draggable={false} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={overlayImage}
          alt=""
          draggable={false}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          className="absolute pointer-events-auto"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            width: `${width}%`,
            transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
            cursor: dragging ? "grabbing" : "grab",
          }}
        />
      </div>
      <p className="text-xs font-sans mt-1" style={{ color: "var(--muted)" }}>
        คลิกหรือลากรูป gem เพื่อวางตำแหน่งบนแหวน หรือใส่พิกัดพิกเซลด้านล่างเพื่อความแม่นยำ
      </p>

      <div className="flex gap-3 mt-2">
        <div className="flex-1">
          <label className="text-xs font-sans block mb-1" style={{ color: "var(--muted)" }}>X (px)</label>
          <input
            type="number"
            value={Math.round((x / 100) * containerSize)}
            onChange={(e) => onChange(pxToPct(Number(e.target.value) || 0), y, width, rotation)}
            className="w-full px-2 py-1.5 text-xs font-sans outline-none"
            style={{ border: "1px solid var(--border)", color: "var(--charcoal)" }}
          />
        </div>
        <div className="flex-1">
          <label className="text-xs font-sans block mb-1" style={{ color: "var(--muted)" }}>Y (px)</label>
          <input
            type="number"
            value={Math.round((y / 100) * containerSize)}
            onChange={(e) => onChange(x, pxToPct(Number(e.target.value) || 0), width, rotation)}
            className="w-full px-2 py-1.5 text-xs font-sans outline-none"
            style={{ border: "1px solid var(--border)", color: "var(--charcoal)" }}
          />
        </div>
      </div>
      <p className="text-xs font-mono mt-1" style={{ color: "var(--muted)", fontSize: "10px" }}>
        กรอบตัวอย่างขนาด {Math.round(containerSize)}×{Math.round(containerSize)}px
      </p>

      <label className="text-xs font-sans block mt-3 mb-1" style={{ color: "var(--muted)" }}>
        ขนาด ({width.toFixed(0)}%)
      </label>
      <input
        type="range"
        min={3}
        max={60}
        value={width}
        onChange={(e) => onChange(x, y, Number(e.target.value), rotation)}
        className="w-full"
      />

      <div className="flex items-center justify-between mt-3 mb-1">
        <label className="text-xs font-sans" style={{ color: "var(--muted)" }}>
          หมุน ({Math.round(rotation)}°)
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange(x, y, width, ((rotation - 15) % 360 + 360) % 360)}
            className="w-6 h-6 text-xs flex items-center justify-center"
            style={{ border: "1px solid var(--border)", color: "var(--charcoal)" }}
            title="หมุนซ้าย 15°"
          >
            ↺
          </button>
          <button
            type="button"
            onClick={() => onChange(x, y, width, 0)}
            className="text-xs tracking-wider uppercase underline font-sans"
            style={{ color: "var(--gold-dark)" }}
          >
            รีเซ็ต
          </button>
          <button
            type="button"
            onClick={() => onChange(x, y, width, (rotation + 15) % 360)}
            className="w-6 h-6 text-xs flex items-center justify-center"
            style={{ border: "1px solid var(--border)", color: "var(--charcoal)" }}
            title="หมุนขวา 15°"
          >
            ↻
          </button>
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={359}
        value={rotation}
        onChange={(e) => onChange(x, y, width, Number(e.target.value))}
        className="w-full"
      />
    </div>
  );
}
