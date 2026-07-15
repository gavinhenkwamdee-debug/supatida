import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (!ALLOWED_TYPES.includes(file.type))
      return NextResponse.json({ error: "Only JPEG, PNG, WebP, AVIF allowed" }, { status: 400 });
    if (file.size > MAX_FILE_SIZE)
      return NextResponse.json({ error: "File exceeds 8 MB" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const publicId = `banner-${Date.now()}`;

    const url = await new Promise<string>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { public_id: publicId, folder: "supatida/banners", overwrite: false, resource_type: "image" },
        (error, result) => {
          if (error || !result) return reject(error);
          resolve(result.secure_url);
        }
      ).end(buffer);
    });

    return NextResponse.json({ url });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
