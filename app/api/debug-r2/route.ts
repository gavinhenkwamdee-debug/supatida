import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKey = process.env.R2_ACCESS_KEY_ID;
  const secret = process.env.R2_SECRET_ACCESS_KEY;
  const publicUrl = process.env.R2_PUBLIC_URL;

  return NextResponse.json({
    R2_ACCOUNT_ID: accountId ? `${accountId.slice(0, 6)}...${accountId.slice(-4)}` : "MISSING",
    R2_ACCESS_KEY_ID: accessKey ? `${accessKey.slice(0, 6)}...${accessKey.slice(-4)}` : "MISSING",
    R2_SECRET_ACCESS_KEY: secret ? `${secret.slice(0, 6)}...${secret.slice(-4)} (len:${secret.length})` : "MISSING",
    R2_PUBLIC_URL: publicUrl || "MISSING",
  });
}
