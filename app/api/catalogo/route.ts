import { NextResponse } from "next/server";
import { pool } from "@/app/lib/db";

export const dynamic = "force-dynamic";

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

export async function GET() {
  try {
    const { rows } = await pool.query<Produto>(
      `SELECT
         codigo_produto,
         COALESCE(descricao, '')       AS descricao,
         COALESCE(familia, '')         AS familia,
         COALESCE(preco, 0)            AS preco,
         COALESCE(imagem_url, '')      AS imagem_url,
         COALESCE(altura, 0)           AS altura,
         COALESCE(largura, 0)          AS largura,
         COALESCE(profundidade, 0)     AS profundidade,
         COALESCE(peso_bruto, 0)       AS peso_bruto,
         COALESCE(peso_liq, 0)         AS peso_liq
       FROM produtos_omie
       WHERE inativo = false OR inativo IS NULL
       ORDER BY descricao`
    );

    // garante que preco vem como number (pg retorna DECIMAL como string)
    const produtos = rows.map((r) => ({
      ...r,
      preco: Number(r.preco) || 0,
      altura: Number(r.altura) || 0,
      largura: Number(r.largura) || 0,
      profundidade: Number(r.profundidade) || 0,
      peso_bruto: Number(r.peso_bruto) || 0,
      peso_liq: Number(r.peso_liq) || 0,
    }));

    return NextResponse.json({ produtos });
  } catch (err: any) {
    console.error("Erro ao consultar produtos:", err);
    return NextResponse.json(
      { error: err?.message || "Erro ao consultar banco de dados" },
      { status: 500 }
    );
  }
}
