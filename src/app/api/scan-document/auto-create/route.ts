import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateBatchCode } from "@/lib/domain/batches";

// ---------------------------------------------------------------------------
// POST /api/scan-document/auto-create
// Takes extracted scan data and auto-creates suppliers, ingredients, and batches
// ---------------------------------------------------------------------------

interface ScannedItem {
  productName: string;
  supplierLotCode?: string | null;
  quantity?: number | null;
  unitOfMeasure?: string | null;
  expiresAt?: string | null;
  price?: number | null;
  notes?: string | null;
}

interface ScanData {
  supplier?: {
    name?: string | null;
    vatNumber?: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;
  documentDate?: string | null;
  items: ScannedItem[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scanData, operatorName, operationalAreaId, storageLocationId, conformity } = body as {
      scanData: ScanData;
      operatorName?: string;
      operationalAreaId?: string;
      storageLocationId?: string;
      conformity?: boolean;
    };

    if (!scanData?.items?.length) {
      return NextResponse.json({ error: "Nessun prodotto da registrare" }, { status: 400 });
    }

    const results = await prisma.$transaction(async (tx) => {
      // 1. Find or create supplier
      let supplierId: string | undefined;
      if (scanData.supplier?.name) {
        const supplierName = scanData.supplier.name.trim();
        let supplier = await tx.supplier.findFirst({
          where: {
            OR: [
              { name: { contains: supplierName, mode: "insensitive" } },
              ...(scanData.supplier.vatNumber
                ? [{ vatNumber: scanData.supplier.vatNumber }]
                : []),
            ],
          },
        });

        if (!supplier) {
          supplier = await tx.supplier.create({
            data: {
              name: supplierName,
              vatNumber: scanData.supplier.vatNumber || undefined,
              phone: scanData.supplier.phone || undefined,
              email: scanData.supplier.email || undefined,
              notes: "Creato automaticamente da scansione DDT",
            },
          });
        }
        supplierId = supplier.id;
      }

      // 2. Process each item
      const createdBatches: Array<{
        id: string;
        code: string;
        productName: string;
        quantity: number;
        unit: string;
        supplierLotCode: string | null;
        isNewIngredient: boolean;
        isNewSupplier: boolean;
      }> = [];

      for (const item of scanData.items) {
        if (!item.productName) continue;

        const productName = item.productName.trim();
        const qty = item.quantity ?? 1;
        const unit = item.unitOfMeasure ?? "pz";

        // Find or create ingredient
        let ingredient = await tx.ingredient.findFirst({
          where: {
            OR: [
              { name: { contains: productName, mode: "insensitive" } },
              { code: { contains: productName.substring(0, 5).toUpperCase(), mode: "insensitive" } },
            ],
          },
        });

        let isNewIngredient = false;
        if (!ingredient) {
          isNewIngredient = true;
          // Generate unique code
          const baseCode = productName
            .replace(/[^A-Za-z0-9]/g, "")
            .substring(0, 6)
            .toUpperCase();
          const count = await tx.ingredient.count({
            where: { code: { startsWith: baseCode } },
          });
          const code = count > 0 ? `${baseCode}${count + 1}` : baseCode;

          ingredient = await tx.ingredient.create({
            data: {
              name: productName,
              code,
              category: "Generico",
              unitOfMeasure: unit,
              allergens: [],
              standardShelfLifeDays: 7,
              storageTemperature: "0-4°C",
              preferredSupplierId: supplierId,
              haccpNotes: "Creato automaticamente da scansione DDT",
            },
          });
        }

        // Create batch
        const batchCode = generateBatchCode(productName);
        const batch = await tx.batch.create({
          data: {
            code: batchCode,
            kind: "SUPPLIER",
            status: "ACTIVE",
            productName,
            ingredientId: ingredient.id,
            supplierId,
            operationalAreaId: operationalAreaId || undefined,
            storageLocationId: storageLocationId || undefined,
            supplierLotCode: item.supplierLotCode || undefined,
            quantityReceived: qty,
            quantityAvailable: qty,
            unitOfMeasure: unit,
            dateReceived: scanData.documentDate
              ? new Date(scanData.documentDate)
              : new Date(),
            expiresAt: item.expiresAt ? new Date(item.expiresAt) : undefined,
            conformityOutcome: conformity !== false,
            operatorName: operatorName || "Scansione automatica",
            notes: item.notes || undefined,
            allergens: [],
          },
        });

        await tx.auditLog.create({
          data: {
            action: "BATCH_CREATED_FROM_SCAN",
            entityType: "Batch",
            entityId: batch.id,
            payload: {
              kind: "SUPPLIER",
              productName,
              code: batch.code,
              quantityReceived: qty,
              fromScan: true,
            },
          },
        });

        createdBatches.push({
          id: batch.id,
          code: batch.code,
          productName,
          quantity: qty,
          unit,
          supplierLotCode: item.supplierLotCode || null,
          isNewIngredient,
          isNewSupplier: false,
        });
      }

      // Mark first batch with isNewSupplier if supplier was created
      if (createdBatches.length > 0 && supplierId) {
        createdBatches[0].isNewSupplier = !!(scanData.supplier?.name);
      }

      return {
        supplierName: scanData.supplier?.name ?? null,
        supplierId,
        batchesCreated: createdBatches.length,
        batches: createdBatches,
      };
    });

    return NextResponse.json(results, { status: 201 });
  } catch (error) {
    console.error("[POST /api/scan-document/auto-create]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Errore nella registrazione automatica" },
      { status: 500 }
    );
  }
}
