"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge, Card, DataTable, PageHeader } from "@/components/ui";
import { generateDerivedCodes, validateDerivedAllocation } from "@/lib/domain/batches";

interface ParentBatch {
  id: string;
  code: string;
  productName: string;
  quantityAvailable: number;
  unitOfMeasure: string;
  status: string;
}

const inputCls = "h-12 w-full rounded-2xl border border-black/10 px-4";
const btnPrimary = "h-12 rounded-full bg-brass px-6 font-semibold text-white disabled:opacity-50";

export default function SublottiPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const [parent, setParent] = useState<ParentBatch | null>(null);
  const [count, setCount] = useState("1");
  const [quantityPerChild, setQuantityPerChild] = useState("");
  const [operatorName, setOperatorName] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [createdCodes, setCreatedCodes] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/batches?search=${encodeURIComponent(code)}`);
        const batches = await res.json();
        if (Array.isArray(batches) && batches.length > 0) {
          const found = batches.find((b: ParentBatch) => b.code === code) || batches[0];
          setParent({
            id: found.id,
            code: found.code,
            productName: found.productName,
            quantityAvailable: Number(found.quantityAvailable),
            unitOfMeasure: found.unitOfMeasure,
            status: found.status,
          });
        } else {
          setError("Lotto padre non trovato");
        }
      } catch {
        setError("Errore nel caricamento del lotto padre");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [code]);

  const countNum = parseInt(count) || 0;
  const qtyNum = parseFloat(quantityPerChild) || 0;

  const allocation = parent
    ? validateDerivedAllocation({
        count: countNum,
        quantityPerChild: qtyNum,
        availableQuantity: parent.quantityAvailable,
      })
    : { total: 0, isValid: false };

  const previewCodes = parent && countNum > 0 ? generateDerivedCodes(parent.code, countNum) : [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!parent) return;
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      if (!allocation.isValid) {
        throw new Error("La somma delle quantita' dei sublotti supera la disponibilita' del lotto padre.");
      }

      const body = {
        parentBatchId: parent.id,
        parentBatchCode: parent.code,
        quantityAvailable: parent.quantityAvailable,
        count: countNum,
        quantityPerChild: qtyNum,
        unitOfMeasure: parent.unitOfMeasure,
        operatorName,
        suffixMode: "AUTO" as const,
      };

      const res = await fetch("/api/derived-batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Errore durante la creazione dei sublotti");
      }

      const result = await res.json();
      setCreatedCodes(result.codes || []);
      setSuccess(`${result.codes?.length ?? countNum} sublotti creati con successo!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title={`Crea sublotti da ${code}`} description="Caricamento..." />
        <div className="text-center text-slate">Caricamento in corso...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Crea sublotti da ${code}`}
        description="Porzionamento e travaso da lotto esistente con eredita' automatica di dati principali e controllo quantita' residua."
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card title="Configurazione sublotti" subtitle={parent ? `Disponibile: ${parent.quantityAvailable} ${parent.unitOfMeasure}` : ""}>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm text-slate">Quantita' disponibile lotto padre</label>
              <input className={inputCls} value={parent ? `${parent.quantityAvailable} ${parent.unitOfMeasure}` : "-"} disabled />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate">Numero contenitori</label>
              <input
                className={inputCls}
                type="number"
                min="1"
                max="26"
                value={count}
                onChange={(e) => setCount(e.target.value)}
                placeholder="N. contenitori"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate">Quantita' per contenitore ({parent?.unitOfMeasure ?? ""})</label>
              <input
                className={inputCls}
                type="number"
                step="0.01"
                value={quantityPerChild}
                onChange={(e) => setQuantityPerChild(e.target.value)}
                placeholder="Qta ciascuno"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm text-slate">Nome operatore</label>
              <input
                className={inputCls}
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                placeholder="Nome operatore"
                required
              />
            </div>

            {error && <div className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger md:col-span-2">{error}</div>}
            {success && <div className="rounded-2xl bg-success/10 px-4 py-3 text-sm text-success md:col-span-2">{success}</div>}

            <button className={`${btnPrimary} md:col-span-2`} type="submit" disabled={submitting || !allocation.isValid || countNum === 0 || qtyNum === 0}>
              {submitting ? "Creazione..." : "Genera sublotti ed etichette"}
            </button>
          </form>

          <div className="mt-4 flex items-center gap-3">
            <Badge tone={countNum > 0 && qtyNum > 0 && allocation.isValid ? "success" : "danger"}>
              {countNum > 0 && qtyNum > 0 && allocation.isValid ? "Allocazione valida" : "Allocazione non valida"}
            </Badge>
            <span className="text-sm text-slate">
              Totale assegnato: {allocation.total} {parent?.unitOfMeasure ?? ""}
            </span>
          </div>
        </Card>

        <Card title="Regole applicate" subtitle="Eredita' e tracciabilita'">
          <ul className="space-y-3 text-sm text-slate">
            <li>Eredita prodotto, allergeni, data produzione, scadenza e genealogia.</li>
            <li>Genera codice gerarchico figlio dal lotto padre.</li>
            <li>Registra movimento di stock e stampa etichette.</li>
            <li>Riduce la quantita' residua del lotto padre.</li>
          </ul>
        </Card>
      </div>

      {/* Preview of generated codes */}
      {previewCodes.length > 0 && countNum > 0 && qtyNum > 0 && (
        <Card title={createdCodes.length > 0 ? "Sublotti creati" : "Anteprima sublotti"} subtitle={createdCodes.length > 0 ? "Sublotti generati con successo" : "Codici che verranno generati"}>
          <DataTable
            headers={["Sublotto", "Quantita'", "Lotto padre"]}
            rows={(createdCodes.length > 0 ? createdCodes : previewCodes).map((childCode) => [
              childCode,
              `${quantityPerChild} ${parent?.unitOfMeasure ?? ""}`,
              code,
            ])}
          />
        </Card>
      )}
    </div>
  );
}
