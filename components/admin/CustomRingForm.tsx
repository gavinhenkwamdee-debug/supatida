"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import OverlayPositioner from "./OverlayPositioner";
import type { CustomRingDetail } from "@/lib/customRings";

interface ChoiceState {
  key: string;
  label: string;
  swatchImage: string;
  overlayImage: string | null;
  overlayX: number;
  overlayY: number;
  overlayWidth: number;
  priceDelta: number;
}

interface GroupState {
  key: string;
  label: string;
  choices: ChoiceState[];
}

let uid = 0;
function nextKey() {
  uid += 1;
  return `k${Date.now()}${uid}`;
}

function emptyChoice(): ChoiceState {
  return { key: nextKey(), label: "", swatchImage: "", overlayImage: null, overlayX: 50, overlayY: 50, overlayWidth: 20, priceDelta: 0 };
}

function emptyGroup(): GroupState {
  return { key: nextKey(), label: "", choices: [emptyChoice()] };
}

async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const MAX = 1200;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
        else { width = Math.round((width * MAX) / height); height = MAX; }
      }
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      const isPng = file.type === "image/png";
      canvas.toBlob(
        (blob) => resolve(new File([blob!], file.name, { type: isPng ? "image/png" : "image/jpeg" })),
        isPng ? "image/png" : "image/jpeg",
        0.9
      );
    };
    img.src = url;
  });
}

async function uploadImage(file: File): Promise<string> {
  const compressed = await compressImage(file);
  const formData = new FormData();
  formData.append("file", compressed);
  const res = await fetch("/api/upload-custom-ring", { method: "POST", body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Upload failed");
  return data.url;
}

function ImageUploadBox({
  src,
  label,
  onUploaded,
  size = 90,
}: {
  src: string;
  label: string;
  onUploaded: (url: string) => void;
  size?: number;
}) {
  const [uploading, setUploading] = useState(false);
  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      onUploaded(url);
    } catch {
      alert("อัพโหลดรูปไม่สำเร็จ");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }
  return (
    <label
      className="relative flex flex-col items-center justify-center flex-shrink-0 cursor-pointer overflow-hidden"
      style={{ width: size, height: size, border: "1px dashed var(--border)", backgroundColor: "#FAF8F4" }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="w-full h-full object-contain" />
      ) : (
        <span className="text-xs font-sans text-center px-1" style={{ color: "var(--muted)" }}>
          {uploading ? "…" : label}
        </span>
      )}
      <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={handleChange} disabled={uploading} />
    </label>
  );
}

function ChoiceEditor({
  choice,
  baseImage,
  onChange,
  onRemove,
}: {
  choice: ChoiceState;
  baseImage: string;
  onChange: (c: ChoiceState) => void;
  onRemove: () => void;
}) {
  const [positioning, setPositioning] = useState(false);

  return (
    <div className="p-3" style={{ border: "1px solid var(--border)", backgroundColor: "white" }}>
      <div className="flex gap-3 items-start">
        <ImageUploadBox src={choice.swatchImage} label="+ Swatch" size={64} onUploaded={(url) => onChange({ ...choice, swatchImage: url })} />
        <ImageUploadBox src={choice.overlayImage || ""} label="+ Gem overlay" size={64} onUploaded={(url) => onChange({ ...choice, overlayImage: url })} />

        <div className="flex-1 min-w-0 space-y-2">
          <input
            value={choice.label}
            onChange={(e) => onChange({ ...choice, label: e.target.value })}
            placeholder="ชื่อตัวเลือก เช่น Garnet (January)"
            className="w-full px-2 py-1.5 text-xs font-sans outline-none"
            style={{ border: "1px solid var(--border)", color: "var(--charcoal)" }}
          />
          <div className="flex items-center gap-2">
            <span className="text-xs font-sans" style={{ color: "var(--muted)" }}>ราคาเพิ่ม/ลด ฿</span>
            <input
              type="number"
              value={choice.priceDelta}
              onChange={(e) => onChange({ ...choice, priceDelta: Number(e.target.value) || 0 })}
              className="w-24 px-2 py-1 text-xs font-sans outline-none"
              style={{ border: "1px solid var(--border)", color: "var(--charcoal)" }}
            />
          </div>
          <div className="flex gap-3">
            {choice.overlayImage && baseImage && (
              <button type="button" onClick={() => setPositioning((p) => !p)} className="text-xs tracking-wider uppercase underline font-sans" style={{ color: "var(--gold-dark)" }}>
                {positioning ? "ปิดตำแหน่ง" : "จัดตำแหน่ง"}
              </button>
            )}
            <button type="button" onClick={onRemove} className="text-xs tracking-wider uppercase underline font-sans" style={{ color: "#C0392B" }}>
              ลบตัวเลือก
            </button>
          </div>
        </div>
      </div>

      {positioning && choice.overlayImage && baseImage && (
        <div className="mt-3 max-w-xs">
          <OverlayPositioner
            baseImage={baseImage}
            overlayImage={choice.overlayImage}
            x={choice.overlayX}
            y={choice.overlayY}
            width={choice.overlayWidth}
            onChange={(x, y, width) => onChange({ ...choice, overlayX: x, overlayY: y, overlayWidth: width })}
          />
        </div>
      )}
    </div>
  );
}

