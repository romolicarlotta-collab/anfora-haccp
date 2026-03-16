"use client";

import { useEffect, useState } from "react";
import { Plus, AlertTriangle, Trash2 } from "lucide-react";
import { Badge, Card, DataTable, PageHeader } from "@/components/ui";

interface OperationalArea {
  id: string;
  name: string;
}

interface TempLog {
  id: string;
  title: string;
  value: number;
  minThreshold: number | null;
  maxThreshold: number | null;
  isAlert: boolean;
  recordedAt: string;
  operationalArea?: { name: string } | null;
  notes: string | null;
}

const inputCls = "h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-base";
const selectCls = "h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-base";
const btnPrimary = "h-12 rounded-full bg-brass px-6 font-semibold text-white disabled:opacity-50 active:scale-[0.98] transition";

export default function TemperaturePage() {
  const [logs, setLogs] = useState<TempLog[]>([]);
  const [areas, setAreas] = useState<OperationalArea[]>([]);
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [minThreshold, setMinThreshold] = useState("");
  const [maxThreshold, setMaxThreshold] = useState("");
  const [areaId, setAreaId] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadData() {
    const [temps, ar] = await Promise.all([
      fetch("/api/temperatures").then((r) => r.json()),
      fetch("/api/operational-areas").then((r) => r.json()),
    ]);
    setLogs(Array.isArray(temps) ? temps : []);
    setAreas(ar);
  }

  useEffect(() => { loadData(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch("/api/temperatures/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          value: parseFloat(value),
          minThreshold: minThreshold ? parseFloat(minThreshold) : undefined,
          maxThreshold: maxThreshold ? parseFloat(maxThreshold) : undefined,
          operationalAreaId: areaId || undefined,
          notes: notes || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Errore");
      }
      const created = await res.json();
      setSuccess(created.isAlert ? "Registrata! ATTENZIONE: fuori soglia!" : "Temperatura registrata con successo");
      setTitle("");
      setValue("");
      setMinThreshold("");
      setMaxThreshold("");
      setNotes("");
      setShowForm(false);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Eliminare questa rilevazione?")) return;
    try {
      const res = await fetch("/api/temperatures", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) { alert("Errore durante l'eliminazione"); return; }
      loadData();
    } catch { alert("Errore"); }
  }

  const alertCount = logs.filter((l) => l.isAlert).length;

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Controlli temperature"
        description="Registri frigo/freezer/celle, temperature ricevimento e alert fuori soglia."
      />

      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition whitespace-nowrap ${showForm ? "bg-brass text-white" : "bg-white border border-black/10 text-ink"}`}
        >
          <Plus className="h-4 w-4" /> Nuova rilevazione
        </button>
        {alertCount > 0 && (
          <div className="flex items-center gap-2 rounded-full bg-danger/10 px-4 py-3 text-sm font-semibold text-danger whitespace-nowrap">
            <AlertTriangle className="h-4 w-4" /> {alertCount} fuori soglia
          </div>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr] sm:gap-6">
        {showForm && (
          <Card title="Nuova rilevazione" subtitle="Registra temperatura con soglie di riferimento.">
            <form className="grid gap-3 sm:grid-cols-2" onSubmit={handleSubmit}>
              <input className={inputCls} placeholder="Postazione (es. Frigo 1)" value={title} onChange={(e) => setTitle(e.target.value)} required />
              <select className={selectCls} value={areaId} onChange={(e) => setAreaId(e.target.value)}>
                <option value="">Area operativa...</option>
                {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <input className={inputCls} type="number" step="0.1" placeholder="Temperatura °C" value={value} onChange={(e) => setValue(e.target.value)} required />
              <div className="flex gap-2">
                <input className={inputCls} type="number" step="0.1" placeholder="Min °C" value={minThreshold} onChange={(e) => setMinThreshold(e.target.value)} />
                <input className={inputCls} type="number" step="0.1" placeholder="Max °C" value={maxThreshold} onChange={(e) => setMaxThreshold(e.target.value)} />
              </div>
              <textarea className="rounded-2xl border border-black/10 bg-white px-4 py-3 sm:col-span-2" placeholder="Note" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />

              {error && <div className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger sm:col-span-2">{error}</div>}
              {success && <div className={`rounded-2xl px-4 py-3 text-sm sm:col-span-2 ${success.includes("ATTENZIONE") ? "bg-danger/10 text-danger" : "bg-success/10 text-success"}`}>{success}</div>}

              <button className={`${btnPrimary} sm:col-span-2`} type="submit" disabled={loading}>
                {loading ? "Registrazione..." : "Registra temperatura"}
              </button>
            </form>
          </Card>
        )}

        <Card title="Registro temperature" subtitle="Valori recenti con soglie." className={showForm ? "" : "xl:col-span-2"}>
          {logs.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate">Nessuna rilevazione registrata.</p>
          ) : (
            <DataTable
              headers={["Postazione", "Area", "Valore", "Soglia", "Esito", ""]}
              rows={logs.map((log) => {
                const threshold = log.minThreshold != null && log.maxThreshold != null
                  ? `${log.minThreshold} / ${log.maxThreshold} °C`
                  : "-";
                return [
                  log.title,
                  log.operationalArea?.name ?? "-",
                  `${log.value} °C`,
                  threshold,
                  <Badge key={log.id} tone={log.isAlert ? "danger" : "success"}>
                    {log.isAlert ? "Fuori soglia" : "OK"}
                  </Badge>,
                  <button key={`del-${log.id}`} onClick={() => handleDelete(log.id)} className="h-8 rounded-full bg-danger/10 px-2.5 text-danger active:scale-95 transition">
                    <Trash2 className="h-3 w-3" />
                  </button>,
                ];
              })}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
