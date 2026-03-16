import Link from "next/link";
import { AlertTriangle, ArrowRight, ChefHat, ClipboardCheck, Printer, Thermometer } from "lucide-react";
import { Badge, Card, DataTable, PageHeader } from "@/components/ui";
import { prisma } from "@/lib/prisma";

const statusMap: Record<string, string> = {
  ACTIVE: "Attivo",
  LOW_STOCK: "In esaurimento",
  DEPLETED: "Esaurito",
  EXPIRED: "Scaduto",
  BLOCKED: "Bloccato",
};

const statusTone: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  ACTIVE: "success",
  LOW_STOCK: "warning",
  DEPLETED: "neutral",
  EXPIRED: "danger",
  BLOCKED: "danger",
};

const checkStatusMap: Record<string, string> = {
  PENDING: "Da completare",
  COMPLETED: "Completata",
  OVERDUE: "Scaduta",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const now = new Date();
  const startOfDay = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Rome" }));
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setHours(23, 59, 59, 999);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [
    expiringToday,
    lowStock,
    pendingChecks,
    tempAlerts,
    nonConformities,
    recentBatches,
    recentTemps,
    recentChecks,
    recentPrintLogs,
  ] = await Promise.all([
    prisma.batch.count({
      where: { status: "ACTIVE", expiresAt: { gte: startOfDay, lte: endOfDay } },
    }),
    prisma.batch.count({ where: { status: "LOW_STOCK" } }),
    prisma.haccpCheck.count({
      where: { status: { in: ["PENDING", "OVERDUE"] } },
    }),
    prisma.temperatureLog.count({
      where: { isAlert: true, recordedAt: { gte: yesterday } },
    }),
    prisma.nonConformity.findMany({
      where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
      include: { actions: true },
      orderBy: { openedAt: "desc" },
      take: 5,
    }),
    prisma.batch.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { operationalArea: true },
    }),
    prisma.temperatureLog.findMany({
      orderBy: { recordedAt: "desc" },
      take: 4,
      include: { operationalArea: true },
    }),
    prisma.haccpCheck.findMany({
      orderBy: { dueAt: "desc" },
      take: 4,
      include: { operationalArea: true },
    }),
    prisma.labelPrintLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { label: { include: { batch: true } }, user: true },
    }),
  ]);

  const stats = [
    { label: "Scadenze oggi", value: String(expiringToday), tone: expiringToday > 0 ? "danger" : "success" },
    { label: "Lotti in esaurimento", value: String(lowStock), tone: lowStock > 0 ? "warning" : "success" },
    { label: "Checklist incomplete", value: String(pendingChecks), tone: pendingChecks > 0 ? "danger" : "success" },
    { label: "Temperature fuori soglia", value: String(tempAlerts), tone: tempAlerts > 0 ? "danger" : "success" },
  ];

  const ncStatusMap: Record<string, string> = {
    OPEN: "Aperta",
    IN_PROGRESS: "In corso",
    RESOLVED: "Risolta",
    CLOSED: "Chiusa",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard operativa"
        description="Vista immediata di scadenze, esaurimenti, controlli HACCP, temperature e attivita' di stampa etichette."
        actionLabel="Avvia nuova produzione"
        actionHref="/produzione/nuova"
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} title={stat.value} subtitle={stat.label}>
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className={`h-4 w-4 ${stat.tone === "success" ? "text-success" : "text-brass"}`} />
              <span>Dati in tempo reale</span>
            </div>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card title="Azioni rapide" subtitle="Percorsi ottimizzati per tablet e postazione cucina.">
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { href: "/ricevimento-merce", label: "Ricevimento merce", icon: ChefHat },
              { href: "/magazzino-lotti", label: "Lotti in esaurimento", icon: AlertTriangle },
              { href: "/etichette/ristampa", label: "Ristampa etichette", icon: Printer },
              { href: "/temperature", label: "Temperature", icon: Thermometer },
              { href: "/checklist-haccp", label: "Checklist HACCP", icon: ClipboardCheck },
              { href: "/tracciabilita", label: "Ricerca tracciabilita'", icon: ArrowRight }
            ].map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.href} href={action.href} className="flex items-center justify-between rounded-3xl border border-black/5 bg-sand p-4 hover:border-brass">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-white p-3 shadow-panel">
                      <Icon className="h-5 w-5 text-brass" />
                    </div>
                    <span className="font-medium">{action.label}</span>
                  </div>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              );
            })}
          </div>
        </Card>
        <Card title="Non conformita' aperte" subtitle="Richiedono azione e chiusura documentata.">
          {nonConformities.length === 0 ? (
            <p className="text-sm text-slate">Nessuna non conformita' aperta.</p>
          ) : (
            <div className="space-y-3">
              {nonConformities.map((item) => (
                <div key={item.id} className="rounded-3xl border border-danger/20 bg-danger/5 p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{item.title}</h4>
                    <Badge tone="danger">{ncStatusMap[item.status] ?? item.status}</Badge>
                  </div>
                  {item.actions[0] && (
                    <p className="mt-3 text-sm text-slate">{item.actions[0].description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Lotti monitorati" subtitle="Stock, stati e priorita' di magazzino.">
          <DataTable
            headers={["Lotto", "Prodotto", "Stato", "Disponibile", "Scadenza"]}
            rows={recentBatches.map((b) => [
              <Link key={b.id} href={`/lotti/${b.code}`} className="font-semibold text-brass underline">{b.code}</Link>,
              b.productName,
              <Badge key={`s-${b.id}`} tone={statusTone[b.status] ?? "neutral"}>{statusMap[b.status] ?? b.status}</Badge>,
              `${b.quantityAvailable} ${b.unitOfMeasure}`,
              b.expiresAt ? new Date(b.expiresAt).toLocaleDateString("it-IT") : "-",
            ])}
          />
        </Card>
        <Card title="Temperature e checklist" subtitle="Controlli giornalieri critici.">
          <div className="space-y-4">
            {recentTemps.map((log) => (
              <div key={log.id} className="flex items-center justify-between rounded-3xl bg-sand p-4">
                <div>
                  <p className="font-semibold">{log.title}</p>
                  <p className="text-sm text-slate">
                    {log.operationalArea?.name ?? "-"} · soglia{" "}
                    {log.minThreshold != null && log.maxThreshold != null
                      ? `${log.minThreshold} / +${log.maxThreshold} °C`
                      : "-"}
                  </p>
                </div>
                <Badge tone={log.isAlert ? "danger" : "success"}>{String(log.value)} °C</Badge>
              </div>
            ))}
            {recentChecks.map((check) => (
              <div key={check.id} className="flex items-center justify-between rounded-3xl border border-black/5 p-4">
                <div>
                  <p className="font-semibold">{check.title}</p>
                  <p className="text-sm text-slate">
                    {check.operationalArea?.name ?? "-"} · entro{" "}
                    {new Date(check.dueAt).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome" })}
                  </p>
                </div>
                <Badge tone={check.status === "COMPLETED" ? "success" : check.status === "OVERDUE" ? "danger" : "warning"}>
                  {checkStatusMap[check.status] ?? check.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card title="Storico ristampe" subtitle="Ogni copia etichetta rimane auditabile.">
        <DataTable
          headers={["Lotto", "Utente", "Quando", "Motivo", "Copie"]}
          rows={recentPrintLogs.map((pl) => [
            pl.label.batch.code,
            pl.user.name,
            new Date(pl.createdAt).toLocaleString("it-IT", { timeZone: "Europe/Rome" }),
            pl.reason,
            String(pl.copies),
          ])}
        />
      </Card>
    </div>
  );
}
