import { NextResponse } from "next/server";
import { pool } from "@/app/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!process.env.ADMIN_SECRET || token !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { rows } = await pool.query(`
    SELECT id, session_id, customer_phone, items_count, order_total,
           status, error_msg, created_at
    FROM pedidos_log
    ORDER BY created_at DESC
    LIMIT 50
  `);

  return NextResponse.json({ pedidos: rows });
}
