"use client";

import { useRef, useState } from "react";
import type { ReviewType } from "@/lib/reviews";

const CATEGORIES = ["Rings", "Necklaces", "Earrings", "Bracelets", "Pendants"];
const MIN_TEXT_LENGTH = 90;

const PLACEHOLDER: Record<ReviewType, string> = {
  preorder:
    "เช่น เลือก Supatida เพราะดีไซน์ไม่เหมือนใคร ปรึกษาง่าย ราคาคุ้มค่า ทีมงานให้คำแนะนำดีมาก มั่นใจในคุณภาพเพชร Lab Grown...",
  product:
    "เช่น สินค้าคุณภาพดีมาก ประกายสวย ตรงตามที่สั่ง แพ็คของดี จัดส่งไว บริการหลังการขายประทับใจ...",
};

async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const MAX = 1800;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
        else { width = Math.round((width * MAX) / height); height = MAX; }
      }
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        (blob) => resolve(new File([blob!], file.name, { type: "image/jpeg" })),
        "image/jpeg",
        0.85
      );
    };
    img.src = url;
  });
}

export default function ReviewFormModal({
  onClose,
  onSubmitted,
}: {
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [type, setType] = useState<ReviewType>("preorder");
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState("");
  const [category, setCategory] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const trimmedLen = text.trim().length;
  const textOk = trimmedLen >= MIN_TEXT_LENGTH;
  const nameOk = name.trim().length > 0;
  const ratingOk = rating >= 1 && rating <= 5;
  const imageOk = type === "preorder" || !!imageUrl;
  const categoryOk = type === "preorder" || !!category;
  const canSubmit = nameOk && ratingOk && textOk && imageOk && categoryOk && !submitting;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append("file", compressed);
      const res = await fetch("/api/upload-review", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setImageUrl(data.url);
      } else {
        setError("อัพโหลดรูปไม่สำเร็จ ลองใหม่อีกครั้ง");
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          name: name.trim(),
          rating,
          text: text.trim(),
          imageUrl: type === "product" ? imageUrl : undefined,
          category: type === "product" ? category : undefined,
        }),
      });
      if (res.ok) {
        setDone(true);
        setTimeout(onSubmitted, 1800);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "ส่งรีวิวไม่สำเร็จ ลองใหม่อีกครั้ง");
      }
    } catch {
      setError("ส่งรีวิวไม่สำเร็จ ลองใหม่อีกครั้ง");
    } finally {
      setSubmitting(false);
    }
  }

  function switchType(next: ReviewType) {
    setType(next);
    setError("");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ border: "1px solid var(--border)" }}>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center text-sm"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", color: "white" }}
        >
          ✕
        </button>

        {done ? (
          <div className="p-10 text-center">
            <p className="text-lg mb-2" style={{ color: "var(--charcoal)" }}>ขอบคุณสำหรับรีวิว!</p>
            <p className="text-sm font-sans" style={{ color: "var(--muted)" }}>
              ส่งรีวิวสำเร็จ รอการตรวจสอบก่อนขึ้นหน้าเว็บ
            </p>
          </div>
        ) : (
          <div className="p-6">
            <h3 className="text-xl tracking-wider mb-4" style={{ color: "var(--charcoal)" }}>เขียนรีวิว</h3>

            {/* Type tabs */}
            <div className="flex mb-5" style={{ border: "1px solid var(--border)" }}>
              {(["preorder", "product"] as ReviewType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => switchType(t)}
                  className="flex-1 py-2.5 text-xs tracking-wide font-sans transition-colors"
                  style={{
                    backgroundColor: type === t ? "var(--charcoal)" : "white",
                    color: type === t ? "var(--gold-light)" : "var(--muted)",
                  }}
                >
                  {t === "preorder" ? "ก่อนสั่งทำ" : "หลังซื้อสินค้า"}
                </button>
              ))}
            </div>

            {/* Name */}
            <label className="text-xs font-sans block mb-1" style={{ color: "var(--muted)" }}>ชื่อของคุณ</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ชื่อ-นามสกุล หรือชื่อเล่น"
              maxLength={60}
              className="w-full px-3 py-2 text-sm font-sans outline-none mb-4"
              style={{ border: "1px solid var(--border)", color: "var(--charcoal)" }}
            />

            {/* Rating */}
            <label className="text-xs font-sans block mb-1" style={{ color: "var(--muted)" }}>ให้คะแนน</label>
            <div className="mb-4 text-2xl" onMouseLeave={() => setHoverRating(0)}>
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i)}
                  onMouseEnter={() => setHoverRating(i)}
                  style={{ color: i <= (hoverRating || rating) ? "var(--gold)" : "var(--border)" }}
                  className="mr-1"
                >
                  ★
                </button>
              ))}
            </div>

            {/* Product-only fields */}
            {type === "product" && (
              <>
                <label className="text-xs font-sans block mb-1" style={{ color: "var(--muted)" }}>ประเภทสินค้า</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-sans outline-none mb-4"
                  style={{ border: "1px solid var(--border)", color: "var(--charcoal)", backgroundColor: "white" }}
                >
                  <option value="">— เลือกประเภทสินค้า —</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>

                <label className="text-xs font-sans block mb-1" style={{ color: "var(--muted)" }}>รูปสินค้า (บังคับ)</label>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                {imageUrl ? (
                  <div className="relative mb-4" style={{ width: 120, height: 120 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageUrl} alt="" className="w-full h-full object-cover" style={{ border: "1px solid var(--border)" }} />
                    <button
                      onClick={() => setImageUrl("")}
                      className="absolute -top-2 -right-2 w-6 h-6 text-xs flex items-center justify-center rounded-full"
                      style={{ backgroundColor: "#C0392B", color: "white" }}
                    >✕</button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full py-6 text-xs font-sans tracking-wide border-2 border-dashed mb-4 disabled:opacity-50"
                    style={{ borderColor: "var(--border)", color: "var(--muted)", backgroundColor: "#FAF8F4" }}
                  >
                    {uploading ? "กำลังอัพโหลด…" : "+ คลิกเพื่ออัพโหลดรูปสินค้า"}
                  </button>
                )}
              </>
            )}

            {/* Text */}
            <label className="text-xs font-sans block mb-1" style={{ color: "var(--muted)" }}>
              รีวิวของคุณ
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={PLACEHOLDER[type]}
              rows={4}
              className="w-full px-3 py-2 text-sm font-sans outline-none resize-none"
              style={{ border: "1px solid var(--border)", color: "var(--charcoal)" }}
            />
            <p className="text-xs font-sans mt-1 mb-4" style={{ color: textOk ? "#2E7D32" : "var(--muted)" }}>
              {trimmedLen} / {MIN_TEXT_LENGTH} ตัวอักษร{textOk ? " ✓" : ""}
            </p>

            {error && (
              <p className="text-xs font-sans mb-4" style={{ color: "#C0392B" }}>{error}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full py-3 text-xs tracking-widest uppercase font-sans transition-opacity hover:opacity-80 disabled:opacity-40"
              style={{ backgroundColor: "var(--charcoal)", color: "var(--gold-light)" }}
            >
              {submitting ? "กำลังส่ง…" : "ส่งรีวิว"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
