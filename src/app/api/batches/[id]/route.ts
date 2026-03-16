import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// GET /api/batches/[id] — Get a single batch with all relations
// ---------------------------------------------------------------------------
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const batch = await prisma.batch.findUnique({
      where: { id },
      include: {
        ingredient: true,
        recipe: true,
        supplier: true,
        operationalArea: true,
        storageLocation: true,
        parentBatch: true,
        childBatches: true,
        sourceItems: {
          include: {
            consumedBatch: true,
            ingredient: true,
          },
        },
        movements: true,
        labels: {
          include: {
            printLogs: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!batch) {
      return NextResponse.json(
        { error: "Batch not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(batch);
  } catch (error) {
    console.error("[GET /api/batches/[id]]", error);
    return NextResponse.json(
      { error: "Failed to fetch batch" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/batches/[id] — Update a batch
// ---------------------------------------------------------------------------
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const allowedFields: Record<string, unknown> = {};
    const permitted = [
      "status",
      "quantityAvailable",
      "storageLocationId",
      "operationalAreaId",
      "notes",
      "lowStockThreshold",
    ] as const;

    for (const key of permitted) {
      if (key in body) {
        allowedFields[key] = body[key];
      }
    }

    const updated = await prisma.batch.update({
      where: { id },
      data: allowedFields,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH /api/batches/[id]]", error);
    return NextResponse.json(
      { error: "Failed to update batch" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/batches/[id] — Delete a batch (if no children or production items)
// ---------------------------------------------------------------------------
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const [childCount, productionItemCount] = await Promise.all([
      prisma.batch.count({ where: { parentBatchId: id } }),
      prisma.productionBatchItem.count({
        where: {
          OR: [{ producedBatchId: id }, { consumedBatchId: id }],
        },
      }),
    ]);

    if (childCount > 0 || productionItemCount > 0) {
      return NextResponse.json(
        { error: "Impossibile eliminare: questo lotto ha derivati o è usato in produzioni" },
        { status: 400 },
      );
    }

    await prisma.batch.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/batches/[id]]", error);
    return NextResponse.json(
      { error: "Failed to delete batch" },
      { status: 500 },
    );
  }
}
