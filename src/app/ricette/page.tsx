import { prisma } from "@/lib/prisma";
import { Card, DataTable, PageHeader } from "@/components/ui";

const recipeCategoryLabels: Record<string, string> = {
  SEMILAVORATO: "Semilavorato",
  PRODOTTO_FINITO: "Prodotto finito",
  PIATTO: "Piatto",
};

export default async function RicettePage() {
  const recipes = await prisma.recipe.findMany({
    include: { items: { include: { ingredient: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Ricette e distinte base" description="Ricette standard, resa prevista, allergeni finali e shelf life." />
      <Card title="Ricettario" subtitle="Base per produzioni interne con scelta lotti reali.">
        <DataTable
          headers={["Codice", "Ricetta", "Categoria", "Resa", "Shelf life", "Allergeni"]}
          rows={recipes.map((recipe) => [
            recipe.code,
            recipe.name,
            recipeCategoryLabels[recipe.category] ?? recipe.category,
            `${recipe.expectedYield} ${recipe.yieldUnit}`,
            `${recipe.standardShelfLifeDays} giorni`,
            recipe.finalAllergens.length > 0 ? recipe.finalAllergens.join(", ") : "Nessuno",
          ])}
        />
      </Card>
    </div>
  );
}
