import { NextResponse } from "next/server";

type Body = {
  customer: { name: string; cpf: string; phone: string; email: string };
  shipping_address: {
    cep: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
  };
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

function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}

export async function POST(req: Request) {
  try {
    const webhook = process.env.N8N_WEBHOOK_URL;
    if (!webhook) throw new Error("Faltou N8N_WEBHOOK_URL no .env.local");

    const body = (await req.json()) as Body;

    const name = body?.customer?.name?.trim();
    const cpf = onlyDigits(body?.customer?.cpf || "");
    const phone = onlyDigits(body?.customer?.phone || "");
    const email = (body?.customer?.email || "").trim();

    const addr = body?.shipping_address;
    const cep = onlyDigits(addr?.cep || "");
    const street = (addr?.street || "").trim();
    const number = (addr?.number || "").trim();
    const complement = (addr?.complement || "").trim();
    const neighborhood = (addr?.neighborhood || "").trim();
    const city = (addr?.city || "").trim();
    const state = (addr?.state || "").trim().toUpperCase();

    const cart = body?.cart || {};

    // validações básicas
    if (!name) throw new Error("Nome obrigatório");
    if (cpf.length !== 11) throw new Error("CPF inválido (11 dígitos)");
    if (phone.length < 10 || phone.length > 13) throw new Error("Telefone inválido");
    if (!email) throw new Error("E-mail obrigatório");

    if (cep.length !== 8) throw new Error("CEP inválido (8 dígitos)");
    if (!street) throw new Error("Rua obrigatória");
    if (!number) throw new Error("Número obrigatório");
    if (!neighborhood) throw new Error("Bairro obrigatório");
    if (!city) throw new Error("Cidade obrigatória");
    if (state.length !== 2) throw new Error("UF inválida");

    if (!Object.keys(cart).length) throw new Error("Carrinho vazio");

    // --- Enriquecer itens consultando o catálogo (server-side) ---
    const catalogRes = await fetch(new URL("/api/catalogo", req.url), { cache: "no-store" });
    const catalogJson = await catalogRes.json();
    if (!catalogRes.ok) {
      throw new Error(catalogJson?.error || "Falha ao consultar catálogo para calcular totais");
    }

    const produtos: Produto[] = catalogJson?.produtos || [];
    const map = new Map(produtos.map((p) => [String(p.codigo_produto), p]));

const itemsDetailed = Object.entries(cart).map(([codigo_produto, qtd]) => {
  const p = map.get(String(codigo_produto));

  const preco_unit = Number(p?.preco || 0);
  const q = Number(qtd || 0);
  const subtotal = preco_unit * q;

  return {
    codigo_produto: String(codigo_produto),
    descricao: p?.descricao || "",
    familia: p?.familia || "",
    preco_unit,
    qtd: q,
    subtotal,

    // ✅ medidas/pesos (para frete)
    altura: Number(p?.altura || 0),
    largura: Number(p?.largura || 0),
    profundidade: Number(p?.profundidade || 0),
    peso_bruto: Number(p?.peso_bruto || 0),
    peso_liq: Number(p?.peso_liq || 0),
  };
});
    const items_count = itemsDetailed.reduce((acc, it) => acc + (it.qtd || 0), 0);
    const order_total = itemsDetailed.reduce((acc, it) => acc + (it.subtotal || 0), 0);
const session_id =
  String((body as any)?.session_id || "").trim() ||`sess_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    const payload = {
      session_id,
      source: "carrinho-omie",
      timestamp: new Date().toISOString(),
      customer: { name, cpf, phone, email },
      shipping_address: {
        cep,
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
      },
      totals: {
        items_count,
        order_total,
      },
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