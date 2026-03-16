import { NextResponse } from "next/server";

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || "(not set)";
  const directUrl = process.env.DIRECT_URL || "(not set)";

  // Mask the password but show structure
  function maskUrl(url: string): string {
    if (url === "(not set)") return url;
    try {
      const u = new URL(url);
      return `${u.protocol}//${u.username}:****@${u.hostname}:${u.port}${u.pathname}`;
    } catch (e) {
      // If URL parsing fails, show a safe version
      return `INVALID URL - parse error: ${(e as Error).message}. Length: ${url.length}, starts with: ${url.substring(0, 15)}...`;
    }
  }

  // Try to connect
  let connectionResult = "not tested";
  try {
    const { prisma } = await import("@/lib/prisma");
    await prisma.$queryRaw`SELECT 1 as ok`;
    connectionResult = "SUCCESS";
  } catch (e) {
    connectionResult = `FAILED: ${(e as Error).message}`;
  }

  return NextResponse.json({
    DATABASE_URL: maskUrl(dbUrl),
    DIRECT_URL: maskUrl(directUrl),
    DATABASE_URL_length: dbUrl.length,
    DIRECT_URL_length: directUrl.length,
    connectionResult,
  });
}
