"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  ringImageUrl: string;
  productName: string;
  onClose: () => void;
}

export default function TryOnModal({ ringImageUrl, productName, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [handImg, setHandImg] = useState<HTMLImageElement | null>(null);
  const [ringImg, setRingImg] = useState<HTMLImageElement | null>(null);
  const [size, setSize] = useState(20);
  const [posX, setPosX] = useState(50);
  const [posY, setPosY] = useState(55);
  const [blend, setBlend] = useState<GlobalCompositeOperation>("multiply");

  useEffect(() => {
    if (!ringImageUrl) return;
    const img = new window.Image();
    img.onload = () => setRingImg(img);
    img.src = `/api/proxy-image?url=${encodeURIComponent(ringImageUrl)}`;
  }, [ringImageUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    if (!handImg) {
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#666";
      ctx.font = "14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("อัพโหลดรูปมือเพื่อลองสวม", W / 2, H / 2);
      return;
    }

    const r = Math.min(W / handImg.width, H / handImg.height);
    const hW = handImg.width * r, hH = handImg.height * r;
    ctx.drawImage(handImg, (W - hW) / 2, (H - hH) / 2, hW, hH);

    if (ringImg) {
      const rSize = (size / 100) * Math.min(W, H);
      const rX = (posX / 100) * W - rSize / 2;
      const rY = (posY / 100) * H - rSize / 2;
      ctx.save();
      ctx.globalCompositeOperation = blend;
      ctx.drawImage(ringImg, rX, rY, rSize, rSize);
      ctx.restore();
    }
  }, [handImg, ringImg, size, posX, posY, blend]);

  function handleHandUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => setHandImg(img);
    img.src = url;
  }

  const inputRef = useRef<HTMLInputElement>(null);

  const BLENDS: { label: string; value: GlobalCompositeOperation }[] = [
    { label: "multiply", value: "multiply" },
    { label: "screen", value: "screen" },
    { label: "overlay", value: "overlay" },
    { label: "normal", value: "source-over" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg bg-white rounded-none overflow-hidden"
        style={{ maxHeight: "90vh", display: "flex", flexDirection: "column" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div>
            <p className="text-xs tracking-widest uppercase font-sans" style={{ color: "var(--gold)" }}>Virtual Try-On</p>
            <p className="text-sm font-sans" style={{ color: "var(--charcoal)" }}>{productName}</p>
          </div>
          <button onClick={onClose} className="text-xl" style={{ color: "var(--muted)" }}>✕</button>
        </div>

        {/* Canvas */}
        <div style={{ backgroundColor: "#111", flexShrink: 0 }}>
          <canvas ref={canvasRef} width={480} height={360} style={{ display: "block", width: "100%" }} />
        </div>

        {/* Controls */}
        <div className="overflow-y-auto" style={{ flexShrink: 0 }}>
          {/* Upload */}
          <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleHandUpload} />
            <button
              onClick={() => inputRef.current?.click()}
              className="w-full py-2.5 text-xs tracking-widest uppercase font-sans transition-opacity hover:opacity-80"
              style={{ border: "1px solid var(--charcoal)", color: "var(--charcoal)" }}
            >
              {handImg ? "เปลี่ยนรูปมือ" : "📷 อัพโหลดรูปมือ"}
            </button>
          </div>

          {/* Sliders */}
          <div className="px-5 py-3 space-y-3" style={{ borderBottom: "1px solid var(--border)" }}>
            {[
              { label: "ขนาดแหวน", val: size, set: setSize, min: 5, max: 50 },
              { label: "ซ้าย / ขวา", val: posX, set: setPosX, min: 0, max: 100 },
              { label: "บน / ล่าง", val: posY, set: setPosY, min: 0, max: 100 },
            ].map(({ label, val, set, min, max }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-xs font-sans w-24 flex-shrink-0" style={{ color: "var(--muted)" }}>{label}</span>
                <input
                  type="range" min={min} max={max} value={val} step={1}
                  className="flex-1"
                  onChange={(e) => set(Number(e.target.value))}
                />
                <span className="text-xs font-mono w-8 text-right" style={{ color: "var(--charcoal)" }}>{val}</span>
              </div>
            ))}
          </div>

          {/* Blend */}
          <div className="px-5 py-3 flex gap-2 flex-wrap">
            <span className="text-xs font-sans self-center" style={{ color: "var(--muted)" }}>blend:</span>
            {BLENDS.map((b) => (
              <button
                key={b.value}
                onClick={() => setBlend(b.value)}
                className="px-3 py-1 text-xs font-sans rounded-full transition-all"
                style={{
                  border: "1px solid",
                  borderColor: blend === b.value ? "var(--charcoal)" : "var(--border)",
                  backgroundColor: blend === b.value ? "var(--charcoal)" : "white",
                  color: blend === b.value ? "white" : "var(--muted)",
                }}
              >
                {b.label}
              </button>
            ))}
          </div>

          <p className="px-5 pb-4 text-xs font-sans" style={{ color: "var(--muted)" }}>
            * ภาพนี้เป็นการจำลองเบื้องต้น ขนาดและสีอาจแตกต่างจากของจริง
          </p>
        </div>
      </div>
    </div>
  );
}
