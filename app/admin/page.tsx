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

type N8nExec = {
  id: string;
  status: string;
  startedAt: string;
  stoppedAt: string;
  workflowId: string;
} | null;

type N8nWorkflow = {
  id: string;
  name: string;
  active: boolean;
  tags: string[];
  lastExecution: N8nExec;
  recentErrors: number;
  totalRecent: number;
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
  if (!iso) return "—";
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
  if (d.length === 13) return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`;
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  return p;
}

function statusColor(status: string) {
  if (status === "success") return "#16a34a";
  if (status === "error") return "#dc2626";
  if (status === "running") return "#d97706";
  return "#6b7280";
}

function statusLabel(status: string) {
  if (status === "success") return "✓ ok";
  if (status === "error") return "✗ erro";
  if (status === "running") return "⟳ rodando";
  if (status === "waiting") return "⏳ aguardando";
  return status || "—";
}

const TAG_GROUPS: Record<string, string> = {
  "VENDA WHATS": "Checkout / Livraria",
  IA: "Inteligência Artificial",
  "Comercial Edições": "Comercial Edições",
  Funcionando: "",
  Homologação: "",
  "Em criação": "",
};

function groupLabel(tags: string[]) {
  for (const t of tags) {
    const label = TAG_GROUPS[t];
    if (label) return label;
  }
  if (tags.includes("Comercial Edições")) return "Comercial Edições";
  return "Outros";
}

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [inputToken, setInputToken] = useState("");
  const [data, setData] = useState<DashData | null>(null);
  const [n8nData, setN8nData] = useState<{ workflows: N8nWorkflow[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [n8nOpen, setN8nOpen] = useState(true);

  const fetchData = useCallback(async (t: string) => {
    if (!t) return;
    setLoading(true);
    setError(null);
    try {
      const [r1, r2] = await Promise.all([
        fetch(`/api/admin/dashboard?token=${encodeURIComponent(t)}`, { cache: "no-store" }),
        fetch(`/api/admin/n8n?token=${encodeURIComponent(t)}`, { cache: "no-store" }),
      ]);
      const [j1, j2] = await Promise.all([r1.json(), r2.json()]);
      if (!r1.ok) throw new Error(j1?.error || "Erro ao carregar dashboard");
      setData(j1);
      if (r2.ok) setN8nData(j2);
      setLastRefresh(new Date());
    } catch (e: any) {
      setError(e?.message || "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token") || "";
    if (t) {
      setToken(t);
      setInputToken(t);
      fetchData(t);
    }
  }, [fetchData]);

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
    page: {
      minHeight: "100vh",
      background: "#f4f4f8",
      fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
    } as React.CSSProperties,
    topbar: {
      background: "#160E79",
      height: 64,
      display: "flex",
      alignItems: "center",
      padding: "0 24px",
      gap: 16,
    } as React.CSSProperties,
    body: { maxWidth: 1100, margin: "0 auto", padding: "24px 16px" } as React.CSSProperties,
    card: {
      background: "#fff",
      borderRadius: 14,
      padding: 20,
      border: "1px solid rgba(0,0,0,.10)",
      boxShadow: "0 2px 10px rgba(0,0,0,.06)",
    } as React.CSSProperties,
    statCard: (color: string) =>
      ({
        background: "#fff",
        borderRadius: 14,
        padding: "18px 20px",
        border: `1px solid ${color}22`,
        boxShadow: "0 2px 10px rgba(0,0,0,.06)",
        borderLeft: `4px solid ${color}`,
      } as React.CSSProperties),
    sectionTitle: {
      fontSize: 11,
      fontWeight: 800,
      margin: "0 0 12px 0",
      color: "rgba(0,0,0,.4)",
      textTransform: "uppercase" as const,
      letterSpacing: 1,
    },
    table: { width: "100%", borderCollapse: "collapse" as const, fontSize: 13 },
    th: {
      textAlign: "left" as const,
      padding: "8px 10px",
      borderBottom: "2px solid rgba(0,0,0,.1)",
      fontWeight: 700,
      color: "rgba(0,0,0,.5)",
      fontSize: 11,
      textTransform: "uppercase" as const,
    },
    td: {
      padding: "10px 10px",
      borderBottom: "1px solid rgba(0,0,0,.06)",
      verticalAlign: "top" as const,
    },
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
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 10,
                border: "1px solid rgba(0,0,0,.2)",
                fontSize: 14,
                marginBottom: 12,
                boxSizing: "border-box",
              }}
            />
            <button
              onClick={login}
              style={{
                width: "100%",
                padding: 12,
                background: "#160E79",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontWeight: 700,
                cursor: "pointer",
                fontSize: 15,
              }}
            >
              Entrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Agrupa workflows por categoria
  const wfGroups: Record<string, N8nWorkflow[]> = {};
  for (const wf of n8nData?.workflows || []) {
    const group = groupLabel(wf.tags);
    if (!wfGroups[group]) wfGroups[group] = [];
    wfGroups[group].push(wf);
  }
  const groupOrder = ["Checkout / Livraria", "Comercial Edições", "Inteligência Artificial", "Outros"];

  return (
    <div style={s.page}>
      {/* TOPBAR */}
      <div style={s.topbar}>
        <img src="/logo-livraria.png" alt="" style={{ height: 36, width: 36, objectFit: "contain" }} />
        <span style={{ color: "#fff", fontWeight: 800, flex: 1 }}>Painel Admin — Livraria Shalom</span>
        <button
          onClick={() => fetchData(token)}
          disabled={loading}
          style={{
            background: "rgba(255,255,255,.15)",
            color: "#fff",
            border: "1px solid rgba(255,255,255,.3)",
            borderRadius: 8,
            padding: "6px 14px",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          {loading ? "..." : "↻ Atualizar"}
        </button>
        {lastRefresh && (
          <span style={{ color: "rgba(255,255,255,.5)", fontSize: 12 }}>
            {lastRefresh.toLocaleTimeString("pt-BR")}
          </span>
        )}
      </div>

      <div style={s.body}>
        {error && (
          <div
            style={{
              padding: 14,
              background: "rgba(255,0,0,.08)",
              border: "1px solid #fca5a5",
              borderRadius: 12,
              color: "#b91c1c",
              marginBottom: 20,
            }}
          >
            {error}
          </div>
        )}

        {loading && !data && (
          <p style={{ color: "rgba(0,0,0,.5)", textAlign: "center", marginTop: 40 }}>
            Carregando...
          </p>
        )}

        {data && (
          <>
            {/* ── CATÁLOGO ── */}
            <p style={s.sectionTitle}>Catálogo de Produtos</p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                gap: 12,
                marginBottom: 32,
              }}
            >
              {[
                { label: "Total", value: data.catalog.total, color: "#160E79" },
                { label: "Com imagem", value: data.catalog.com_imagem, color: "#16a34a" },
                { label: "Sem imagem", value: data.catalog.sem_imagem, color: "#d97706" },
                { label: "Bloqueados", value: data.catalog.bloqueados, color: "#dc2626" },
                { label: "Inativos", value: data.catalog.inativos, color: "#6b7280" },
                { label: "Sem preço", value: data.catalog.sem_preco, color: "#7c3aed" },
              ].map(({ label, value, color }) => (
                <div key={label} style={s.statCard(color)}>
                  <div style={{ fontSize: 30, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: 12, color: "rgba(0,0,0,.5)", marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* ── PEDIDOS ── */}
            <p style={s.sectionTitle}>Pedidos recentes ({data.total_pedidos})</p>
            <div style={{ ...s.card, marginBottom: 32, overflowX: "auto" }}>
              {data.recent_orders.length === 0 ? (
                <p style={{ color: "rgba(0,0,0,.4)", margin: 0, fontSize: 14 }}>
                  Nenhum pedido ainda.{" "}
                  <span style={{ opacity: 0.6 }}>
                    (Execute criar_tabela_pedidos_log.sql no banco)
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
                        <td style={{ ...s.td, color: "rgba(0,0,0,.45)", fontSize: 12 }}>
                          {timeAgo(p.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* ── ERROS CHECKOUT ── */}
            <p style={{ ...s.sectionTitle, color: data.total_erros > 0 ? "#dc2626" : "rgba(0,0,0,.4)" }}>
              Erros de checkout ({data.total_erros})
            </p>
            <div style={{ ...s.card, marginBottom: 32, overflowX: "auto" }}>
              {data.recent_errors.length === 0 ? (
                <p style={{ color: "#16a34a", margin: 0, fontSize: 14, fontWeight: 600 }}>
                  ✓ Nenhum erro registrado
                </p>
              ) : (
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>#</th>
                      <th style={s.th}>Mensagem</th>
                      <th style={s.th}>Horário</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent_errors.map((e) => (
                      <tr key={e.id}>
                        <td style={{ ...s.td, color: "rgba(0,0,0,.4)", fontSize: 12 }}>{e.id}</td>
                        <td style={{ ...s.td, color: "#b91c1c", fontFamily: "monospace", fontSize: 12 }}>
                          {e.error_msg}
                        </td>
                        <td style={{ ...s.td, color: "rgba(0,0,0,.45)", fontSize: 12 }}>
                          {timeAgo(e.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* ── N8N WORKFLOWS ── */}
        {n8nData && (
          <>
            <div
              style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, cursor: "pointer" }}
              onClick={() => setN8nOpen((v) => !v)}
            >
              <p style={{ ...s.sectionTitle, margin: 0 }}>
                Fluxos n8n ({n8nData.workflows.length})
              </p>
              <span style={{ fontSize: 12, color: "rgba(0,0,0,.35)" }}>
                {n8nData.workflows.filter((w) => w.active).length} ativos ·{" "}
                {n8nData.workflows.filter((w) => w.recentErrors > 0).length} com erros recentes ·{" "}
                {n8nOpen ? "▲ recolher" : "▼ expandir"}
              </span>
            </div>

            {n8nOpen &&
              groupOrder.map((group) => {
                const wfs = wfGroups[group];
                if (!wfs || wfs.length === 0) return null;
                return (
                  <div key={group} style={{ marginBottom: 24 }}>
                    <p style={{ ...s.sectionTitle, color: "#160E79", marginBottom: 8 }}>{group}</p>
                    <div style={{ ...s.card, padding: 0, overflow: "hidden" }}>
                      <table style={s.table}>
                        <thead>
                          <tr style={{ background: "rgba(0,0,0,.02)" }}>
                            <th style={{ ...s.th, paddingLeft: 16 }}>Workflow</th>
                            <th style={s.th}>Status</th>
                            <th style={s.th}>Última execução</th>
                            <th style={s.th}>Resultado</th>
                            <th style={s.th}>Erros recentes</th>
                            <th style={s.th}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {wfs.map((wf) => {
                            const N8N = "https://applications-n8n.ky0uhm.easypanel.host";
                            const execUrl = wf.lastExecution
                              ? `${N8N}/workflow/${wf.id}/executions/${wf.lastExecution.id}`
                              : `${N8N}/workflow/${wf.id}/executions`;
                            return (
                            <tr key={wf.id}>
                              <td style={{ ...s.td, paddingLeft: 16 }}>
                                <span style={{ fontWeight: 600, fontSize: 13 }}>{wf.name}</span>
                              </td>
                              <td style={s.td}>
                                <span
                                  style={{
                                    display: "inline-block",
                                    padding: "2px 8px",
                                    borderRadius: 999,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    background: wf.active ? "#dcfce7" : "#f3f4f6",
                                    color: wf.active ? "#16a34a" : "#6b7280",
                                  }}
                                >
                                  {wf.active ? "Ativo" : "Inativo"}
                                </span>
                              </td>
                              <td style={{ ...s.td, color: "rgba(0,0,0,.45)", fontSize: 12 }}>
                                {wf.lastExecution ? timeAgo(wf.lastExecution.startedAt) : "—"}
                              </td>
                              <td style={s.td}>
                                {wf.lastExecution ? (
                                  <span
                                    style={{
                                      fontSize: 12,
                                      fontWeight: 700,
                                      color: statusColor(wf.lastExecution.status),
                                    }}
                                  >
                                    {statusLabel(wf.lastExecution.status)}
                                  </span>
                                ) : (
                                  <span style={{ color: "rgba(0,0,0,.3)", fontSize: 12 }}>—</span>
                                )}
                              </td>
                              <td style={s.td}>
                                {wf.recentErrors > 0 ? (
                                  <span
                                    style={{
                                      display: "inline-block",
                                      padding: "2px 8px",
                                      borderRadius: 999,
                                      fontSize: 11,
                                      fontWeight: 700,
                                      background: "#fee2e2",
                                      color: "#dc2626",
                                    }}
                                  >
                                    {wf.recentErrors} erro{wf.recentErrors > 1 ? "s" : ""}
                                  </span>
                                ) : (
                                  <span style={{ color: "#16a34a", fontSize: 12 }}>✓</span>
                                )}
                              </td>
                              <td style={{ ...s.td, whiteSpace: "nowrap" as const }}>
                                <a
                                  href={execUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    fontSize: 11,
                                    color: wf.lastExecution?.status === "error" ? "#dc2626" : "#160E79",
                                    textDecoration: "none",
                                    fontWeight: 600,
                                    opacity: 0.8,
                                  }}
                                >
                                  {wf.lastExecution?.status === "error" ? "🔴 Ver erro →" : "Ver →"}
                                </a>
                              </td>
                            </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
          </>
        )}
      </div>
    </div>
  );
}
