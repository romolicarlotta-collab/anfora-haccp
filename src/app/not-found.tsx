import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="rounded-4xl bg-white p-10 text-center shadow-panel">
        <h2 className="font-serif text-4xl">Pagina non trovata</h2>
        <p className="mt-3 text-sm text-slate">Il percorso richiesto non esiste oppure il lotto non e' piu' disponibile.</p>
        <Link href="/dashboard" className="mt-6 inline-flex h-12 items-center rounded-full bg-brass px-5 font-semibold text-white">
          Torna alla dashboard
        </Link>
      </div>
    </div>
  );
}
