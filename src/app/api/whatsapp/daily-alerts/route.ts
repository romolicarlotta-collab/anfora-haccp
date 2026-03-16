import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// GET /api/whatsapp/daily-alerts
// Returns a structured daily alert summary for WhatsApp integration.
// Can be called by a cron job, external scheduler, or manually.
// POST with { phone: string } to trigger sending (integration layer handles delivery)
// ---------------------------------------------------------------------------

interface DailyAlert {
  category: string;
  severity: "critical" | "warning" | "info";
  message: string;
}

async function buildDailyAlerts(): Promise<DailyAlert[]> {
  const alerts: DailyAlert[] = [];
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowEnd = new Date(todayStart);
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 2);

  // 1. Check if temperatures were recorded today
  const todayTemps = await prisma.temperatureLog.count({
    where: { recordedAt: { gte: todayStart } },
  });

  if (todayTemps === 0) {
    alerts.push({
      category: "temperature",
      severity: "critical",
      message: "⚠️ *TEMPERATURE NON REGISTRATE*\nNessuna rilevazione temperatura inserita oggi. Registrare immediatamente.",
    });
  } else {
    // Check for temperature alerts today
    const tempAlerts = await prisma.temperatureLog.findMany({
      where: {
        isAlert: true,
        recordedAt: { gte: todayStart },
      },
      select: { title: true, value: true, minThreshold: true, maxThreshold: true },
    });

    if (tempAlerts.length > 0) {
      const lines = tempAlerts.map(
        (t) => `• ${t.title}: ${t.value}°C (soglia ${t.minThreshold}–${t.maxThreshold}°C)`
      );
      alerts.push({
        category: "temperature",
        severity: "critical",
        message: `🌡️ *ALERT TEMPERATURA* (${tempAlerts.length})\n${lines.join("\n")}`,
      });
    }
  }

  // 2. Expiring batches (today + tomorrow)
  const expiringBatches = await prisma.batch.findMany({
    where: {
      status: "ACTIVE",
      expiresAt: { lte: tomorrowEnd },
    },
    select: { code: true, productName: true, expiresAt: true, quantityAvailable: true, unitOfMeasure: true },
    orderBy: { expiresAt: "asc" },
  });

  if (expiringBatches.length > 0) {
    const expired = expiringBatches.filter((b) => b.expiresAt && new Date(b.expiresAt) < now);
    const expiring = expiringBatches.filter((b) => b.expiresAt && new Date(b.expiresAt) >= now);

    if (expired.length > 0) {
      const lines = expired.map((b) => `• ${b.code} — ${b.productName} (${b.quantityAvailable} ${b.unitOfMeasure})`);
      alerts.push({
        category: "expiry",
        severity: "critical",
        message: `🔴 *LOTTI SCADUTI* (${expired.length})\n${lines.join("\n")}`,
      });
    }

    if (expiring.length > 0) {
      const lines = expiring.map((b) => {
        const expDate = b.expiresAt ? new Date(b.expiresAt).toLocaleDateString("it-IT") : "";
        return `• ${b.code} — ${b.productName} (scad. ${expDate})`;
      });
      alerts.push({
        category: "expiry",
        severity: "warning",
        message: `🟡 *LOTTI IN SCADENZA* (${expiring.length})\n${lines.join("\n")}`,
      });
    }
  }

  // 3. Low stock
  const lowStockBatches = await prisma.batch.findMany({
    where: {
      status: "ACTIVE",
      lowStockThreshold: { gt: 0 },
    },
    select: { code: true, productName: true, quantityAvailable: true, lowStockThreshold: true, unitOfMeasure: true },
  });

  const actualLowStock = lowStockBatches.filter(
    (b) => Number(b.quantityAvailable) <= Number(b.lowStockThreshold)
  );

  if (actualLowStock.length > 0) {
    const lines = actualLowStock.map(
      (b) => `• ${b.code} — ${b.productName}: ${b.quantityAvailable}/${b.lowStockThreshold} ${b.unitOfMeasure}`
    );
    alerts.push({
      category: "low_stock",
      severity: "warning",
      message: `📦 *STOCK BASSO* (${actualLowStock.length})\n${lines.join("\n")}`,
    });
  }

  // 4. Open non-conformities
  const openNCs = await prisma.nonConformity.count({
    where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
  });

  if (openNCs > 0) {
    alerts.push({
      category: "non_conformity",
      severity: "warning",
      message: `📋 *NON CONFORMITÀ APERTE*: ${openNCs}`,
    });
  }

  // 5. Pending HACCP checks
  const pendingChecks = await prisma.haccpCheck.count({
    where: { status: "PENDING" },
  });

  if (pendingChecks > 0) {
    alerts.push({
      category: "checklist",
      severity: "info",
      message: `✅ *CHECKLIST DA COMPLETARE*: ${pendingChecks}`,
    });
  }

  return alerts;
}

