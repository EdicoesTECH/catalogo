import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const N8N_URL = process.env.N8N_BASE_URL || "https://applications-n8n.ky0uhm.easypanel.host";
const N8N_KEY = process.env.N8N_API_KEY || "";

// Excluídos: SHALOM PLAY - HOTMART
const EXCLUDE_IDS = new Set([
  "lCYvznnyBVUePqey", // Hotmart — Compra Aprovada
  "AbeV3M1rXFh7OWXk", // Hotmart — Cancelamento de Assinatura
  "SjRJyZaoG3dWUgGe", // Hotmart — Reembolso
  "gPW3w6dgOnraAPKa", // Hotmart — Tratamento de Erros (Painel)
]);

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  if (!N8N_KEY) {
    return NextResponse.json({ error: "N8N_API_KEY não configurada" }, { status: 500 });
  }

  const headers = {
    "X-N8N-API-KEY": N8N_KEY,
    Accept: "application/json",
  };

  try {
    const [wfRes, exRes] = await Promise.all([
      fetch(`${N8N_URL}/api/v1/workflows?limit=100`, { headers }),
      fetch(`${N8N_URL}/api/v1/executions?limit=200&includeData=false`, { headers }),
    ]);

    const [wfData, exData] = await Promise.all([wfRes.json(), exRes.json()]);

    const workflows: any[] = (wfData?.data || []).filter(
      (w: any) => !EXCLUDE_IDS.has(w.id)
    );

    // Agrupa execuções por workflowId
    const execsByWf: Record<string, any[]> = {};
    for (const ex of exData?.data || []) {
      const wid = ex.workflowId;
      if (!execsByWf[wid]) execsByWf[wid] = [];
      execsByWf[wid].push(ex);
    }

    const result = workflows.map((w: any) => {
      const execs: any[] = execsByWf[w.id] || [];
      const last = execs[0] || null;
      const recentErrors = execs.filter((e) => e.status === "error").length;
      return {
        id: w.id,
        name: w.name,
        active: w.active,
        tags: (w.tags || []).map((t: any) => t.name),
        lastExecution: last
          ? {
              id: last.id,
              status: last.status,
              startedAt: last.startedAt,
              stoppedAt: last.stoppedAt,
            }
          : null,
        recentErrors,
        totalRecent: execs.length,
      };
    });

    // Ordena: ativos primeiro, depois por nome
    result.sort((a, b) => {
      if (a.active !== b.active) return a.active ? -1 : 1;
      return a.name.localeCompare(b.name, "pt-BR");
    });

    return NextResponse.json({ workflows: result });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Erro ao buscar n8n" }, { status: 500 });
  }
}
