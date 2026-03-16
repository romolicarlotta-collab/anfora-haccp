import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const areas = await prisma.operationalArea.findMany({
    orderBy: {
      name: "asc"
    }
  });

  return NextResponse.json(areas);
}
