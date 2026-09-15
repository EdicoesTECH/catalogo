import { NextResponse } from "next/server";
import { pool } from "@/app/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const [catalog, orders] = await Promise.all([
    pool.query(`
      SELECT
        COUNT(*)                                                                   AS total,
        COUNT(*) FILTER (WHERE url_imagem IS NOT NULL AND url_imagem <> '')       AS com_imagem,
        COUNT(*) FILTER (WHERE url_imagem IS NULL OR url_imagem = '')             AS sem_imagem,
        COUNT(*) FILTER (WHERE bloqueado = 'S')                                   AS bloqueados,
        COUNT(*) FILTER (WHERE inativo = 'S' OR inativo = 'true')                AS inativos,
        COUNT(*) FILTER (WHERE "nPrecoUnitario" = 0 OR "nPrecoUnitario" IS NULL) AS sem_preco
      FROM produtos_omie
    `),
    pool.query(`
      SELECT id, session_id, customer_phone, items_count,
             order_total, status, error_msg, created_at
      FROM pedidos_log
      ORDER BY created_at DESC
      LIMIT 50
    `).catch(() => ({ rows: [] as any[] })),
  ]);

  const orders_rows = orders.rows as any[];

  return NextResponse.json({
    catalog: catalog.rows[0],
    recent_orders: orders_rows.filter((r) => r.status === "ok"),
    recent_errors: orders_rows.filter((r) => r.status === "error"),
    total_pedidos: orders_rows.filter((r) => r.status === "ok").length,
    total_erros: orders_rows.filter((r) => r.status === "error").length,
  });
}
