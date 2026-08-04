"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CustomRingDetail } from "@/lib/customRings";

const THB = (n: number) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(n);

export default function CustomRingConfigurator({ ring }: { ring: CustomRingDetail }) {
  const [selections, setSelections] = useState<Record<number, number>>(() => {
    const initial: Record<number, number> = {};
    for (const g of ring.groups) {
      if (g.choices[0]) initial[g.id] = g.choices[0].id;
    }
    return initial;
  });
  const [groupIndex, setGroupIndex] = useState(0);

  const groups = ring.groups;
  const currentGroup = groups[groupIndex];

  const selectedChoices = useMemo(
    () =>
      groups
        .map((g) => g.choices.find((c) => c.id === selections[g.id]))
        .filter((c): c is NonNullable<typeof c> => Boolean(c)),
    [groups, selections]
  );

  const totalPrice = ring.basePrice + selectedChoices.reduce((sum, c) => sum + c.priceDelta, 0);

  // A choice can replace the whole ring photo (e.g. metal color) instead of
  // just layering a gem on top — last selected group with an override wins.
  const effectiveBaseImage = useMemo(() => {
    const override = [...selectedChoices].reverse().find((c) => c.baseImageOverride);
    return override?.baseImageOverride || ring.baseImage;
  }, [selectedChoices, ring.baseImage]);

  function selectChoice(groupId: number, choiceId: number) {
    setSelections((prev) => ({ ...prev, [groupId]: choiceId }));
  }

  const currentChoice = currentGroup ? groups[groupIndex].choices.find((c) => c.id === selections[currentGroup.id]) : undefined;

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

      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl tracking-wide" style={{ color: "var(--charcoal)" }}>{ring.name}</h2>
          <p className="text-xl font-sans font-light" style={{ color: "var(--gold)" }}>{THB(totalPrice)}</p>
        </div>

        {ring.description && (
          <p className="text-sm font-sans mb-6" style={{ color: "var(--muted)" }}>{ring.description}</p>
        )}

        {/* Image with layered overlays */}
        <div className="relative w-full mb-6" style={{ aspectRatio: "1/1", backgroundColor: "var(--img-bg)", border: "1px solid var(--border)" }}>
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
                className="absolute"
                style={{ left: `${c.overlayX}%`, top: `${c.overlayY}%`, width: `${c.overlayWidth}%`, transform: "translate(-50%, -50%)" }}
              />
            ) : null
          )}
        </div>

        {currentGroup && (
          <div className="text-center mb-4">
            <p className="text-xs tracking-[0.3em] uppercase font-sans" style={{ color: "var(--gold)" }}>{currentGroup.label}</p>
            <p className="text-sm font-sans mt-1" style={{ color: "var(--muted)" }}>{currentChoice?.label}</p>
          </div>
        )}

        {/* Swatches for current group */}
        {currentGroup && (
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {currentGroup.choices.map((choice) => {
              const isSelected = selections[currentGroup.id] === choice.id;
              return (
                <button
                  key={choice.id}
                  onClick={() => selectChoice(currentGroup.id, choice.id)}
                  className="rounded-full overflow-hidden flex-shrink-0"
                  style={{
                    width: 48,
                    height: 48,
                    border: isSelected ? "2px solid var(--charcoal)" : "1px solid var(--border)",
                    backgroundColor: "var(--img-bg)",
                  }}
                  title={choice.label}
                >
                  {choice.swatchImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={choice.swatchImage} alt={choice.label} className="w-full h-full object-cover" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Stepper */}
        {groups.length > 1 && (
          <div className="flex items-center justify-center gap-6 mb-10">
            <button
              onClick={() => setGroupIndex((i) => Math.max(0, i - 1))}
              disabled={groupIndex === 0}
              className="w-10 h-10 flex items-center justify-center disabled:opacity-30"
              style={{ border: "1px solid var(--border)", color: "var(--charcoal)" }}
            >
              ←
            </button>
            <span className="text-xs font-sans tracking-wider" style={{ color: "var(--muted)" }}>
              {groupIndex + 1} / {groups.length}
            </span>
            <button
              onClick={() => setGroupIndex((i) => Math.min(groups.length - 1, i + 1))}
              disabled={groupIndex === groups.length - 1}
              className="w-10 h-10 flex items-center justify-center disabled:opacity-30"
              style={{ backgroundColor: "var(--charcoal)", color: "var(--gold-light)" }}
            >
              →
            </button>
          </div>
        )}

        {/* Summary + LINE */}
        <div className="bg-white p-6" style={{ border: "1px solid var(--border)" }}>
          <p className="text-xs tracking-widest uppercase mb-3 font-sans" style={{ color: "var(--gold-dark)" }}>
            สรุปตัวเลือกของคุณ
          </p>
          <div className="space-y-1 mb-4">
            {groups.map((g) => {
              const c = g.choices.find((ch) => ch.id === selections[g.id]);
              return (
                <div key={g.id} className="flex justify-between text-xs font-sans">
                  <span style={{ color: "var(--muted)" }}>{g.label}</span>
                  <span style={{ color: "var(--charcoal)" }}>{c?.label ?? "-"}</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-sm mb-4 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
            <span style={{ color: "var(--charcoal)" }}>ราคารวม</span>
            <span style={{ color: "var(--gold)" }}>{THB(totalPrice)}</span>
          </div>
          <a
            href="https://lin.ee/U9D2iyG"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3 text-xs tracking-widest uppercase font-sans transition-opacity hover:opacity-80"
            style={{ backgroundColor: "#06C755", color: "white" }}
          >
            สอบถามข้อมูล
          </a>
          <p className="text-xs font-sans mt-2 text-center" style={{ color: "var(--muted)" }}>
            แคปหน้าจอส่ง admin ได้เลยค่ะ
          </p>
        </div>
      </div>
    </div>
  );
}
