export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge, Card, DataTable, PageHeader } from "@/components/ui";

const batchStatusLabels: Record<string, string> = {
  ACTIVE: "Attivo",
  LOW_STOCK: "In esaurimento",
  DEPLETED: "Esaurito",
  EXPIRED: "Scaduto",
  BLOCKED: "Bloccato",
};

const batchStatusTone: Record<string, "success" | "warning" | "danger"> = {
  ACTIVE: "success",
  LOW_STOCK: "warning",
  DEPLETED: "warning",
  EXPIRED: "danger",
  BLOCKED: "danger",
};

export default async function IngredientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const ingredient = await prisma.ingredient.findUnique({
    where: { id },
    include: {
      preferredSupplier: true,
      recipeItems: { include: { recipe: true } },
      supplierBatches: {
        where: { status: { in: ["ACTIVE", "LOW_STOCK"] } },
        orderBy: { expiresAt: "asc" },
      },
    },
  });

  if (!ingredient) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader title={ingredient.name} description="Dettaglio ingrediente con dati HACCP, fornitore abituale e parametri operativi." />
      <div className="grid gap-6 xl:grid-cols-3">
        <Card title="Scheda tecnica" subtitle="Campi principali">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-slate">Codice</dt><dd>{ingredient.code}</dd></div>
            <div className="flex justify-between"><dt className="text-slate">Categoria</dt><dd>{ingredient.category}</dd></div>
            <div className="flex justify-between"><dt className="text-slate">Unita&apos; di misura</dt><dd>{ingredient.unitOfMeasure}</dd></div>
            <div className="flex justify-between"><dt className="text-slate">Fornitore abituale</dt><dd>{ingredient.preferredSupplier?.name ?? "-"}</dd></div>
            <div className="flex justify-between"><dt className="text-slate">Shelf life</dt><dd>{ingredient.standardShelfLifeDays} giorni</dd></div>
          </dl>
        </Card>
        <Card title="Allergeni e conservazione" subtitle="Parametri operativi">
          <p className="text-sm text-slate">Temperatura di conservazione</p>
          <p className="mt-2 text-lg font-semibold">{ingredient.storageTemperature}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {ingredient.allergens.length > 0 ? (
              ingredient.allergens.map((a) => (
                <Badge key={a} tone="danger">{a}</Badge>
              ))
            ) : (
              <Badge tone="success">Nessun allergene</Badge>
            )}
          </div>
        </Card>
        <Card title="Linee guida HACCP" subtitle="Per l'MVP sono configurate a livello ingrediente.">
          <p className="text-sm text-slate">
            {ingredient.haccpNotes ?? "Verificare integrita\u0027 imballo, conformita\u0027 etichetta fornitore e bloccare l\u0027uso in caso di non conformita\u0027."}
          </p>
        </Card>
      </div>

      {ingredient.recipeItems.length > 0 && (
        <Card title="Utilizzato nelle ricette" subtitle={`Presente in ${ingredient.recipeItems.length} ricett${ingredient.recipeItems.length === 1 ? "a" : "e"}`}>
          <DataTable
            headers={["Codice", "Ricetta", "Quantita'", "UM"]}
            rows={ingredient.recipeItems.map((ri) => [
              ri.recipe.code,
              ri.recipe.name,
              ri.quantity.toString(),
              ri.unit,
            ])}
          />
        </Card>
      )}

      {ingredient.supplierBatches.length > 0 && (
        <Card title="Lotti attivi" subtitle="Lotti fornitore con disponibilita' residua">
          <DataTable
            headers={["Codice lotto", "Disponibile", "Scadenza", "Stato"]}
            rows={ingredient.supplierBatches.map((b) => [
              <Link key={b.id} href={`/lotti/${b.code}`} className="font-semibold text-brass">{b.code}</Link>,
              `${b.quantityAvailable} ${b.unitOfMeasure}`,
              b.expiresAt ? b.expiresAt.toLocaleDateString("it-IT") : "-",
              <Badge key={`status-${b.id}`} tone={batchStatusTone[b.status] ?? "success"}>{batchStatusLabels[b.status] ?? b.status}</Badge>,
            ])}
          />
        </Card>
      )}
    </div>
  );
}
