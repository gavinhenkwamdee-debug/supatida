import { notFound } from "next/navigation";
import WriteReviewPageClient from "@/components/WriteReviewPageClient";
import type { ReviewType } from "@/lib/reviews";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ type: string }>;
}

export default async function WriteReviewPage({ params }: Props) {
  const { type } = await params;
  if (type !== "preorder" && type !== "product") notFound();
  return <WriteReviewPageClient type={type as ReviewType} />;
}
