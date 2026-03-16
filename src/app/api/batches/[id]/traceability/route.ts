import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Types for the traceability tree nodes
// ---------------------------------------------------------------------------
interface TraceNode {
  batchId: string;
  code: string;
  kind: string;
  productName: string;
  quantityUsed?: number | string | null;
  unitOfMeasure?: string | null;
  ingredientName?: string | null;
  children: TraceNode[];
}

// ---------------------------------------------------------------------------
// Backward traceability: walk up the supply chain
// ---------------------------------------------------------------------------
async function traceBackward(
  batchId: string,
  visited: Set<string> = new Set(),
): Promise<TraceNode | null> {
  if (visited.has(batchId)) return null;
  visited.add(batchId);

  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    select: {
      id: true,
      code: true,
      kind: true,
      productName: true,
      parentBatchId: true,
    },
  });

  if (!batch) return null;

  const node: TraceNode = {
    batchId: batch.id,
    code: batch.code,
    kind: batch.kind,
    productName: batch.productName,
    children: [],
  };

  if (batch.kind === "PRODUCTION") {
    // Find all ingredient batches that went into this production batch
    const sourceItems = await prisma.productionBatchItem.findMany({
      where: { producedBatchId: batchId },
      include: {
        consumedBatch: {
          select: { id: true, code: true, kind: true, productName: true },
        },
        ingredient: { select: { name: true } },
      },
    });

    for (const item of sourceItems) {
      const childNode = await traceBackward(item.consumedBatch.id, visited);
      if (childNode) {
        childNode.quantityUsed = item.quantityUsed?.toString() ?? null;
        childNode.unitOfMeasure = item.unitOfMeasure;
        childNode.ingredientName = item.ingredient?.name ?? null;
        node.children.push(childNode);
      }
    }
  } else if (batch.kind === "DERIVED" && batch.parentBatchId) {
    // Walk up to the parent batch
    const parentNode = await traceBackward(batch.parentBatchId, visited);
    if (parentNode) {
      node.children.push(parentNode);
    }
  }

  return node;
}

// ---------------------------------------------------------------------------
// Forward traceability: walk down the distribution chain
// ---------------------------------------------------------------------------
async function traceForward(
  batchId: string,
  visited: Set<string> = new Set(),
): Promise<TraceNode | null> {
  if (visited.has(batchId)) return null;
  visited.add(batchId);

  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    select: { id: true, code: true, kind: true, productName: true },
  });

  if (!batch) return null;

  const node: TraceNode = {
    batchId: batch.id,
    code: batch.code,
    kind: batch.kind,
    productName: batch.productName,
    children: [],
  };

  // 1. Find DERIVED child batches (direct splits / portions)
  const childBatches = await prisma.batch.findMany({
    where: { parentBatchId: batchId },
    select: { id: true },
  });

  for (const child of childBatches) {
    const childNode = await traceForward(child.id, visited);
    if (childNode) {
      node.children.push(childNode);
    }
  }

  // 2. Find PRODUCTION batches that consumed this batch as an ingredient
  const usedInProduction = await prisma.productionBatchItem.findMany({
    where: { consumedBatchId: batchId },
    include: {
      producedBatch: {
        select: { id: true },
      },
      ingredient: { select: { name: true } },
    },
  });

  for (const item of usedInProduction) {
    const prodNode = await traceForward(item.producedBatch.id, visited);
    if (prodNode) {
      prodNode.quantityUsed = item.quantityUsed?.toString() ?? null;
      prodNode.unitOfMeasure = item.unitOfMeasure;
      prodNode.ingredientName = item.ingredient?.name ?? null;
      node.children.push(prodNode);
    }
  }

  return node;
}

// ---------------------------------------------------------------------------
// GET /api/batches/[id]/traceability
// ---------------------------------------------------------------------------
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const batch = await prisma.batch.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!batch) {
      return NextResponse.json(
        { error: "Batch not found" },
        { status: 404 },
      );
    }

    const [backward, forward] = await Promise.all([
      traceBackward(id),
      traceForward(id),
    ]);

    return NextResponse.json({ backward, forward });
  } catch (error) {
    console.error("[GET /api/batches/[id]/traceability]", error);
    return NextResponse.json(
      { error: "Failed to build traceability tree" },
      { status: 500 },
    );
  }
}
