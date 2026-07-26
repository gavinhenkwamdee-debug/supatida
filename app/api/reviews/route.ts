import { NextResponse } from "next/server";
import { createReview, getApprovedReviews } from "@/lib/reviews";
import { CATEGORIES } from "@/lib/db";

const MIN_TEXT_LENGTH = 90;
const MAX_NAME_LENGTH = 60;

export async function GET() {
  const reviews = await getApprovedReviews();
  return NextResponse.json(reviews);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { type, name, rating, text, imageUrl, category } = body;

  if (type !== "preorder" && type !== "product") {
    return NextResponse.json({ error: "Invalid review type" }, { status: 400 });
  }

  const trimmedName = typeof name === "string" ? name.trim() : "";
  if (!trimmedName || trimmedName.length > MAX_NAME_LENGTH) {
    return NextResponse.json({ error: "กรุณาใส่ชื่อ" }, { status: 400 });
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "กรุณาให้คะแนนดาว 1-5" }, { status: 400 });
  }

  const trimmedText = typeof text === "string" ? text.trim() : "";
  if (trimmedText.length < MIN_TEXT_LENGTH) {
    return NextResponse.json(
      { error: `รีวิวต้องมีความยาวอย่างน้อย ${MIN_TEXT_LENGTH} ตัวอักษร` },
      { status: 400 }
    );
  }

  if (type === "preorder") {
    if (imageUrl || category) {
      return NextResponse.json({ error: "Invalid preorder review fields" }, { status: 400 });
    }
  } else {
    if (typeof imageUrl !== "string" || !imageUrl) {
      return NextResponse.json({ error: "กรุณาอัพโหลดรูปสินค้า" }, { status: 400 });
    }
    if (typeof category !== "string" || !CATEGORIES.includes(category)) {
      return NextResponse.json({ error: "กรุณาเลือกประเภทสินค้า" }, { status: 400 });
    }
  }

  const review = await createReview({
    type,
    name: trimmedName,
    rating,
    text: trimmedText,
    imageUrl: type === "product" ? imageUrl : null,
    category: type === "product" ? category : null,
  });

  return NextResponse.json(review);
}