function GroupEditor({
  group,
  baseImage,
  onChange,
  onRemove,
  onMove,
}: {
  group: GroupState;
  baseImage: string;
  onChange: (g: GroupState) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  return (
    <div className="p-4 mb-4" style={{ border: "1px solid var(--border)", backgroundColor: "#FAF8F4" }}>
      <div className="flex items-center gap-2 mb-3">
        <input
          value={group.label}
          onChange={(e) => onChange({ ...group, label: e.target.value })}
          placeholder="ชื่อหมวด เช่น Front Stone Type"
          className="flex-1 px-3 py-2 text-sm font-sans outline-none"
          style={{ border: "1px solid var(--border)", color: "var(--charcoal)", backgroundColor: "white" }}
        />
        <button type="button" onClick={() => onMove(-1)} className="w-7 h-7 text-xs" style={{ border: "1px solid var(--border)", color: "var(--charcoal)", backgroundColor: "white" }}>↑</button>
        <button type="button" onClick={() => onMove(1)} className="w-7 h-7 text-xs" style={{ border: "1px solid var(--border)", color: "var(--charcoal)", backgroundColor: "white" }}>↓</button>
        <button type="button" onClick={onRemove} className="px-3 py-2 text-xs tracking-wider uppercase font-sans" style={{ border: "1px solid #C0392B", color: "#C0392B", backgroundColor: "white" }}>
          ลบหมวด
        </button>
      </div>

      <div className="space-y-2">
        {group.choices.map((choice) => (
          <ChoiceEditor
            key={choice.key}
            choice={choice}
            baseImage={baseImage}
            onChange={(c) => onChange({ ...group, choices: group.choices.map((x) => (x.key === c.key ? c : x)) })}
            onRemove={() => onChange({ ...group, choices: group.choices.filter((x) => x.key !== choice.key) })}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => onChange({ ...group, choices: [...group.choices, emptyChoice()] })}
        className="mt-3 text-xs tracking-wider uppercase underline font-sans"
        style={{ color: "var(--gold-dark)" }}
      >
        + Add Option
      </button>
    </div>
  );
}

export default function CustomRingForm({ ring }: { ring?: CustomRingDetail }) {
  const router = useRouter();
  const isEdit = Boolean(ring);

  const [name, setName] = useState(ring?.name || "");
  const [description, setDescription] = useState(ring?.description || "");
  const [basePrice, setBasePrice] = useState(ring?.basePrice?.toString() || "");
  const [baseImage, setBaseImage] = useState(ring?.baseImage || "");
  const [enabled, setEnabled] = useState(ring?.enabled ?? true);
  const [groups, setGroups] = useState<GroupState[]>(
    ring?.groups.length
      ? ring.groups.map((g) => ({
          key: nextKey(),
          label: g.label,
          choices: g.choices.map((c) => ({
            key: nextKey(),
            label: c.label,
            swatchImage: c.swatchImage,
            overlayImage: c.overlayImage,
            overlayX: c.overlayX,
            overlayY: c.overlayY,
            overlayWidth: c.overlayWidth,
            priceDelta: c.priceDelta,
          })),
        }))
      : [emptyGroup()]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function moveGroup(index: number, dir: -1 | 1) {
    const next = [...groups];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    setGroups(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      name: name.trim() || "Untitled Ring",
      description: description.trim(),
      basePrice: parseFloat(basePrice) || 0,
      baseImage,
      enabled,
      groups: groups
        .filter((g) => g.label.trim())
        .map((g) => ({
          label: g.label.trim(),
          choices: g.choices
            .filter((c) => c.label.trim())
            .map((c) => ({
              label: c.label.trim(),
              swatchImage: c.swatchImage,
              overlayImage: c.overlayImage,
              overlayX: c.overlayX,
              overlayY: c.overlayY,
              overlayWidth: c.overlayWidth,
              priceDelta: c.priceDelta,
            })),
        })),
    };

    try {
      let id = ring?.id;
      if (!id) {
        const res = await fetch("/api/admin/custom-rings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: payload.name, basePrice: payload.basePrice }),
        });
        const created = await res.json();
        if (!res.ok) throw new Error(created.error || "Create failed");
        id = created.id;
      }

      const res = await fetch(`/api/admin/custom-rings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Save failed");
      }

      router.push("/admin/custom-rings");
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const fieldClass = "w-full px-4 py-2.5 text-sm font-sans outline-none";
  const fieldStyle = { border: "1px solid var(--border)", color: "var(--charcoal)", backgroundColor: "white" };
  const labelClass = "block text-xs tracking-widest uppercase mb-1.5 font-sans";
  const labelStyle = { color: "var(--muted)" };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl">
      <div className="grid grid-cols-1 gap-6 mb-8">
        <div>
          <label className={labelClass} style={labelStyle}>Ring Name</label>
          <input className={fieldClass} style={fieldStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Curve Band 03" />
        </div>

        <div>
          <label className={labelClass} style={labelStyle}>Description</label>
          <textarea className={fieldClass} style={{ ...fieldStyle, resize: "vertical", minHeight: "80px" }} value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass} style={labelStyle}>Base Price (THB)</label>
            <input type="number" min="0" step="0.01" className={fieldClass} style={fieldStyle} value={basePrice} onChange={(e) => setBasePrice(e.target.value)} />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => setEnabled((v) => !v)}
              className="relative w-14 h-7 rounded-full transition-colors duration-200 mb-1"
              style={{ backgroundColor: enabled ? "var(--gold)" : "#D1D5DB" }}
            >
              <span className="absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200" style={{ left: enabled ? "30px" : "4px" }} />
            </button>
            <span className="ml-3 text-xs font-sans mb-1.5" style={{ color: "var(--muted)" }}>{enabled ? "เปิดให้ลูกค้าดู" : "ปิดไว้ก่อน"}</span>
          </div>
        </div>

        <div>
          <label className={labelClass} style={labelStyle}>Base Ring Image (ไม่มี gem)</label>
          <ImageUploadBox src={baseImage} label="+ Upload" size={160} onUploaded={setBaseImage} />
        </div>
      </div>

      <h3 className="text-sm tracking-widest uppercase mb-4 font-sans" style={{ color: "var(--charcoal)" }}>ตัวเลือก (Groups)</h3>
      {groups.map((g, i) => (
        <GroupEditor
          key={g.key}
          group={g}
          baseImage={baseImage}
          onChange={(ng) => setGroups(groups.map((x) => (x.key === g.key ? ng : x)))}
          onRemove={() => setGroups(groups.filter((x) => x.key !== g.key))}
          onMove={(dir) => moveGroup(i, dir)}
        />
      ))}
      <button
        type="button"
        onClick={() => setGroups([...groups, emptyGroup()])}
        className="text-xs tracking-wider uppercase underline font-sans mb-8"
        style={{ color: "var(--gold-dark)" }}
      >
        + Add Group
      </button>

      {error && <p className="text-sm font-sans mb-4" style={{ color: "#C0392B" }}>{error}</p>}

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={saving}
          className="px-8 py-3 text-xs tracking-widest uppercase font-sans transition-opacity disabled:opacity-60"
          style={{ backgroundColor: "var(--charcoal)", color: "var(--gold-light)" }}
        >
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Ring"}
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
    </form>
  );
}
