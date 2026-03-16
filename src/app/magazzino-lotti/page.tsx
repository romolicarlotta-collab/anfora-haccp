import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge, Card, DataTable, PageHeader } from "@/components/ui";

const batchKindLabels: Record<string, string> = {
  SUPPLIER: "Fornitore",
  PRODUCTION: "Produzione",
  DERIVED: "Sublotto",
};

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

export default async function MagazzinoLottiPage() {
  const batches = await prisma.batch.findMany({
    include: {
      ingredient: true,
      recipe: true,
      operationalArea: true,
      storageLocation: true,
      parentBatch: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Magazzino lotti" description="Stock per lotto, FEFO/FIFO, stati, relazioni padre-figlio e azioni rapide per esaurimento." />
      <Card title="Situazione lotti" subtitle="Ogni lotto espone disponibilita', scadenza, area e parentela.">
        <DataTable
          headers={["Lotto", "Prodotto", "Tipo", "Area", "Disponibile", "Stato", "Lotto padre"]}
          rows={batches.map((row) => [
            <Link key={row.id} href={`/lotti/${row.code}`} className="font-semibold text-brass">{row.code}</Link>,
            row.productName,
            batchKindLabels[row.kind] ?? row.kind,
            row.operationalArea?.name ?? "-",
            `${row.quantityAvailable} ${row.unitOfMeasure}`,
            <Badge key={`status-${row.id}`} tone={batchStatusTone[row.status] ?? "success"}>{batchStatusLabels[row.status] ?? row.status}</Badge>,
            row.parentBatch?.code ?? "-",
          ])}
        />
      </Card>
      <div className="grid gap-6 xl:grid-cols-3">
        <Card title="Regola low stock" subtitle="Caso d'uso lotto in esaurimento">
          <p className="text-sm text-slate">Soglia standard: minore del 20% o sotto valore minimo configurato.</p>
          <div className="mt-4 space-y-3 text-sm">
            <div className="rounded-3xl bg-sand p-4">Azione rapida: ristampa etichetta</div>
            <div className="rounded-3xl bg-sand p-4">Azione rapida: crea sublotto / nuovo contenitore</div>
            <div className="rounded-3xl bg-sand p-4">Azione rapida: avvia nuova produzione</div>
          </div>
        </Card>
        <Card title="Vincoli" subtitle="Il sistema impedisce inconsistenze.">
          <ul className="space-y-3 text-sm text-slate">
            <li>Non utilizza lotti scaduti o bloccati.</li>
            <li>Non permette sublotti oltre la disponibilita&apos; residua.</li>
            <li>Traccia ogni movimento come evento auditabile.</li>
          </ul>
        </Card>
        <Card title="Padre-figlio" subtitle="Gerarchia lotto">
          <div className="space-y-3 text-sm">
            <div className="rounded-3xl border border-black/5 p-4">Lotto di produzione &rarr; sublotti derivati</div>
            <div className="rounded-3xl border border-black/5 p-4">Il codice figlio eredita il prefisso del padre</div>
            <div className="rounded-3xl border border-black/5 p-4">Disponibilita&apos; padre decrementata automaticamente</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
