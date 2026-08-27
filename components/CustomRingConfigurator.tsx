"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DIAMOND_SHAPE_LABELS } from "@/lib/ringShapes";
import type { CustomRingChoice, CustomRingDetail, CustomRingGroup, StoneKind } from "@/lib/customRings";
import {
  MEANINGS_BY_CATEGORY,
  buildMeaningSummary,
  DIAMOND_SHAPE_IMAGES,
  type MeaningCategory,
  type MeaningSelection,
} from "@/lib/gemstoneMeanings";
import type { GroupKind } from "@/lib/customRings";

// Only these 4 shapes have real photography uploaded so far.
const DIAMOND_SHAPE_OPTIONS = ["round", "pear", "princess", "oval"] as const;

// The ring's own "power" groups double as the meaning picker — main_power is
// YOUR WISH, secondary_power is YOUR STRENGTH, tertiary_power is YOUR
// BALANCE — so there's one selection to make per stone, not a separate pick.
const POWER_KIND_TO_MEANING_CATEGORY: Partial<Record<GroupKind, MeaningCategory>> = {
  main_power: "wish",
  secondary_power: "strength",
  tertiary_power: "balance",
};

const THB = (n: number) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(n);

// Makes a flat gem-overlay photo read as set into a carved channel rather
// than pasted on top — drop-shadow (unlike box-shadow) follows the image's
// actual alpha silhouette, so this works for any cut (round/princess/
// baguette/pear) without needing a shape-specific mask. A tight dark shadow
// stands in for the groove wall, a softer wider one for the overall recess,
// and a faint highlight on the opposite edge catches the "light" like a
// bezel rim would.
const GEM_SET_SHADOW =
  "drop-shadow(0 0 1px rgba(0,0,0,0.9)) " +
  "drop-shadow(0 1px 1.5px rgba(0,0,0,0.8)) " +
  "drop-shadow(0 2px 3px rgba(0,0,0,0.5)) " +
  "drop-shadow(0 -0.5px 0.5px rgba(255,255,255,0.6))";

const STONE_KIND_LABEL: Record<StoneKind, string> = { diamond: "เพชร", gem: "พลอย" };

function isMeaningGroup(group: CustomRingGroup) {
  return POWER_KIND_TO_MEANING_CATEGORY[group.kind] !== undefined;
}

// Meaning groups match choices to a Meaning by POSITION (1st choice = 1st
// meaning in that category, etc.), not by the choice's typed label — the
// admin can freely rename a choice's Thai text from the admin panel (e.g.
// "ความสัมพันธ์" -> "ความรัก") without breaking the gemstone-name display or
// the generated summary sentence, as long as the 6 choices stay in the same
// order as lib/gemstoneMeanings.ts. Reordering/adding/removing choices will
// throw the mapping off.
function meaningForChoice(group: CustomRingGroup, choice: CustomRingChoice) {
  const category = POWER_KIND_TO_MEANING_CATEGORY[group.kind];
  if (!category) return undefined;
  const index = group.choices.findIndex((c) => c.id === choice.id);
  return MEANINGS_BY_CATEGORY[category][index];
}

// Diamond choices in a plain (non-meaning) Main Power group are shape
// variants — show the shape name (Pear/Emerald/…) instead of whatever
// internal label the admin typed. Meaning groups skip this: the admin's
// typed label is always what customers see there, and shape-picking is
// handled separately by the dedicated diamond-shape sub-picker.
function choiceLabel(group: CustomRingGroup, choice: CustomRingChoice) {
  if (!isMeaningGroup(group) && group.kind === "main_power" && choice.stoneKind === "diamond" && choice.shape) {
    return DIAMOND_SHAPE_LABELS[choice.shape] ?? choice.label;
  }
  return choice.label;
}

// Zooms in on (and re-centers) a swatch photo whose subject sits small in a
// mostly-empty frame — admin-tunable per choice, display-only.
function swatchTransform(choice: CustomRingChoice) {
  const zoom = choice.swatchZoom || 1;
  const x = choice.swatchOffsetX || 0;
  const y = choice.swatchOffsetY || 0;
  return `translate(${x}%, ${y}%) scale(${zoom})`;
}

// The "selected: X" indicator next to a meaning group's title has little
// room — the full meaning phrase (e.g. "ความก้าวหน้าในงาน") wraps and runs
// off the edge there, so show the shorter gemstone name instead.
function selectedIndicatorLabel(group: CustomRingGroup, choice: CustomRingChoice) {
  const meaning = meaningForChoice(group, choice);
  return meaning ? meaning.gemstone : choiceLabel(group, choice);
}

const THAI_CHARS = /[฀-๿]/;
const LABEL_SEPARATOR = /\s[-—–]\s/;

