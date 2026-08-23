"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DIAMOND_SHAPE_LABELS } from "@/lib/ringShapes";
import type { CustomRingChoice, CustomRingDetail, CustomRingGroup, StoneKind } from "@/lib/customRings";
import {
  MEANINGS_BY_CATEGORY,
  CATEGORY_LABEL,
  buildMeaningSummary,
  type MeaningCategory,
  type MeaningSelection,
} from "@/lib/gemstoneMeanings";

const THB = (n: number) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(n);

const STONE_KIND_LABEL: Record<StoneKind, string> = { diamond: "เพชร", gem: "พลอย" };

// Diamond choices in a Main Power group are shape variants — show the shape name
// (Pear/Emerald/…) rather than whatever internal label the admin typed on the choice.
function choiceLabel(group: CustomRingGroup, choice: CustomRingChoice) {
  if (group.kind === "main_power" && choice.stoneKind === "diamond" && choice.shape) {
    return DIAMOND_SHAPE_LABELS[choice.shape] ?? choice.label;
  }
  return choice.label;
}

function GroupSection({
  group,
  selectedId,
  onToggle,
  stoneKind,
  onStoneKindChange,
  textValue,
  onTextChange,
}: {
  group: CustomRingGroup;
  selectedId: number | undefined;
  onToggle: (choiceId: number) => void;
  stoneKind?: StoneKind;
  onStoneKindChange?: (k: StoneKind) => void;
  textValue?: string;
  onTextChange?: (v: string) => void;
}) {
  const isMainPower = group.kind === "main_power";
  const availableKinds = useMemo(
    () => (isMainPower ? Array.from(new Set(group.choices.map((c) => c.stoneKind).filter((k): k is StoneKind => Boolean(k)))) : []),
    [isMainPower, group.choices]
  );
  const visibleChoices = isMainPower && stoneKind ? group.choices.filter((c) => c.stoneKind === stoneKind) : group.choices;
  const selectedChoice = group.choices.find((c) => c.id === selectedId);
  const allHaveImages = visibleChoices.length > 0 && visibleChoices.every((c) => c.swatchImage);

  if (group.kind === "text_input") {
    return (
      <div className="py-5" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-baseline justify-between gap-3 mb-3">
          <p className="text-xs tracking-[0.25em] uppercase font-sans" style={{ color: "var(--muted)" }}>{group.label}</p>
          <p className="text-xs font-sans text-right" style={{ color: "var(--charcoal)" }}>{textValue?.trim() ? textValue : "None"}</p>
        </div>
        <input
          type="text"
          value={textValue ?? ""}
          onChange={(e) => onTextChange?.(e.target.value)}
          placeholder={group.placeholder || "พิมพ์ข้อความที่ต้องการ"}
          maxLength={40}
          className="w-full px-3 py-2.5 text-sm font-sans outline-none"
          style={{ border: "1px solid var(--border)", color: "var(--charcoal)", backgroundColor: "white" }}
        />
        {group.priceDelta > 0 && (
          <p className="text-xs font-sans mt-1.5" style={{ color: "var(--muted)" }}>+{THB(group.priceDelta)} หากระบุข้อความ</p>
        )}
      </div>
    );
  }

  return (
    <div className="py-5" style={{ borderBottom: "1px solid var(--border)" }}>
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <p className="text-xs tracking-[0.25em] uppercase font-sans" style={{ color: "var(--muted)" }}>{group.label}</p>
        <p className="text-xs font-sans text-right" style={{ color: "var(--charcoal)" }}>
          {selectedChoice ? choiceLabel(group, selectedChoice) : "None"}
        </p>
      </div>

      {isMainPower && availableKinds.length > 1 && (
        <div className="flex gap-2 mb-3">
          {availableKinds.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => onStoneKindChange?.(k)}
              className="flex-1 py-2 text-xs tracking-wider uppercase font-sans transition-colors"
              style={{
                border: stoneKind === k ? "1.5px solid var(--charcoal)" : "1px solid var(--border)",
                color: "var(--charcoal)",
                backgroundColor: "white",
              }}
            >
              {STONE_KIND_LABEL[k]}
            </button>
          ))}
        </div>
      )}

      {group.kind === "dropdown" ? (
        <select
          value={selectedId ?? ""}
          onChange={(e) => onToggle(Number(e.target.value))}
          className="w-full px-3 py-2.5 text-sm font-sans outline-none"
          style={{ border: "1px solid var(--border)", color: "var(--charcoal)", backgroundColor: "white" }}
        >
          {visibleChoices.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
      ) : allHaveImages ? (
        <div className="flex flex-wrap gap-3">
          {visibleChoices.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onToggle(c.id)}
              title={choiceLabel(group, c)}
              className="rounded-full overflow-hidden flex-shrink-0 transition-shadow"
              style={{
                width: 44,
                height: 44,
                border: selectedId === c.id ? "2px solid var(--charcoal)" : "1px solid var(--border)",
                backgroundColor: "var(--img-bg)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.swatchImage} alt={choiceLabel(group, c)} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {visibleChoices.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onToggle(c.id)}
              title={choiceLabel(group, c)}
              className="px-3 py-2.5 text-xs font-sans text-center transition-colors"
              style={{
                border: selectedId === c.id ? "1.5px solid var(--charcoal)" : "1px solid var(--border)",
                color: "var(--charcoal)",
                backgroundColor: "white",
              }}
            >
              {choiceLabel(group, c)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const MEANING_CATEGORIES: MeaningCategory[] = ["wish", "strength", "balance"];

// Symbolic gemstone-meaning picker — separate from the ring-building groups
// above (no price/photo effect), so it gets its own small self-contained UI.
function MeaningSection({
  selection,
  onToggle,
}: {
  selection: MeaningSelection;
  onToggle: (category: MeaningCategory, key: string) => void;
}) {
  const summary = useMemo(() => buildMeaningSummary(selection), [selection]);

  return (
    <div className="py-5" style={{ borderTop: "1px solid var(--border)" }}>
      <p className="text-xs tracking-[0.25em] uppercase font-sans mb-1" style={{ color: "var(--muted)" }}>
        ความหมายของคุณ
      </p>
      <p className="text-xs font-sans mb-4" style={{ color: "var(--muted)" }}>
        เลือกได้ 1–3 หมวด เพื่อสร้างความหมายเฉพาะตัวให้กับเครื่องประดับชิ้นนี้
      </p>

      {MEANING_CATEGORIES.map((category) => (
        <div key={category} className="mb-5">
          <p className="text-xs tracking-[0.15em] uppercase font-sans mb-2" style={{ color: "var(--charcoal)" }}>
            {CATEGORY_LABEL[category]}
          </p>
          <div className="flex flex-wrap gap-3">
            {MEANINGS_BY_CATEGORY[category].map((m) => {
              const isSelected = selection[category] === m.key;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => onToggle(category, m.key)}
                  title={`${m.labelTh} — ${m.gemstone}`}
                  className="flex flex-col items-center gap-1.5"
                  style={{ width: 56 }}
                >
                  <span
                    className="rounded-full flex-shrink-0 transition-shadow"
                    style={{
                      width: 36,
                      height: 36,
                      backgroundColor: m.swatchColor,
                      border: isSelected ? "2px solid var(--charcoal)" : "1px solid var(--border)",
                      boxShadow: isSelected ? "0 0 0 2px white inset" : undefined,
                    }}
                  />
                  <span
                    className="text-[10px] font-sans text-center leading-tight"
                    style={{ color: isSelected ? "var(--charcoal)" : "var(--muted)" }}
                  >
                    {m.labelTh}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {summary && (
        <div className="mt-2 p-4" style={{ backgroundColor: "var(--img-bg)", border: "1px solid var(--border)" }}>
          <p className="text-xs tracking-[0.2em] uppercase font-sans mb-2" style={{ color: "var(--gold)" }}>
            สรุปความหมายของคุณ
          </p>
          <p className="text-sm font-sans leading-relaxed mb-3" style={{ color: "var(--charcoal)" }}>
            {summary.generatedSummary}
          </p>
          <p className="text-xs font-sans" style={{ color: "var(--muted)" }}>
            อัญมณี: {summary.selectedGemstones.join(" · ")}
          </p>
        </div>
      )}
    </div>
  );
}

export default function CustomRingConfigurator({ ring }: { ring: CustomRingDetail }) {
  const [selections, setSelections] = useState<Record<number, number | undefined>>(() => {
    const initial: Record<number, number | undefined> = {};
    for (const g of ring.groups) {
      if (g.kind === "main_power") {
        // Default Main Power to diamond when the group offers one, regardless of choice order.
        const preferred = g.choices.some((c) => c.stoneKind === "diamond") ? "diamond" : "gem";
        const match = g.choices.find((c) => c.stoneKind === preferred);
        initial[g.id] = match?.id ?? g.choices[0]?.id;
      } else if (g.choices[0]) {
        initial[g.id] = g.choices[0].id;
      }
    }
    return initial;
  });
  const [powerStoneKind, setPowerStoneKind] = useState<Record<number, StoneKind>>(() => {
    const initial: Record<number, StoneKind> = {};
    for (const g of ring.groups) {
      if (g.kind === "main_power") {
        const hasDiamond = g.choices.some((c) => c.stoneKind === "diamond");
        const hasGem = g.choices.some((c) => c.stoneKind === "gem");
        if (hasDiamond) initial[g.id] = "diamond";
        else if (hasGem) initial[g.id] = "gem";
      }
    }
    return initial;
  });
  const [textValues, setTextValues] = useState<Record<number, string>>({});
  const [meaningSelection, setMeaningSelection] = useState<MeaningSelection>({});

  const groups = ring.groups;
  const meaningSummary = useMemo(() => buildMeaningSummary(meaningSelection), [meaningSelection]);

  function toggleMeaning(category: MeaningCategory, key: string) {
    setMeaningSelection((prev) => (prev[category] === key ? { ...prev, [category]: undefined } : { ...prev, [category]: key }));
  }

  const selectedChoices = useMemo(
    () =>
      groups
        .filter((g) => g.kind !== "text_input")
        .map((g) => g.choices.find((c) => c.id === selections[g.id]))
        .filter((c): c is CustomRingChoice => Boolean(c)),
    [groups, selections]
  );

  const textInputTotal = useMemo(
    () =>
      groups
        .filter((g) => g.kind === "text_input" && textValues[g.id]?.trim())
        .reduce((sum, g) => sum + g.priceDelta, 0),
    [groups, textValues]
  );

  const totalPrice = ring.basePrice + selectedChoices.reduce((sum, c) => sum + c.priceDelta, 0) + textInputTotal;

  // A choice can replace the whole ring photo (e.g. metal color) instead of
  // just layering a gem on top — last selected group with an override wins.
  const effectiveBaseImage = useMemo(() => {
    const override = [...selectedChoices].reverse().find((c) => c.baseImageOverride);
    return override?.baseImageOverride || ring.baseImage;
  }, [selectedChoices, ring.baseImage]);

  function toggleChoice(groupId: number, choiceId: number) {
    setSelections((prev) => (prev[groupId] === choiceId ? { ...prev, [groupId]: undefined } : { ...prev, [groupId]: choiceId }));
  }

  function changeStoneKind(groupId: number, kind: StoneKind) {
    setPowerStoneKind((prev) => ({ ...prev, [groupId]: kind }));
    const group = groups.find((g) => g.id === groupId);
    const first = group?.choices.find((c) => c.stoneKind === kind);
    setSelections((prev) => ({ ...prev, [groupId]: first?.id }));
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--ivory)" }}>
      {/* Minimal header */}
      <div className="text-center py-6" style={{ borderBottom: "1px solid var(--border)", backgroundColor: "white" }}>
        <Link href="/" className="inline-block">
          <h1 className="text-2xl tracking-[0.2em]" style={{ color: "var(--charcoal)" }}>SUPATIDA</h1>
          <p className="text-xs tracking-[0.3em] uppercase mt-1 font-sans" style={{ color: "var(--muted)" }}>
            Lab Grown Diamond Jewelry
          </p>
        </Link>
      </div>

      <div className="lg:grid lg:grid-cols-[380px_1fr] lg:items-start">
        {/* Sidebar — all options shown at once */}
        <aside className="px-6 py-8 lg:px-10 lg:py-10" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-baseline justify-between mb-1">
            <h2 className="text-xl tracking-wide" style={{ color: "var(--charcoal)" }}>{ring.name}</h2>
          </div>
          <p className="text-lg font-sans font-light mb-4" style={{ color: "var(--gold)" }}>{THB(totalPrice)}</p>

          {ring.description && (
            <p className="text-sm font-sans mb-4" style={{ color: "var(--muted)" }}>{ring.description}</p>
          )}

          <div>
            {groups.map((g) => (
              <GroupSection
                key={g.id}
                group={g}
                selectedId={selections[g.id]}
                onToggle={(choiceId) => toggleChoice(g.id, choiceId)}
                stoneKind={powerStoneKind[g.id]}
                onStoneKindChange={(k) => changeStoneKind(g.id, k)}
                textValue={textValues[g.id]}
                onTextChange={(v) => setTextValues((prev) => ({ ...prev, [g.id]: v }))}
              />
            ))}
          </div>

          <MeaningSection selection={meaningSelection} onToggle={toggleMeaning} />
        </aside>

        {/* Image + purchase action */}
        <main className="flex flex-col items-center px-6 py-10 lg:py-16 lg:sticky lg:top-0">
          <div className="relative w-full max-w-lg mb-8" style={{ aspectRatio: "1/1", backgroundColor: "var(--img-bg)", border: "1px solid var(--border)" }}>
            {effectiveBaseImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={effectiveBaseImage} alt={ring.name} className="absolute inset-0 w-full h-full object-contain" />
            )}
            {selectedChoices.map((c) =>
              c.overlayImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={c.id}
                  src={c.overlayImage}
                  alt=""
                  title={c.label}
                  className="absolute"
                  style={{
                    left: `${c.overlayX}%`,
                    top: `${c.overlayY}%`,
                    width: `${c.overlayWidth}%`,
                    transform: `translate(-50%, -50%) rotate(${c.overlayRotation}deg)`,
                  }}
                />
              ) : null
            )}
          </div>

          {meaningSummary && (
            <div className="w-full max-w-xs mb-6 p-4 text-center" style={{ backgroundColor: "var(--img-bg)", border: "1px solid var(--border)" }}>
              <p className="text-xs tracking-[0.2em] uppercase font-sans mb-2" style={{ color: "var(--gold)" }}>
                ความหมายที่คุณเลือก
              </p>
              <p className="text-sm font-sans leading-relaxed" style={{ color: "var(--charcoal)" }}>
                {meaningSummary.generatedSummary}
              </p>
            </div>
          )}

          <a
            href="https://lin.ee/U9D2iyG"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full max-w-xs text-center py-3.5 text-xs tracking-widest uppercase font-sans transition-opacity hover:opacity-80"
            style={{ border: "1px solid var(--charcoal)", color: "var(--charcoal)" }}
          >
            สอบถามข้อมูล / สั่งทำแหวนนี้
          </a>
          <p className="text-xs font-sans mt-3 text-center" style={{ color: "var(--muted)" }}>
            แคปหน้าจอส่ง admin ได้เลยค่ะ
          </p>
        </main>
      </div>
    </div>
  );
}
