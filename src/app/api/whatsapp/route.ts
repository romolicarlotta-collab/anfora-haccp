import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// WhatsApp Webhook Endpoint
// POST /api/whatsapp — Receives messages from WhatsApp Business API or
//   third-party services (Twilio, Meta Cloud API, etc.)
//
// This endpoint can be used to:
// 1. Receive DDT photos via WhatsApp → forward to AI scan
// 2. Query batch status ("stato lotto SG-20260313-01")
// 3. Receive temperature readings
// 4. Send alerts to operators
//
// GET /api/whatsapp — Webhook verification (Meta Cloud API)
// ---------------------------------------------------------------------------

// Meta webhook verification
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "anfora-haccp-verify";

  if (mode === "subscribe" && token === verifyToken) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ status: "ok", message: "WhatsApp webhook attivo" });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Log incoming webhook
    await prisma.auditLog.create({
      data: {
        action: "WHATSAPP_WEBHOOK_RECEIVED",
        entityType: "WhatsApp",
        entityId: "webhook",
        payload: body,
      },
    });

    // Extract message text (Meta Cloud API format)
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];

    if (!message) {
      // Might be a status update, acknowledge it
      return NextResponse.json({ status: "ok" });
    }

    const from = message.from; // phone number
    const msgType = message.type; // text, image, document
    const text = message.text?.body || "";

    let responseText = "";

    // Handle text messages — batch queries
    if (msgType === "text") {
      const lowerText = text.toLowerCase().trim();

      // Batch status query
      if (lowerText.startsWith("lotto ") || lowerText.startsWith("stato ")) {
        const code = text.replace(/^(lotto|stato)\s+/i, "").trim();
        const batch = await prisma.batch.findFirst({
          where: {
            OR: [
              { code: { contains: code, mode: "insensitive" } },
              { supplierLotCode: { contains: code, mode: "insensitive" } },
            ],
          },
          include: { ingredient: true, supplier: true },
        });

        if (batch) {
          responseText = `*${batch.code}*\nProdotto: ${batch.productName}\nStato: ${batch.status}\nDisp.: ${batch.quantityAvailable} ${batch.unitOfMeasure}\nScadenza: ${batch.expiresAt?.toLocaleDateString("it-IT") ?? "N/A"}`;
        } else {
          responseText = `Lotto "${code}" non trovato nel sistema.`;
        }
      }

      // Temperature query
      else if (lowerText.includes("temperature") || lowerText.includes("temp")) {
        const alerts = await prisma.temperatureLog.findMany({
          where: { isAlert: true },
          orderBy: { recordedAt: "desc" },
          take: 5,
        });

        if (alerts.length > 0) {
          responseText = `*${alerts.length} alert temperature:*\n` +
            alerts.map((a) => `• ${a.title}: ${a.value}°C`).join("\n");
        } else {
          responseText = "Nessun alert temperature attivo.";
        }
      }

      // Stock summary
      else if (lowerText.includes("magazzino") || lowerText.includes("stock")) {
        const lowStock = await prisma.batch.count({ where: { status: "LOW_STOCK" } });
        const expired = await prisma.batch.count({ where: { status: "EXPIRED" } });
        const active = await prisma.batch.count({ where: { status: "ACTIVE" } });

        responseText = `*Riepilogo magazzino:*\n• ${active} lotti attivi\n• ${lowStock} in esaurimento\n• ${expired} scaduti`;
      }

      // Help
      else {
        responseText = `*L'Anfora HACCP Bot*\nComandi:\n• "lotto [CODICE]" - stato lotto\n• "temperature" - alert attivi\n• "magazzino" - riepilogo stock\n• Invia una FOTO di un DDT per registrare automaticamente i prodotti`;
      }
    }

    // Handle image messages — forward to scan
    else if (msgType === "image") {
      responseText = "Foto ricevuta! Per la scansione automatica dei DDT, usa l'app web: apri Ricevimento Merce e scatta la foto da li'.";
    }

    // Return response (the actual sending depends on the WhatsApp integration)
    // For Meta Cloud API, you'd call the Messages API
    // For now, we return the response for the integration layer to handle
    return NextResponse.json({
      status: "ok",
      from,
      responseText,
    });
  } catch (error) {
    console.error("[POST /api/whatsapp]", error);
    return NextResponse.json(
      { error: "Errore webhook WhatsApp" },
      { status: 500 }
    );
  }
}
