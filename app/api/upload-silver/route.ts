import { NextResponse } from "next/server";
import { uploadToR2 } from "@/lib/r2";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    if (!isVideo && !isImage)
      return NextResponse.json({ error: "Only JPEG, PNG, WebP, AVIF, MP4, WebM, MOV allowed" }, { status: 400 });

    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    if (file.size > maxSize)
      return NextResponse.json(
        { error: `File exceeds ${isVideo ? "50 MB" : "8 MB"}` },
        { status: 400 }
      );

    const ext = file.type.split("/")[1].replace("jpeg", "jpg").replace("quicktime", "mov");
    const key = `silver-jewelry/silver-${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadToR2(buffer, key, file.type);

    return NextResponse.json({ url, mediaType: isVideo ? "video" : "image" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
