import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(1),
  value: z.number(),
  minThreshold: z.number().optional(),
  maxThreshold: z.number().optional(),
  operationalAreaId: z.string().optional(),
  recordedById: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = schema.parse(body);

    const isAlert = (data.minThreshold != null && data.value < data.minThreshold) ||
                    (data.maxThreshold != null && data.value > data.maxThreshold);

    const log = await prisma.temperatureLog.create({
      data: {
        title: data.title,
        value: data.value,
        minThreshold: data.minThreshold,
        maxThreshold: data.maxThreshold,
        operationalAreaId: data.operationalAreaId || undefined,
        recordedById: data.recordedById || undefined,
        isAlert,
        notes: data.notes || undefined,
      },
      include: { operationalArea: true },
    });

    // If alert, create a non-conformity automatically
    if (isAlert) {
      await prisma.nonConformity.create({
        data: {
          title: `Temperatura fuori soglia: ${data.title}`,
          description: `Valore registrato ${data.value}°C (soglia: ${data.minThreshold ?? "N/A"} / ${data.maxThreshold ?? "N/A"}°C)`,
          severity: "Alta",
          status: "OPEN",
          actions: {
            create: {
              description: "Verificare la causa e ripristinare la temperatura corretta",
              owner: "Responsabile HACCP",
            },
          },
        },
      });
    }

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error("[POST /api/temperatures/create]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Errore" },
      { status: 400 }
    );
  }
}
