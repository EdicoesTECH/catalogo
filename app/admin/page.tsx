"use client";

import { useEffect, useState, useCallback } from "react";

type CatalogStats = {
  total: string;
  com_imagem: string;
  sem_imagem: string;
  bloqueados: string;
  inativos: string;
  sem_preco: string;
};

type Pedido = {
  id: number;
  session_id: string;
  customer_phone: string;
  items_count: number;
  order_total: string;
  status: string;
  error_msg: string | null;
  created_at: string;
};

type DashData = {
  catalog: CatalogStats;
  recent_orders: Pedido[];
  recent_errors: Pedido[];
  total_pedidos: number;
  total_erros: number;
};

function formatBRL(n: string | number) {
  return "R$ " + Number(n || 0).toFixed(2).replace(".", ",");
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m}min atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  return `${Math.floor(h / 24)}d atrás`;
}

function formatPhone(p: string) {
  if (!p) return "—";
  const d = p.replace(/\D/g, "");
  if (d.length === 13) return `+${d.slice(0,2)} (${d.slice(2,4)}) ${d.slice(4,9)}-${d.slice(9)}`;
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  return p;
}

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [inputToken, setInputToken] = useState("");
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchData = useCallback(async (t: string) => {
    if (!t) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/admin/dashboard?token=${encodeURIComponent(t)}`, { cache: "no-store" });
      const json = await r.json();
      if (!r.ok) throw new Error(json?.error || "Erro ao carregar");
      setData(json);
      setLastRefresh(new Date());
    } catch (e: any) {
      setError(e?.message || "Erro desconhecido");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Lê token da URL ao montar
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token") || "";
    if (t) {
      setToken(t);
      setInputToken(t);
      fetchData(t);
    }
  }, [fetchData]);

  // Auto-refresh a cada 30s
  useEffect(() => {
    if (!token) return;
    const id = setInterval(() => fetchData(token), 30000);
    return () => clearInterval(id);
  }, [token, fetchData]);

  function login() {
    const t = inputToken.trim();
    if (!t) return;
    setToken(t);
    const url = new URL(window.location.href);
    url.searchParams.set("token", t);
    window.history.replaceState({}, "", url.toString());
    fetchData(t);
  }

  const s = {
    page: { minHeight: "100vh", background: "#f4f4f8", fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif" } as React.CSSProperties,
    topbar: { background: "#160E79", height: 64, display: "flex", alignItems: "center", padding: "0 24px", gap: 16 } as React.CSSProperties,
    body: { maxWidth: 1000, margin: "0 auto", padding: "24px 16px" } as React.CSSProperties,
    card: { background: "#fff", borderRadius: 14, padding: 20, border: "1px solid rgba(0,0,0,.10)", boxShadow: "0 2px 10px rgba(0,0,0,.06)" } as React.CSSProperties,
    statCard: (color: string) => ({ background: "#fff", borderRadius: 14, padding: "18px 20px", border: `1px solid ${color}22`, boxShadow: "0 2px 10px rgba(0,0,0,.06)", borderLeft: `4px solid ${color}` }) as React.CSSProperties,
    statNum: { fontSize: 32, fontWeight: 900, lineHeight: 1 } as React.CSSProperties,
    statLabel: { fontSize: 13, color: "rgba(0,0,0,.5)", marginTop: 4 } as React.CSSProperties,
    sectionTitle: { fontSize: 16, fontWeight: 800, margin: "0 0 14px 0", color: "#160E79" } as React.CSSProperties,
    table: { width: "100%", borderCollapse: "collapse" as const, fontSize: 13 },
    th: { textAlign: "left" as const, padding: "8px 10px", borderBottom: "2px solid rgba(0,0,0,.1)", fontWeight: 700, color: "rgba(0,0,0,.5)", fontSize: 11, textTransform: "uppercase" as const },
    td: { padding: "10px 10px", borderBottom: "1px solid rgba(0,0,0,.06)", verticalAlign: "top" as const },
  };

  if (!token) {
    return (
      <div style={s.page}>
        <div style={s.topbar}>
          <img src="/logo-livraria.png" alt="" style={{ height: 36, width: 36, objectFit: "contain" }} />
          <span style={{ color: "#fff", fontWeight: 800 }}>Painel Admin — Livraria Shalom</span>
        </div>
        <div style={{ maxWidth: 380, margin: "80px auto", padding: 24 }}>
          <div style={s.card}>
            <h2 style={{ margin: "0 0 16px", fontSize: 18 }}>Acesso restrito</h2>
            <input
              type="password"
              placeholder="Token de acesso"
              value={inputToken}
              onChange={(e) => setInputToken(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && login()}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(0,0,0,.2)", fontSize: 14, marginBottom: 12, boxSizing: "border-box" }}
            />
            <button
              onClick={login}
              style={{ width: "100%", padding: 12, background: "#160E79", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 15 }}
            >
              Entrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.topbar}>
        <img src="/logo-livraria.png" alt="" style={{ height: 36, width: 36, objectFit: "contain" }} />
        <span style={{ color: "#fff", fontWeight: 800, flex: 1 }}>Painel Admin — Livraria Shalom</span>
        <button
          onClick={() => fetchData(token)}
          disabled={loading}
          style={{ background: "rgba(255,255,255,.15)", color: "#fff", border: "1px solid rgba(255,255,255,.3)", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13 }}
        >
          {loading ? "..." : "↻ Atualizar"}
        </button>
        {lastRefresh && (
          <span style={{ color: "rgba(255,255,255,.5)", fontSize: 12 }}>
            Atualizado {lastRefresh.toLocaleTimeString("pt-BR")}
          </span>
        )}
      </div>

      <div style={s.body}>
        {error && (
          <div style={{ padding: 14, background: "rgba(255,0,0,.08)", border: "1px solid #fca5a5", borderRadius: 12, color: "#b91c1c", marginBottom: 20 }}>
            {error}
          </div>
        )}

        {loading && !data && (
          <p style={{ color: "rgba(0,0,0,.5)", textAlign: "center", marginTop: 40 }}>Carregando...</p>
        )}

        {data && (
          <>
            {/* CATÁLOGO */}
            <h2 style={{ ...s.sectionTitle, fontSize: 13, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
              Catálogo
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12, marginBottom: 28 }}>
              {[
                { label: "Total de produtos", value: data.catalog.total, color: "#160E79" },
                { label: "Com imagem", value: data.catalog.com_imagem, color: "#16a34a" },
                { label: "Sem imagem", value: data.catalog.sem_imagem, color: "#d97706" },
                { label: "Bloqueados", value: data.catalog.bloqueados, color: "#dc2626" },
                { label: "Inativos", value: data.catalog.inativos, color: "#6b7280" },
                { label: "Sem preço", value: data.catalog.sem_preco, color: "#7c3aed" },
              ].map(({ label, value, color }) => (
                <div key={label} style={s.statCard(color)}>
                  <div style={{ ...s.statNum, color }}>{value}</div>
                  <div style={s.statLabel}>{label}</div>
                </div>
              ))}
            </div>

            {/* PEDIDOS */}
            <h2 style={{ ...s.sectionTitle, fontSize: 13, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
              Últimos pedidos ({data.total_pedidos})
            </h2>
            <div style={{ ...s.card, marginBottom: 28, overflowX: "auto" }}>
              {data.recent_orders.length === 0 ? (
                <p style={{ color: "rgba(0,0,0,.4)", margin: 0, fontSize: 14 }}>
                  Nenhum pedido registrado ainda.{" "}
                  <span style={{ opacity: 0.6 }}>
                    (Execute o SQL de criação da tabela pedidos_log no banco)
                  </span>
                </p>
              ) : (
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>#</th>
                      <th style={s.th}>Telefone</th>
                      <th style={s.th}>Itens</th>
                      <th style={s.th}>Total</th>
                      <th style={s.th}>Horário</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent_orders.map((p) => (
                      <tr key={p.id}>
                        <td style={{ ...s.td, color: "rgba(0,0,0,.4)", fontSize: 12 }}>{p.id}</td>
                        <td style={s.td}>{formatPhone(p.customer_phone)}</td>
                        <td style={s.td}>{p.items_count}</td>
                        <td style={{ ...s.td, fontWeight: 700 }}>{formatBRL(p.order_total)}</td>
                        <td style={{ ...s.td, color: "rgba(0,0,0,.45)", fontSize: 12 }}>{timeAgo(p.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* ERROS */}
            <h2 style={{ ...s.sectionTitle, fontSize: 13, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, color: "#dc2626" }}>
              Erros recentes ({data.total_erros})
            </h2>
            <div style={{ ...s.card, overflowX: "auto" }}>
              {data.recent_errors.length === 0 ? (
                <p style={{ color: "#16a34a", margin: 0, fontSize: 14, fontWeight: 600 }}>
                  ✓ Nenhum erro registrado
                </p>
              ) : (
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>#</th>
                      <th style={s.th}>Mensagem de erro</th>
                      <th style={s.th}>Horário</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent_errors.map((e) => (
                      <tr key={e.id}>
                        <td style={{ ...s.td, color: "rgba(0,0,0,.4)", fontSize: 12 }}>{e.id}</td>
                        <td style={{ ...s.td, color: "#b91c1c", fontFamily: "monospace", fontSize: 12 }}>{e.error_msg}</td>
                        <td style={{ ...s.td, color: "rgba(0,0,0,.45)", fontSize: 12 }}>{timeAgo(e.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
