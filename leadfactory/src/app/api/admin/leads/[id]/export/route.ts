import { NextResponse } from "next/server";
import { getLead } from "@/lib/repo/queries";
import { getDb, getWorkspaceId } from "@/lib/db";
import { audit } from "@/lib/repo/audit";

/** Droit d'accès / portabilité : export JSON des données d'un prospect. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const data = await getLead(id);
  if (!data) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  const db = await getDb();
  await audit(db, await getWorkspaceId(), "admin", "lead.exported", "lead", id);
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="prospect-${id}.json"` },
  });
}
