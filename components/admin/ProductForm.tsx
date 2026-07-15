"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Product } from "@/lib/db";

const CATEGORIES = ["Rings", "Necklaces", "Earrings", "Bracelets", "Pendants"];
const MAX_SLOTS = 5;

interface Props {
  product?: Product;
}

function SpecsEditor({
  value,
  onChange,
}: {
  value: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
}) {
  const entries = Object.entries(value);

  function addRow() {
    onChange({ ...value, "": "" });
  }
  function updateKey(oldKey: string, newKey: string) {
    const updated: Record<string, string> = {};
    for (const [k, v] of Object.entries(value)) {
      updated[k === oldKey ? newKey : k] = v;
    }
    onChange(updated);
  }
  function updateVal(key: string, val: string) {
    onChange({ ...value, [key]: val });
  }
  function removeRow(key: string) {
    const updated = { ...value };
    delete updated[key];
    onChange(updated);
  }

  return (
    <div className="space-y-2">
      {entries.map(([key, val], i) => (
        <div key={i} className="flex gap-2">
          <input
            className="flex-1 px-3 py-2 text-xs font-sans outline-none"
            style={{ border: "1px solid var(--border)", color: "var(--charcoal)" }}
            placeholder="e.g. Carat Weight"
            value={key}
            onChange={(e) => updateKey(key, e.target.value)}
          />
          <input
            className="flex-1 px-3 py-2 text-xs font-sans outline-none"
            style={{ border: "1px solid var(--border)", color: "var(--charcoal)" }}
            placeholder="e.g. 1.5 ct"
            value={val}
            onChange={(e) => updateVal(key, e.target.value)}
          />
          <button
            type="button"
            onClick={() => removeRow(key)}
            className="px-3 text-xs"
            style={{ color: "#C0392B" }}
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="text-xs tracking-wider uppercase underline font-sans"
        style={{ color: "var(--gold-dark)" }}
      >
        + Add Specification
      </button>
    </div>
  );
}

function ImageSlot({
  slot,
  src,
  productId,
  onUploaded,
  onRemoved,
}: {
  slot: number;
  src: string;
  productId: number;
  onUploaded: (slot: number, url: string) => void;
  onRemoved: (slot: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("productId", String(productId));
      formData.append("slot", String(slot));

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      onUploaded(slot, data.url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    await fetch("/api/upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, slot }),
    });
    onRemoved(slot);
  }

  return (
    <div
      className="relative aspect-square flex items-center justify-center overflow-hidden"
      style={{ border: "1px dashed var(--border)", backgroundColor: "#FAF8F4" }}
    >
      {src ? (
        <>
          <Image
            src={src}
            alt={`Slot ${slot + 1}`}
            fill
            className="object-cover"
            sizes="160px"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-1 right-1 w-6 h-6 text-xs flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.65)", color: "white" }}
          >
            ✕
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex flex-col items-center gap-2 w-full h-full justify-center text-xs font-sans disabled:opacity-50 transition-opacity hover:opacity-70"
          style={{ color: "var(--muted)" }}
        >
          {uploading ? (
            <span>Uploading…</span>
          ) : (
            <>
              <span className="text-xl" style={{ color: "var(--gold)" }}>+</span>
              <span className="text-xs">Slot {slot + 1}</span>
            </>
          )}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      {error && (
        <p className="absolute bottom-1 left-1 right-1 text-center text-xs" style={{ color: "#C0392B" }}>
          {error}
        </p>
      )}
    </div>
  );
}

export default function ProductForm({ product }: Props) {
  const router = useRouter();
  const isEdit = Boolean(product);

  const [name, setName] = useState(product?.name || "");
  const [price, setPrice] = useState(product?.price?.toString() || "");
  const [category, setCategory] = useState(product?.category || CATEGORIES[0]);
  const [description, setDescription] = useState(product?.description || "");
  const [specifications, setSpecifications] = useState<Record<string, string>>(
    product?.specifications || {}
  );
  const [images, setImages] = useState<string[]>(product?.images || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      name: name.trim(),
      price: parseFloat(price),
      category,
      description: description.trim(),
      specifications,
      images,
    };

    try {
      let res: Response;
      if (isEdit && product) {
        res = await fetch(`/api/products/${product.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Save failed");
      }

      router.push("/admin");
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const fieldClass = "w-full px-4 py-2.5 text-sm font-sans outline-none transition-all";
  const fieldStyle = { border: "1px solid var(--border)", color: "var(--charcoal)", backgroundColor: "white" };
  const labelClass = "block text-xs tracking-widest uppercase mb-1.5 font-sans";
  const labelStyle = { color: "var(--muted)" };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl">
      <div className="grid grid-cols-1 gap-6">
        {/* Name */}
        <div>
          <label className={labelClass} style={labelStyle}>Product Name *</label>
          <input
            className={fieldClass}
            style={fieldStyle}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Radiant Cut Solitaire Ring"
            required
          />
        </div>

        {/* Price + Category */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass} style={labelStyle}>Price (THB) *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className={fieldClass}
              style={fieldStyle}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g. 3500"
              required
            />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Category *</label>
            <select
              className={fieldClass}
              style={fieldStyle}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className={labelClass} style={labelStyle}>Description</label>
          <textarea
            className={fieldClass}
            style={{ ...fieldStyle, resize: "vertical", minHeight: "100px" }}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe this piece…"
            rows={4}
          />
        </div>

        {/* Specs */}
        <div>
          <label className={labelClass} style={labelStyle}>Specifications</label>
          <SpecsEditor value={specifications} onChange={setSpecifications} />
        </div>

        {/* Images — only show slots when editing (product must exist first) */}
        {isEdit && product && (
          <div>
            <label className={labelClass} style={labelStyle}>
              Images ({images.filter(Boolean).length}/{MAX_SLOTS} slots)
            </label>
            <div className="grid grid-cols-5 gap-3">
              {Array.from({ length: MAX_SLOTS }).map((_, i) => (
                <ImageSlot
                  key={i}
                  slot={i}
                  src={images[i] || ""}
                  productId={product.id}
                  onUploaded={(slot, url) => {
                    const next = [...images];
                    while (next.length <= slot) next.push("");
                    next[slot] = url;
                    setImages(next);
                  }}
                  onRemoved={(slot) => {
                    const next = [...images];
                    next[slot] = "";
                    setImages(next);
                  }}
                />
              ))}
            </div>
            <p className="text-xs mt-2 font-sans" style={{ color: "var(--muted)" }}>
              JPEG, PNG, WebP or AVIF · Max 8 MB per image
            </p>
          </div>
        )}

        {!isEdit && (
          <p className="text-xs font-sans" style={{ color: "var(--muted)" }}>
            You can upload images after saving the product.
          </p>
        )}

        {error && (
          <p className="text-sm font-sans" style={{ color: "#C0392B" }}>
            {error}
          </p>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 text-xs tracking-widest uppercase font-sans transition-opacity disabled:opacity-60"
            style={{ backgroundColor: "var(--charcoal)", color: "var(--gold-light)" }}
          >
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Product"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-8 py-3 text-xs tracking-widest uppercase font-sans transition-opacity hover:opacity-70"
            style={{ border: "1px solid var(--border)", color: "var(--muted)" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
