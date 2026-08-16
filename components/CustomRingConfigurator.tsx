"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CustomRingChoice, CustomRingDetail, CustomRingGroup, StoneKind } from "@/lib/customRings";

const THB = (n: number) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(n);

const STONE_KIND_LABEL: Record<StoneKind, string> = { diamond: "เพชร", gem: "พลอย" };

function isSizeGroup(label: string) {
  const l = label.toLowerCase();
  return l.includes("size") || l.includes("ไซส์") || l.includes("ไซซ์") || l.includes("ขนาด");
}

function GroupSection({
  group,
  selectedId,
  onToggle,
  stoneKind,
  onStoneKindChange,
}: {
  group: CustomRingGroup;
  selectedId: number | undefined;
  onToggle: (choiceId: number) => void;
  stoneKind?: StoneKind;
  onStoneKindChange?: (k: StoneKind) => void;
}) {
  const isMainPower = group.kind === "main_power";
  const availableKinds = useMemo(
    () => (isMainPower ? Array.from(new Set(group.choices.map((c) => c.stoneKind).filter((k): k is StoneKind => Boolean(k)))) : []),
    [isMainPower, group.choices]
  );
  const visibleChoices = isMainPower && stoneKind ? group.choices.filter((c) => c.stoneKind === stoneKind) : group.choices;
  const selectedChoice = group.choices.find((c) => c.id === selectedId);
  const sizeLike = isSizeGroup(group.label);
  const allHaveImages = visibleChoices.length > 0 && visibleChoices.every((c) => c.swatchImage);

  return (
    <div className="py-5" style={{ borderBottom: "1px solid var(--border)" }}>
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <p className="text-xs tracking-[0.25em] uppercase font-sans" style={{ color: "var(--muted)" }}>{group.label}</p>
        <p className="text-xs font-sans text-right" style={{ color: "var(--charcoal)" }}>{selectedChoice?.label ?? "None"}</p>
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

      {sizeLike ? (
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
              title={c.label}
              className="rounded-full overflow-hidden flex-shrink-0 transition-shadow"
              style={{
                width: 44,
                height: 44,
                border: selectedId === c.id ? "2px solid var(--charcoal)" : "1px solid var(--border)",
                backgroundColor: "var(--img-bg)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.swatchImage} alt={c.label} className="w-full h-full object-cover" />
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
              title={c.label}
              className="px-3 py-2.5 text-xs font-sans text-center transition-colors"
              style={{
                border: selectedId === c.id ? "1.5px solid var(--charcoal)" : "1px solid var(--border)",
                color: "var(--charcoal)",
                backgroundColor: "white",
              }}
            >
              {c.label}
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
    for (const g of ring.groups) if (g.choices[0]) initial[g.id] = g.choices[0].id;
    return initial;
  });
  const [powerStoneKind, setPowerStoneKind] = useState<Record<number, StoneKind>>(() => {
    const initial: Record<number, StoneKind> = {};
    for (const g of ring.groups) {
      if (g.kind === "main_power") {
        const first = g.choices.find((c) => c.stoneKind)?.stoneKind;
        if (first) initial[g.id] = first;
      }
    }
    return initial;
  });

  const groups = ring.groups;

  const selectedChoices = useMemo(
    () =>
      groups
        .map((g) => g.choices.find((c) => c.id === selections[g.id]))
        .filter((c): c is CustomRingChoice => Boolean(c)),
    [groups, selections]
  );

  const totalPrice = ring.basePrice + selectedChoices.reduce((sum, c) => sum + c.priceDelta, 0);

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
              />
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
                  style={{ left: `${c.overlayX}%`, top: `${c.overlayY}%`, width: `${c.overlayWidth}%`, transform: "translate(-50%, -50%)" }}
                />
              ) : null
            )}
          </div>

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
