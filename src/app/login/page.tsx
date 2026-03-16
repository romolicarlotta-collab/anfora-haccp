"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@anfora.local");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false
    });

    setLoading(false);

    if (result?.error) {
      setError("Credenziali non valide. Riprova.");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="mx-auto grid min-h-[70vh] max-w-6xl items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="rounded-[2rem] bg-ink p-10 text-white shadow-panel">
        <p className="text-sm uppercase tracking-[0.28em] text-white/50">Accesso operativo</p>
        <h1 className="mt-4 font-serif text-5xl">HACCP digitale semplice per cucina, bar e pizzeria.</h1>
        <p className="mt-4 max-w-xl text-white/72">
          Registra lotti, produzioni, temperature e controlli da tablet o desktop con un flusso pensato per L&apos;Anfora.
        </p>
      </section>
      <section className="rounded-[2rem] bg-white p-8 shadow-panel">
        <h2 className="font-serif text-3xl">Accedi</h2>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Email</span>
            <input
              className="h-12 w-full rounded-2xl border border-black/10 px-4"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Password</span>
            <input
              className="h-12 w-full rounded-2xl border border-black/10 px-4"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && (
            <p className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>
          )}
          <button
            className="h-12 w-full rounded-full bg-brass font-semibold text-white disabled:opacity-50"
            type="submit"
            disabled={loading}
          >
            {loading ? "Accesso in corso..." : "Entra in piattaforma"}
          </button>
        </form>
        <div className="mt-6 rounded-3xl bg-sand p-4 text-sm text-slate">
          Demo: admin@anfora.local / demo1234
        </div>
      </section>
    </div>
  );
}
