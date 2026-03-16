"use client";

import { useEffect, useState } from "react";
import { Plus, CheckCircle2 } from "lucide-react";
import { Badge, Card, DataTable, PageHeader } from "@/components/ui";

interface OperationalArea {
  id: string;
  name: string;
}

interface HaccpCheck {
  id: string;
  title: string;
  checklistType: string;
  status: "PENDING" | "COMPLETED" | "OVERDUE";
  dueAt: string;
  completedAt: string | null;
  operationalArea?: { name: string } | null;
  notes: string | null;
}

const statusLabels: Record<string, string> = {
  PENDING: "Da completare",
  COMPLETED: "Completata",
  OVERDUE: "Scaduta",
};
const statusTone: Record<string, "success" | "warning" | "danger"> = {
  PENDING: "warning",
  COMPLETED: "success",
  OVERDUE: "danger",
};

const inputCls = "h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-base";
const selectCls = "h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-base";
const btnPrimary = "h-12 rounded-full bg-brass px-6 font-semibold text-white disabled:opacity-50 active:scale-[0.98] transition";

export default function ChecklistHaccpPage() {
  const [checks, setChecks] = useState<HaccpCheck[]>([]);
  const [areas, setAreas] = useState<OperationalArea[]>([]);
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");
  const [checkType, setCheckType] = useState("Apertura");
  const [dueAt, setDueAt] = useState(new Date().toISOString().split("T")[0]);
  const [areaId, setAreaId] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadData() {
    const [ch, ar] = await Promise.all([
      fetch("/api/haccp-checks").then((r) => r.json()),
      fetch("/api/operational-areas").then((r) => r.json()),
    ]);
    setChecks(Array.isArray(ch) ? ch : []);
    setAreas(ar);
  }

  useEffect(() => { loadData(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch("/api/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          checklistType: checkType,
          dueAt: new Date(dueAt).toISOString(),
          operationalAreaId: areaId || undefined,
          notes: notes || undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Errore");
      setSuccess("Checklist creata!");
      setTitle("");
      setNotes("");
      setShowForm(false);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore");
    } finally {
      setLoading(false);
    }
  }

  async function markComplete(id: string) {
    try {
      const res = await fetch("/api/checklist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "COMPLETED" }),
      });
      if (!res.ok) throw new Error("Errore");
      loadData();
    } catch {
      // silent
    }
  }

  function formatDate(d: string): string {
    return new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  const pending = checks.filter((c) => c.status !== "COMPLETED").length;

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader title="Checklist HACCP" description="Apertura, chiusura, pulizie e sanificazioni per area operativa." />

      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition whitespace-nowrap ${showForm ? "bg-brass text-white" : "bg-white border border-black/10 text-ink"}`}
        >
          <Plus className="h-4 w-4" /> Nuova checklist
        </button>
        {pending > 0 && (
          <div className="flex items-center gap-2 rounded-full bg-brass/10 px-4 py-3 text-sm font-semibold text-brass whitespace-nowrap">
            {pending} da completare
          </div>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr] sm:gap-6">
        {showForm && (
          <Card title="Nuova checklist" subtitle="Crea un nuovo controllo HACCP.">
            <form className="grid gap-3 sm:grid-cols-2" onSubmit={handleCreate}>
              <input className={inputCls} placeholder="Titolo checklist" value={title} onChange={(e) => setTitle(e.target.value)} required />
              <select className={selectCls} value={checkType} onChange={(e) => setCheckType(e.target.value)}>
                <option value="Apertura">Apertura</option>
                <option value="Chiusura">Chiusura</option>
                <option value="Pulizia">Pulizia</option>
                <option value="Sanificazione">Sanificazione</option>
                <option value="Controllo">Controllo periodico</option>
              </select>
              <input className={inputCls} type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} required />
              <select className={selectCls} value={areaId} onChange={(e) => setAreaId(e.target.value)}>
                <option value="">Area operativa...</option>
                {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <textarea className="rounded-2xl border border-black/10 bg-white px-4 py-3 sm:col-span-2" placeholder="Note" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />

              {error && <div className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger sm:col-span-2">{error}</div>}
              {success && <div className="rounded-2xl bg-success/10 px-4 py-3 text-sm text-success sm:col-span-2">{success}</div>}

              <button className={`${btnPrimary} sm:col-span-2`} type="submit" disabled={loading}>
                {loading ? "Creazione..." : "Crea checklist"}
              </button>
            </form>
          </Card>
        )}

        <Card title="Checklist giornaliere" subtitle="Stato e completamento." className={showForm ? "" : "xl:col-span-2"}>
          {checks.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate">Nessuna checklist.</p>
          ) : (
            <DataTable
              headers={["Checklist", "Tipo", "Scadenza", "Stato", ""]}
              rows={checks.map((check) => [
                check.title,
                check.checklistType,
                formatDate(check.dueAt),
                <Badge key={check.id} tone={statusTone[check.status] ?? "warning"}>
                  {statusLabels[check.status] ?? check.status}
                </Badge>,
                check.status !== "COMPLETED" ? (
                  <button
                    key={`${check.id}-btn`}
                    onClick={() => markComplete(check.id)}
                    className="flex items-center gap-1 rounded-full bg-success/10 px-3 py-1.5 text-xs font-semibold text-success active:scale-95 transition"
                  >
                    <CheckCircle2 className="h-3 w-3" /> Completa
                  </button>
                ) : (
                  <span key={`${check.id}-done`} className="text-xs text-slate">
                    {check.completedAt ? formatDate(check.completedAt) : ""}
                  </span>
                ),
              ])}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
