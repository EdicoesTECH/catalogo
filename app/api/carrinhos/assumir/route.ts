import { NextResponse } from "next/server";
import { pool } from "@/app/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = process.env.ADMIN_SECRET;
  const chave = new URL(req.url).searchParams.get("chave");

  if (!secret || chave !== secret) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { session_id } = await req.json();
  if (!session_id) {
    return NextResponse.json({ error: "session_id obrigatório" }, { status: 400 });
  }

  await pool.query(
    `UPDATE carts SET assumido_em = NOW() WHERE session_id = $1`,
    [session_id]
  );

  return NextResponse.json({ ok: true });
}
