import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const attachments = await prisma.attachment.findMany({
      include: {
        supplier: true,
        batch: true,
      },
      orderBy: { uploadedAt: "desc" },
    });
    return NextResponse.json(attachments);
  } catch (error) {
    console.error("[GET /api/documents]", error);
    return NextResponse.json([], { status: 500 });
  }
}
