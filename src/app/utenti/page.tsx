import { prisma } from "@/lib/prisma";
import { Badge, Card, DataTable, PageHeader } from "@/components/ui";

export default async function UtentiPage() {
  const users = await prisma.user.findMany({
    include: { role: true },
    orderBy: { name: "asc" },
  });

  const roles = await prisma.role.findMany({
    include: { _count: { select: { users: true } } },
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader title="Utenti e permessi" description="Ruoli operativi differenziati per cucina, HACCP, amministrazione e supervisione." />
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr] sm:gap-6">
        <Card title="Utenti registrati" subtitle="Account attivi nel sistema.">
          <DataTable
            headers={["Nome", "Email", "Ruolo"]}
            rows={users.map((u) => [
              u.name,
              u.email,
              <Badge key={u.id} tone="neutral">{u.role.name}</Badge>,
            ])}
          />
        </Card>
        <Card title="Ruoli disponibili" subtitle="Permessi operativi dell'MVP.">
          <DataTable
            headers={["Ruolo", "Chiave", "Utenti"]}
            rows={roles.map((r) => [
              r.name,
              <span key={r.id} className="font-mono text-xs">{r.key}</span>,
              String(r._count.users),
            ])}
          />
        </Card>
      </div>
    </div>
  );
}
