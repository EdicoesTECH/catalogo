import { NextResponse } from "next/server";
import { pool } from "@/app/lib/db";

type Body = {
  session_id?: string;
  cart: Record<string, number>;
};

type Produto = {
  codigo_produto: string;
  descricao: string;
  familia: string;
  preco: number;
  imagem_url: string;
  altura: number;
  largura: number;
  profundidade: number;
  peso_bruto: number;
  peso_liq: number;
};

export async function POST(req: Request) {
  try {
    const webhook = process.env.N8N_WEBHOOK_URL;
    if (!webhook) throw new Error("Faltou N8N_WEBHOOK_URL no .env.local");

    const body = (await req.json()) as Body;
    const cart = body?.cart || {};

    if (!Object.keys(cart).length) throw new Error("Carrinho vazio");

    const session_id =
      String(body?.session_id || "").trim() ||
      `sess_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    // Enriquecer itens consultando o banco
    const { rows: produtos } = await pool.query<Produto>(
      `SELECT
         codigo_produto,
         COALESCE(descricao, '')       AS descricao,
         COALESCE(familia, '')         AS familia,
         COALESCE("nPrecoUnitario", 0) AS preco,
         COALESCE(url_imagem, '')      AS imagem_url,
         COALESCE(altura, 0)           AS altura,
         COALESCE(largura, 0)          AS largura,
         COALESCE(profundidade, 0)     AS profundidade,
         COALESCE(peso_bruto, 0)       AS peso_bruto,
         COALESCE(peso_liq, 0)         AS peso_liq
       FROM produtos_omie`
    );
    const map = new Map(produtos.map((p) => [String(p.codigo_produto), p]));

    const itemsDetailed = Object.entries(cart).map(([codigo_produto, qtd]) => {
      const p = map.get(String(codigo_produto));
      const preco_unit = Number(p?.preco || 0);
      const q = Number(qtd || 0);
      return {
        codigo_produto: String(codigo_produto),
        descricao: p?.descricao || "",
        familia: p?.familia || "",
        preco_unit,
        qtd: q,
        subtotal: preco_unit * q,
        altura: Number(p?.altura || 0),
        largura: Number(p?.largura || 0),
        profundidade: Number(p?.profundidade || 0),
        peso_bruto: Number(p?.peso_bruto || 0),
        peso_liq: Number(p?.peso_liq || 0),
      };
    });

    const items_count = itemsDetailed.reduce((acc, it) => acc + it.qtd, 0);
    const order_total = itemsDetailed.reduce((acc, it) => acc + it.subtotal, 0);

    const payload = {
      session_id,
      source: "carrinho-omie",
      timestamp: new Date().toISOString(),
      totals: { items_count, order_total },
      items: itemsDetailed,
    };

    const r = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await r.text();
    if (!r.ok) throw new Error(`Webhook n8n respondeu ${r.status}: ${text}`);

    return NextResponse.json({ ok: true, totals: payload.totals });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Erro ao enviar" }, { status: 500 });
  }
}
