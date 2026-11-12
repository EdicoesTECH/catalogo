import { NextResponse } from "next/server";
import { pool } from "@/app/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.ADMIN_SECRET;
  const chave = new URL(req.url).searchParams.get("chave");

  if (!secret || chave !== secret) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  await pool.query(`
    ALTER TABLE carts ADD COLUMN IF NOT EXISTS assumido_em TIMESTAMPTZ
  `).catch(() => {});

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
      assumido_em,
      CASE
        WHEN status IN ('paid', 'completed', 'confirmed') THEN 'pago'
        WHEN total_geral > 0                       THEN 'aguarda_pagamento'
        WHEN frete > 0                            THEN 'frete_cotado'
        ELSE                                          'carrinho_aberto'
      END AS etapa
    FROM carts
    ORDER BY updated_at DESC
    LIMIT 100
  `);

  return NextResponse.json({ carrinhos: rows });
}
