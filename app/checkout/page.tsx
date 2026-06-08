"use client";

import { useEffect, useMemo, useState } from "react";

const LS_KEY = "carrinho_omie_itens_v1";
const LS_SESSION_KEY = "carrinho_session_id_v1";

function formatBRL(n: number) {
  const v = Number(n || 0);
  return "R$ " + v.toFixed(2).replace(".", ",");
}

type Produto = {
  codigo_produto: string;
  descricao: string;
  familia: string;
  preco: number;
  imagem_url: string;
};

export default function CheckoutPage() {
  const [itens, setItens] = useState<Record<string, number>>({});
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [sending, setSending] = useState(false);
  const [pedidoEnviado, setPedidoEnviado] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const WPP_URL = "https://wa.me/558585871467";

  // Carrega carrinho
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setItens(JSON.parse(raw));
    } catch {}
  }, []);

  // Carrega catálogo para exibir descrição/preço
  useEffect(() => {
    fetch("/api/catalogo", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setProdutos(data?.produtos || []))
      .catch(() => {});
  }, []);

  // Countdown após pedido enviado
  useEffect(() => {
    if (!pedidoEnviado) return;
    setCountdown(10);
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          window.location.href = WPP_URL;
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [pedidoEnviado]);

  // Expiração
  const [isExpired, setIsExpired] = useState(false);
  useEffect(() => {
    const check = () => {
      const startStr = localStorage.getItem("carrinho_session_start_v1");
      if (!startStr) { setIsExpired(true); return; }
      const elapsed = Date.now() - Number(startStr);
      setIsExpired(elapsed > 30 * 60 * 1000);
    };
    check();
    const t = setInterval(check, 10000);
    return () => clearInterval(t);
  }, []);

  const pmap = useMemo(
    () => new Map(produtos.map((p) => [p.codigo_produto, p])),
    [produtos]
  );

  const itemsDetalhados = useMemo(
    () =>
      Object.entries(itens)
        .filter(([, qtd]) => qtd > 0)
        .map(([codigo, qtd]) => {
          const p = pmap.get(codigo);
          return {
            codigo,
            descricao: p?.descricao || codigo,
            preco: Number(p?.preco || 0),
            qtd,
            subtotal: Number(p?.preco || 0) * qtd,
          };
        }),
    [itens, pmap]
  );

  const totalItens = useMemo(
    () => itemsDetalhados.reduce((a, b) => a + b.qtd, 0),
    [itemsDetalhados]
  );

  const total = useMemo(
    () => itemsDetalhados.reduce((a, b) => a + b.subtotal, 0),
    [itemsDetalhados]
  );

  async function confirmar() {
    setErrorMsg(null);
    if (!totalItens) return setErrorMsg("Seu carrinho está vazio.");

    const session_id     = localStorage.getItem(LS_SESSION_KEY) || "";
    const customer_phone = localStorage.getItem("carrinho_customer_phone_v1") || "";

    try {
      setSending(true);
      const r = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id, customer_phone, cart: itens }),
      });

      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Falha ao enviar pedido");

      localStorage.removeItem(LS_KEY);
      setPedidoEnviado(true);
    } catch (e: any) {
      setErrorMsg(e?.message || "Erro desconhecido");
    } finally {
      setSending(false);
    }
  }

  if (isExpired) {
    return (
      <main style={{ maxWidth: 720, margin: "0 auto", padding: 0 }}>
        <div style={{ position: "sticky", top: 0, zIndex: 50, background: "#160E79", height: 64, display: "flex", alignItems: "center", padding: "0 16px", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
          <a href="/carrinho" style={{ display: "inline-flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
            <img src="/logo-livraria.png" alt="Livraria Shalom" style={{ height: 40, width: 40, objectFit: "contain" }} />
            <span style={{ color: "#fff", fontWeight: 800, letterSpacing: 0.2 }}>Livraria Shalom</span>
          </a>
        </div>
        <div style={{ padding: "40px 20px", textAlign: "center", display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
          <div style={{ background: "rgba(255,0,0,0.1)", color: "red", padding: "20px", borderRadius: "16px", border: "1px solid red", maxWidth: 400 }}>
            <h2 style={{ fontSize: 22, marginBottom: 12 }}>Tempo Esgotado ⏳</h2>
            <p style={{ margin: 0, opacity: 0.9 }}>Seu pedido não pode ser finalizado. O limite de tempo (30 minutos) foi atingido.</p>
            <p style={{ marginTop: 12, fontSize: 14 }}>Retorne ao WhatsApp e solicite um novo link de atendimento.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 0 }}>

      {/* MODAL DE SUCESSO */}
      {pedidoEnviado && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.55)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 20,
        }}>
          <div style={{
            background: "#fff",
            borderRadius: 20,
            padding: "36px 28px",
            maxWidth: 400,
            width: "100%",
            textAlign: "center",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
          }}>
            <div style={{ fontSize: 56 }}>✅</div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#000" }}>Pedido enviado!</h2>
            <p style={{ margin: 0, fontSize: 15, color: "rgba(0,0,0,0.6)", lineHeight: 1.6 }}>
              Seu pedido foi recebido com sucesso.<br />
              Agora <strong style={{ color: "#000" }}>retorne ao WhatsApp</strong> para concluir o pagamento.
            </p>
            <a
              href={WPP_URL}
              style={{
                marginTop: 8,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                background: "#25D366",
                color: "#fff",
                textDecoration: "none",
                borderRadius: 12,
                padding: "14px 24px",
                fontWeight: 700,
                fontSize: 16,
                width: "100%",
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Ir para o WhatsApp
            </a>
            <p style={{ margin: 0, fontSize: 13, color: "rgba(0,0,0,0.35)" }}>
              Redirecionando automaticamente em {countdown}s...
            </p>
          </div>
        </div>
      )}

      {/* TOPBAR */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: "#160E79", height: 64, display: "flex", alignItems: "center", padding: "0 16px", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
        <a href="/carrinho" style={{ display: "inline-flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
          <img src="/logo-livraria.png" alt="Livraria Shalom" style={{ height: 40, width: 40, objectFit: "contain" }} />
          <span style={{ color: "#fff", fontWeight: 800, letterSpacing: 0.2 }}>Livraria Shalom</span>
        </a>
      </div>

      {/* CONTEÚDO */}
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, margin: 0 }}>Resumo do pedido</h1>
          <p style={{ marginTop: 6, opacity: 0.7, fontSize: 14 }}>
            Confira os itens selecionados antes de confirmar.
          </p>
        </div>

        {/* Lista de itens */}
        {itemsDetalhados.length === 0 ? (
          <div style={{ padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)", opacity: 0.6 }}>
            Seu carrinho está vazio.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {itemsDetalhados.map((item) => (
              <div
                key={item.codigo}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: 12,
                  padding: "12px 14px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  gap: 12,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.4 }}>{item.descricao}</div>
                  <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>
                    {item.qtd}x {formatBRL(item.preco)}
                  </div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 15, whiteSpace: "nowrap" }}>
                  {formatBRL(item.subtotal)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Total */}
        {itemsDetalhados.length > 0 && (
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid rgba(255,255,255,0.15)",
            paddingTop: 12,
          }}>
            <span style={{ fontWeight: 700, fontSize: 16 }}>Total ({totalItens} {totalItens === 1 ? "item" : "itens"})</span>
            <span style={{ fontWeight: 900, fontSize: 20 }}>{formatBRL(total)}</span>
          </div>
        )}

        {errorMsg && (
          <div style={{ padding: 12, border: "1px solid #500", borderRadius: 12, background: "rgba(255,0,0,0.08)" }}>
            <b>Erro:</b> {errorMsg}
          </div>
        )}

        {/* Botões */}
        <div style={{ display: "grid", gap: 10 }}>
          <button
            onClick={confirmar}
            disabled={sending || totalItens === 0}
            style={{
              padding: "14px",
              borderRadius: 12,
              border: "none",
              cursor: sending || totalItens === 0 ? "not-allowed" : "pointer",
              opacity: sending || totalItens === 0 ? 0.45 : 1,
              fontWeight: 700,
              background: "#160E79",
              color: "#fff",
              fontSize: 16,
            }}
          >
            {sending ? "Enviando..." : "Confirmar pedido"}
          </button>

          <a href="/carrinho" style={{ textDecoration: "none", opacity: 0.75, fontSize: 14 }}>
            ← Voltar e editar carrinho
          </a>
        </div>
      </div>
    </main>
  );
}
