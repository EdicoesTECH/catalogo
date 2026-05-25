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
  const [pedidoEnviado, setPedidoEnviado] = useState(false);
  const [countdown, setCountdown] = useState(10);

  const WPP_URL = "https://wa.me/558585871467";

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

  const [cepLoading, setCepLoading] = useState(false);
  const [touched, setTouched] = useState(false);

  // Erro (se precisar mostrar)
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Expiração
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const checkExpiration = () => {
      const startStr = localStorage.getItem("carrinho_session_start_v1");
      if (!startStr) {
        setIsExpired(true);
        return;
      }
      const elapsed = Date.now() - Number(startStr);
      const LIMIT = 30 * 60 * 1000;
      setIsExpired(elapsed > LIMIT);
    };

    checkExpiration();
    const t = setInterval(checkExpiration, 10000);
    return () => clearInterval(t);
  }, []);

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

  // Busca endereço pelo CEP via ViaCEP
  async function fetchCep(value: string) {
    const digits = onlyDigits(value);
    setCep(value);
    if (digits.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setStreet(data.logradouro || "");
        setNeighborhood(data.bairro || "");
        setCity(data.localidade || "");
        setStateUF(data.uf || "");
      }
    } catch {}
    finally { setCepLoading(false); }
  }

  const canSubmit = useMemo(() => {
    return (
      name.trim().length > 0 &&
      onlyDigits(cpf).length === 11 &&
      onlyDigits(phone).length >= 10 &&
      isValidEmail(email) &&
      onlyDigits(cep).length === 8 &&
      street.trim().length > 0 &&
      number.trim().length > 0 &&
      neighborhood.trim().length > 0 &&
      city.trim().length > 0 &&
      stateUF.trim().length === 2 &&
      itemsCount > 0
    );
  }, [name, cpf, phone, email, cep, street, number, neighborhood, city, stateUF, itemsCount]);

  function fieldStyle(valid: boolean): React.CSSProperties {
    return {
      width: "100%",
      padding: "12px 14px",
      borderRadius: 12,
      border: `1px solid ${touched && !valid ? "#ef4444" : "rgba(0,0,0,.15)"}`,
      background: "#fff",
      color: "#000",
      fontSize: 14,
      fontFamily: "inherit",
    };
  }

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
    setTouched(true);
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

      // limpar carrinho e formulário
      localStorage.removeItem(LS_KEY);
      clearForm();

      // redireciona para página de agradecimento
      window.location.href = "/obrigado";
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
            <p style={{ margin: 0, opacity: 0.9 }}>Seu pedido não pode ser finalizado. O limite de tempo (30 minutos) de exclusividade foi atingido.</p>
            <p style={{ marginTop: 12, fontSize: 14 }}>Por favor, retorne ao WhatsApp e solicite um novo link de atendimento para retomar sua compra.</p>
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
            border: "1px solid rgba(0,0,0,0.10)",
            borderRadius: 20,
            padding: "36px 28px",
            maxWidth: 400,
            width: "100%",
            textAlign: "center",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
          }}>
            <div style={{ fontSize: 56 }}>✅</div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Pedido enviado!</h2>
            <p style={{ margin: 0, fontSize: 15, color: "rgba(0,0,0,0.6)", lineHeight: 1.6 }}>
              Seu pedido foi recebido com sucesso.<br />
              Agora <strong style={{ color: "#000" }}>retorne ao WhatsApp</strong> para concluir o pagamento.
            </p>
            <a
              href={WPP_URL}
              target="_blank"
              rel="noopener noreferrer"
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
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
              Redirecionando automaticamente em {countdown}s...
            </p>
          </div>
        </div>
      )}

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
            placeholder="Nome completo *"
            style={fieldStyle(name.trim().length > 0)}
          />

          <input
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            placeholder="CPF (somente números) *"
            inputMode="numeric"
            maxLength={14}
            style={fieldStyle(onlyDigits(cpf).length === 11)}
          />

          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Telefone com DDD (ex: 85999999999) *"
            inputMode="tel"
            style={fieldStyle(onlyDigits(phone).length >= 10)}
          />

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail *"
            inputMode="email"
            style={fieldStyle(isValidEmail(email))}
          />
        </div>

        {/* Endereço */}
        <h2 style={{ fontSize: 16, marginTop: 18 }}>Endereço de entrega</h2>
        <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
          <div style={{ position: "relative" }}>
            <input
              value={cep}
              onChange={(e) => fetchCep(e.target.value)}
              placeholder="CEP (8 dígitos) *"
              inputMode="numeric"
              maxLength={9}
              style={fieldStyle(onlyDigits(cep).length === 8)}
            />
            {cepLoading && (
              <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 12, opacity: 0.6 }}>
                buscando...
              </span>
            )}
          </div>

          <input
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            placeholder="Rua / Avenida *"
            style={fieldStyle(street.trim().length > 0)}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <input
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="Número *"
              style={fieldStyle(number.trim().length > 0)}
            />
            <input
              value={complement}
              onChange={(e) => setComplement(e.target.value)}
              placeholder="Complemento (opcional)"
              style={fieldStyle(true)}
            />
          </div>

          <input
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
            placeholder="Bairro *"
            style={fieldStyle(neighborhood.trim().length > 0)}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 10 }}>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Cidade *"
              style={fieldStyle(city.trim().length > 0)}
            />
            <input
              value={stateUF}
              onChange={(e) => setStateUF(e.target.value)}
              placeholder="UF *"
              maxLength={2}
              style={{ ...fieldStyle(stateUF.trim().length === 2), textTransform: "uppercase" }}
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
            disabled={sending || !canSubmit}
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              border: "none",
              cursor: sending || !canSubmit ? "not-allowed" : "pointer",
              opacity: sending || !canSubmit ? 0.45 : 1,
              fontWeight: 700,
              background: "#160E79",
              color: "#fff",
              fontSize: 15,
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