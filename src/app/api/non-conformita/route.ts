import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  severity: z.enum(["Alta", "Media", "Bassa"]),
  correctiveAction: z.string().optional(),
  actionOwner: z.string().optional(),
});

const updateSchema = z.object({
  id: z.string(),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createSchema.parse(body);

    const nc = await prisma.nonConformity.create({
      data: {
        title: data.title,
        description: data.description,
        severity: data.severity,
        status: "OPEN",
        actions: data.correctiveAction ? {
          create: {
            description: data.correctiveAction,
            owner: data.actionOwner || "Responsabile HACCP",
          }
        } : undefined,
      },
      include: { actions: true },
    });

    return NextResponse.json(nc, { status: 201 });
  } catch (error) {
    console.error("[POST /api/non-conformita]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Errore" },
      { status: 400 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const data = updateSchema.parse(body);

    const nc = await prisma.nonConformity.update({
      where: { id: data.id },
      data: {
        status: data.status,
        closedAt: data.status === "CLOSED" || data.status === "RESOLVED" ? new Date() : undefined,
      },
      include: { actions: true },
    });

    return NextResponse.json(nc);
  } catch (error) {
    console.error("[PATCH /api/non-conformita]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Errore" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    await prisma.nonConformity.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/non-conformita]", error);
    return NextResponse.json(
      { error: "Errore durante l'eliminazione della non conformità" },
      { status: 500 }
    );
  }
}
