"use client";

import { useEffect } from "react";

export default function ObrigadoPage() {
  useEffect(() => {
    // Expira a sessão para o cliente não voltar ao carrinho
    localStorage.removeItem("carrinho_omie_itens_v1");
    localStorage.removeItem("carrinho_session_id_v1");
    localStorage.removeItem("carrinho_session_start_v1");
    sessionStorage.removeItem("carrinho_tab_init");

    // Fecha a aba após 5 segundos
    const t = window.setTimeout(() => window.close(), 5000);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 0 }}>
      {/* TARJA AZUL COM LOGO */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "#160E79",
          height: 64,
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          borderBottom: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
          <img
            src="/logo-livraria.png"
            alt="Livraria Shalom"
            style={{ height: 40, width: 40, objectFit: "contain" }}
          />
          <span style={{ color: "#fff", fontWeight: 800, letterSpacing: 0.2 }}>
            Livraria Shalom
          </span>
        </div>
      </div>

      {/* CONTEÚDO */}
      <div
        style={{
          padding: "60px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 24,
        }}
      >
        {/* Ícone de sucesso */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "#16a34a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 40,
          }}
        >
          ✓
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>
          Pedido enviado com sucesso!
        </h1>

        <p style={{ fontSize: 16, opacity: 0.85, margin: 0, maxWidth: 380 }}>
          Agradecemos pela sua compra! 🎉
        </p>

        <div
          style={{
            background: "rgba(22, 163, 74, 0.1)",
            border: "1px solid #16a34a",
            borderRadius: 16,
            padding: "20px 24px",
            maxWidth: 400,
            width: "100%",
          }}
        >
          <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#16a34a" }}>
            📱 Retorne ao WhatsApp para concluir o pagamento.
          </p>
          <p style={{ margin: "10px 0 0", fontSize: 14, opacity: 0.75 }}>
            Esta janela será fechada automaticamente em alguns segundos.
          </p>
        </div>
      </div>
    </main>
  );
}
