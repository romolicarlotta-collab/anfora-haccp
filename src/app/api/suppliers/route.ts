import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supplierSchema } from "@/lib/validators";

export async function GET() {
  const suppliers = await prisma.supplier.findMany({
    include: {
      _count: { select: { batches: true, ingredients: true } },
    },
    orderBy: {
      name: "asc"
    }
  });

  return NextResponse.json(suppliers);
}

export async function POST(request: Request) {
  const payload = supplierSchema.parse(await request.json());
  const supplier = await prisma.supplier.create({
    data: {
      ...payload,
      email: payload.email || null
    }
  });

  return NextResponse.json(supplier, { status: 201 });
}
