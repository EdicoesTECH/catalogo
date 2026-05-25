"use client";

import { useEffect, useState } from "react";

const WPP_URL = "https://wa.me/558585871467";

export default function ObrigadoPage() {
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    localStorage.removeItem("carrinho_omie_itens_v1");
    localStorage.removeItem("carrinho_session_id_v1");
    localStorage.setItem("carrinho_session_start_v1", "0");
    sessionStorage.removeItem("carrinho_tab_init");

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
  }, []);

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 0 }}>
      {/* TARJA AZUL */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "#160E79", height: 64,
        display: "flex", alignItems: "center",
        padding: "0 16px", borderBottom: "1px solid rgba(255,255,255,0.12)",
      }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
          <img src="/logo-livraria.png" alt="Livraria Shalom" style={{ height: 40, width: 40, objectFit: "contain" }} />
          <span style={{ color: "#fff", fontWeight: 800, letterSpacing: 0.2 }}>Livraria Shalom</span>
        </div>
      </div>

      {/* CONTEÚDO */}
      <div style={{
        padding: "60px 24px",
        display: "flex", flexDirection: "column",
        alignItems: "center", textAlign: "center", gap: 24,
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          background: "#16a34a",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 40,
        }}>✓</div>

        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>
          Pedido enviado com sucesso!
        </h1>

        <p style={{ fontSize: 16, color: "rgba(0,0,0,0.7)", margin: 0, maxWidth: 380 }}>
          Agradecemos pela sua compra! 🎉<br />
          Agora <strong style={{ color: "#000" }}>retorne ao WhatsApp</strong> para concluir o pagamento.
        </p>

        <a
          href={WPP_URL}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            background: "#25D366", color: "#fff",
            textDecoration: "none", borderRadius: 14,
            padding: "16px 28px", fontWeight: 700, fontSize: 17,
            width: "100%", maxWidth: 380,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Ir para o WhatsApp
        </a>

        <p style={{ fontSize: 13, color: "rgba(0,0,0,0.4)", margin: 0 }}>
          Redirecionando automaticamente em {countdown}s...
        </p>
      </div>
    </main>
  );
}
