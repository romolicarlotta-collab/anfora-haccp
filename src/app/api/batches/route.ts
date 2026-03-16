import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateBatchCode } from "@/lib/domain/batches";
import { z } from "zod";

// ---------------------------------------------------------------------------
// GET /api/batches — List batches with optional filters
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const status = searchParams.get("status");
    const kind = searchParams.get("kind");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (kind) {
      where.kind = kind;
    }

    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { productName: { contains: search, mode: "insensitive" } },
        { supplierLotCode: { contains: search, mode: "insensitive" } },
        { operatorName: { contains: search, mode: "insensitive" } },
      ];
    }

    const batches = await prisma.batch.findMany({
      where,
      include: {
        ingredient: true,
        recipe: true,
        supplier: true,
        operationalArea: true,
        storageLocation: true,
        parentBatch: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(batches);
  } catch (error) {
    console.error("[GET /api/batches]", error);
    return NextResponse.json(
      { error: "Failed to fetch batches" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/batches — Create a new SUPPLIER batch (goods receiving)
// ---------------------------------------------------------------------------

const createBatchSchema = z.object({
  productName: z.string().min(1, "Product name is required"),
  ingredientId: z.string().optional(),
  supplierId: z.string().optional(),
  operationalAreaId: z.string().optional(),
  storageLocationId: z.string().optional(),
  supplierLotCode: z.string().optional(),
  quantityReceived: z.number().positive("Quantity must be positive"),
  unitOfMeasure: z.string().min(1, "Unit of measure is required"),
  lowStockThreshold: z.number().positive().optional(),
  dateReceived: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  storageCondition: z.string().optional(),
  inboundTemperature: z.number().optional(),
  conformityOutcome: z.union([z.boolean(), z.string()]).optional(),
  operatorName: z.string().optional(),
  notes: z.string().optional(),
  allergens: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createBatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;

    const batch = await prisma.$transaction(async (tx) => {
      const code = generateBatchCode(data.productName);
      const newBatch = await tx.batch.create({
        data: {
          code,
          kind: "SUPPLIER",
          status: "ACTIVE",
          productName: data.productName,
          ingredientId: data.ingredientId,
          supplierId: data.supplierId,
          operationalAreaId: data.operationalAreaId,
          storageLocationId: data.storageLocationId,
          supplierLotCode: data.supplierLotCode,
          quantityReceived: data.quantityReceived,
          quantityAvailable: data.quantityReceived,
          unitOfMeasure: data.unitOfMeasure,
          lowStockThreshold: data.lowStockThreshold,
          dateReceived: data.dateReceived
            ? new Date(data.dateReceived)
            : new Date(),
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
          storageCondition: data.storageCondition,
          inboundTemperature: data.inboundTemperature,
          conformityOutcome: typeof data.conformityOutcome === "string"
            ? data.conformityOutcome === "CONFORME"
            : data.conformityOutcome ?? null,
          operatorName: data.operatorName,
          notes: data.notes,
          allergens: data.allergens ?? [],
        },
        include: {
          ingredient: true,
          supplier: true,
          operationalArea: true,
          storageLocation: true,
        },
      });

      await tx.auditLog.create({
        data: {
          action: "BATCH_CREATED",
          entityType: "Batch",
          entityId: newBatch.id,
          payload: {
            kind: "SUPPLIER",
            productName: newBatch.productName,
            code: newBatch.code,
            quantityReceived: data.quantityReceived,
          },
        },
      });

      return newBatch;
    });

    return NextResponse.json(batch, { status: 201 });
  } catch (error) {
    console.error("[POST /api/batches]", error);
    return NextResponse.json(
      { error: "Failed to create batch" },
      { status: 500 },
    );
  }
}
