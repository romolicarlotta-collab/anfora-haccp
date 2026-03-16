import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1),
  checklistType: z.string().min(1),
  dueAt: z.string(),
  operationalAreaId: z.string().optional(),
  assignedToId: z.string().optional(),
  notes: z.string().optional(),
});

const updateSchema = z.object({
  id: z.string(),
  status: z.enum(["PENDING", "COMPLETED", "OVERDUE"]),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createSchema.parse(body);

    const check = await prisma.haccpCheck.create({
      data: {
        title: data.title,
        checklistType: data.checklistType,
        status: "PENDING",
        dueAt: new Date(data.dueAt),
        operationalAreaId: data.operationalAreaId || undefined,
        assignedToId: data.assignedToId || undefined,
        notes: data.notes || undefined,
      },
      include: { operationalArea: true },
    });

    return NextResponse.json(check, { status: 201 });
  } catch (error) {
    console.error("[POST /api/checklist]", error);
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

    const check = await prisma.haccpCheck.update({
      where: { id: data.id },
      data: {
        status: data.status,
        completedAt: data.status === "COMPLETED" ? new Date() : undefined,
        notes: data.notes || undefined,
      },
      include: { operationalArea: true },
    });

    return NextResponse.json(check);
  } catch (error) {
    console.error("[PATCH /api/checklist]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Errore" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    await prisma.haccpCheck.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/checklist]", error);
    return NextResponse.json(
      { error: "Errore durante l'eliminazione della checklist" },
      { status: 500 }
    );
  }
}
