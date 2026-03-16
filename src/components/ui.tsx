import Link from "next/link";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actionLabel,
  actionHref
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 rounded-4xl bg-white p-6 shadow-panel lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 className="font-serif text-3xl">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate">{description}</p>
      </div>
      {actionLabel && actionHref ? (
        <Link href={actionHref as never} className="inline-flex h-12 items-center justify-center rounded-full bg-brass px-5 text-sm font-semibold text-white">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

export function Card({
  title,
  subtitle,
  children,
  className
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-4xl bg-white p-6 shadow-panel", className)}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        {subtitle ? <p className="mt-1 text-sm text-slate">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function Badge({
  children,
  tone = "neutral"
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "danger" | "warning";
}) {
  const styles = {
    neutral: "bg-ink/5 text-ink",
    success: "bg-success/10 text-success",
    danger: "bg-danger/10 text-danger",
    warning: "bg-brass/10 text-brass"
  };

  return <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", styles[tone])}>{children}</span>;
}

export function DataTable({
  headers,
  rows
}: {
  headers: string[];
  rows: Array<Array<React.ReactNode>>;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-black/5">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-black/5 text-sm">
          <thead className="bg-ink/[0.03] text-left text-slate">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-4 py-3 font-medium">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 bg-white">
            {rows.map((row, index) => (
              <tr key={index}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-4 align-top">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
