export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { Card, DataTable, PageHeader } from "@/components/ui";

export default async function DocumentiPage() {
  const attachments = await prisma.attachment.findMany({
    include: {
      supplier: true,
      batch: true,
    },
    orderBy: { uploadedAt: "desc" },
  });

  function formatDate(d: Date): string {
    return d.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader title="Archivio documenti" description="DDT scansionati, foto prodotti, certificati fornitori e allegati lotti." />
      <Card title="Documenti archiviati" subtitle="File caricati e associati a fornitori e lotti.">
        {attachments.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate">
            Nessun documento archiviato. I documenti vengono creati automaticamente quando scansioni un DDT o carichi una foto.
          </p>
        ) : (
          <DataTable
            headers={["Documento", "Tipo", "Collegato a", "Data"]}
            rows={attachments.map((item) => [
              item.fileName,
              item.mimeType.split("/")[1]?.toUpperCase() ?? item.mimeType,
              item.supplier?.name ?? item.batch?.code ?? "-",
              formatDate(item.uploadedAt),
            ])}
          />
        )}
      </Card>
    </div>
  );
}
