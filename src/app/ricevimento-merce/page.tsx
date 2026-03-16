"use client";

import { useEffect, useState, useRef } from "react";
import { Camera, Upload, Loader2, CheckCircle2, AlertCircle, Plus, Trash2, FileText } from "lucide-react";
import { Badge, Card, DataTable, PageHeader } from "@/components/ui";

interface Ingredient {
  id: string;
  name: string;
  unitOfMeasure: string;
}
interface Supplier {
  id: string;
  name: string;
}
interface OperationalArea {
  id: string;
  name: string;
}
interface StorageLocation {
  id: string;
  name: string;
}
interface Batch {
  id: string;
  code: string;
  productName: string;
  supplierLotCode: string | null;
  quantityReceived: number;
  unitOfMeasure: string;
  inboundTemperature: number | null;
  conformityOutcome: string | null;
  ingredient?: { name: string } | null;
  supplier?: { name: string } | null;
}

interface ScannedItem {
  productName: string;
  supplierLotCode: string | null;
  quantity: number | null;
  unitOfMeasure: string | null;
  expiresAt: string | null;
  price: number | null;
  notes: string | null;
}

interface ScanResult {
  documentType: string;
  supplier: {
    name: string | null;
    vatNumber: string | null;
    phone: string | null;
    email: string | null;
  } | null;
  documentNumber: string | null;
  documentDate: string | null;
  items: ScannedItem[];
  totalAmount: number | null;
  notes: string | null;
}

const inputCls = "h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-base";
const selectCls = "h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-base";
const btnPrimary = "h-12 rounded-full bg-brass px-6 font-semibold text-white disabled:opacity-50 active:scale-[0.98] transition";
const btnSecondary = "h-12 rounded-full border-2 border-brass px-6 font-semibold text-brass disabled:opacity-50 active:scale-[0.98] transition";

type Mode = "scan" | "manual" | "review";

