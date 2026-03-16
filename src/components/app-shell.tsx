"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import {
  Bell, ClipboardCheck, CookingPot, Factory, LayoutDashboard,
  LogOut, Menu, PackageSearch, Printer, Settings, Thermometer,
  Truck, Users2, X, FileText, AlertTriangle, CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/ricevimento-merce", label: "Ricevimento", icon: Truck },
  { href: "/magazzino-lotti", label: "Magazzino lotti", icon: Factory },
  { href: "/produzione/nuova", label: "Nuova produzione", icon: CookingPot },
  { href: "/tracciabilita", label: "Tracciabilita'", icon: PackageSearch },
  { href: "/etichette/ristampa", label: "Etichette", icon: Printer },
  { href: "/temperature", label: "Temperature", icon: Thermometer },
  { href: "/checklist-haccp", label: "Checklist HACCP", icon: ClipboardCheck },
  { href: "/non-conformita", label: "Non conformita'", icon: AlertTriangle },
  { href: "/ingredienti", label: "Ingredienti", icon: PackageSearch },
  { href: "/fornitori", label: "Fornitori", icon: Truck },
  { href: "/ricette", label: "Ricette", icon: FileText },
  { href: "/utenti", label: "Utenti", icon: Users2 },
  { href: "/impostazioni", label: "Impostazioni", icon: Settings },
];

type AlertItem = {
  id: string;
  type: "expiry" | "low_stock" | "temperature" | "non_conformity" | "checklist";
  severity: "danger" | "warning" | "info";
  title: string;
  detail: string;
  timestamp: string;
  link: string;
};

const TYPE_LABELS: Record<AlertItem["type"], string> = {
  expiry: "Scadenze",
  low_stock: "Stock basso",
  temperature: "Temperature",
  non_conformity: "Non conformita'",
  checklist: "Checklist HACCP",
};

const TYPE_ORDER: AlertItem["type"][] = [
  "temperature",
  "expiry",
  "low_stock",
  "non_conformity",
  "checklist",
];

