import { NextResponse } from "next/server";
import { getSignupBanner } from "@/lib/crm-settings";

export async function GET() {
  return NextResponse.json(await getSignupBanner());
}
