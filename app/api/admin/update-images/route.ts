import { NextResponse } from "next/server";
import { pool } from "@/app/lib/db";

type UpdateItem = {
  codigo_produto: string;
  url_imagem: string;
};

export async function POST(req: Request) {
  try {
    const secret = process.env.ADMIN_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "ADMIN_SECRET não configurado" }, { status: 500 });
    }

    const body = await req.json();

    if (body?.secret !== secret) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const updates: UpdateItem[] = body?.updates || [];
    if (!updates.length) {
      return NextResponse.json({ error: "Nenhum item para atualizar" }, { status: 400 });
    }

    let updated = 0;
    for (const item of updates) {
      if (!item.codigo_produto || !item.url_imagem) continue;
      const result = await pool.query(
        `UPDATE produtos_omie SET url_imagem = $1 WHERE codigo_produto = $2`,
        [item.url_imagem, String(item.codigo_produto)]
      );
      if ((result.rowCount ?? 0) > 0) updated++;
    }

    return NextResponse.json({ ok: true, updated, total: updates.length });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Erro interno" }, { status: 500 });
  }
}
