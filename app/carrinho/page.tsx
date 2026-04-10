"use client";

import { useEffect, useMemo, useState } from "react";

type Produto = {
  codigo_produto: string;
  descricao: string;
  familia: string;
  preco: number;
  imagem_url: string;
};

const LS_KEY = "carrinho_omie_itens_v1";

// ID DA SESSÃO
const LS_SESSION_KEY = "carrinho_session_id_v1";

function newSessionId() {
  return `sess_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function normalizeText(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

function formatBRL(n: number) {
  const v = Number(n || 0);
  return "R$ " + v.toFixed(2).replace(".", ",");
}

export default function CarrinhoPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [itens, setItens] = useState<Record<string, number>>({});
  const [busca, setBusca] = useState("");
  const [familiaAtiva, setFamiliaAtiva] = useState<string>("Todas");

  // Expiração
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const checkExpiration = () => {
      // 1. ler URL
      const urlParams = new URLSearchParams(window.location.search);
      const novoAcesso = urlParams.get("novo_acesso");
      
      // 2. se novo acesso, resetar relógio
      if (novoAcesso === "1") {
        localStorage.setItem("carrinho_session_start_v1", String(Date.now()));
        // Limpa a URL p/ não ficar resetando ao atualizar a página
        window.history.replaceState(null, '', window.location.pathname);
      }
      
      // 3. checar tempo
      const startStr = localStorage.getItem("carrinho_session_start_v1");
      if (!startStr) {
        localStorage.setItem("carrinho_session_start_v1", String(Date.now()));
      } else {
        const start = Number(startStr);
        const elapsed = Date.now() - start;
        const LIMIT = 30 * 60 * 1000; // 30 min
        if (elapsed > LIMIT) {
          setIsExpired(true);
        } else {
          setIsExpired(false);
        }
      }
    };

    checkExpiration();
    const t = setInterval(checkExpiration, 10000); // checa a cada 10s
    return () => clearInterval(t);
  }, []);

  // cria session_id se não existir
  useEffect(() => {
    try {
      const existing = localStorage.getItem(LS_SESSION_KEY);
      if (!existing) localStorage.setItem(LS_SESSION_KEY, newSessionId());
    } catch {}
  }, []);

  // carregar carrinho salvo
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setItens(JSON.parse(raw));
    } catch {}
  }, []);

  // salvar carrinho
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(itens));
    } catch {}
  }, [itens]);

  // carregar catálogo
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const r = await fetch("/api/catalogo", { cache: "no-store" });
        const data = await r.json();
        if (!r.ok) throw new Error(data?.error || "Falha ao carregar catálogo");
        const list: Produto[] = data?.produtos || [];
        setProdutos(list);

        // se a aba atual não existir, volta para "Todas"
        const fams = Array.from(
          new Set(list.map((p) => (p.familia || "Outros").trim() || "Outros"))
        ).sort((a, b) => a.localeCompare(b, "pt-BR"));

        if (familiaAtiva !== "Todas" && !fams.includes(familiaAtiva)) {
          setFamiliaAtiva("Todas");
        }
      } catch (e: any) {
        setErro(e?.message || "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function add(codigo: string) {
    setItens((prev) => ({ ...prev, [codigo]: (prev[codigo] ?? 0) + 1 }));
  }

  function remove(codigo: string) {
    setItens((prev) => {
      const q = (prev[codigo] ?? 0) - 1;
      const next = { ...prev };
      if (q <= 0) delete next[codigo];
      else next[codigo] = q;
      return next;
    });
  }

  function setQty(codigo: string, qtd: number) {
    setItens((prev) => {
      const next = { ...prev };
      if (qtd <= 0) delete next[codigo];
      else next[codigo] = qtd;
      return next;
    });
  }

  function clearCart() {
    setItens({});
  }

  const totalItens = useMemo(
    () => Object.values(itens).reduce((a, b) => a + b, 0),
    [itens]
  );

  const total = useMemo(() => {
    const pmap = new Map(produtos.map((p) => [p.codigo_produto, p]));
    return Object.entries(itens).reduce((sum, [codigo, qtd]) => {
      const p = pmap.get(codigo);
      if (!p) return sum;
      return sum + (Number(p.preco) || 0) * qtd;
    }, 0);
  }, [itens, produtos]);

  const familias = useMemo(() => {
    const set = new Set<string>();
    for (const p of produtos) set.add((p.familia || "Outros").trim() || "Outros");
    const arr = Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
    return ["Todas", ...arr];
  }, [produtos]);

  const produtosFiltrados = useMemo(() => {
    const nq = normalizeText(busca);

    return produtos
      .filter((p) => {
        const fam = (p.familia || "Outros").trim() || "Outros";
        if (familiaAtiva !== "Todas" && fam !== familiaAtiva) return false;

        if (!nq) return true;

        const hay = normalizeText(`${p.descricao} ${fam} ${p.codigo_produto}`);
        return hay.includes(nq);
      })
      .sort((a, b) => a.descricao.localeCompare(b.descricao, "pt-BR"));
  }, [produtos, busca, familiaAtiva]);

  if (isExpired) {
    return (
      <main style={{ maxWidth: 720, margin: "0 auto", padding: 0 }}>
        {/* TARJA AZUL COM LOGO */}
        <div style={{ position: "sticky", top: 0, zIndex: 50, background: "#160E79", height: 64, display: "flex", alignItems: "center", padding: "0 16px", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
          <a href="/carrinho" style={{ display: "inline-flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
            <img src="/logo-livraria.png" alt="Livraria Shalom" style={{ height: 40, width: 40, objectFit: "contain" }} />
            <span style={{ color: "#fff", fontWeight: 800, letterSpacing: 0.2 }}>Livraria Shalom</span>
          </a>
        </div>
        <div style={{ padding: "40px 20px", textAlign: "center", display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
          <div style={{ background: "rgba(255,0,0,0.1)", color: "red", padding: "20px", borderRadius: "16px", border: "1px solid red", maxWidth: 400 }}>
            <h2 style={{ fontSize: 22, marginBottom: 12 }}>Tempo Esgotado ⏳</h2>
            <p style={{ margin: 0, opacity: 0.9 }}>Este link de acesso expirou. O limite de tempo (30 minutos) de exclusividade foi atingido.</p>
            <p style={{ marginTop: 12, fontSize: 14 }}>Por favor, retorne ao WhatsApp e solicite um novo link de atendimento para retomar sua compra.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main>
      {/* TOPBAR */}
      <div className="topbar">
        <div className="topbar-inner container">
          <a className="brand" href="/carrinho">
            <img
              src="/logo-livraria.png"
              alt="Livraria Shalom"
              style={{ height: 40, width: 40, objectFit: "contain" }}
            />
            <span>Livraria Shalom</span>
          </a>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              className="btn"
              onClick={clearCart}
              disabled={!totalItens}
              style={{
                width: "auto",
                opacity: totalItens ? 1 : 0.5,
                cursor: totalItens ? "pointer" : "not-allowed",
              }}
            >
              Limpar carrinho
            </button>

            <a
              href="/checkout"
              className="btn"
              style={{
                width: "auto",
                textDecoration: "none",
                opacity: totalItens ? 1 : 0.5,
                pointerEvents: totalItens ? "auto" : "none",
              }}
            >
              Finalizar ({totalItens})
            </a>
          </div>
        </div>
      </div>

      {/* CONTEÚDO */}
      <div className="page container">
        <div style={{ display: "grid", gap: 6 }}>
          <h1 style={{ margin: 0, fontSize: 22 }}>Loja</h1>
          <p style={{ margin: 0, color: "var(--muted)" }}>
            Navegue por categorias e adicione ao carrinho.
          </p>
        </div>

        {/* Tabs */}
        <nav className="tabs" style={{ marginTop: 14 }}>
          {familias.map((f) => {
            const active = f === familiaAtiva;
            return (
              <button
                key={f}
                className={`tab ${active ? "active" : ""}`}
                onClick={() => setFamiliaAtiva(f)}
              >
                {f.toUpperCase()}
              </button>
            );
          })}
        </nav>

        {/* Busca */}
        <div style={{ marginTop: 14 }}>
          <input
            className="input"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar produto…"
          />
        </div>

        {loading && <p style={{ marginTop: 16, color: "var(--muted)" }}>Carregando produtos...</p>}

        {erro && (
          <div
            style={{
              marginTop: 16,
              padding: 12,
              border: "1px solid rgba(255,0,0,.35)",
              borderRadius: 12,
              background: "rgba(255,0,0,.06)",
            }}
          >
            <b>Erro:</b> {erro}
          </div>
        )}

        {!loading && !erro && (
          <section className="grid">
            {produtosFiltrados.map((p) => {
              const qtd = itens[p.codigo_produto] ?? 0;
              const img =
                p.imagem_url && p.imagem_url.trim()
                  ? p.imagem_url
                  : "https://placehold.co/420x560?text=Produto";

              return (
                <div key={p.codigo_produto} className="card">
                  <div className="thumb">
                    <img src={img} alt={p.descricao} />
                  </div>

                  <div className="card-body">
                    <div className="title">{p.descricao}</div>

                    <div className="price-row">
                      <div className="price">{formatBRL(p.preco)}</div>
                      <div className="badge">
                        {((p.familia || "Outros").trim() || "Outros").toUpperCase()}
                      </div>
                    </div>

                    {qtd === 0 ? (
                      <button className="btn" onClick={() => add(p.codigo_produto)}>
                        Comprar
                      </button>
                    ) : (
                      <div className="qty">
                        <button className="iconbtn" onClick={() => remove(p.codigo_produto)}>
                          −
                        </button>

                        <input
                          className="input"
                          value={String(qtd)}
                          onChange={(e) =>
                            setQty(
                              p.codigo_produto,
                              Number(e.target.value.replace(/\D/g, "")) || 0
                            )
                          }
                          inputMode="numeric"
                          style={{ textAlign: "center", padding: "10px 10px" }}
                        />

                        <button className="iconbtn" onClick={() => add(p.codigo_produto)}>
                          +
                        </button>
                      </div>
                    )}

                    <div style={{ fontSize: 11, opacity: 0.65 }}>
                      Código: {p.codigo_produto}
                    </div>
                  </div>
                </div>
              );
            })}

            {produtosFiltrados.length === 0 && (
              <div
                style={{
                  gridColumn: "1/-1",
                  padding: 12,
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  color: "var(--muted)",
                }}
              >
                Nenhum produto encontrado.
              </div>
            )}
          </section>
        )}
      </div>

      {/* FOOTER BAR */}
      <div className="footerbar">
        <div className="footerbar-inner container">
          <div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Total</div>
            <div style={{ fontSize: 18, fontWeight: 900 }}>{formatBRL(total)}</div>
          </div>

          <a
            href="/checkout"
            className="btn"
            style={{
              width: "auto",
              textDecoration: "none",
              opacity: totalItens ? 1 : 0.5,
              pointerEvents: totalItens ? "auto" : "none",
            }}
          >
            Finalizar ({totalItens})
          </a>
        </div>
      </div>
    </main>
  );
}
