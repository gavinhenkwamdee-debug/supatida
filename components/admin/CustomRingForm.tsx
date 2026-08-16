"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import OverlayPositioner from "./OverlayPositioner";
import { DIAMOND_SHAPES } from "@/lib/ringShapes";
import type { CustomRingDetail, GroupKind, GroupWithRing, StoneKind } from "@/lib/customRings";

const GROUP_KIND_OPTIONS: { value: GroupKind; label: string }[] = [
  { value: "generic", label: "ทั่วไป" },
  { value: "main_power", label: "พลังงานหลัก (Main Power)" },
  { value: "secondary_power", label: "พลังงานรอง (Secondary Power)" },
  { value: "tertiary_power", label: "พลังงานที่สาม (Tertiary Power)" },
];

const DIAMOND_SHAPE_LABELS: Record<string, string> = {
  pear: "ทรงหยดน้ำ (Pear)",
  emerald: "ทรงมรกต (Emerald)",
  baguette: "ทรงแบเกตต์ (Baguette)",
  heart: "ทรงหัวใจ (Heart)",
  oval: "ทรงไข่ (Oval)",
  round: "ทรงกลม (Round)",
  princess: "ทรงเหลี่ยม (Princess)",
  marquise: "ทรงมาร์คีส์ (Marquise)",
};

interface ChoiceState {
  key: string;
  label: string;
  swatchImage: string;
  overlayImage: string | null;
  overlayX: number;
  overlayY: number;
  overlayWidth: number;
  baseImageOverride: string | null;
  priceDelta: number;
  stoneKind: StoneKind | null;
  shape: string | null;
}

interface GroupState {
  key: string;
  label: string;
  kind: GroupKind;
  choices: ChoiceState[];
}

let uid = 0;
function nextKey() {
  uid += 1;
  return `k${Date.now()}${uid}`;
}

function emptyChoice(): ChoiceState {
  return {
    key: nextKey(),
    label: "",
    swatchImage: "",
    overlayImage: null,
    overlayX: 50,
    overlayY: 50,
    overlayWidth: 20,
    baseImageOverride: null,
    priceDelta: 0,
    stoneKind: null,
    shape: null,
  };
}

function emptyGroup(): GroupState {
  return { key: nextKey(), label: "", kind: "generic", choices: [emptyChoice()] };
}

// Positioner's preview box is a fixed max-w-xs (320px) square — used only
// to show an approximate px hint next to the copy/paste buttons.
const POSITIONER_PX = 320;
function fmtPx(pct: number) {
  return Math.round((pct / 100) * POSITIONER_PX);
}

type CopiedPosition = { x: number; y: number; width: number };

function cloneGroup(label: string, kind: GroupKind, choices: Omit<ChoiceState, "key">[]): GroupState {
  return {
    key: nextKey(),
    label,
    kind,
    choices: choices.map((c) => ({ ...c, key: nextKey() })),
  };
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
  onClear,
  size = 90,
}: {
  src: string;
  label: string;
  onUploaded: (url: string) => void;
  onClear?: () => void;
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
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <label
        className="relative flex flex-col items-center justify-center cursor-pointer overflow-hidden w-full h-full"
        style={{ border: "1px dashed var(--border)", backgroundColor: "#FAF8F4" }}
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
      {src && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 text-xs flex items-center justify-center rounded-full"
          style={{ backgroundColor: "#C0392B", color: "white" }}
          title="ลบรูป"
        >
          ✕
        </button>
      )}
    </div>
  );
}

