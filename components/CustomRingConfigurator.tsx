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

// Only shapes with real photography uploaded (DIAMOND_SHAPE_IMAGES) can be offered.
const DIAMOND_SHAPE_OPTIONS = Object.keys(DIAMOND_SHAPE_IMAGES);

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
  const rotation = choice.swatchRotation || 0;
  return `translate(${x}%, ${y}%) rotate(${rotation}deg) scale(${zoom})`;
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
  onlyWhiteGold,
}: {
  group: CustomRingGroup;
  selectedId: number | undefined;
  onToggle: (choiceId: number) => void;
  stoneKind?: StoneKind;
  onStoneKindChange?: (k: StoneKind) => void;
  textValue?: string;
  onTextChange?: (v: string) => void;
  // True when the ring's currently-selected metal can't reliably hold
  // other color plating (e.g. Silver) — in any group that has a choice
  // admin-flagged isWhiteGoldOption, every other choice in that group is
  // hidden. A group with no such flagged choice is untouched (it isn't a
  // "ring color" style group at all).
  onlyWhiteGold?: boolean;
}) {
  // The diamond/gem toggle only makes sense for a plain "pick your stone"
  // group — a meaning group always shows all 6 meanings together regardless
  // of which ones happen to be flagged diamond vs gem internally.
  const isMainPower = group.kind === "main_power" && !isMeaningGroup(group);
  const availableKinds = useMemo(
    () => (isMainPower ? Array.from(new Set(group.choices.map((c) => c.stoneKind).filter((k): k is StoneKind => Boolean(k)))) : []),
    [isMainPower, group.choices]
  );
  let visibleChoices = isMainPower && stoneKind ? group.choices.filter((c) => c.stoneKind === stoneKind) : group.choices;
  if (onlyWhiteGold && group.choices.some((c) => c.isWhiteGoldOption)) {
    visibleChoices = visibleChoices.filter((c) => c.isWhiteGoldOption);
  }
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
          maxLength={10}
          className="w-full px-3 py-2.5 text-sm font-sans outline-none"
          style={{ border: "1px solid var(--border)", color: "var(--charcoal)", backgroundColor: "white" }}
        />
        <p className="text-xs font-sans mt-1 text-right" style={{ color: "var(--muted)" }}>{(textValue ?? "").length}/10</p>
        {group.priceDelta > 0 && (
          <p className="text-xs font-sans mt-1.5" style={{ color: "var(--muted)" }}>+{THB(group.priceDelta)} หากระบุข้อความ</p>
        )}
      </div>
    );
  }

  return (
    <div className="py-5" style={{ borderBottom: "1px solid var(--border)" }}>
      <div className="mb-3">
        <p className="text-xs font-sans" style={{ color: "var(--muted)" }}><GroupLabelText label={group.label} /></p>
        {selectedChoice && (
          <p className="text-sm font-sans font-semibold mt-1" style={{ color: "#344EAD" }}>
            เลือกแล้ว: {selectedIndicatorLabel(group, selectedChoice)}
          </p>
        )}
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
      } else if (isMeaningGroup(g)) {
        // WISH/STRENGTH/BALANCE start with nothing picked — customers
        // aren't required to fill all 3; "None" is just one of the choices.
      } else if (g.choices[0]) {
        initial[g.id] = g.choices[0].id;
      }
    }
    // Each group defaults independently to its own first choice, so if the
    // default metal (also just whatever's first) can't reliably hold other
    // color plating, bump every "ring color" style group's default to its
    // White Gold option too — same correction toggleChoice applies on every
    // later click, just run once up front so the initial render doesn't
    // show a colour the metal couldn't actually wear.
    for (const metalGroup of ring.groups) {
      if (metalGroup.kind !== "metal") continue;
      const metalChoice = metalGroup.choices.find((c) => c.id === initial[metalGroup.id]);
      if (!metalChoice?.onlyWhiteGold) continue;
      for (const g of ring.groups) {
        if (g.id === metalGroup.id) continue;
        const whiteChoice = g.choices.find((c) => c.isWhiteGoldOption);
        if (whiteChoice) initial[g.id] = whiteChoice.id;
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
  const [realPhotosOpen, setRealPhotosOpen] = useState(false);
  const [realPhotosTabHovered, setRealPhotosTabHovered] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);

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
            const shape = diamondShapes[g.id] ?? "round";
            const images = DIAMOND_SHAPE_IMAGES[shape];
            if (images) {
              // Shapes have different natural silhouettes (e.g. marquise is
              // long/thin, round is compact) — a per-shape position/size
              // override (admin-tunable) takes precedence over the choice's
              // own default overlay fields, so each shape can sit right on
              // the ring regardless of what the default was tuned for.
              const override = choice.diamondShapeOverlays?.[shape];
              return {
                ...choice,
                swatchImage: images.swatchImage,
                overlayImage: images.overlayImage,
                ...(override
                  ? {
                      overlayX: override.x,
                      overlayY: override.y,
                      overlayWidth: override.width,
                      overlayRotation: override.rotation,
                    }
                  : {}),
              };
            }
          }
          return choice;
        })
        .filter((c): c is CustomRingChoice => Boolean(c)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [groups, selections, diamondShapes]
  );

  // Flat label/value list for the order-summary popup — one row per group
  // the customer actually made a choice in. Meaning groups show the
  // gemstone name (plus diamond shape, if that's the gem) instead of the
  // raw choice label, same as the sidebar's "เลือกแล้ว" indicator; a "None"
  // pick in a meaning group is skipped since it carries no meaning to report.
  const summaryRows = useMemo(() => {
    const rows: { label: string; value: string }[] = [];
    for (const g of groups) {
      if (g.kind === "text_input") {
        const v = textValues[g.id]?.trim();
        if (v) rows.push({ label: g.label, value: v });
        continue;
      }
      const choice = g.choices.find((c) => c.id === selections[g.id]);
      if (!choice) continue;
      if (isMeaningGroup(g)) {
        const meaning = meaningForChoice(g, choice);
        if (!meaning) continue;
        let value = meaning.gemstone;
        if (isDiamondMeaning(g)) {
          const shape = diamondShapes[g.id] ?? "round";
          value += ` ทรง${DIAMOND_SHAPE_LABELS[shape] ?? shape}`;
        }
        rows.push({ label: g.label, value });
      } else {
        rows.push({ label: g.label, value: choiceLabel(g, choice) });
      }
    }
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups, selections, textValues, diamondShapes]);

  // Switching diamond shape swaps the SAME overlay <img> element's `src`
  // (same choice id, so React keeps the element) — the new position/size
  // style applies instantly, but the browser still has to fetch the new
  // image bytes, so for a moment it paints the OLD (still-loaded) image
  // stretched into the NEW shape's box: a visible flash of a mismatched
  // gem. Preloading every shape's images as soon as the ring could show
  // this picker means they're already in the browser cache by the time
  // the customer clicks a shape, so the swap is instant.
  const needsDiamondShapePreload = groups.some(isMeaningGroup);
  const diamondShapePreloadUrls = useMemo(() => {
    if (!needsDiamondShapePreload) return [];
    const urls = new Set<string>();
    for (const images of Object.values(DIAMOND_SHAPE_IMAGES)) {
      urls.add(images.swatchImage);
      urls.add(images.overlayImage);
    }
    return Array.from(urls);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsDiamondShapePreload]);

  const textInputTotal = useMemo(
    () =>
      groups
        .filter((g) => g.kind === "text_input" && textValues[g.id]?.trim())
        .reduce((sum, g) => sum + g.priceDelta, 0),
    [groups, textValues]
  );

  // Some metals (9K/14K/18K gold) cost more gold per step above size 55,
  // while others (e.g. Silver) don't scale with size at all — rather than
  // hand-setting a priceDelta on every single size choice per metal, the
  // selected "metal" group's choice carries a baht-per-step rate, applied
  // against whichever numeric size is picked in any "dropdown" group.
  const metalChoice = useMemo(() => {
    for (const group of groups) {
      if (group.kind !== "metal") continue;
      const choice = group.choices.find((c) => c.id === selections[group.id]);
      if (choice) return choice;
    }
    return undefined;
  }, [groups, selections]);

  const sizeSurcharge = useMemo(() => {
    if (!metalChoice?.sizeSurchargePerStep) return 0;
    let surcharge = 0;
    for (const group of groups) {
      if (group.kind !== "dropdown") continue;
      const choice = group.choices.find((c) => c.id === selections[group.id]);
      if (!choice) continue;
      const sizeNum = parseInt(choice.label, 10);
      if (!Number.isFinite(sizeNum) || sizeNum < 56) continue;
      surcharge += (sizeNum - 55) * metalChoice.sizeSurchargePerStep;
    }
    return surcharge;
  }, [groups, selections, metalChoice]);

  const totalPrice =
    ring.basePrice + selectedChoices.reduce((sum, c) => sum + c.priceDelta, 0) + textInputTotal + sizeSurcharge;

  // A choice can replace the whole ring photo (e.g. a different base ring
  // design) instead of just layering a gem on top — last selected group
  // with an override wins.
  const baseImageChoice = useMemo(
    () => [...selectedChoices].reverse().find((c) => c.baseImageOverride),
    [selectedChoices]
  );
  const effectiveBaseImage = baseImageChoice?.baseImageOverride || ring.baseImage;

  // baseImageOverride photos come from separate shoots and often frame the
  // ring differently — this admin-tuned pan/zoom (set in the admin's "จัด
  // ตำแหน่งรูปแหวน" tool) keeps the ring visually in place when switching
  // between them, so any gem overlay positions stay aligned.
  const baseImageTransform = useMemo(() => {
    if (!baseImageChoice) return undefined;
    const zoom = baseImageChoice.baseImageZoom || 1;
    const x = baseImageChoice.baseImageOffsetX || 0;
    const y = baseImageChoice.baseImageOffsetY || 0;
    if (zoom === 1 && x === 0 && y === 0) return undefined;
    return `translate(${x}%, ${y}%) scale(${zoom})`;
  }, [baseImageChoice]);

  // Metal color is a CSS tint layered on top of whichever base photo is
  // showing, not a separate photo per color — only color choices ever set
  // colorFilter, so finding any selected one is enough regardless of which
  // group it came from.
  const effectiveColorFilter = useMemo(
    () => selectedChoices.find((c) => c.colorFilter)?.colorFilter || undefined,
    [selectedChoices]
  );

  function toggleChoice(groupId: number, choiceId: number) {
    setSelections((prev) => {
      const next = prev[groupId] === choiceId ? { ...prev, [groupId]: undefined } : { ...prev, [groupId]: choiceId };
      // Switching to a metal that can't reliably hold other color plating
      // (e.g. Silver — Rose/Yellow Gold wear off it quickly) bumps any
      // already-selected non-White-Gold choice back to the admin-flagged
      // isWhiteGoldOption choice in whichever group holds it, matching
      // what GroupSection now hides from that group's choices.
      const group = groups.find((g) => g.id === groupId);
      const chosen = group?.choices.find((c) => c.id === choiceId);
      if (group?.kind === "metal" && next[groupId] === choiceId && chosen?.onlyWhiteGold) {
        for (const g of groups) {
          if (g.id === groupId) continue;
          const whiteChoice = g.choices.find((c) => c.isWhiteGoldOption);
          if (!whiteChoice) continue;
          const current = g.choices.find((c) => c.id === next[g.id]);
          if (current && !current.isWhiteGoldOption) {
            next[g.id] = whiteChoice.id;
          }
        }
      }
      return next;
    });
  }

  function changeStoneKind(groupId: number, kind: StoneKind) {
    setPowerStoneKind((prev) => ({ ...prev, [groupId]: kind }));
    const group = groups.find((g) => g.id === groupId);
    const first = group?.choices.find((c) => c.stoneKind === kind);
    setSelections((prev) => ({ ...prev, [groupId]: first?.id }));
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--ivory)" }}>
      {diamondShapePreloadUrls.length > 0 && (
        <div aria-hidden style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}>
          {diamondShapePreloadUrls.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={url} src={url} alt="" />
          ))}
        </div>
      )}
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
          <div className="mb-4">
            <p className="text-lg font-sans font-light" style={{ color: "var(--gold)" }}>{THB(totalPrice)}</p>
            {sizeSurcharge > 0 && (
              <p className="text-xs font-sans" style={{ color: "var(--muted)" }}>
                (รวมค่าทองตามไซส์ +{THB(sizeSurcharge)})
              </p>
            )}
          </div>

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
                  onlyWhiteGold={Boolean(metalChoice?.onlyWhiteGold)}
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
              <img
                src={effectiveBaseImage}
                alt={ring.name}
                className="absolute inset-0 w-full h-full object-contain"
                style={{
                  ...(effectiveColorFilter ? { filter: effectiveColorFilter } : {}),
                  ...(baseImageTransform ? { transform: baseImageTransform } : {}),
                }}
              />
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

          <button
            type="button"
            onClick={() => setSummaryOpen(true)}
            className="w-full max-w-xs text-center py-3.5 text-xs tracking-widest uppercase font-sans transition-opacity hover:opacity-80"
            style={{ border: "1px solid var(--charcoal)", color: "var(--charcoal)", backgroundColor: "white" }}
          >
            สอบถามข้อมูล / สั่งทำแหวนนี้
          </button>
          <p className="text-xs font-sans mt-3 text-center" style={{ color: "var(--muted)" }}>
            แคปหน้าจอส่ง admin ได้เลยค่ะ
          </p>
        </main>
      </div>

      {summaryOpen && (
        <div
          onClick={() => setSummaryOpen(false)}
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ zIndex: 60, backgroundColor: "rgba(20,20,19,0.6)" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: "var(--ivory)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <p className="text-xs tracking-[0.2em] uppercase font-sans" style={{ color: "var(--charcoal)" }}>
                สรุปแบบแหวนของคุณ
              </p>
              <button
                type="button"
                onClick={() => setSummaryOpen(false)}
                aria-label="ปิด"
                className="text-lg leading-none px-1"
                style={{ color: "var(--muted)" }}
              >
                ✕
              </button>
            </div>

            <div className="p-5 flex flex-col items-center">
              <div
                className="relative w-full max-w-xs mb-4"
                style={{ aspectRatio: "1/1", backgroundColor: "var(--img-bg)", border: "1px solid var(--border)" }}
              >
                {effectiveBaseImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={effectiveBaseImage}
                    alt={ring.name}
                    className="absolute inset-0 w-full h-full object-contain"
                    style={{
                      ...(effectiveColorFilter ? { filter: effectiveColorFilter } : {}),
                      ...(baseImageTransform ? { transform: baseImageTransform } : {}),
                    }}
                  />
                )}
                {selectedChoices.map((c) =>
                  c.overlayImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={c.id}
                      src={c.overlayImage}
                      alt=""
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

              <h3 className="text-base tracking-wide mb-1 text-center" style={{ color: "var(--charcoal)" }}>
                {ring.name}
              </h3>
              <p className="text-lg font-sans font-light mb-4" style={{ color: "var(--gold)" }}>{THB(totalPrice)}</p>

              {summaryRows.length > 0 && (
                <div className="w-full mb-4">
                  {summaryRows.map((row, i) => (
                    <div
                      key={i}
                      className="flex justify-between gap-3 py-2 text-sm font-sans"
                      style={{ borderBottom: "1px solid var(--border)" }}
                    >
                      <span style={{ color: "var(--muted)" }}>{row.label}</span>
                      <span className="text-right" style={{ color: "var(--charcoal)" }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {meaningSummary && (
                <p className="text-sm font-sans text-center mb-4 leading-relaxed" style={{ color: "var(--charcoal)" }}>
                  {meaningSummary.generatedSummary}
                </p>
              )}

              <p className="text-sm font-sans text-center mb-4" style={{ color: "var(--charcoal)" }}>
                แคปหน้าจอนี้แล้วส่งให้แอดมินทางไลน์ได้เลยค่ะ
              </p>

              <a
                href="https://lin.ee/U9D2iyG"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center py-3.5 text-xs tracking-widest uppercase font-sans transition-opacity hover:opacity-80"
                style={{ border: "1px solid var(--charcoal)", color: "white", backgroundColor: "var(--charcoal)" }}
              >
                ไปที่ไลน์
              </a>
            </div>
          </div>
        </div>
      )}

      {ring.realPhotos.length > 0 && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setRealPhotosOpen(false)}
            aria-hidden="true"
            className="fixed inset-0 transition-opacity duration-300"
            style={{
              zIndex: 40,
              backgroundColor: "rgba(20,20,19,0.5)",
              opacity: realPhotosOpen ? 1 : 0,
              pointerEvents: realPhotosOpen ? "auto" : "none",
            }}
          />

          {/* Edge tab — click to open, hover (desktop) reveals the label */}
          <button
            type="button"
            onClick={() => setRealPhotosOpen(true)}
            onMouseEnter={() => setRealPhotosTabHovered(true)}
            onMouseLeave={() => setRealPhotosTabHovered(false)}
            aria-label="ดูภาพถ่ายจริง"
            className="fixed flex items-center gap-2 py-3 transition-all duration-200"
            style={{
              zIndex: 45,
              right: 0,
              top: "50%",
              transform: realPhotosOpen ? "translateY(-50%) translateX(100%)" : "translateY(-50%)",
              backgroundColor: "white",
              border: "1px solid var(--border)",
              borderRight: "none",
              borderRadius: "6px 0 0 6px",
              paddingLeft: realPhotosTabHovered ? 14 : 10,
              paddingRight: 10,
              boxShadow: "-2px 0 6px rgba(0,0,0,0.05)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--charcoal)" strokeWidth="1.5" aria-hidden="true" style={{ flexShrink: 0 }}>
              <path d="M4 7h3l2-2h6l2 2h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z" />
              <circle cx="12" cy="13" r="3.5" />
            </svg>
            <span
              className="text-xs font-sans whitespace-nowrap overflow-hidden transition-all duration-200"
              style={{
                maxWidth: realPhotosTabHovered ? 120 : 0,
                opacity: realPhotosTabHovered ? 1 : 0,
                color: "var(--charcoal)",
              }}
            >
              ตัวอย่างภาพจริง
            </span>
          </button>

          {/* Slide-out panel */}
          <div
            className="fixed top-0 right-0 h-full overflow-y-auto transition-transform duration-300"
            style={{
              zIndex: 50,
              width: "min(88vw, 420px)",
              backgroundColor: "var(--ivory)",
              borderLeft: "1px solid var(--border)",
              transform: realPhotosOpen ? "translateX(0)" : "translateX(100%)",
            }}
          >
            <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <p className="text-xs tracking-[0.2em] uppercase font-sans" style={{ color: "var(--charcoal)" }}>
                ภาพถ่ายจริง
              </p>
              <button
                type="button"
                onClick={() => setRealPhotosOpen(false)}
                aria-label="ปิด"
                className="text-lg leading-none px-1"
                style={{ color: "var(--muted)" }}
              >
                ✕
              </button>
            </div>
            <div className="p-4 flex flex-col gap-3">
              {ring.realPhotos.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={url}
                  alt={`${ring.name} ภาพถ่ายจริง ${i + 1}`}
                  className="w-full aspect-square object-cover"
                  style={{ border: "1px solid var(--border)" }}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
