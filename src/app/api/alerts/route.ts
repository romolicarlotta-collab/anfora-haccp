import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 1. Expiring batches (expires today or already expired, still ACTIVE)
    const expiringBatches = await prisma.batch.findMany({
      where: {
        status: "ACTIVE",
        expiresAt: { lte: tomorrow },
      },
      select: { id: true, code: true, productName: true, expiresAt: true, quantityAvailable: true, unitOfMeasure: true },
      orderBy: { expiresAt: "asc" },
    });

    // 2. Low stock batches
    const lowStockBatches = await prisma.batch.findMany({
      where: {
        status: "ACTIVE",
        lowStockThreshold: { gt: 0 },
      },
      select: { id: true, code: true, productName: true, quantityAvailable: true, lowStockThreshold: true, unitOfMeasure: true },
    });
    const actualLowStock = lowStockBatches.filter(b =>
      Number(b.quantityAvailable) <= Number(b.lowStockThreshold)
    );

    // 3. Temperature alerts (last 24h)
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const tempAlerts = await prisma.temperatureLog.findMany({
      where: {
        isAlert: true,
        recordedAt: { gte: yesterday },
      },
      select: { id: true, title: true, value: true, minThreshold: true, maxThreshold: true, recordedAt: true },
      orderBy: { recordedAt: "desc" },
    });

    // 4. Open non-conformities
    const openNCs = await prisma.nonConformity.findMany({
      where: {
        status: { in: ["OPEN", "IN_PROGRESS"] },
      },
      select: { id: true, title: true, severity: true, status: true, openedAt: true },
      orderBy: { openedAt: "desc" },
    });

    // 5. Overdue/pending HACCP checks
    const pendingChecks = await prisma.haccpCheck.findMany({
      where: {
        status: "PENDING",
      },
      select: { id: true, title: true, checklistType: true, dueAt: true, operationalArea: { select: { name: true } } },
      orderBy: { dueAt: "asc" },
    });

    // Build flat alert list
    const alerts: Array<{
      id: string;
      type: "expiry" | "low_stock" | "temperature" | "non_conformity" | "checklist";
      severity: "danger" | "warning" | "info";
      title: string;
      detail: string;
      timestamp: string;
      link: string;
    }> = [];

    for (const b of expiringBatches) {
      const isExpired = b.expiresAt && new Date(b.expiresAt) < now;
      alerts.push({
        id: `exp-${b.id}`,
        type: "expiry",
        severity: isExpired ? "danger" : "warning",
        title: isExpired ? "Lotto scaduto" : "Lotto in scadenza",
        detail: `${b.code} — ${b.productName} (${b.quantityAvailable} ${b.unitOfMeasure})`,
        timestamp: b.expiresAt?.toISOString() ?? now.toISOString(),
        link: `/lotti/${b.code}`,
      });
    }

    for (const b of actualLowStock) {
      alerts.push({
        id: `low-${b.id}`,
        type: "low_stock",
        severity: "warning",
        title: "Stock basso",
        detail: `${b.code} — ${b.productName}: ${b.quantityAvailable}/${b.lowStockThreshold} ${b.unitOfMeasure}`,
        timestamp: now.toISOString(),
        link: `/lotti/${b.code}`,
      });
    }

    for (const t of tempAlerts) {
      alerts.push({
        id: `temp-${t.id}`,
        type: "temperature",
        severity: "danger",
        title: "Temperatura fuori soglia",
        detail: `${t.title}: ${t.value}°C (soglia ${t.minThreshold}–${t.maxThreshold}°C)`,
        timestamp: t.recordedAt.toISOString(),
        link: `/temperature`,
      });
    }

    for (const nc of openNCs) {
      alerts.push({
        id: `nc-${nc.id}`,
        type: "non_conformity",
        severity: nc.severity === "Alta" ? "danger" : "warning",
        title: `NC: ${nc.title}`,
        detail: `Stato: ${nc.status} — Severità: ${nc.severity}`,
        timestamp: nc.openedAt.toISOString(),
        link: `/non-conformita`,
      });
    }

    for (const c of pendingChecks) {
      alerts.push({
        id: `check-${c.id}`,
        type: "checklist",
        severity: "info",
        title: "Checklist da completare",
        detail: `${c.checklistType} — ${c.operationalArea?.name ?? c.title}`,
        timestamp: c.dueAt?.toISOString() ?? now.toISOString(),
        link: `/checklist-haccp`,
      });
    }

    return NextResponse.json({ count: alerts.length, alerts });
  } catch (error) {
    console.error("[GET /api/alerts]", error);
    return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 });
  }
}
