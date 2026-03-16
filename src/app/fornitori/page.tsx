"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Save } from "lucide-react";
import { Card, DataTable, PageHeader, Badge } from "@/components/ui";

interface Supplier {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  vatNumber: string | null;
  address: string | null;
  notes: string | null;
  _count: { batches: number; ingredients: number };
}

const inputCls = "h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm";
const btnPrimary = "h-11 rounded-full bg-brass px-5 font-semibold text-white text-sm disabled:opacity-50 active:scale-[0.98] transition";
const btnDanger = "h-9 rounded-full bg-danger/10 px-3 text-xs font-semibold text-danger active:scale-95 transition";
const btnEdit = "h-9 rounded-full bg-brass/10 px-3 text-xs font-semibold text-brass active:scale-95 transition";

export default function FornitoriPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadData() {
    const res = await fetch("/api/suppliers");
    if (res.ok) setSuppliers(await res.json());
  }

  useEffect(() => { loadData(); }, []);

  function startEdit(s: Supplier) {
    setEditingId(s.id);
    setName(s.name);
    setEmail(s.email ?? "");
    setPhone(s.phone ?? "");
    setVatNumber(s.vatNumber ?? "");
    setAddress(s.address ?? "");
    setNotes(s.notes ?? "");
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  function startCreate() {
    setEditingId(null);
    setName("");
    setEmail("");
    setPhone("");
    setVatNumber("");
    setAddress("");
    setNotes("");
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const body = {
        name,
        email: email || undefined,
        phone: phone || undefined,
        vatNumber: vatNumber || undefined,
        address: address || undefined,
        notes: notes || undefined,
      };

      const url = editingId ? `/api/suppliers/${editingId}` : "/api/suppliers";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error((await res.json()).error || "Errore");

      setSuccess(editingId ? "Fornitore aggiornato!" : "Fornitore creato!");
      setShowForm(false);
      setEditingId(null);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Eliminare il fornitore "${name}"? Questa azione non può essere annullata.`)) return;

    try {
      const res = await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Impossibile eliminare");
        return;
      }
      setSuccess("Fornitore eliminato");
      loadData();
    } catch {
      alert("Errore durante l'eliminazione");
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader title="Fornitori" description="Ragione sociale, contatti, prodotti forniti, allegati e storico lotti ricevuti." />

      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => showForm ? setShowForm(false) : startCreate()}
          className={`flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition whitespace-nowrap ${showForm ? "bg-brass text-white" : "bg-white border border-black/10 text-ink"}`}
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Chiudi" : "Nuovo fornitore"}
        </button>
      </div>

      {success && <div className="rounded-2xl bg-success/10 px-4 py-3 text-sm text-success">{success}</div>}

      <div className="space-y-4 sm:space-y-6">
        {showForm && (
          <Card title={editingId ? "Modifica fornitore" : "Nuovo fornitore"} subtitle={editingId ? "Aggiorna i dati del fornitore." : "Aggiungi un nuovo fornitore all'anagrafica."}>
            <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" onSubmit={handleSubmit}>
              <input className={`${inputCls} sm:col-span-2`} placeholder="Ragione sociale *" value={name} onChange={(e) => setName(e.target.value)} required />
              <input className={inputCls} placeholder="P.IVA" value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} />
              <input className={inputCls} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input className={inputCls} placeholder="Telefono" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <input className={`${inputCls} lg:col-span-3`} placeholder="Indirizzo" value={address} onChange={(e) => setAddress(e.target.value)} />
              <textarea className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm sm:col-span-2 lg:col-span-4" placeholder="Note" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />

              {error && <div className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger sm:col-span-2 lg:col-span-4">{error}</div>}

              <button className={`${btnPrimary} sm:col-span-2 lg:col-span-4 flex items-center justify-center gap-2`} type="submit" disabled={loading}>
                <Save className="h-4 w-4" />
                {loading ? "Salvataggio..." : editingId ? "Aggiorna fornitore" : "Crea fornitore"}
              </button>
            </form>
          </Card>
        )}

        <Card title="Anagrafica fornitori" subtitle="Base per qualifica, documenti e storico ricezioni.">
          {suppliers.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate">Nessun fornitore registrato.</p>
          ) : (
            <DataTable
              headers={["Fornitore", "Contatto", "P.IVA", "Prodotti", "Lotti", "Azioni"]}
              rows={suppliers.map((s) => [
                s.name,
                s.email ?? s.phone ?? "-",
                s.vatNumber ?? "-",
                s._count.ingredients.toString(),
                s._count.batches.toString(),
                <div key={s.id} className="flex gap-1">
                  <button onClick={() => startEdit(s)} className={btnEdit}>
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button onClick={() => handleDelete(s.id, s.name)} className={btnDanger}>
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>,
              ])}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