function ChoiceEditor({
  choice,
  baseImage,
  groupKind,
  onChange,
  onRemove,
  onMove,
  isFirst,
  isLast,
  copiedPosition,
  onCopyPosition,
}: {
  choice: ChoiceState;
  baseImage: string;
  groupKind: GroupKind;
  onChange: (c: ChoiceState) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
  isFirst: boolean;
  copiedPosition: CopiedPosition | null;
  onCopyPosition: (p: CopiedPosition) => void;
  isLast: boolean;
}) {
  const [positioning, setPositioning] = useState(false);

  return (
    <div className="p-3" style={{ border: "1px solid var(--border)", backgroundColor: "white" }}>
      <p className="text-xs font-sans mb-2" style={{ color: "var(--muted)" }}>
        <strong>Gem overlay</strong> = ลอยทับรูปหลัก (ใช้กับพลอย) · <strong>Base</strong> = เปลี่ยนรูปแหวนทั้งรูป (ใช้กับโลหะ/สี)
      </p>
      {groupKind === "main_power" && (
        <div className="flex items-center flex-wrap gap-2 mb-2 p-2" style={{ backgroundColor: "#FAF8F4", border: "1px solid var(--border)" }}>
          <span className="text-xs font-sans" style={{ color: "var(--muted)" }}>ชนิดพลอย:</span>
          <select
            value={choice.stoneKind ?? "diamond"}
            onChange={(e) => {
              const stoneKind = e.target.value as StoneKind;
              onChange({
                ...choice,
                stoneKind,
                shape: stoneKind === "gem" ? "round" : choice.shape && choice.shape !== "round" ? choice.shape : "pear",
              });
            }}
            className="px-2 py-1 text-xs font-sans outline-none"
            style={{ border: "1px solid var(--border)", color: "var(--charcoal)" }}
          >
            <option value="diamond">เพชร (Diamond)</option>
            <option value="gem">พลอย (Gemstone)</option>
          </select>
          {(choice.stoneKind ?? "diamond") === "diamond" ? (
            <select
              value={choice.shape ?? "pear"}
              onChange={(e) => onChange({ ...choice, shape: e.target.value })}
              className="px-2 py-1 text-xs font-sans outline-none"
              style={{ border: "1px solid var(--border)", color: "var(--charcoal)" }}
            >
              {DIAMOND_SHAPES.map((s) => (
                <option key={s} value={s}>{DIAMOND_SHAPE_LABELS[s]}</option>
              ))}
            </select>
          ) : (
            <span className="text-xs font-sans italic" style={{ color: "var(--muted)" }}>ทรงกลมเท่านั้น</span>
          )}
        </div>
      )}
      {groupKind === "secondary_power" && (
        <p className="text-xs font-sans italic mb-2" style={{ color: "var(--muted)" }}>* บันทึกเป็นเม็ดกลมขนาดเล็กอัตโนมัติ</p>
      )}
      {groupKind === "tertiary_power" && (
        <p className="text-xs font-sans italic mb-2" style={{ color: "var(--muted)" }}>* บันทึกเป็นพลอยทรงสี่เหลี่ยมจตุรัสอัตโนมัติ</p>
      )}
      <div className="flex gap-3 items-start">
        <ImageUploadBox src={choice.swatchImage} label="+ Swatch" size={64} onUploaded={(url) => onChange({ ...choice, swatchImage: url })} />
        <ImageUploadBox
          src={choice.overlayImage || ""}
          label="+ Gem overlay"
          size={64}
          onUploaded={(url) => onChange({ ...choice, overlayImage: url })}
          onClear={() => onChange({ ...choice, overlayImage: null })}
        />
        <ImageUploadBox
          src={choice.baseImageOverride || ""}
          label="+ Base (แทนรูปหลัก)"
          size={64}
          onUploaded={(url) => onChange({ ...choice, baseImageOverride: url })}
          onClear={() => onChange({ ...choice, baseImageOverride: null })}
        />

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
          <div className="flex flex-wrap gap-3">
            {choice.overlayImage && baseImage && (
              <button type="button" onClick={() => setPositioning((p) => !p)} className="text-xs tracking-wider uppercase underline font-sans" style={{ color: "var(--gold-dark)" }}>
                {positioning ? "ปิดตำแหน่ง" : "จัดตำแหน่ง"}
              </button>
            )}
            {choice.overlayImage && (
              <button
                type="button"
                onClick={() => onCopyPosition({ x: choice.overlayX, y: choice.overlayY, width: choice.overlayWidth })}
                className="text-xs tracking-wider uppercase underline font-sans"
                style={{ color: "var(--gold-dark)" }}
                title={`x=${fmtPx(choice.overlayX)}px, y=${fmtPx(choice.overlayY)}px`}
              >
                คัดลอกตำแหน่ง
              </button>
            )}
            {choice.overlayImage && copiedPosition && (
              <button
                type="button"
                onClick={() =>
                  onChange({ ...choice, overlayX: copiedPosition.x, overlayY: copiedPosition.y, overlayWidth: copiedPosition.width })
                }
                className="text-xs tracking-wider uppercase underline font-sans"
                style={{ color: "var(--gold-dark)" }}
              >
                วางตำแหน่ง ({fmtPx(copiedPosition.x)}, {fmtPx(copiedPosition.y)}px)
              </button>
            )}
            <button type="button" onClick={onRemove} className="text-xs tracking-wider uppercase underline font-sans" style={{ color: "#C0392B" }}>
              ลบตัวเลือก
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={isFirst}
            className="w-6 h-6 text-xs flex items-center justify-center disabled:opacity-30"
            style={{ border: "1px solid var(--border)", color: "var(--charcoal)" }}
            title="เลื่อนขึ้น"
          >↑</button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={isLast}
            className="w-6 h-6 text-xs flex items-center justify-center disabled:opacity-30"
            style={{ border: "1px solid var(--border)", color: "var(--charcoal)" }}
            title="เลื่อนลง"
          >↓</button>
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
  onDuplicate,
  copiedPosition,
  onCopyPosition,
}: {
  group: GroupState;
  baseImage: string;
  onChange: (g: GroupState) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
  onDuplicate: () => void;
  copiedPosition: CopiedPosition | null;
  onCopyPosition: (p: CopiedPosition) => void;
}) {
  function moveChoice(index: number, dir: -1 | 1) {
    const next = [...group.choices];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    onChange({ ...group, choices: next });
  }

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
        <select
          value={group.kind}
          onChange={(e) => onChange({ ...group, kind: e.target.value as GroupKind })}
          className="px-2 py-2 text-xs font-sans outline-none"
          style={{ border: "1px solid var(--border)", color: "var(--charcoal)", backgroundColor: "white" }}
        >
          {GROUP_KIND_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <button type="button" onClick={() => onMove(-1)} className="w-7 h-7 text-xs" style={{ border: "1px solid var(--border)", color: "var(--charcoal)", backgroundColor: "white" }}>↑</button>
        <button type="button" onClick={() => onMove(1)} className="w-7 h-7 text-xs" style={{ border: "1px solid var(--border)", color: "var(--charcoal)", backgroundColor: "white" }}>↓</button>
        <button type="button" onClick={onDuplicate} className="px-3 py-2 text-xs tracking-wider uppercase font-sans" style={{ border: "1px solid var(--gold-dark)", color: "var(--gold-dark)", backgroundColor: "white" }}>
          Duplicate
        </button>
        <button type="button" onClick={onRemove} className="px-3 py-2 text-xs tracking-wider uppercase font-sans" style={{ border: "1px solid #C0392B", color: "#C0392B", backgroundColor: "white" }}>
          ลบหมวด
        </button>
      </div>

      <div className="space-y-2">
        {group.choices.map((choice, i) => (
          <ChoiceEditor
            key={choice.key}
            choice={choice}
            baseImage={baseImage}
            groupKind={group.kind}
            onChange={(c) => onChange({ ...group, choices: group.choices.map((x) => (x.key === c.key ? c : x)) })}
            onRemove={() => onChange({ ...group, choices: group.choices.filter((x) => x.key !== choice.key) })}
            onMove={(dir) => moveChoice(i, dir)}
            isFirst={i === 0}
            isLast={i === group.choices.length - 1}
            copiedPosition={copiedPosition}
            onCopyPosition={onCopyPosition}
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
          kind: g.kind,
          choices: g.choices.map((c) => ({
            key: nextKey(),
            label: c.label,
            swatchImage: c.swatchImage,
            overlayImage: c.overlayImage,
            overlayX: c.overlayX,
            overlayY: c.overlayY,
            overlayWidth: c.overlayWidth,
            baseImageOverride: c.baseImageOverride,
            priceDelta: c.priceDelta,
            stoneKind: c.stoneKind,
            shape: c.shape,
          })),
        }))
      : [emptyGroup()]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [copiedPosition, setCopiedPosition] = useState<CopiedPosition | null>(null);

  const [availableGroups, setAvailableGroups] = useState<GroupWithRing[]>([]);
  const [importSelection, setImportSelection] = useState("");

  useEffect(() => {
    fetch("/api/admin/custom-ring-groups")
      .then((r) => r.json())
      .then((d: GroupWithRing[]) => setAvailableGroups(Array.isArray(d) ? d.filter((g) => g.ringId !== ring?.id) : []))
      .catch(() => {});
  }, [ring?.id]);

  function moveGroup(index: number, dir: -1 | 1) {
    const next = [...groups];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    setGroups(next);
  }

  function duplicateGroup(index: number) {
    const source = groups[index];
    const copy = cloneGroup(`${source.label} (copy)`, source.kind, source.choices.map(({ key, ...rest }) => rest));
    const next = [...groups];
    next.splice(index + 1, 0, copy);
    setGroups(next);
  }

  function importGroup() {
    const found = availableGroups.find((g) => String(g.group.id) === importSelection);
    if (!found) return;
    const copy = cloneGroup(
      found.group.label,
      found.group.kind,
      found.group.choices.map((c) => ({
        label: c.label,
        swatchImage: c.swatchImage,
        overlayImage: c.overlayImage,
        overlayX: c.overlayX,
        overlayY: c.overlayY,
        overlayWidth: c.overlayWidth,
        baseImageOverride: c.baseImageOverride,
        priceDelta: c.priceDelta,
        stoneKind: c.stoneKind,
        shape: c.shape,
      }))
    );
    setGroups([...groups, copy]);
    setImportSelection("");
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
          kind: g.kind,
          choices: g.choices
            .filter((c) => c.label.trim())
            .map((c) => {
              // Power groups enforce their shape/material rule regardless of what's stored in local state.
              let stoneKind = c.stoneKind;
              let shape = c.shape;
              if (g.kind === "secondary_power") {
                shape = "round";
              } else if (g.kind === "tertiary_power") {
                stoneKind = "gem";
                shape = "square";
              } else if (g.kind === "main_power") {
                stoneKind = stoneKind ?? "diamond";
                shape = stoneKind === "gem" ? "round" : shape ?? "pear";
              } else {
                stoneKind = null;
                shape = null;
              }
              return {
                label: c.label.trim(),
                swatchImage: c.swatchImage,
                overlayImage: c.overlayImage,
                overlayX: c.overlayX,
                overlayY: c.overlayY,
                overlayWidth: c.overlayWidth,
                baseImageOverride: c.baseImageOverride,
                priceDelta: c.priceDelta,
                stoneKind,
                shape,
              };
            }),
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
          onDuplicate={() => duplicateGroup(i)}
          copiedPosition={copiedPosition}
          onCopyPosition={setCopiedPosition}
        />
      ))}
      <button
        type="button"
        onClick={() => setGroups([...groups, emptyGroup()])}
        className="text-xs tracking-wider uppercase underline font-sans"
        style={{ color: "var(--gold-dark)" }}
      >
        + Add Group
      </button>

      {availableGroups.length > 0 && (
        <div className="mt-4 mb-8 p-4 flex flex-wrap items-center gap-2" style={{ border: "1px dashed var(--border)", backgroundColor: "#FAF8F4" }}>
          <span className="text-xs font-sans" style={{ color: "var(--muted)" }}>นำเข้า Group จากแหวนอื่น:</span>
          <select
            value={importSelection}
            onChange={(e) => setImportSelection(e.target.value)}
            className="px-2 py-1.5 text-xs font-sans outline-none flex-1 min-w-[220px]"
            style={{ border: "1px solid var(--border)", color: "var(--charcoal)", backgroundColor: "white" }}
          >
            <option value="">— เลือก Group —</option>
            {availableGroups.map((g) => (
              <option key={g.group.id} value={g.group.id}>
                {g.ringName} — {g.group.label} ({g.group.choices.length} ตัวเลือก)
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={importGroup}
            disabled={!importSelection}
            className="px-4 py-1.5 text-xs tracking-wider uppercase font-sans disabled:opacity-40"
            style={{ backgroundColor: "var(--gold-dark)", color: "white" }}
          >
            นำเข้า
          </button>
          <p className="w-full text-xs font-sans mt-1" style={{ color: "var(--muted)" }}>
            * ตำแหน่ง gem จะถูกคัดลอกมาด้วย แต่อาจต้องปรับใหม่ให้ตรงกับรูปแหวนนี้
          </p>
        </div>
      )}

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
