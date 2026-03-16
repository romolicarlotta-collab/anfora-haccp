import { BatchStatus, CheckStatus, NonConformityStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  // Compute today's boundaries in Europe/Rome timezone
  const nowRome = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Europe/Rome" })
  );
  const startOfDay = new Date(nowRome);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(nowRome);
  endOfDay.setHours(23, 59, 59, 999);

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    expiringToday,
    lowStock,
    pendingChecks,
    tempAlerts,
    recentNonConformities,
    recentTemperatures,
    recentChecks
  ] = await Promise.all([
    // Batches expiring today
    prisma.batch.count({
      where: {
        status: BatchStatus.ACTIVE,
        expiresAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    }),

    // Low stock batches
    prisma.batch.count({
      where: {
        status: BatchStatus.LOW_STOCK
      }
    }),

    // Pending or overdue HACCP checks
    prisma.haccpCheck.count({
      where: {
        status: {
          in: [CheckStatus.PENDING, CheckStatus.OVERDUE]
        }
      }
    }),

    // Temperature alerts in last 24h
    prisma.temperatureLog.count({
      where: {
        isAlert: true,
        recordedAt: {
          gte: twentyFourHoursAgo
        }
      }
    }),

    // Recent open/in-progress non-conformities with actions
    prisma.nonConformity.findMany({
      where: {
        status: {
          in: [NonConformityStatus.OPEN, NonConformityStatus.IN_PROGRESS]
        }
      },
      include: {
        actions: true
      },
      orderBy: {
        openedAt: "desc"
      }
    }),

    // Last 10 temperature logs
    prisma.temperatureLog.findMany({
      include: {
        operationalArea: true,
        recordedBy: true
      },
      orderBy: {
        recordedAt: "desc"
      },
      take: 10
    }),

    // Last 10 HACCP checks
    prisma.haccpCheck.findMany({
      include: {
        operationalArea: true,
        assignedTo: true
      },
      orderBy: {
        dueAt: "desc"
      },
      take: 10
    })
  ]);

  return NextResponse.json({
    expiringToday,
    lowStock,
    pendingChecks,
    tempAlerts,
    recentNonConformities,
    recentTemperatures,
    recentChecks
  });
}
