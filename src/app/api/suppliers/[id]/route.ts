import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supplierSchema } from "@/lib/validators";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      batches: true,
      ingredients: true
    }
  });

  if (!supplier) {
    return NextResponse.json({ error: "Fornitore non trovato" }, { status: 404 });
  }

  return NextResponse.json(supplier);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const payload = supplierSchema.partial().parse(await request.json());

  const updated = await prisma.supplier.update({
    where: { id },
    data: {
      ...payload,
      email: payload.email === "" ? null : payload.email
    }
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
      where: { supplierId: id },
    });

    if (linkedBatches > 0) {
      return NextResponse.json(
        { error: "Impossibile eliminare: ci sono lotti collegati a questo fornitore" },
        { status: 400 }
      );
    }

    await prisma.supplier.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/suppliers/[id]]", error);
    return NextResponse.json(
      { error: "Errore durante l'eliminazione del fornitore" },
      { status: 500 }
    );
  }
}
