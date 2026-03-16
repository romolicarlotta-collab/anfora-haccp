"use client";

import { useEffect, useState } from "react";
import { Plus, ArrowRight, Trash2 } from "lucide-react";
import { Badge, Card, DataTable, PageHeader } from "@/components/ui";

interface NonConformity {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  openedAt: string;
  closedAt: string | null;
  actions: Array<{ id: string; description: string; owner: string }>;
}

const ncStatusLabels: Record<string, string> = {
  OPEN: "Aperta",
  IN_PROGRESS: "In corso",
  RESOLVED: "Risolta",
  CLOSED: "Chiusa",
};
const ncStatusTone: Record<string, "success" | "warning" | "danger"> = {
  OPEN: "danger",
  IN_PROGRESS: "warning",
  RESOLVED: "success",
  CLOSED: "success",
};
const severityTone: Record<string, "success" | "warning" | "danger"> = {
  Alta: "danger",
  Media: "warning",
  Bassa: "success",
};
const nextStatus: Record<string, string> = {
  OPEN: "IN_PROGRESS",
  IN_PROGRESS: "RESOLVED",
  RESOLVED: "CLOSED",
};

const inputCls = "h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-base";
const selectCls = "h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-base";
const btnPrimary = "h-12 rounded-full bg-brass px-6 font-semibold text-white disabled:opacity-50 active:scale-[0.98] transition";

export default function NonConformitaPage() {
  const [items, setItems] = useState<NonConformity[]>([]);
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("Media");
  const [correctiveAction, setCorrectiveAction] = useState("");
  const [actionOwner, setActionOwner] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadData() {
    const res = await fetch("/api/non-conformita");
    if (res.ok) {
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } else {
      // fallback to SSR-compatible endpoint
      // If the custom API doesn't exist yet, we load nothing
      setItems([]);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch("/api/non-conformita", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          severity,
          correctiveAction: correctiveAction || undefined,
          actionOwner: actionOwner || undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Errore");
      setSuccess("Non conformita' registrata!");
      setTitle("");
      setDescription("");
      setCorrectiveAction("");
      setActionOwner("");
      setShowForm(false);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore");
    } finally {
      setLoading(false);
    }
  }

  async function advanceStatus(id: string, current: string) {
    const next = nextStatus[current];
    if (!next) return;
    try {
      await fetch("/api/non-conformita", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: next }),
      });
      loadData();
    } catch {
      // silent
    }
  }

  async function handleDeleteNC(id: string) {
    if (!confirm("Eliminare questa non conformità?")) return;
    try {
      const res = await fetch("/api/non-conformita", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) { alert("Errore durante l'eliminazione"); return; }
      loadData();
    } catch { alert("Errore"); }
  }

  const openCount = items.filter((i) => i.status === "OPEN" || i.status === "IN_PROGRESS").length;

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader title="Non conformita'" description="Segnalazioni, severita', azioni correttive e chiusura auditabile." />

      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition whitespace-nowrap ${showForm ? "bg-brass text-white" : "bg-white border border-black/10 text-ink"}`}
        >
          <Plus className="h-4 w-4" /> Nuova segnalazione
        </button>
        {openCount > 0 && (
          <div className="flex items-center gap-2 rounded-full bg-danger/10 px-4 py-3 text-sm font-semibold text-danger whitespace-nowrap">
            {openCount} aperte
          </div>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr] sm:gap-6">
        {showForm && (
          <Card title="Nuova segnalazione" subtitle="Registra non conformita' con azione correttiva.">
            <form className="grid gap-3 sm:grid-cols-2" onSubmit={handleCreate}>
              <input className={inputCls} placeholder="Titolo" value={title} onChange={(e) => setTitle(e.target.value)} required />
              <select className={selectCls} value={severity} onChange={(e) => setSeverity(e.target.value)}>
                <option value="Alta">Alta</option>
                <option value="Media">Media</option>
                <option value="Bassa">Bassa</option>
              </select>
              <textarea className="rounded-2xl border border-black/10 bg-white px-4 py-3 sm:col-span-2" placeholder="Descrizione del problema" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} required />
              <input className={inputCls} placeholder="Azione correttiva" value={correctiveAction} onChange={(e) => setCorrectiveAction(e.target.value)} />
              <input className={inputCls} placeholder="Responsabile azione" value={actionOwner} onChange={(e) => setActionOwner(e.target.value)} />

              {error && <div className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger sm:col-span-2">{error}</div>}
              {success && <div className="rounded-2xl bg-success/10 px-4 py-3 text-sm text-success sm:col-span-2">{success}</div>}

              <button className={`${btnPrimary} sm:col-span-2`} type="submit" disabled={loading}>
                {loading ? "Registrazione..." : "Registra non conformita'"}
              </button>
            </form>
          </Card>
        )}

        <Card title="Registro non conformita'" subtitle="Struttura con singola action chain." className={showForm ? "" : "xl:col-span-2"}>
          {items.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate">Nessuna non conformita' registrata.</p>
          ) : (
            <DataTable
              headers={["Titolo", "Severita'", "Stato", "Azione", "", ""]}
              rows={items.map((item) => [
                item.title,
                <Badge key={`${item.id}-sev`} tone={severityTone[item.severity] ?? "danger"}>{item.severity}</Badge>,
                <Badge key={`${item.id}-st`} tone={ncStatusTone[item.status] ?? "warning"}>{ncStatusLabels[item.status] ?? item.status}</Badge>,
                item.actions[0]?.description ?? "-",
                item.status !== "CLOSED" ? (
                  <button
                    key={`${item.id}-adv`}
                    onClick={() => advanceStatus(item.id, item.status)}
                    className="flex items-center gap-1 rounded-full bg-brass/10 px-3 py-1.5 text-xs font-semibold text-brass active:scale-95 transition whitespace-nowrap"
                  >
                    <ArrowRight className="h-3 w-3" /> {ncStatusLabels[nextStatus[item.status]] ?? "Avanza"}
                  </button>
                ) : null,
                <button key={`${item.id}-del`} onClick={() => handleDeleteNC(item.id)} className="h-8 rounded-full bg-danger/10 px-2.5 text-danger active:scale-95 transition">
                  <Trash2 className="h-3 w-3" />
                </button>,
              ])}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
