import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ingredientSchema } from "@/lib/validators";

export async function GET() {
  const items = await prisma.ingredient.findMany({
    include: {
      preferredSupplier: true
    },
    orderBy: {
      name: "asc"
    }
  });

  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const payload = ingredientSchema.parse(await request.json());

  const item = await prisma.ingredient.create({
    data: payload
  });

  return NextResponse.json(item, { status: 201 });
}
