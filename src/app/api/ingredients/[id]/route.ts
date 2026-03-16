import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ingredientSchema } from "@/lib/validators";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const ingredient = await prisma.ingredient.findUnique({
    where: { id },
    include: {
      preferredSupplier: true,
      recipeItems: {
        include: {
          recipe: true
        }
      },
      supplierBatches: true
    }
  });

  if (!ingredient) {
    return NextResponse.json({ error: "Ingrediente non trovato" }, { status: 404 });
  }

  return NextResponse.json(ingredient);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const payload = ingredientSchema.partial().parse(await request.json());

  const updated = await prisma.ingredient.update({
    where: { id },
    data: payload
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const linkedBatches = await prisma.batch.count({
      where: { ingredientId: id },
    });

    if (linkedBatches > 0) {
      return NextResponse.json(
        { error: "Impossibile eliminare: ci sono lotti collegati a questo ingrediente" },
        { status: 400 }
      );
    }

    await prisma.ingredient.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/ingredients/[id]]", error);
    return NextResponse.json(
      { error: "Errore durante l'eliminazione dell'ingrediente" },
      { status: 500 }
    );
  }
}
