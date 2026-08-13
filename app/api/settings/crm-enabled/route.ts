import { NextResponse } from "next/server";
import { getCrmEnabled } from "@/lib/crm-settings";

export async function GET() {
  return NextResponse.json({ enabled: await getCrmEnabled() });
}
