import { NextResponse } from "next/server";
import { handleUpload } from "@vercel/blob/client";

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json();

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const jsonResponse = await (handleUpload as any)({
      body,
      request,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
        maximumSizeInBytes: 20 * 1024 * 1024,
      }),
      onUploadCompleted: async ({ blob }: { blob: { url: string } }) => {
        console.log("Upload completed:", blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 });
  }
}
