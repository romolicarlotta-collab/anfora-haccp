import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { temperatureLogSchema } from "@/lib/validators";

export async function GET() {
  const logs = await prisma.temperatureLog.findMany({
    include: {
      operationalArea: true,
      recordedBy: true
    },
    orderBy: {
      recordedAt: "desc"
    }
  });

  return NextResponse.json(logs);
}

export async function POST(request: Request) {
  const payload = temperatureLogSchema.parse(await request.json());

  const isAlert =
    (payload.minThreshold != null && payload.value < payload.minThreshold) ||
    (payload.maxThreshold != null && payload.value > payload.maxThreshold);

  const log = await prisma.$transaction(async (tx) => {
    const created = await tx.temperatureLog.create({
      data: {
        title: payload.title,
        value: payload.value,
        minThreshold: payload.minThreshold,
        maxThreshold: payload.maxThreshold,
        operationalAreaId: payload.operationalAreaId,
        recordedById: payload.recordedById,
        isAlert,
        notes: payload.notes
      }
    });

    await tx.auditLog.create({
      data: {
        userId: payload.recordedById,
        entityType: "temperature_log",
        entityId: created.id,
        action: "CREATE_TEMPERATURE_LOG",
        payload: { ...payload, isAlert } as object
      }
    });

    return created;
  });

  return NextResponse.json(log, { status: 201 });
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    await prisma.temperatureLog.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/temperatures]", error);
    return NextResponse.json(
      { error: "Errore durante l'eliminazione del log temperatura" },
      { status: 500 }
    );
  }
}
