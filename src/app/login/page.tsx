"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasUsers, setHasUsers] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/setup")
      .then((r) => r.json())
      .then((data) => {
        setHasUsers(data.hasUsers);
        if (!data.hasUsers) setMode("register");
      })
      .catch(() => {});
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Credenziali non valide. Riprova.");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Errore durante la registrazione");
        setLoading(false);
        return;
      }

      setSuccess("Account creato! Accesso in corso...");

      // Auto-login
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      setLoading(false);

      if (result?.error) {
        setSuccess("Account creato! Usa le credenziali per accedere.");
        setMode("login");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Errore di connessione. Riprova.");
      setLoading(false);
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
        {mode === "login" ? (
          <>
            <h2 className="font-serif text-3xl">Accedi</h2>
            <form className="mt-6 space-y-4" onSubmit={handleLogin}>
              <label className="block">
                <span className="mb-2 block text-sm font-medium">Email</span>
                <input
                  className="h-12 w-full rounded-2xl border border-black/10 px-4"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="la-tua@email.com"
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
              {error && <p className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}
              {success && <p className="rounded-2xl bg-success/10 px-4 py-3 text-sm text-success">{success}</p>}
              <button
                className="h-12 w-full rounded-full bg-brass font-semibold text-white disabled:opacity-50"
                type="submit"
                disabled={loading}
              >
                {loading ? "Accesso in corso..." : "Entra in piattaforma"}
              </button>
            </form>
            <button
              onClick={() => { setMode("register"); setError(""); setSuccess(""); }}
              className="mt-4 w-full rounded-3xl bg-sand p-4 text-sm text-slate hover:bg-sand/80 transition"
            >
              Non hai un account? <span className="font-semibold text-brass">Crea account</span>
            </button>
          </>
        ) : (
          <>
            <h2 className="font-serif text-3xl">
              {hasUsers === false ? "Configura L'Anfora" : "Crea account"}
            </h2>
            {hasUsers === false && (
              <p className="mt-2 text-sm text-slate">
                Primo accesso! Crea il tuo account amministratore.
              </p>
            )}
            <form className="mt-6 space-y-4" onSubmit={handleRegister}>
              <label className="block">
                <span className="mb-2 block text-sm font-medium">Nome completo</span>
                <input
                  className="h-12 w-full rounded-2xl border border-black/10 px-4"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="es. Giulia Rossi"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium">Email</span>
                <input
                  className="h-12 w-full rounded-2xl border border-black/10 px-4"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="la-tua@email.com"
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
                  placeholder="Minimo 6 caratteri"
                  minLength={6}
                  required
                />
              </label>
              {error && <p className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}
              {success && <p className="rounded-2xl bg-success/10 px-4 py-3 text-sm text-success">{success}</p>}
              <button
                className="h-12 w-full rounded-full bg-brass font-semibold text-white disabled:opacity-50"
                type="submit"
                disabled={loading}
              >
                {loading ? "Creazione..." : "Crea account e accedi"}
              </button>
            </form>
            {hasUsers !== false && (
              <button
                onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
                className="mt-4 w-full rounded-3xl bg-sand p-4 text-sm text-slate hover:bg-sand/80 transition"
              >
                Hai gia&apos; un account? <span className="font-semibold text-brass">Accedi</span>
              </button>
            )}
          </>
        )}
      </section>
    </div>
  );
}
