"use client";

import { useEffect, useMemo, useState } from "react";

const LS_KEY = "carrinho_omie_itens_v1";
const LS_SESSION_KEY = "carrinho_session_id_v1";

function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}

function isValidEmail(email: string) {
  const e = (email || "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

export default function CheckoutPage() {
  const [itens, setItens] = useState<Record<string, number>>({});
  const [sending, setSending] = useState(false);

  // Toast (alerta verde)
  const [toast, setToast] = useState<string | null>(null);
  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  }

  // Cliente
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // Endereço
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [stateUF, setStateUF] = useState("");

  // Erro (se precisar mostrar)
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setItens(JSON.parse(raw));
    } catch {}
  }, []);

  const itemsCount = useMemo(
    () => Object.values(itens).reduce((a, b) => a + b, 0),
    [itens]
  );

  function clearForm() {
    setName("");
    setCpf("");
    setPhone("");
    setEmail("");
    setCep("");
    setStreet("");
    setNumber("");
    setComplement("");
    setNeighborhood("");
    setCity("");
    setStateUF("");
  }

  async function submit() {
    setErrorMsg(null);

    const cpfDigits = onlyDigits(cpf);
    const phoneDigits = onlyDigits(phone);
    const cepDigits = onlyDigits(cep);
    const uf = (stateUF || "").trim().toUpperCase();
    const session_id = localStorage.getItem(LS_SESSION_KEY) || "";

    if (!name.trim()) return setErrorMsg("Informe seu nome.");
    if (cpfDigits.length !== 11) return setErrorMsg("CPF inválido. Informe 11 dígitos.");
    if (phoneDigits.length < 10 || phoneDigits.length > 13)
      return setErrorMsg("Telefone inválido. Informe DDD + número.");
    if (!isValidEmail(email)) return setErrorMsg("E-mail inválido.");
    if (!itemsCount) return setErrorMsg("Seu carrinho está vazio.");

    // endereço obrigatório
    if (cepDigits.length !== 8) return setErrorMsg("CEP inválido (8 dígitos).");
    if (!street.trim()) return setErrorMsg("Informe a rua/avenida.");
    if (!number.trim()) return setErrorMsg("Informe o número.");
    if (!neighborhood.trim()) return setErrorMsg("Informe o bairro.");
    if (!city.trim()) return setErrorMsg("Informe a cidade.");
    if (uf.length !== 2) return setErrorMsg("UF inválida (ex: CE, SP).");

    try {
      setSending(true);

      const r = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id,
          customer: {
            name: name.trim(),
            cpf: cpfDigits,
            phone: phoneDigits,
            email: email.trim(),
          },
          shipping_address: {
            cep: cepDigits,
            street: street.trim(),
            number: number.trim(),
            complement: complement.trim(),
            neighborhood: neighborhood.trim(),
            city: city.trim(),
            state: uf,
          },
          cart: itens,
        }),
      });

      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Falha ao enviar pedido");

      // limpar carrinho e formulário (mantém sua lógica)
      localStorage.removeItem(LS_KEY);
      clearForm();

      // alerta verde
      showToast("Pedido enviado! Retorne ao WhatsApp para concluir o pagamento.");
    } catch (e: any) {
      setErrorMsg(e?.message || "Erro desconhecido");
    } finally {
      setSending(false);
    }
  }

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
        <a
          href="/carrinho"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            textDecoration: "none",
          }}
        >
          <img
            src="/logo-livraria.png"
            alt="Livraria Shalom"
            style={{ height: 40, width: 40, objectFit: "contain" }}
          />
          <span style={{ color: "#fff", fontWeight: 800, letterSpacing: 0.2 }}>
            Livraria Shalom
          </span>
        </a>
      </div>

      {/* TOAST VERDE (WINDOW ALERT) */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 74,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            background: "#16a34a",
            color: "white",
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.25)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
            fontWeight: 800,
          }}
        >
          {toast}
        </div>
      )}

      {/* CONTEÚDO */}
      <div style={{ padding: 16 }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>Checkout</h1>
        <p style={{ marginTop: 8, opacity: 0.85 }}>
          Informe seus dados para enviar o pedido. ({itemsCount} itens no carrinho)
        </p>

        {/* Dados do cliente */}
        <h2 style={{ fontSize: 16, marginTop: 18 }}>Dados do cliente</h2>
        <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome completo"
            style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid #333" }}
          />

          <input
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            placeholder="CPF (somente números)"
            inputMode="numeric"
            style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid #333" }}
          />

          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Telefone com DDD (ex: 85999999999)"
            inputMode="tel"
            style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid #333" }}
          />

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail"
            inputMode="email"
            style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid #333" }}
          />
        </div>

        {/* Endereço */}
        <h2 style={{ fontSize: 16, marginTop: 18 }}>Endereço de entrega</h2>
        <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
          <input
            value={cep}
            onChange={(e) => setCep(e.target.value)}
            placeholder="CEP (8 dígitos)"
            inputMode="numeric"
            style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid #333" }}
          />

          <input
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            placeholder="Rua / Avenida"
            style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid #333" }}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <input
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="Número"
              style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid #333" }}
            />
            <input
              value={complement}
              onChange={(e) => setComplement(e.target.value)}
              placeholder="Complemento (opcional)"
              style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid #333" }}
            />
          </div>

          <input
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
            placeholder="Bairro"
            style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid #333" }}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 10 }}>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Cidade"
              style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid #333" }}
            />
            <input
              value={stateUF}
              onChange={(e) => setStateUF(e.target.value)}
              placeholder="UF"
              maxLength={2}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid #333",
                textTransform: "uppercase",
              }}
            />
          </div>
        </div>

        {errorMsg && (
          <div style={{ marginTop: 12, padding: 12, border: "1px solid #500", borderRadius: 12 }}>
            <b>Erro:</b> {errorMsg}
          </div>
        )}

        <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
          <button
            onClick={submit}
            disabled={sending}
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid #333",
              cursor: sending ? "not-allowed" : "pointer",
              opacity: sending ? 0.6 : 1,
              fontWeight: 700,
            }}
          >
            {sending ? "Enviando..." : "Enviar pedido"}
          </button>

          <a href="/carrinho" style={{ textDecoration: "none", opacity: 0.85 }}>
            ← Voltar ao carrinho
          </a>
        </div>
      </div>
    </main>
  );
}