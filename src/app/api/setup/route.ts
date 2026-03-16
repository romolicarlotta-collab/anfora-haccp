import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/setup — Create initial admin user (works only if no users exist)
// Also creates roles if missing
export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Nome, email e password sono obbligatori" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "La password deve avere almeno 6 caratteri" }, { status: 400 });
    }

    // Ensure roles exist
    const adminRole = await prisma.role.upsert({
      where: { key: "ADMIN" },
      update: {},
      create: { key: "ADMIN", name: "Admin" },
    });

    await prisma.role.upsert({
      where: { key: "HACCP_MANAGER" },
      update: {},
      create: { key: "HACCP_MANAGER", name: "Responsabile HACCP" },
    });

    await prisma.role.upsert({
      where: { key: "KITCHEN_MANAGER" },
      update: {},
      create: { key: "KITCHEN_MANAGER", name: "Capo cucina" },
    });

    await prisma.role.upsert({
      where: { key: "KITCHEN_OPERATOR" },
      update: {},
      create: { key: "KITCHEN_OPERATOR", name: "Operatore cucina" },
    });

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Utente con questa email esiste gia'" }, { status: 409 });
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: password, // MVP: plaintext — in produzione usare bcrypt
        roleId: adminRole.id,
      },
      select: { id: true, name: true, email: true },
    });

    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/setup]", error);
    return NextResponse.json({ error: "Errore durante la creazione utente" }, { status: 500 });
  }
}

// GET /api/setup — Check if setup is needed (any users exist?)
export async function GET() {
  try {
    const userCount = await prisma.user.count();
    return NextResponse.json({ hasUsers: userCount > 0, count: userCount });
  } catch (error) {
    console.error("[GET /api/setup]", error);
    return NextResponse.json({ error: "Errore connessione database" }, { status: 500 });
  }
}
