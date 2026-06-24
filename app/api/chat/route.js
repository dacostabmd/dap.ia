// POST /api/chat  ->  { reply: string, sources: string[] }
export async function POST(req) {
  try {
    const { message } = await req.json();
    const apiUrl = process.env.RAG_API_URL || "https://dap-api-988622096584.southamerica-east1.run.app/webhook/chat-ia";
    const apiKey = process.env.RAG_API_KEY;

    console.log(`Forwarding chat message to external RAG API: ${apiUrl}`);

    const headers = {
      "Content-Type": "application/json",
    };

    if (apiKey && apiKey !== "YOUR_BEARER_TOKEN_HERE") {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const payload = {
      mensagem: message,
      session_id: `session-web-${Date.now()}`,
    };

    const res = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`RAG API returned status: ${res.status}`);
    }

    const data = await res.json();
    console.log("RAG API response data:", data);

    return Response.json({
      reply: data.resposta ?? data.reply ?? data.answer ?? data.text ?? data.response ?? "",
      sources: data.sources ?? data.fontes ?? [],
    });
  } catch (error) {
    console.error("Error communicating with external RAG API:", error);
    // Retorna uma resposta amigável de erro para que o chatbot não quebre
    return Response.json({
      reply: "Desculpe, não consegui obter resposta do assistente no momento. Por favor, tente novamente mais tarde.",
      sources: [],
    });
  }
}


