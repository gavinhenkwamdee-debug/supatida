import { NextResponse } from "next/server";
import { getAllGroupsWithChoices } from "@/lib/customRings";
import { isAdminRequest } from "@/lib/admin-auth";

export async function GET(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const groups = await getAllGroupsWithChoices();
  return NextResponse.json(groups);
}