function severityDot(severity: AlertItem["severity"]) {
  if (severity === "danger") return "bg-red-500";
  if (severity === "warning") return "bg-amber-500";
  return "bg-blue-500";
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const absDiff = Math.abs(diff);
  const mins = Math.floor(absDiff / 60000);
  if (mins < 1) return "ora";
  if (mins < 60) return `${mins}m fa`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h fa`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "ieri";
  return `${days}g fa`;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [alertPanelOpen, setAlertPanelOpen] = useState(false);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [alertCount, setAlertCount] = useState<number | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch("/api/alerts");
      if (!res.ok) return;
      const data = await res.json();
      setAlerts(data.alerts ?? []);
      setAlertCount(data.count ?? 0);
    } catch {
      // silently ignore fetch errors
    }
  }, []);

  // Fetch alerts on mount and every 60s
  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60_000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Close panels on escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSidebarOpen(false);
        setAlertPanelOpen(false);
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  if (pathname === "/login") {
    return <div className="min-h-screen bg-sand px-5 py-8 text-ink lg:px-8">{children}</div>;
  }

  const userName = session?.user?.name ?? "—";
  const userRole = (session?.user as Record<string, unknown>)?.role as string ?? "—";

  // Group alerts by type
  const grouped = TYPE_ORDER.reduce<Record<string, AlertItem[]>>((acc, type) => {
    const items = alerts.filter((a) => a.type === type);
    if (items.length > 0) acc[type] = items;
    return acc;
  }, {});

  const dangerCount = alerts.filter((a) => a.severity === "danger").length;

  return (
    <div className="min-h-screen bg-sand text-ink">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Alert panel overlay */}
      {alertPanelOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50"
          onClick={() => setAlertPanelOpen(false)}
        />
      )}

      {/* Alert slide-over panel */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-[60] w-full max-w-md transform bg-white shadow-2xl transition-transform duration-300 ease-in-out",
          alertPanelOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Panel header */}
          <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-brass" />
              <h2 className="font-serif text-xl">Alert attivi</h2>
              {alertCount !== null && alertCount > 0 && (
                <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                  {alertCount}
                </span>
              )}
            </div>
            <button
              onClick={() => setAlertPanelOpen(false)}
              className="rounded-xl p-2 text-slate hover:bg-black/5 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Panel body */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {alertCount === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-3" />
                <p className="font-serif text-lg text-ink">Tutto OK</p>
                <p className="mt-1 text-sm text-slate">Nessun alert attivo al momento</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(grouped).map(([type, items]) => (
                  <div key={type}>
                    <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-slate">
                      {TYPE_LABELS[type as AlertItem["type"]]} ({items.length})
                    </p>
                    <div className="space-y-1.5">
                      {items.map((alert) => (
                        <button
                          key={alert.id}
                          onClick={() => {
                            setAlertPanelOpen(false);
                            router.push(alert.link);
                          }}
                          className="flex w-full items-start gap-3 rounded-2xl border border-black/5 bg-sand/50 px-4 py-3 text-left transition hover:bg-sand hover:shadow-panel active:scale-[0.98]"
                        >
                          <span
                            className={cn(
                              "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full",
                              severityDot(alert.severity)
                            )}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold leading-snug">{alert.title}</p>
                            <p className="mt-0.5 truncate text-xs text-slate">{alert.detail}</p>
                          </div>
                          <span className="shrink-0 text-[10px] text-slate/70">
                            {relativeTime(alert.timestamp)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[260px_1fr]">
        {/* SIDEBAR */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-[280px] transform border-r border-black/5 bg-ink px-5 py-6 text-white transition-transform duration-300 lg:static lg:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="font-serif text-2xl">L&apos;Anfora</p>
              <p className="mt-1 text-xs text-white/70">HACCP &amp; Tracciabilita&apos;</p>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="rounded-xl p-2 text-white/50 hover:bg-white/10 lg:hidden">
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="space-y-1 overflow-y-auto" style={{ maxHeight: "calc(100vh - 200px)" }}>
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition active:scale-[0.98]",
                    isActive ? "bg-white text-ink font-semibold" : "text-white/76 hover:bg-white/10"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 rounded-2xl bg-white/10 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-white/50">Sessione</p>
            <p className="mt-1 truncate font-semibold text-sm">{userName}</p>
            <p className="truncate text-xs text-white/70">{userRole}</p>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="mt-2 flex items-center gap-2 text-xs text-white/50 transition hover:text-white/80"
            >
              <LogOut className="h-3 w-3" /> Esci
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <main className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-black/5 bg-sand/95 px-4 py-3 backdrop-blur sm:px-5 sm:py-4 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="rounded-xl p-2 text-ink hover:bg-black/5 lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate sm:text-xs">Operativita&apos; quotidiana</p>
                <h1 className="font-serif text-lg sm:text-2xl">Controllo food safety</h1>
              </div>
            </div>
            <button
              onClick={() => {
                setAlertPanelOpen(true);
                fetchAlerts();
              }}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1.5 shadow-panel transition hover:shadow-md active:scale-[0.97] sm:px-4 sm:py-2",
                alertCount === 0
                  ? "border-emerald-200 bg-emerald-50"
                  : dangerCount > 0
                    ? "border-red-200 bg-red-50"
                    : "border-black/10 bg-white"
              )}
            >
              {alertCount === 0 ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="hidden text-sm text-emerald-700 sm:inline">Tutto OK</span>
                </>
              ) : (
                <>
                  <Bell className={cn("h-4 w-4", dangerCount > 0 ? "text-red-600" : "text-brass")} />
                  <span className="hidden text-sm sm:inline">
                    {alertCount !== null ? `${alertCount} alert apert${alertCount === 1 ? "o" : "i"}` : "..."}
                  </span>
                  <span className="text-xs sm:hidden">{alertCount ?? "..."}</span>
                  {dangerCount > 0 && (
                    <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  )}
                </>
              )}
            </button>
          </header>
          <div className="flex-1 px-4 py-4 sm:px-5 sm:py-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
