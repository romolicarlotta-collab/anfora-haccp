"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, DataTable, PageHeader } from "@/components/ui";

interface RecipeItem {
  id: string;
  ingredientId: string;
  quantity: number;
  unit: string;
  ingredient: { id: string; name: string };
}
interface Recipe {
  id: string;
  name: string;
  code: string;
  expectedYield: number;
  yieldUnit: string;
  standardShelfLifeDays: number;
  finalAllergens: string[];
  items: RecipeItem[];
}
interface Batch {
  id: string;
  code: string;
  productName: string;
  quantityAvailable: number;
  unitOfMeasure: string;
  ingredientId: string | null;
}

const inputCls = "h-12 w-full rounded-2xl border border-black/10 px-4";
const selectCls = "h-12 w-full rounded-2xl border border-black/10 px-4";
const btnPrimary = "h-12 rounded-full bg-brass px-6 font-semibold text-white disabled:opacity-50";
const btnSecondary = "h-12 rounded-full border border-black/10 px-6 font-semibold";

function generateBatchCode(productName: string): string {
  const prefix = productName.replace(/[^A-Za-z]/g, "").substring(0, 2).toUpperCase() || "XX";
  const today = new Date();
  const dateStr = today.getFullYear().toString() +
    String(today.getMonth() + 1).padStart(2, "0") +
    String(today.getDate()).padStart(2, "0");
  const seq = String(Math.floor(Math.random() * 99) + 1).padStart(2, "0");
  return `${prefix}-${dateStr}-${seq}`;
}

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export default function NuovaProduzionePage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState("");
  const [availableBatches, setAvailableBatches] = useState<Record<string, Batch[]>>({});
  const [selectedBatches, setSelectedBatches] = useState<Record<string, string>>({});
  const [quantityUsed, setQuantityUsed] = useState<Record<string, string>>({});
  const [quantityProduced, setQuantityProduced] = useState("");
  const [operatorName, setOperatorName] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [createdCode, setCreatedCode] = useState("");

  const selectedRecipe = recipes.find((r) => r.id === selectedRecipeId);

  useEffect(() => {
    fetch("/api/recipes").then((r) => r.json()).then(setRecipes);
  }, []);

  // When recipe changes, fetch supplier batches for each ingredient
  useEffect(() => {
    if (!selectedRecipe) return;

    setSelectedBatches({});
    setQuantityUsed({});
    setQuantityProduced(String(selectedRecipe.expectedYield));

    const ingredientIds = [...new Set(selectedRecipe.items.map((item) => item.ingredientId))];

    fetch("/api/batches?kind=SUPPLIER&status=ACTIVE")
      .then((r) => r.json())
      .then((batches: Batch[]) => {
        const grouped: Record<string, Batch[]> = {};
        for (const ingId of ingredientIds) {
          grouped[ingId] = batches.filter(
            (b) => b.ingredientId === ingId && Number(b.quantityAvailable) > 0,
          );
        }
        setAvailableBatches(grouped);

        // Pre-set quantity used from recipe
        const qtyMap: Record<string, string> = {};
        for (const item of selectedRecipe.items) {
          qtyMap[item.ingredientId] = String(item.quantity);
        }
        setQuantityUsed(qtyMap);
      });
  }, [selectedRecipeId, selectedRecipe]);

  const batchCode = selectedRecipe ? generateBatchCode(selectedRecipe.name) : "";
  const expiresAt = selectedRecipe ? addDays(selectedRecipe.standardShelfLifeDays) : "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRecipe) return;
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const sourceItems = selectedRecipe.items.map((item) => ({
        consumedBatchId: selectedBatches[item.ingredientId],
        ingredientId: item.ingredientId,
        quantityUsed: parseFloat(quantityUsed[item.ingredientId] || "0"),
        unitOfMeasure: item.unit,
      }));

      // Validate all ingredients have a batch selected
      for (const item of sourceItems) {
        if (!item.consumedBatchId) {
          throw new Error("Seleziona un lotto per ogni ingrediente.");
        }
      }

      const body = {
        recipeId: selectedRecipe.id,
        operationalAreaId: "", // Will be set if available
        storageLocationId: "",
        productName: selectedRecipe.name,
        code: batchCode,
        quantityProduced: parseFloat(quantityProduced),
        unitOfMeasure: selectedRecipe.yieldUnit,
        operatorName,
        producedAt: new Date().toISOString(),
        expiresAt: new Date(expiresAt).toISOString(),
        allergens: selectedRecipe.finalAllergens,
        sourceItems,
      };

      const res = await fetch("/api/production-batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Errore durante la creazione");
      }

      const created = await res.json();
      setCreatedCode(created.code);
      setSuccess(`Lotto di produzione ${created.code} creato con successo!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nuova produzione"
        description="Flusso MVP: selezione ricetta, scelta lotti ingredienti reali, resa prodotta, scadenza e stampa etichetta."
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card title="Wizard rapido" subtitle="Pensato per cucine operative con pochi click.">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Step 1: Select recipe */}
            <div className="rounded-3xl bg-sand p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate">1. Seleziona ricetta</p>
              <select className={selectCls} value={selectedRecipeId} onChange={(e) => setSelectedRecipeId(e.target.value)} required>
                <option value="">Scegli una ricetta...</option>
                {recipes.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            {/* Step 2: Choose real batches per ingredient */}
            {selectedRecipe && (
              <div className="rounded-3xl bg-sand p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate">2. Scegli lotti reali</p>
                <div className="space-y-3">
                  {selectedRecipe.items.map((item) => (
                    <div key={item.ingredientId} className="flex flex-col gap-1">
                      <label className="text-sm font-medium">{item.ingredient.name} ({item.quantity} {item.unit})</label>
                      <div className="flex gap-2">
                        <select
                          className={selectCls}
                          value={selectedBatches[item.ingredientId] || ""}
                          onChange={(e) => setSelectedBatches((prev) => ({ ...prev, [item.ingredientId]: e.target.value }))}
                          required
                        >
                          <option value="">Seleziona lotto...</option>
                          {(availableBatches[item.ingredientId] || []).map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.code} - disp. {b.quantityAvailable} {b.unitOfMeasure}
                            </option>
                          ))}
                        </select>
                        <input
                          className="h-12 w-28 rounded-2xl border border-black/10 px-3"
                          type="number"
                          step="0.01"
                          placeholder="Qta"
                          value={quantityUsed[item.ingredientId] || ""}
                          onChange={(e) => setQuantityUsed((prev) => ({ ...prev, [item.ingredientId]: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Yield */}
            {selectedRecipe && (
              <div className="rounded-3xl bg-sand p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate">3. Imposta resa</p>
                <div className="flex gap-2">
                  <input
                    className={inputCls}
                    type="number"
                    step="0.01"
                    placeholder="Quantita' prodotta"
                    value={quantityProduced}
                    onChange={(e) => setQuantityProduced(e.target.value)}
                    required
                  />
                  <span className="flex h-12 items-center text-sm text-slate">{selectedRecipe.yieldUnit}</span>
                </div>
              </div>
            )}

            {/* Step 4: Generated batch code */}
            {selectedRecipe && (
              <div className="rounded-3xl bg-sand p-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate">4. Lotto generato</p>
                <p className="text-xl font-semibold">{batchCode}</p>
              </div>
            )}

            {/* Step 5: Expiry + operator */}
            {selectedRecipe && (
              <div className="rounded-3xl bg-sand p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate">5. Scadenza e operatore</p>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <p className="text-sm text-slate">Scadenza calcolata: <strong>{expiresAt}</strong> ({selectedRecipe.standardShelfLifeDays} gg)</p>
                  </div>
                  <input
                    className={inputCls}
                    placeholder="Nome operatore"
                    value={operatorName}
                    onChange={(e) => setOperatorName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {error && <div className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>}
            {success && <div className="rounded-2xl bg-success/10 px-4 py-3 text-sm text-success">{success}</div>}

            <div className="flex gap-3">
              <button className={btnPrimary} type="submit" disabled={loading || !selectedRecipe}>
                {loading ? "Creazione..." : "Conferma produzione"}
              </button>
              {createdCode && (
                <Link href={`/lotti/${createdCode}`} className={`inline-flex items-center ${btnSecondary}`}>
                  Apri lotto creato
                </Link>
              )}
            </div>
          </form>
        </Card>

        {/* Right side: preview table of selected ingredients */}
        {selectedRecipe && (
          <Card title="Riepilogo ingredienti" subtitle="Lotti selezionati per questa produzione">
            <DataTable
              headers={["Ingrediente", "Lotto usato", "Quantita'"]}
              rows={selectedRecipe.items.map((item) => {
                const batchId = selectedBatches[item.ingredientId];
                const batch = (availableBatches[item.ingredientId] || []).find((b) => b.id === batchId);
                return [
                  item.ingredient.name,
                  batch?.code ?? "-",
                  `${quantityUsed[item.ingredientId] || "-"} ${item.unit}`,
                ];
              })}
            />
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <div className="rounded-3xl bg-sand p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate">Lotto generato</p>
                <p className="mt-2 text-xl font-semibold">{batchCode}</p>
              </div>
              <div className="rounded-3xl bg-sand p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate">Scadenza</p>
                <p className="mt-2 text-xl font-semibold">{expiresAt}</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
