import { BatchKind, BatchStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { productionBatchSchema } from "@/lib/validators";

export async function GET() {
  const batches = await prisma.batch.findMany({
    where: {
      kind: BatchKind.PRODUCTION
    },
    include: {
      sourceItems: {
        include: {
          consumedBatch: true,
          ingredient: true
        }
      },
      labels: true
    },
    orderBy: {
      producedAt: "desc"
    }
  });

  return NextResponse.json(batches);
}

export async function POST(request: Request) {
  const payload = productionBatchSchema.parse(await request.json());

  try {
    const batch = await prisma.$transaction(async (tx) => {
      const sourceBatches = await tx.batch.findMany({
        where: {
          id: {
            in: payload.sourceItems.map((item) => item.consumedBatchId)
          }
        }
      });

      for (const item of payload.sourceItems) {
        const source = sourceBatches.find((batchItem) => batchItem.id === item.consumedBatchId);
        if (!source) {
          throw new Error(`Lotto sorgente non trovato: ${item.consumedBatchId}`);
        }
        if (source.status === BatchStatus.BLOCKED || source.status === BatchStatus.EXPIRED) {
          throw new Error(`Il lotto ${source.code} non puo' essere usato in produzione.`);
        }
        if (Number(source.quantityAvailable) < item.quantityUsed) {
          throw new Error(`Quantita' insufficiente sul lotto ${source.code}.`);
        }
      }

      const created = await tx.batch.create({
        data: {
          code: payload.code,
          kind: BatchKind.PRODUCTION,
          status: BatchStatus.ACTIVE,
          productName: payload.productName,
          recipeId: payload.recipeId,
          operationalAreaId: payload.operationalAreaId,
          storageLocationId: payload.storageLocationId,
          quantityReceived: payload.quantityProduced,
          quantityAvailable: payload.quantityProduced,
          unitOfMeasure: payload.unitOfMeasure,
          lowStockThreshold: payload.lowStockThreshold,
          operatorName: payload.operatorName,
          producedAt: new Date(payload.producedAt),
          expiresAt: new Date(payload.expiresAt),
          allergens: payload.allergens,
          genealogySnapshot: {
            sourceItems: payload.sourceItems
          }
        }
      });

      for (const item of payload.sourceItems) {
        await tx.productionBatchItem.create({
          data: {
            producedBatchId: created.id,
            consumedBatchId: item.consumedBatchId,
            ingredientId: item.ingredientId,
            quantityUsed: item.quantityUsed,
            unitOfMeasure: item.unitOfMeasure
          }
        });

        await tx.batch.update({
          where: { id: item.consumedBatchId },
          data: {
            quantityAvailable: {
              decrement: item.quantityUsed
            }
          }
        });
      }

      await tx.batchMovement.create({
        data: {
          batchId: created.id,
          movementType: "PRODUCED",
          quantity: payload.quantityProduced,
          unitOfMeasure: payload.unitOfMeasure,
          reason: "Nuova produzione interna",
          performedBy: payload.operatorName
        }
      });

      await tx.auditLog.create({
        data: {
          entityType: "batch",
          entityId: created.id,
          action: "CREATE_PRODUCTION_BATCH",
          payload
        }
      });

      return created;
    });

    return NextResponse.json(batch, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Errore durante la creazione del lotto di produzione."
      },
      { status: 400 }
    );
  }
}