// Wide letter-spacing looks right on the English part of a group label
// ("YOUR WISH") but wraps Thai text ("สิ่งที่อยากให้เกิดขึ้น") onto an
// extra line — split at the dash (-, – or —) so only the English side gets it.
function GroupLabelText({ label }: { label: string }) {
  const match = label.match(LABEL_SEPARATOR);
  if (match?.index !== undefined) {
    const eng = label.slice(0, match.index);
    const rest = label.slice(match.index);
    return (
      <>
        <span className="tracking-[0.25em] uppercase">{eng}</span>
        {rest}
      </>
    );
  }
  if (THAI_CHARS.test(label)) return <>{label}</>;
  return <span className="tracking-[0.25em] uppercase">{label}</span>;
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
  // The diamond/gem toggle only makes sense for a plain "pick your stone"
  // group — a meaning group always shows all 6 meanings together regardless
  // of which ones happen to be flagged diamond vs gem internally.
  const isMainPower = group.kind === "main_power" && !isMeaningGroup(group);
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
          <p className="text-xs font-sans" style={{ color: "var(--muted)" }}><GroupLabelText label={group.label} /></p>
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
        <p className="text-xs font-sans" style={{ color: "var(--muted)" }}><GroupLabelText label={group.label} /></p>
        <p className="text-xs font-sans text-right" style={{ color: "var(--charcoal)" }}>
          {selectedChoice ? selectedIndicatorLabel(group, selectedChoice) : "None"}
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
        <div className="flex flex-wrap gap-x-5 gap-y-3">
          {visibleChoices.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onToggle(c.id)}
              title={choiceLabel(group, c)}
              className="flex flex-col items-center gap-1.5"
              style={{ width: 56 }}
            >
              <span
                className="rounded-full overflow-hidden flex-shrink-0 transition-shadow"
                style={{
                  width: 44,
                  height: 44,
                  border: selectedId === c.id ? "2px solid #344EAD" : "1px solid var(--border)",
                  backgroundColor: "var(--img-bg)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.swatchImage}
                  alt={choiceLabel(group, c)}
                  className="w-full h-full object-cover"
                  style={{ transform: swatchTransform(c) }}
                />
              </span>
              <span
                className="text-[10px] font-sans text-center leading-tight"
                style={{ color: selectedId === c.id ? "#344EAD" : "var(--muted)" }}
              >
                {choiceLabel(group, c)}
              </span>
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

export default function CustomRingConfigurator({ ring }: { ring: CustomRingDetail }) {
  const [selections, setSelections] = useState<Record<number, number | undefined>>(() => {
    const initial: Record<number, number | undefined> = {};
    for (const g of ring.groups) {
      if (g.kind === "main_power" && !isMeaningGroup(g)) {
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
  const [diamondShapes, setDiamondShapes] = useState<Record<number, string>>({});

  const groups = ring.groups;

  // Read the meaning selection straight off whichever choice is picked in
  // each power group (matched by position — see meaningForChoice) — no
  // separate state needed.
  const meaningSelection = useMemo(() => {
    const sel: MeaningSelection = {};
    for (const g of groups) {
      const category = POWER_KIND_TO_MEANING_CATEGORY[g.kind];
      if (!category) continue;
      const choice = g.choices.find((c) => c.id === selections[g.id]);
      const meaning = choice && meaningForChoice(g, choice);
      if (meaning) sel[category] = meaning.key;
    }
    return sel;
  }, [groups, selections]);
  const meaningSummary = useMemo(() => buildMeaningSummary(meaningSelection), [meaningSelection]);

  // Whether the currently-selected choice in a group is a meaning whose
  // gemstone is literally "Diamond" — that's the one case where the
  // customer also gets to pick which diamond shape they want.
  function isDiamondMeaning(g: CustomRingGroup): boolean {
    const choice = g.choices.find((c) => c.id === selections[g.id]);
    const meaning = choice && meaningForChoice(g, choice);
    return meaning?.gemstone === "Diamond";
  }

  const selectedChoices = useMemo(
    () =>
      groups
        .filter((g) => g.kind !== "text_input")
        .map((g) => {
          const choice = g.choices.find((c) => c.id === selections[g.id]);
          if (!choice) return undefined;
          if (isDiamondMeaning(g)) {
            const images = DIAMOND_SHAPE_IMAGES[diamondShapes[g.id] ?? "round"];
            if (images) return { ...choice, swatchImage: images.swatchImage, overlayImage: images.overlayImage };
          }
          return choice;
        })
        .filter((c): c is CustomRingChoice => Boolean(c)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [groups, selections, diamondShapes]
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
              <div key={g.id}>
                <GroupSection
                  group={g}
                  selectedId={selections[g.id]}
                  onToggle={(choiceId) => toggleChoice(g.id, choiceId)}
                  stoneKind={powerStoneKind[g.id]}
                  onStoneKindChange={(k) => changeStoneKind(g.id, k)}
                  textValue={textValues[g.id]}
                  onTextChange={(v) => setTextValues((prev) => ({ ...prev, [g.id]: v }))}
                />
                {isDiamondMeaning(g) && (
                  <div className="pb-5">
                    <p className="text-xs font-sans mb-2" style={{ color: "var(--muted)" }}>เลือกทรงเพชร</p>
                    <div className="flex flex-wrap gap-x-5 gap-y-3">
                      {DIAMOND_SHAPE_OPTIONS.map((shape) => {
                        const selected = (diamondShapes[g.id] ?? "round") === shape;
                        return (
                          <button
                            key={shape}
                            type="button"
                            onClick={() => setDiamondShapes((prev) => ({ ...prev, [g.id]: shape }))}
                            title={DIAMOND_SHAPE_LABELS[shape]}
                            className="flex flex-col items-center gap-1.5"
                            style={{ width: 56 }}
                          >
                            <span
                              className="rounded-full overflow-hidden flex-shrink-0"
                              style={{
                                width: 40,
                                height: 40,
                                border: selected ? "2px solid #344EAD" : "1px solid var(--border)",
                                backgroundColor: "var(--img-bg)",
                              }}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={DIAMOND_SHAPE_IMAGES[shape].swatchImage}
                                alt={DIAMOND_SHAPE_LABELS[shape]}
                                className="w-full h-full object-cover"
                              />
                            </span>
                            <span
                              className="text-[10px] font-sans text-center leading-tight"
                              style={{ color: selected ? "#344EAD" : "var(--muted)" }}
                            >
                              {DIAMOND_SHAPE_LABELS[shape]}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
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
                    filter: GEM_SET_SHADOW,
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
