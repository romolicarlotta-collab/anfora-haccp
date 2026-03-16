import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { labelReprintSchema } from "@/lib/validators";

export async function GET() {
  const logs = await prisma.labelPrintLog.findMany({
    include: {
      label: {
        include: {
          batch: true
        }
      },
      user: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return NextResponse.json(logs);
}

export async function POST(request: Request) {
  const payload = labelReprintSchema.parse(await request.json());

  const log = await prisma.$transaction(async (tx) => {
    const created = await tx.labelPrintLog.create({
      data: payload
    });

    await tx.auditLog.create({
      data: {
        userId: payload.userId,
        entityType: "label",
        entityId: payload.labelId,
        action: "REPRINT_LABEL",
        payload: {
          batchId: payload.batchId,
          reason: payload.reason,
          copies: payload.copies
        }
      }
    });

    return created;
  });

  return NextResponse.json(log, { status: 201 });
}
