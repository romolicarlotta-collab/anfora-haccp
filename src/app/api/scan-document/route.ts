import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// ---------------------------------------------------------------------------
// POST /api/scan-document — AI-powered DDT / product photo / PDF / Word analysis
// Accepts multipart form with an image, PDF, or Word file
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `Sei un assistente esperto in logistica alimentare e HACCP italiano.
Analizza il contenuto fornito (può essere un DDT - Documento di Trasporto, una foto di un prodotto alimentare, una foto di un'etichetta, un PDF o un documento Word) e estrai TUTTI i dati strutturati possibili.

Rispondi SOLO con un JSON valido (senza markdown, senza commenti) con questa struttura:
{
  "documentType": "DDT" | "PRODUCT_PHOTO" | "LABEL" | "UNKNOWN",
  "supplier": {
    "name": "nome del fornitore/azienda mittente",
    "vatNumber": "P.IVA se visibile",
    "phone": "telefono se visibile",
    "email": "email se visibile"
  },
  "recipient": {
    "name": "nome destinatario"
  },
  "documentNumber": "numero documento se presente",
  "documentDate": "data documento in formato YYYY-MM-DD",
  "items": [
    {
      "productName": "nome del prodotto",
      "supplierLotCode": "numero di lotto fornitore se presente",
      "quantity": 0.0,
      "unitOfMeasure": "kg/l/pz/ct",
      "expiresAt": "data scadenza YYYY-MM-DD se visibile",
      "price": 0.0,
      "notes": "eventuali note aggiuntive"
    }
  ],
  "totalAmount": 0.0,
  "notes": "eventuali informazioni aggiuntive rilevanti"
}

REGOLE IMPORTANTI:
- Se un campo non è visibile/leggibile, usa null
- Per le quantità, converti in numeri decimali
- Per le unità di misura: usa "kg", "l", "pz" (pezzi), "ct" (cartoni)
- I numeri di lotto sono spesso codici alfanumerici sulle etichette dei prodotti
- Le date devono essere in formato YYYY-MM-DD
- Ogni riga prodotto del DDT diventa un item separato
- Se è una foto di prodotto, estrai nome, lotto dall'etichetta, peso/quantità, scadenza
- Rispondi SOLO con il JSON, nient'altro`;

// Supported MIME types
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const PDF_TYPES = ["application/pdf"];
const WORD_TYPES = [
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/msword", // .doc
];
const ACCEPTED_TYPES = [...IMAGE_TYPES, ...PDF_TYPES, ...WORD_TYPES];

function getFileCategory(mimeType: string): "image" | "pdf" | "word" | null {
  if (IMAGE_TYPES.includes(mimeType)) return "image";
  if (PDF_TYPES.includes(mimeType)) return "pdf";
  if (WORD_TYPES.includes(mimeType)) return "word";
  return null;
}

// Extract text from PDF
async function extractPdfText(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse");
  const data = await pdfParse(buffer);
  return data.text || "";
}

// Extract text from Word document
async function extractWordText(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mammoth = require("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value || "";
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Nessun file fornito" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mimeType = file.type || "application/octet-stream";
    const category = getFileCategory(mimeType);

    // Also detect by file extension as fallback
    const fileName = file.name?.toLowerCase() ?? "";
    const detectedCategory = category
      || (fileName.endsWith(".pdf") ? "pdf" : null)
      || (fileName.endsWith(".docx") || fileName.endsWith(".doc") ? "word" : null)
      || (fileName.match(/\.(jpe?g|png|gif|webp)$/i) ? "image" : null);

    if (!detectedCategory) {
      return NextResponse.json(
        { error: `Formato non supportato: ${mimeType}. Accettati: immagini, PDF, Word (.docx)` },
        { status: 400 },
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey || apiKey.includes("PLACEHOLDER")) {
      return NextResponse.json({
        success: false,
        needsManualEntry: true,
        message: "API key Anthropic non configurata. Inserisci i dati manualmente.",
        data: {
          documentType: "UNKNOWN",
          supplier: { name: null, vatNumber: null, phone: null, email: null },
          recipient: { name: null },
          documentNumber: null,
          documentDate: null,
          items: [],
          totalAmount: null,
          notes: "Scansione AI non disponibile - inserimento manuale",
        },
      });
    }

    const anthropic = new Anthropic({ apiKey });

    // Build content based on file type
    const content: Anthropic.Messages.ContentBlockParam[] = [];

    if (detectedCategory === "image") {
      // Send image directly via vision
      const base64 = buffer.toString("base64");
      const validMime = IMAGE_TYPES.includes(mimeType)
        ? (mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp")
        : "image/jpeg";
      content.push({
        type: "image",
        source: { type: "base64", media_type: validMime, data: base64 },
      });
      content.push({
        type: "text",
        text: "Analizza questa immagine e estrai tutti i dati strutturati. Rispondi SOLO con JSON valido.",
      });
    } else if (detectedCategory === "pdf") {
      // Send PDF as document (Claude supports native PDF)
      const base64 = buffer.toString("base64");
      content.push({
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: base64 },
      } as unknown as Anthropic.Messages.ContentBlockParam);
      content.push({
        type: "text",
        text: "Analizza questo documento PDF (probabilmente un DDT o documento di trasporto) e estrai tutti i dati strutturati. Rispondi SOLO con JSON valido.",
      });

      // Fallback: also try extracting text in case Claude PDF support isn't available
      try {
        const pdfText = await extractPdfText(buffer);
        if (pdfText.trim().length > 20) {
          content.push({
            type: "text",
            text: `Testo estratto dal PDF per riferimento:\n\n${pdfText.substring(0, 8000)}`,
          });
        }
      } catch {
        // PDF text extraction failed — that's OK, rely on Claude's native PDF support
      }
    } else if (detectedCategory === "word") {
      // Extract text from Word and send as text
      let wordText = "";
      try {
        wordText = await extractWordText(buffer);
      } catch {
        return NextResponse.json(
          { error: "Impossibile leggere il documento Word" },
          { status: 400 },
        );
      }

      if (!wordText.trim()) {
        return NextResponse.json(
          { error: "Il documento Word è vuoto o non contiene testo leggibile" },
          { status: 400 },
        );
      }

      content.push({
        type: "text",
        text: `Analizza questo documento (Word/DDT) e estrai tutti i dati strutturati. Rispondi SOLO con JSON valido.\n\nContenuto del documento:\n\n${wordText.substring(0, 10000)}`,
      });
    }

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content }],
      system: SYSTEM_PROMPT,
    });

    // Extract the text response
    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "Risposta AI vuota" }, { status: 500 });
    }

    // Parse the JSON response
    let parsed;
    try {
      let jsonStr = textBlock.text.trim();
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }
      parsed = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json(
        { error: "Impossibile interpretare la risposta AI", raw: textBlock.text },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      needsManualEntry: false,
      data: parsed,
    });
  } catch (error) {
    console.error("[POST /api/scan-document]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Errore durante la scansione" },
      { status: 500 },
    );
  }
}
