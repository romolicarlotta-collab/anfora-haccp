import { Card, PageHeader } from "@/components/ui";

export default function ImpostazioniPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Impostazioni" description="Configurazioni globali, template etichette, timezone Europe/Rome e soglie lotti." />
      <div className="grid gap-6 xl:grid-cols-3">
        <Card title="Locale applicativo" subtitle="Valori base MVP">
          <p className="text-sm text-slate">Lingua default: Italiano</p>
          <p className="mt-2 text-sm text-slate">Timezone: Europe/Rome</p>
        </Card>
        <Card title="Soglie lotti" subtitle="Regole per low stock">
          <p className="text-sm text-slate">Default: 20% residuo o soglia assoluta definita per lotto.</p>
        </Card>
        <Card title="Template etichette" subtitle="Supporto termiche">
          <p className="text-sm text-slate">Template iniziale: 58x40 mm, QR opzionale, operatore e area operativa.</p>
        </Card>
      </div>
    </div>
  );
}
