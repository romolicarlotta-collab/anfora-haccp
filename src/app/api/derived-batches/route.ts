import { BatchKind } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateDerivedCodes, validateDerivedAllocation } from "@/lib/domain/batches";
import { derivedBatchSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const payload = derivedBatchSchema.parse(await request.json());
  try {
    const result = await prisma.$transaction(async (tx) => {
      const parent = await tx.batch.findUniqueOrThrow({
        where: { id: payload.parentBatchId }
      });

      const allocation = validateDerivedAllocation({
        count: payload.count,
        quantityPerChild: payload.quantityPerChild,
        availableQuantity: Number(parent.quantityAvailable)
      });

      if (!allocation.isValid) {
        throw new Error("La somma delle quantita' dei sublotti supera la disponibilita' del lotto padre.");
      }

      const codes =
        payload.suffixMode === "CUSTOM" && payload.customCodes?.length
          ? payload.customCodes
          : generateDerivedCodes(payload.parentBatchCode, payload.count);

      const createdIds: string[] = [];
      for (const code of codes) {
        const child = await tx.batch.create({
          data: {
            code,
            kind: BatchKind.DERIVED,
            status: parent.status,
            productName: parent.productName,
            ingredientId: parent.ingredientId,
            recipeId: parent.recipeId,
            parentBatchId: parent.id,
            operationalAreaId: parent.operationalAreaId,
            storageLocationId: payload.storageLocationId || parent.storageLocationId,
            quantityReceived: payload.quantityPerChild,
            quantityAvailable: payload.quantityPerChild,
            unitOfMeasure: payload.unitOfMeasure,
            lowStockThreshold: parent.lowStockThreshold,
            dateReceived: parent.dateReceived,
            producedAt: parent.producedAt,
            expiresAt: parent.expiresAt,
            storageCondition: parent.storageCondition,
            operatorName: payload.operatorName,
            notes: "Sublotto creato da porzionamento/travaso",
            allergens: parent.allergens,
            genealogySnapshot: parent.genealogySnapshot
          }
        });
        createdIds.push(child.id);
      }

      await tx.batch.update({
        where: { id: parent.id },
        data: {
          quantityAvailable: {
            decrement: allocation.total
          }
        }
      });

      await tx.batchMovement.create({
        data: {
          batchId: parent.id,
          movementType: "DERIVED",
          quantity: allocation.total,
          unitOfMeasure: payload.unitOfMeasure,
          reason: `Creazione ${payload.count} sublotti`,
          performedBy: payload.operatorName
        }
      });

      await tx.auditLog.create({
        data: {
          entityType: "batch",
          entityId: parent.id,
          action: "CREATE_DERIVED_BATCHES",
          payload: {
            codes,
            quantityPerChild: payload.quantityPerChild
          }
        }
      });

      return { parentId: parent.id, childIds: createdIds, codes };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Errore durante la creazione dei sublotti."
      },
      { status: 400 }
    );
  }
}
