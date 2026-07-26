import { NextResponse } from "next/server";
import { getAllReviews } from "@/lib/reviews";
import { isAdminRequest } from "@/lib/admin-auth";

export async function GET(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const reviews = await getAllReviews();
  return NextResponse.json(reviews);
}
