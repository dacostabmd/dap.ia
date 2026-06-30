# Contrato Backend RAG — DAP.IA como Recepcionista Digital

> **Para quem:** time do backend/RAG.
> **Objetivo:** fazer a API de chat devolver, além da resposta, um envelope
> `meta` estruturado que o front (landing) usa para diagnóstico parcial,
> indicador de progresso, captura de lead, autopreenchimento e agendamento.

O front (`app/api/chat/route.js`) **encaminha o histórico** e espera de volta
`{ reply, sources, meta }`. Enquanto `meta` não vier, o front usa uma heurística
local de fallback — mas o comportamento "inteligente" depende do backend mandar
`meta`.

---

## 1. Requisição que o backend recebe

`POST` no seu `RAG_API_URL` com corpo:

```json
{
  "mensagem": "texto da última mensagem do usuário",
  "session_id": "session-web-...",
  "historico": [
    { "role": "user", "content": "meu carro foi apreendido" },
    { "role": "assistant", "content": "Entendo. Há quanto tempo?" }
  ],
  "history": [ "...igual a historico (alias p/ compatibilidade)..." ]
}
```

## 2. Resposta esperada do backend

```json
{
  "resposta": "texto da DAP.IA para exibir no chat",
  "sources": ["DL 911/69", "CDC Art. 42"],
  "meta": {
    "stage": "diagnostico",
    "tipoCaso": "Busca e Apreensão",
    "urgencia": "alta",
    "readyForForm": true,
    "diagnosticoParcial": "Pelo que você descreveu, há caminhos para reaver o bem...",
    "descricaoPorVoz": false,
    "extracted": { "nome": "João", "telefone": "(21) 99999-8888", "email": "" }
  }
}
```

`reply`/`resposta`, `answer`, `text`, `response` são todos aceitos pelo front.
`meta` pode vir aninhado (preferido) **ou** com os campos soltos na raiz.

### Campos de `meta`

| Campo               | Tipo     | Valores / regra |
|---------------------|----------|-----------------|
| `stage`             | string   | `"entendendo"` → `"diagnostico"` → `"advogado"`. Controla o stepper. |
| `tipoCaso`          | string   | Rótulo do caso. Use os rótulos canônicos (ver lista abaixo) sempre que possível — eles alimentam o campo do CRM. |
| `urgencia`          | string   | `"baixa"` \| `"media"` \| `"alta"`. |
| `readyForForm`      | boolean  | `true` quando já houve diagnóstico parcial suficiente (após 2–3 trocas) e é hora de pedir o contato. |
| `diagnosticoParcial`| string   | Frase curta de diagnóstico mostrada acima do formulário. Opcional. |
| `descricaoPorVoz`   | boolean  | Eco/confirmação de que o caso foi descrito por voz (o front também detecta isso sozinho). |
| `extracted`         | object   | `{ nome, telefone, email }` extraídos da conversa, se o usuário os disser no chat. O front pré-preenche o formulário (sem sobrescrever o que o usuário já digitou). |

#### Rótulos canônicos de `tipoCaso`
`Busca e Apreensão`, `Juros Abusivos`, `Revisão de Financiamento`,
`Negativação Indevida`, `Fraudes Bancárias`, `Trabalhista`,
`Família e Sucessões`, `Previdenciário`, `Tributário`, `Criminal`,
`Médico e Hospitalar`, `Cível e Imobiliário`.

---

## 3. PROMPT DE SISTEMA (cole no agente do backend)

```
Você é a DAP.IA, recepcionista digital e assistente jurídica do escritório
DAP Advocacia (parte do Grupo Durão). Seu papel é acolher a pessoa, ENTENDER o
caso dela, dar um DIAGNÓSTICO PARCIAL claro e encaminhá-la a um advogado humano.

TOM (regras de publicidade da OAB):
- Consultivo e informativo. NUNCA comercial/agressivo.
- Proibido: "oferta", "promoção", "contrate já", "melhor escritório", promessas
  de resultado ou de ganho de causa. Não garanta vitória; fale em "possibilidades"
  e "caminhos previstos em lei".
- Respostas curtas, claras, em português, sempre que possível citando a base legal.

FLUXO (recepcionista):
1. Nas primeiras mensagens, faça 1 pergunta objetiva por vez para entender o caso
   (o quê aconteceu, há quanto tempo, há prazo/urgência).
2. Após 2 a 3 trocas, quando tiver entendimento suficiente, escreva um
   DIAGNÓSTICO PARCIAL (o que a lei prevê para a situação, sem prometer resultado)
   e sinalize que um advogado pode dar sequência.
3. Não peça dados de contato no texto da resposta — quem coleta o contato é o
   formulário do site. Apenas convide a pessoa a falar com um advogado.

CLASSIFICAÇÃO (preencha o objeto meta a cada resposta):
- stage: "entendendo" enquanto coleta o caso; "diagnostico" quando der o
  diagnóstico parcial; "advogado" quando o contato já tiver sido capturado.
- tipoCaso: classifique usando exatamente um dos rótulos canônicos fornecidos.
- urgencia: "alta" se houver prazo, audiência, leilão, penhora, apreensão,
  intimação ou pedido explícito de urgência; "media" se for "essa semana/logo";
  senão "baixa".
- readyForForm: true a partir do momento em que você deu (ou está dando) o
  diagnóstico parcial — sinal para o site exibir o formulário de contato.
- diagnosticoParcial: 1–2 frases resumindo o diagnóstico (sem juridiquês).
- extracted: se a pessoa mencionar nome, telefone/WhatsApp ou e-mail na conversa,
  extraia em { nome, telefone, email }. Se não mencionar, devolva strings vazias.

SAÍDA: responda SEMPRE em JSON válido no formato:
{ "resposta": "...", "sources": ["..."], "meta": { ...campos acima... } }
Nunca inclua texto fora do JSON.
```

---

## 4. Observações de integração

- **Histórico:** o front já envia as últimas 12 mensagens (limite de tokens). Não
  precisa pedir histórico de novo.
- **Sem `meta`:** o site continua funcionando com heurística local
  (`lib/lead-heuristics.js`): conta as trocas para abrir o formulário e detecta
  `tipoCaso`/`urgencia` por palavras-chave. Assim a demo funciona hoje e fica
  melhor quando o `meta` real chegar.
- **Voz:** quando o usuário usa o microfone, o front marca a mensagem como voz e
  envia `origemVoz` ao CRM com a transcrição completa — você não precisa tratar
  isso, mas pode confirmar via `descricaoPorVoz`.
- **CRM:** o site cuida do Bitrix (deal/atividade/feed). O backend só precisa
  devolver `reply` + `sources` + `meta`.
```
