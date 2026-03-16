"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, X, Save } from "lucide-react";
import { Card, DataTable, PageHeader } from "@/components/ui";

interface Supplier { id: string; name: string; }
interface Ingredient {
  id: string;
  code: string;
  name: string;
  category: string;
  unitOfMeasure: string;
  standardShelfLifeDays: number;
  allergens: string[];
  storageTemperature: string | null;
  haccpNotes: string | null;
  preferredSupplierId: string | null;
  preferredSupplier: { name: string } | null;
}

const inputCls = "h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm";
const selectCls = "h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm";
const btnPrimary = "h-11 rounded-full bg-brass px-5 font-semibold text-white text-sm disabled:opacity-50 active:scale-[0.98] transition";
const btnDanger = "h-9 rounded-full bg-danger/10 px-3 text-xs font-semibold text-danger active:scale-95 transition";
const btnEdit = "h-9 rounded-full bg-brass/10 px-3 text-xs font-semibold text-brass active:scale-95 transition";

export default function IngredientiPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Generico");
  const [unitOfMeasure, setUnitOfMeasure] = useState("kg");
  const [shelfLife, setShelfLife] = useState("7");
  const [allergens, setAllergens] = useState("");
  const [storageTemp, setStorageTemp] = useState("");
  const [haccpNotes, setHaccpNotes] = useState("");
  const [preferredSupplierId, setPreferredSupplierId] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadData() {
    const [ingRes, supRes] = await Promise.all([
      fetch("/api/ingredients"),
      fetch("/api/suppliers"),
    ]);
    if (ingRes.ok) setIngredients(await ingRes.json());
    if (supRes.ok) setSuppliers(await supRes.json());
  }

  useEffect(() => { loadData(); }, []);

  function startCreate() {
    setEditingId(null);
    setCode("");
    setName("");
    setCategory("Generico");
    setUnitOfMeasure("kg");
    setShelfLife("7");
    setAllergens("");
    setStorageTemp("");
    setHaccpNotes("");
    setPreferredSupplierId("");
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  function startEdit(ing: Ingredient) {
    setEditingId(ing.id);
    setCode(ing.code);
    setName(ing.name);
    setCategory(ing.category);
    setUnitOfMeasure(ing.unitOfMeasure);
    setShelfLife(String(ing.standardShelfLifeDays));
    setAllergens(ing.allergens?.join(", ") ?? "");
    setStorageTemp(ing.storageTemperature ?? "");
    setHaccpNotes(ing.haccpNotes ?? "");
    setPreferredSupplierId(ing.preferredSupplierId ?? "");
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
        code: code || undefined,
        name,
        category,
        unitOfMeasure,
        standardShelfLifeDays: parseInt(shelfLife) || 7,
        allergens: allergens ? allergens.split(",").map((a) => a.trim()).filter(Boolean) : [],
        storageTemperature: storageTemp || undefined,
        haccpNotes: haccpNotes || undefined,
        preferredSupplierId: preferredSupplierId || undefined,
      };

      const url = editingId ? `/api/ingredients/${editingId}` : "/api/ingredients";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error((await res.json()).error || "Errore");

      setSuccess(editingId ? "Ingrediente aggiornato!" : "Ingrediente creato!");
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
    if (!confirm(`Eliminare "${name}"? Questa azione non può essere annullata.`)) return;

    try {
      const res = await fetch(`/api/ingredients/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Impossibile eliminare");
        return;
      }
      setSuccess("Ingrediente eliminato");
      loadData();
    } catch {
      alert("Errore durante l'eliminazione");
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader title="Ingredienti" description="Anagrafica ingredienti con allergeni, shelf life, fornitore abituale e note HACCP." />

      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => showForm ? setShowForm(false) : startCreate()}
          className={`flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition whitespace-nowrap ${showForm ? "bg-brass text-white" : "bg-white border border-black/10 text-ink"}`}
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Chiudi" : "Nuovo ingrediente"}
        </button>
      </div>

      {success && <div className="rounded-2xl bg-success/10 px-4 py-3 text-sm text-success">{success}</div>}

      <div className="space-y-4 sm:space-y-6">
        {showForm && (
          <Card title={editingId ? "Modifica ingrediente" : "Nuovo ingrediente"} subtitle="Dati tecnici, allergeni e fornitore abituale.">
            <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" onSubmit={handleSubmit}>
              <input className={`${inputCls} sm:col-span-2`} placeholder="Nome ingrediente *" value={name} onChange={(e) => setName(e.target.value)} required />
              <input className={inputCls} placeholder="Codice (auto se vuoto)" value={code} onChange={(e) => setCode(e.target.value)} />
              <select className={selectCls} value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="Generico">Generico</option>
                <option value="Ortaggi">Ortaggi</option>
                <option value="Frutta">Frutta</option>
                <option value="Carni">Carni</option>
                <option value="Pesce">Pesce</option>
                <option value="Latticini">Latticini</option>
                <option value="Condimenti">Condimenti</option>
                <option value="Conserve">Conserve</option>
                <option value="Cereali">Cereali</option>
                <option value="Surgelati">Surgelati</option>
                <option value="Bevande">Bevande</option>
              </select>
              <select className={selectCls} value={unitOfMeasure} onChange={(e) => setUnitOfMeasure(e.target.value)}>
                <option value="kg">kg</option>
                <option value="l">litri</option>
                <option value="pz">pezzi</option>
                <option value="ct">cartoni</option>
                <option value="g">grammi</option>
              </select>
              <input className={inputCls} type="number" placeholder="Shelf life (giorni)" value={shelfLife} onChange={(e) => setShelfLife(e.target.value)} />
              <select className={selectCls} value={preferredSupplierId} onChange={(e) => setPreferredSupplierId(e.target.value)}>
                <option value="">Fornitore abituale...</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <input className={`${inputCls} sm:col-span-2 lg:col-span-4`} placeholder="Allergeni (separati da virgola)" value={allergens} onChange={(e) => setAllergens(e.target.value)} />
              <input className={`${inputCls} lg:col-span-2`} placeholder="Temperatura conservazione (es. 0-4°C)" value={storageTemp} onChange={(e) => setStorageTemp(e.target.value)} />
              <input className={`${inputCls} lg:col-span-2`} placeholder="Note HACCP" value={haccpNotes} onChange={(e) => setHaccpNotes(e.target.value)} />

              {error && <div className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger sm:col-span-2 lg:col-span-4">{error}</div>}

              <button className={`${btnPrimary} sm:col-span-2 lg:col-span-4 flex items-center justify-center gap-2`} type="submit" disabled={loading}>
                <Save className="h-4 w-4" />
                {loading ? "Salvataggio..." : editingId ? "Aggiorna" : "Crea ingrediente"}
              </button>
            </form>
          </Card>
        )}

        <Card title="Elenco ingredienti" subtitle="Consultazione rapida e qualifica lotti.">
          {ingredients.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate">Nessun ingrediente registrato.</p>
          ) : (
            <DataTable
              headers={["Codice", "Ingrediente", "Categoria", "UM", "Fornitore", "Shelf life", "Azioni"]}
              rows={ingredients.map((item) => [
                item.code,
                item.name,
                item.category,
                item.unitOfMeasure,
                item.preferredSupplier?.name ?? "-",
                `${item.standardShelfLifeDays}gg`,
                <div key={item.id} className="flex gap-1">
                  <Link href={`/ingredienti/${item.id}`} className="h-9 rounded-full bg-ink/5 px-3 text-xs font-semibold text-ink flex items-center active:scale-95 transition">
                    Apri
                  </Link>
                  <button onClick={() => startEdit(item)} className={btnEdit}>
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button onClick={() => handleDelete(item.id, item.name)} className={btnDanger}>
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
