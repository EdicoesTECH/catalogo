import { NextResponse } from "next/server";
import { pool } from "@/app/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.ADMIN_SECRET;
  const chave = new URL(req.url).searchParams.get("chave");

  if (!secret || chave !== secret) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { rows } = await pool.query(`
    SELECT id, session_id, customer_phone, items_count, order_total,
           status, error_msg, created_at
    FROM pedidos_log
    ORDER BY created_at DESC
    LIMIT 200
  `);

  return NextResponse.json({ pedidos: rows });
}