function formatWhatsAppMessage(alerts: DailyAlert[]): string {
  const header = `🏪 *L'Ànfora — Report giornaliero*\n📅 ${new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}\n`;

  if (alerts.length === 0) {
    return `${header}\n✅ *Tutto OK!* Nessun alert attivo oggi.`;
  }

  const criticals = alerts.filter((a) => a.severity === "critical");
  const warnings = alerts.filter((a) => a.severity === "warning");
  const infos = alerts.filter((a) => a.severity === "info");

  let body = header;

  if (criticals.length > 0) {
    body += `\n${"─".repeat(30)}\n`;
    body += criticals.map((a) => a.message).join("\n\n");
  }

  if (warnings.length > 0) {
    body += `\n\n${"─".repeat(30)}\n`;
    body += warnings.map((a) => a.message).join("\n\n");
  }

  if (infos.length > 0) {
    body += `\n\n${"─".repeat(30)}\n`;
    body += infos.map((a) => a.message).join("\n\n");
  }

  body += `\n\n💬 Rispondi con "lotto CODICE" per dettagli su un lotto.`;

  return body;
}

// GET: Retrieve daily alerts summary (for preview/testing)
export async function GET() {
  try {
    const alerts = await buildDailyAlerts();
    const message = formatWhatsAppMessage(alerts);

    return NextResponse.json({
      alertCount: alerts.length,
      alerts,
      whatsappMessage: message,
    });
  } catch (error) {
    console.error("[GET /api/whatsapp/daily-alerts]", error);
    return NextResponse.json(
      { error: "Failed to build daily alerts" },
      { status: 500 },
    );
  }
}

// POST: Trigger daily alert dispatch (called by cron/scheduler)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { phone, webhookUrl } = body as { phone?: string; webhookUrl?: string };

    const alerts = await buildDailyAlerts();
    const message = formatWhatsAppMessage(alerts);

    // Log the alert dispatch
    await prisma.auditLog.create({
      data: {
        action: "DAILY_ALERT_DISPATCHED",
        entityType: "WhatsApp",
        entityId: phone ?? "system",
        payload: {
          alertCount: alerts.length,
          categories: alerts.map((a) => a.category),
          phone: phone ?? null,
        },
      },
    });

    // If webhookUrl is provided, forward the message there (for n8n, Make, Zapier)
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone,
            message,
            alertCount: alerts.length,
            alerts,
          }),
        });
      } catch (webhookError) {
        console.error("[WhatsApp daily-alerts] Webhook forward failed:", webhookError);
      }
    }

    return NextResponse.json({
      success: true,
      alertCount: alerts.length,
      message,
      dispatched: !!webhookUrl,
    });
  } catch (error) {
    console.error("[POST /api/whatsapp/daily-alerts]", error);
    return NextResponse.json(
      { error: "Failed to dispatch daily alerts" },
      { status: 500 },
    );
  }
}
