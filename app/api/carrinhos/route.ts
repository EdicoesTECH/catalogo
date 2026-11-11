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
    SELECT
      customer_phone,
      session_id,
      status,
      items_count,
      subtotal,
      frete,
      total_geral,
      transportadora_codigo_omie,
      updated_at,
      CASE
        WHEN status IN ('paid', 'completed', 'confirmed') THEN 'pago'
        WHEN total_geral IS NOT NULL              THEN 'aguarda_pagamento'
        WHEN frete IS NOT NULL                   THEN 'frete_cotado'
        ELSE                                          'carrinho_aberto'
      END AS etapa
    FROM carts
    ORDER BY updated_at DESC
    LIMIT 100
  `);

  return NextResponse.json({ carrinhos: rows });
}
