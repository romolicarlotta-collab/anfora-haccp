import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          ingredient: true
        }
      }
    }
  });

  if (!recipe) {
    return NextResponse.json({ error: "Ricetta non trovata" }, { status: 404 });
  }

  return NextResponse.json(recipe);
}
