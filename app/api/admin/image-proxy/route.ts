import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";

// Fetches an R2-hosted image server-side and streams it back same-origin —
// used only so admin tools can draw product photos onto a <canvas> (e.g. the
// 11.11 sold-out collage) without the browser tainting the canvas on a
// cross-origin <img>. Restricted to R2_PUBLIC_URL so this can't become an
// open proxy for arbitrary URLs.
export async function GET(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url).searchParams.get("url") || "";
  const base = process.env.R2_PUBLIC_URL;
  if (!base || !url.startsWith(`${base}/`)) {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  const res = await fetch(url);
  if (!res.ok) {
    return NextResponse.json({ error: "Fetch failed" }, { status: 502 });
  }

  const buffer = await res.arrayBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": res.headers.get("content-type") || "image/jpeg",
      "Cache-Control": "private, max-age=300",
    },
  });
}
