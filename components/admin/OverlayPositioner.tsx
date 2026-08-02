"use client";

import { useRef, useState } from "react";

export default function OverlayPositioner({
  baseImage,
  overlayImage,
  x,
  y,
  width,
  onChange,
}: {
  baseImage: string;
  overlayImage: string;
  x: number;
  y: number;
  width: number;
  onChange: (x: number, y: number, width: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  function clamp(n: number) {
    return Math.max(0, Math.min(100, n));
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
    if (pos) onChange(pos.x, pos.y, width);
  }

  function handleMouseUp() {
    setDragging(false);
  }

  function handleClick(e: React.MouseEvent) {
    if (dragging) return;
    const pos = posFromEvent(e.clientX, e.clientY);
    if (pos) onChange(pos.x, pos.y, width);
  }

  function handleTouchStart(e: React.TouchEvent) {
    setDragging(true);
    const t = e.touches[0];
    const pos = t && posFromEvent(t.clientX, t.clientY);
    if (pos) onChange(pos.x, pos.y, width);
  }

  function handleTouchMove(e: React.TouchEvent) {
    e.preventDefault();
    const t = e.touches[0];
    const pos = t && posFromEvent(t.clientX, t.clientY);
    if (pos) onChange(pos.x, pos.y, width);
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
            transform: "translate(-50%, -50%)",
            cursor: dragging ? "grabbing" : "grab",
          }}
        />
      </div>
      <p className="text-xs font-sans mt-1" style={{ color: "var(--muted)" }}>
        คลิกหรือลากรูป gem เพื่อวางตำแหน่งบนแหวน
      </p>
      <label className="text-xs font-sans block mt-3 mb-1" style={{ color: "var(--muted)" }}>
        ขนาด ({width.toFixed(0)}%)
      </label>
      <input
        type="range"
        min={3}
        max={60}
        value={width}
        onChange={(e) => onChange(x, y, Number(e.target.value))}
        className="w-full"
      />
    </div>
  );
}
