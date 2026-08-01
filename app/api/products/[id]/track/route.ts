import { NextResponse } from "next/server";
import { incrementProductLineClicks, incrementProductViews } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const { type } = await request.json();

  if (type !== "view" && type !== "line_click") {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const productId = parseInt(id);
  if (type === "view") await incrementProductViews(productId);
  else await incrementProductLineClicks(productId);

  return NextResponse.json({ ok: true });
}
