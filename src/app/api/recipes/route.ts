import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recipeSchema } from "@/lib/validators";

export async function GET() {
  const recipes = await prisma.recipe.findMany({
    include: {
      items: {
        include: {
          ingredient: true
        }
      }
    },
    orderBy: {
      name: "asc"
    }
  });

  return NextResponse.json(recipes);
}

export async function POST(request: Request) {
  const payload = recipeSchema.parse(await request.json());

  const { items, ...recipeData } = payload;

  const recipe = await prisma.$transaction(async (tx) => {
    const created = await tx.recipe.create({
      data: {
        name: recipeData.name,
        code: recipeData.code,
        category: recipeData.category,
        instructions: recipeData.instructions,
        expectedYield: recipeData.expectedYield,
        yieldUnit: recipeData.yieldUnit,
        finalAllergens: recipeData.finalAllergens,
        standardShelfLifeDays: recipeData.standardShelfLifeDays,
        items: {
          create: items.map((item) => ({
            ingredientId: item.ingredientId,
            quantity: item.quantity,
            unit: item.unit
          }))
        }
      },
      include: {
        items: {
          include: {
            ingredient: true
          }
        }
      }
    });

    await tx.auditLog.create({
      data: {
        entityType: "recipe",
        entityId: created.id,
        action: "CREATE_RECIPE",
        payload: payload as object
      }
    });

    return created;
  });

  return NextResponse.json(recipe, { status: 201 });
}
