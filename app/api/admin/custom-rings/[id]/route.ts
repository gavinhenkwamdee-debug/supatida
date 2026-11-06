import { NextResponse } from "next/server";
import { deleteCustomRing, getCustomRingById, replaceCustomRing } from "@/lib/customRings";
import type { DiamondShapeOverlay, GroupInput, GroupKind, RingFieldsInput, StoneKind } from "@/lib/customRings";
import { isAdminRequest } from "@/lib/admin-auth";

const GROUP_KINDS: GroupKind[] = ["generic", "dropdown", "text_input", "main_power", "secondary_power", "tertiary_power", "metal"];
const STONE_KINDS: StoneKind[] = ["diamond", "gem"];

function parseGroupKind(v: unknown): GroupKind {
  return GROUP_KINDS.includes(v as GroupKind) ? (v as GroupKind) : "generic";
}

function parseStoneKind(v: unknown): StoneKind | null {
  return STONE_KINDS.includes(v as StoneKind) ? (v as StoneKind) : null;
}

function parseDiamondShapeOverlays(v: unknown): Record<string, DiamondShapeOverlay> {
  if (!v || typeof v !== "object") return {};
  const out: Record<string, DiamondShapeOverlay> = {};
  for (const [shape, val] of Object.entries(v as Record<string, unknown>)) {
    if (!val || typeof val !== "object") continue;
    const o = val as Record<string, unknown>;
    out[shape] = {
      x: Number(o.x) || 50,
      y: Number(o.y) || 50,
      width: Number(o.width) || 20,
      rotation: Number(o.rotation) || 0,
    };
  }
  return out;
}

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const ring = await getCustomRingById(Number(id));
  if (!ring) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(ring);
}

export async function PUT(request: Request, { params }: Params) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json();

  const fields: RingFieldsInput = {
    name: String(body.name ?? "").trim() || "Untitled Ring",
    description: String(body.description ?? ""),
    basePrice: Number(body.basePrice) || 0,
    baseImage: String(body.baseImage ?? ""),
    enabled: Boolean(body.enabled),
  };

  const groups: GroupInput[] = Array.isArray(body.groups)
    ? body.groups.map((g: unknown, gi: number) => {
        const group = g as Record<string, unknown>;
        const kind = parseGroupKind(group.kind);
        return {
          label: String(group.label ?? "").trim() || "Group",
          sortOrder: gi,
          kind,
          placeholder: String(group.placeholder ?? ""),
          priceDelta: Number(group.priceDelta) || 0,
          choices:
            kind === "text_input"
              ? []
              : Array.isArray(group.choices)
              ? group.choices.map((c: unknown, ci: number) => {
                  const choice = c as Record<string, unknown>;
                  return {
                    label: String(choice.label ?? "").trim() || "Option",
                    swatchImage: String(choice.swatchImage ?? ""),
                    swatchZoom: Number(choice.swatchZoom) || 1,
                    swatchOffsetX: Number(choice.swatchOffsetX) || 0,
                    swatchOffsetY: Number(choice.swatchOffsetY) || 0,
                    swatchRotation: Number(choice.swatchRotation) || 0,
                    colorFilter: choice.colorFilter ? String(choice.colorFilter) : null,
                    overlayImage: choice.overlayImage ? String(choice.overlayImage) : null,
                    overlayX: Number(choice.overlayX) || 50,
                    overlayY: Number(choice.overlayY) || 50,
                    overlayWidth: Number(choice.overlayWidth) || 20,
                    overlayRotation: Number(choice.overlayRotation) || 0,
                    diamondShapeOverlays: parseDiamondShapeOverlays(choice.diamondShapeOverlays),
                    baseImageOverride: choice.baseImageOverride ? String(choice.baseImageOverride) : null,
                    baseImageZoom: Number(choice.baseImageZoom) || 1,
                    baseImageOffsetX: Number(choice.baseImageOffsetX) || 0,
                    baseImageOffsetY: Number(choice.baseImageOffsetY) || 0,
                    priceDelta: Number(choice.priceDelta) || 0,
                    sizeSurchargePerStep: Number(choice.sizeSurchargePerStep) || 0,
                    onlyWhiteGold: Boolean(choice.onlyWhiteGold),
                    isWhiteGoldOption: Boolean(choice.isWhiteGoldOption),
                    sortOrder: ci,
                    stoneKind: parseStoneKind(choice.stoneKind),
                    shape: choice.shape ? String(choice.shape) : null,
                  };
                })
              : [],
        };
      })
    : [];

  const ring = await replaceCustomRing(Number(id), fields, groups);
  if (!ring) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(ring);
}

export async function DELETE(request: Request, { params }: Params) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const ok = await deleteCustomRing(Number(id));
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
