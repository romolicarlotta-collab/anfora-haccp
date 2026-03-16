import { CheckStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { haccpCheckSchema, haccpCheckUpdateSchema } from "@/lib/validators";

export async function GET() {
  const checks = await prisma.haccpCheck.findMany({
    include: {
      operationalArea: true,
      assignedTo: true
    },
    orderBy: {
      dueAt: "desc"
    }
  });

  return NextResponse.json(checks);
}

export async function POST(request: Request) {
  const payload = haccpCheckSchema.parse(await request.json());

  const check = await prisma.haccpCheck.create({
    data: {
      title: payload.title,
      checklistType: payload.checklistType,
      status: payload.status as CheckStatus,
      dueAt: new Date(payload.dueAt),
      operationalAreaId: payload.operationalAreaId,
      assignedToId: payload.assignedToId,
      notes: payload.notes
    }
  });

  return NextResponse.json(check, { status: 201 });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const { id, ...fields } = body;

  if (!id) {
    return NextResponse.json({ error: "ID obbligatorio" }, { status: 400 });
  }

  const payload = haccpCheckUpdateSchema.parse(fields);

  const data: Record<string, unknown> = { ...payload };

  if (payload.status === "COMPLETED") {
    data.completedAt = new Date();
  }

  const updated = await prisma.haccpCheck.update({
    where: { id },
    data
  });

  return NextResponse.json(updated);
}