export default function RicevimentoMercePage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [areas, setAreas] = useState<OperationalArea[]>([]);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [recentBatches, setRecentBatches] = useState<Batch[]>([]);

  // Scan state
  const [mode, setMode] = useState<Mode>("scan");
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanError, setScanError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Manual / edited form state
  const [ingredientId, setIngredientId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [supplierLotCode, setSupplierLotCode] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const [expiresAt, setExpiresAt] = useState("");
  const [inboundTemperature, setInboundTemperature] = useState("");
  const [operationalAreaId, setOperationalAreaId] = useState("");
  const [storageLocationId, setStorageLocationId] = useState("");
  const [operatorName, setOperatorName] = useState("");
  const [conformity, setConformity] = useState(true);
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Auto-create state for scanned items
  const [autoCreating, setAutoCreating] = useState(false);
  const [autoCreateResult, setAutoCreateResult] = useState<{
    batchesCreated: number;
    batches: Array<{ code: string; productName: string; quantity: number; unit: string; isNewIngredient: boolean }>;
  } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/ingredients").then((r) => r.json()),
      fetch("/api/suppliers").then((r) => r.json()),
      fetch("/api/operational-areas").then((r) => r.json()),
      fetch("/api/storage-locations").then((r) => r.json()),
      fetch("/api/batches?kind=SUPPLIER").then((r) => r.json()),
    ]).then(([ing, sup, ar, loc, bat]) => {
      setIngredients(ing);
      setSuppliers(sup);
      setAreas(ar);
      setLocations(loc);
      setRecentBatches(Array.isArray(bat) ? bat : []);
    });
  }, []);

  useEffect(() => {
    if (ingredientId) {
      const ing = ingredients.find((i) => i.id === ingredientId);
      if (ing) setUnit(ing.unitOfMeasure);
    }
  }, [ingredientId, ingredients]);

  const selectedIngredient = ingredients.find((i) => i.id === ingredientId);

  // ---------- SCAN HANDLERS ----------

  async function handleFileUpload(file: File) {
    setScanError("");
    setScanResult(null);
    setScanning(true);
    setAutoCreateResult(null);

    // Show preview (only for images)
    const isImage = file.type.startsWith("image/");
    if (isImage) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
    setPreviewFileName(file.name);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/scan-document", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Errore durante la scansione");
      }

      if (result.needsManualEntry) {
        setScanError("AI non disponibile - inserisci i dati manualmente");
        setMode("manual");
      } else if (result.data) {
        setScanResult(result.data);
        setMode("review");
      }
    } catch (err) {
      setScanError(err instanceof Error ? err.message : "Errore sconosciuto");
    } finally {
      setScanning(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    e.target.value = "";
  }

  async function handleAutoCreate() {
    if (!scanResult) return;
    setAutoCreating(true);
    setError("");

    try {
      const res = await fetch("/api/scan-document/auto-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scanData: scanResult,
          operatorName: operatorName || "Scansione automatica",
          operationalAreaId: operationalAreaId || undefined,
          storageLocationId: storageLocationId || undefined,
          conformity,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Errore");

      setAutoCreateResult(result);
      setSuccess(`${result.batchesCreated} lotti registrati automaticamente!`);

      // Refresh data
      const [freshBatches, freshIng, freshSup] = await Promise.all([
        fetch("/api/batches?kind=SUPPLIER").then((r) => r.json()),
        fetch("/api/ingredients").then((r) => r.json()),
        fetch("/api/suppliers").then((r) => r.json()),
      ]);
      setRecentBatches(Array.isArray(freshBatches) ? freshBatches : []);
      setIngredients(freshIng);
      setSuppliers(freshSup);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore");
    } finally {
      setAutoCreating(false);
    }
  }

  // ---------- MANUAL SUBMIT ----------

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const body: Record<string, unknown> = {
        productName: selectedIngredient?.name ?? "Ingrediente",
        ingredientId: ingredientId || undefined,
        supplierId: supplierId || undefined,
        supplierLotCode: supplierLotCode || undefined,
        quantityReceived: parseFloat(quantity),
        unitOfMeasure: unit,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        inboundTemperature: inboundTemperature ? parseFloat(inboundTemperature) : undefined,
        operationalAreaId: operationalAreaId || undefined,
        storageLocationId: storageLocationId || undefined,
        operatorName: operatorName || undefined,
        conformityOutcome: conformity,
        notes: notes || undefined,
      };

      const res = await fetch("/api/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Errore durante la registrazione");
      }

      const created = await res.json();
      setSuccess(`Lotto ${created.code} registrato con successo!`);

      setIngredientId("");
      setSupplierId("");
      setSupplierLotCode("");
      setQuantity("");
      setUnit("kg");
      setExpiresAt("");
      setInboundTemperature("");
      setOperatorName("");
      setConformity(true);
      setNotes("");

      const freshBatches = await fetch("/api/batches?kind=SUPPLIER").then((r) => r.json());
      setRecentBatches(Array.isArray(freshBatches) ? freshBatches : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto");
    } finally {
      setLoading(false);
    }
  }

  function resetScan() {
    setMode("scan");
    setScanResult(null);
    setScanError("");
    setPreviewUrl(null);
    setPreviewFileName(null);
    setAutoCreateResult(null);
    setSuccess("");
    setError("");
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Ricevimento merce"
        description="Scansiona un DDT o foto prodotto per registrare automaticamente, oppure inserisci manualmente."
      />

      {/* MODE SWITCHER */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => { resetScan(); setMode("scan"); }}
          className={`flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition whitespace-nowrap ${mode === "scan" || mode === "review" ? "bg-brass text-white" : "bg-white border border-black/10 text-ink"}`}
        >
          <Camera className="h-4 w-4" /> Scansiona DDT / Foto
        </button>
        <button
          onClick={() => { resetScan(); setMode("manual"); }}
          className={`flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition whitespace-nowrap ${mode === "manual" ? "bg-brass text-white" : "bg-white border border-black/10 text-ink"}`}
        >
          <Plus className="h-4 w-4" /> Inserimento manuale
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr] sm:gap-6">
        {/* LEFT COLUMN */}
        <div className="space-y-4 sm:space-y-6">
          {/* SCAN MODE */}
          {(mode === "scan" || mode === "review") && (
            <Card title="Scansione intelligente" subtitle="Scatta una foto al DDT o al prodotto — l'AI estrae tutto in automatico.">
              {/* Hidden file inputs */}
              <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={handleFileChange} />
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />

              {!scanResult && !scanning && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-brass/30 bg-brass/5 p-6 transition hover:bg-brass/10 active:scale-[0.98]"
                    >
                      <Camera className="h-8 w-8 text-brass" />
                      <span className="text-sm font-semibold text-brass">Scatta foto</span>
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-black/10 bg-white p-6 transition hover:bg-ink/5 active:scale-[0.98]"
                    >
                      <Upload className="h-8 w-8 text-slate" />
                      <span className="text-sm font-semibold text-slate">Carica file</span>
                      <span className="text-[10px] text-slate/60">Foto, PDF, Word</span>
                    </button>
                  </div>

                  {scanError && (
                    <div className="flex items-center gap-2 rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">
                      <AlertCircle className="h-4 w-4 shrink-0" /> {scanError}
                    </div>
                  )}
                </div>
              )}

              {scanning && (
                <div className="flex flex-col items-center gap-4 py-8">
                  <Loader2 className="h-10 w-10 animate-spin text-brass" />
                  <p className="text-sm text-slate">Analisi AI in corso...</p>
                  {previewUrl ? (
                    <img src={previewUrl} alt="Documento" className="mt-2 max-h-40 rounded-2xl object-contain" />
                  ) : previewFileName ? (
                    <div className="mt-2 flex items-center gap-2 rounded-2xl bg-ink/5 px-4 py-3">
                      <FileText className="h-6 w-6 text-brass" />
                      <span className="text-sm font-medium">{previewFileName}</span>
                    </div>
                  ) : null}
                </div>
              )}

              {/* REVIEW SCANNED RESULTS */}
              {scanResult && mode === "review" && (
                <div className="space-y-4">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Documento scansionato" className="max-h-32 rounded-2xl object-contain" />
                  ) : previewFileName ? (
                    <div className="flex items-center gap-2 rounded-2xl bg-ink/5 px-4 py-3">
                      <FileText className="h-5 w-5 text-brass" />
                      <span className="text-sm font-medium">{previewFileName}</span>
                    </div>
                  ) : null}

                  <div className="rounded-2xl bg-success/10 px-4 py-3">
                    <p className="text-sm font-semibold text-success">
                      <CheckCircle2 className="mr-1 inline h-4 w-4" />
                      {scanResult.documentType === "DDT" ? "DDT riconosciuto" : "Documento analizzato"} — {scanResult.items.length} prodotti trovati
                    </p>
                  </div>

                  {scanResult.supplier?.name && (
                    <div className="rounded-2xl bg-ink/5 px-4 py-3">
                      <p className="text-xs uppercase tracking-wider text-slate">Fornitore</p>
                      <p className="font-semibold">{scanResult.supplier.name}</p>
                      {scanResult.supplier.vatNumber && <p className="text-sm text-slate">P.IVA: {scanResult.supplier.vatNumber}</p>}
                    </div>
                  )}

                  {/* Items table */}
                  <div className="overflow-hidden rounded-2xl border border-black/5">
                    <table className="min-w-full text-sm">
                      <thead className="bg-ink/[0.03]">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-slate">Prodotto</th>
                          <th className="px-3 py-2 text-left font-medium text-slate">Lotto</th>
                          <th className="px-3 py-2 text-left font-medium text-slate">Qta</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5">
                        {scanResult.items.map((item, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2">{item.productName}</td>
                            <td className="px-3 py-2 text-slate">{item.supplierLotCode ?? "-"}</td>
                            <td className="px-3 py-2">{item.quantity ?? "-"} {item.unitOfMeasure ?? ""}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Contextual fields for auto-create */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      className={inputCls}
                      placeholder="Nome operatore"
                      value={operatorName}
                      onChange={(e) => setOperatorName(e.target.value)}
                    />
                    <select className={selectCls} value={operationalAreaId} onChange={(e) => setOperationalAreaId(e.target.value)}>
                      <option value="">Area operativa...</option>
                      {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                    <select className={selectCls} value={storageLocationId} onChange={(e) => setStorageLocationId(e.target.value)}>
                      <option value="">Ubicazione...</option>
                      {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                    <label className="flex h-12 items-center gap-3 rounded-2xl border border-black/10 bg-white px-4">
                      <input type="checkbox" checked={conformity} onChange={(e) => setConformity(e.target.checked)} className="h-5 w-5 rounded" />
                      <span className="text-sm">Conforme</span>
                    </label>
                  </div>

                  {error && <div className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>}
                  {success && <div className="rounded-2xl bg-success/10 px-4 py-3 text-sm text-success">{success}</div>}

                  {/* Auto-create results */}
                  {autoCreateResult && (
                    <div className="space-y-2">
                      {autoCreateResult.batches.map((b) => (
                        <div key={b.code} className="flex items-center justify-between rounded-2xl bg-success/5 px-4 py-2">
                          <div>
                            <span className="font-mono text-sm font-semibold">{b.code}</span>
                            <span className="ml-2 text-sm text-slate">{b.productName}</span>
                          </div>
                          <div className="flex gap-1">
                            <Badge tone="success">{b.quantity} {b.unit}</Badge>
                            {b.isNewIngredient && <Badge tone="warning">Nuovo</Badge>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-3">
                    {!autoCreateResult && (
                      <button onClick={handleAutoCreate} disabled={autoCreating} className={btnPrimary}>
                        {autoCreating ? (
                          <><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Registrazione...</>
                        ) : (
                          <><CheckCircle2 className="mr-2 inline h-4 w-4" />Registra tutti ({scanResult.items.length})</>
                        )}
                      </button>
                    )}
                    <button onClick={resetScan} className={btnSecondary}>
                      {autoCreateResult ? "Nuova scansione" : "Annulla"}
                    </button>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* MANUAL MODE */}
          {mode === "manual" && (
            <Card title="Registrazione manuale" subtitle="Form operativo per tablet e mobile.">
              <form className="grid gap-3 sm:grid-cols-2 sm:gap-4" onSubmit={handleManualSubmit}>
                <select className={selectCls} value={ingredientId} onChange={(e) => setIngredientId(e.target.value)} required>
                  <option value="">Seleziona ingrediente...</option>
                  {ingredients.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>

                <select className={selectCls} value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                  <option value="">Seleziona fornitore...</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>

                <input className={inputCls} placeholder="Codice lotto fornitore" value={supplierLotCode} onChange={(e) => setSupplierLotCode(e.target.value)} />

                <div className="flex gap-2">
                  <input className={inputCls} type="number" step="0.01" placeholder="Quantita'" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
                  <input className="h-12 w-24 shrink-0 rounded-2xl border border-black/10 bg-white px-3" placeholder="Unita'" value={unit} onChange={(e) => setUnit(e.target.value)} required />
                </div>

                <input className={inputCls} type="date" placeholder="Data scadenza" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />

                <input className={inputCls} type="number" step="0.1" placeholder="Temperatura °C" value={inboundTemperature} onChange={(e) => setInboundTemperature(e.target.value)} />

                <select className={selectCls} value={operationalAreaId} onChange={(e) => setOperationalAreaId(e.target.value)}>
                  <option value="">Area operativa...</option>
                  {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>

                <select className={selectCls} value={storageLocationId} onChange={(e) => setStorageLocationId(e.target.value)}>
                  <option value="">Ubicazione stoccaggio...</option>
                  {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>

                <input className={inputCls} placeholder="Nome operatore" value={operatorName} onChange={(e) => setOperatorName(e.target.value)} />

                <label className="flex h-12 items-center gap-3 rounded-2xl border border-black/10 bg-white px-4">
                  <input type="checkbox" checked={conformity} onChange={(e) => setConformity(e.target.checked)} className="h-5 w-5 rounded" />
                  <span className="text-sm">Conforme</span>
                </label>

                <textarea
                  className="rounded-2xl border border-black/10 bg-white px-4 py-3 sm:col-span-2"
                  placeholder="Note"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />

                {error && <div className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger sm:col-span-2">{error}</div>}
                {success && <div className="rounded-2xl bg-success/10 px-4 py-3 text-sm text-success sm:col-span-2">{success}</div>}

                <button className={`${btnPrimary} sm:col-span-2`} type="submit" disabled={loading}>
                  {loading ? "Registrazione..." : "Registra ricevimento"}
                </button>
              </form>
            </Card>
          )}
        </div>

        {/* RIGHT COLUMN: Recent batches */}
        <Card title="Ultimi lotti ricevuti" subtitle="Con esito di accettazione e temperatura.">
          {recentBatches.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate">Nessun lotto ricevuto ancora.</p>
          ) : (
            <DataTable
              headers={["Lotto", "Prodotto", "Qta", "Esito"]}
              rows={recentBatches.slice(0, 20).map((b) => [
                <span key={b.id} className="font-mono text-xs">{b.code}</span>,
                b.ingredient?.name ?? b.productName,
                `${b.quantityReceived} ${b.unitOfMeasure}`,
                <Badge key={`${b.id}-badge`} tone={b.conformityOutcome === "CONFORME" ? "success" : b.conformityOutcome === "NON_CONFORME" ? "danger" : "neutral"}>
                  {b.conformityOutcome === "CONFORME" ? "Conforme" : b.conformityOutcome === "NON_CONFORME" ? "Non conforme" : "N/A"}
                </Badge>,
              ])}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
