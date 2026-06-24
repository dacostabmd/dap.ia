# DAP.IA — Assistente Jurídico com IA

Landing page do assistente jurídico **DAP.IA**, desenvolvida para a [DAP Advocacia](https://dapadvocacia.com.br) (Grupo Durão). Integra um chat RAG (*Retrieval-Augmented Generation*) em tempo real para responder dúvidas jurídicas em português, com foco em direito do consumidor, busca e apreensão e juros abusivos.

---

## Funcionalidades

| # | Funcionalidade | Descrição |
|---|---|---|
| 1 | **Chat RAG** | Usuário digita uma pergunta jurídica; o backend encaminha para a API RAG externa e exibe a resposta com animação de digitação progressiva e badges de fontes citadas. |
| 2 | **Modo Demo/Fallback** | Se a API RAG estiver indisponível, `lib/answers.js` retorna respostas simuladas para que a página permaneça funcional offline. |
| 3 | **Carrossel de Direitos** | Rotação automática (6,5 s) entre 5 casos jurídicos reais (Busca e Apreensão, Juros Abusivos, etc.) com botão "Perguntar à DAP.IA" que preenche o chat automaticamente via evento customizado. |
| 4 | **8 Áreas de Atuação** | Grade responsiva com cards animados (inversão de cor no hover) cobrindo Consumidor, Trabalhista, Família e Sucessões, Previdenciário, Tributário, Criminal, Médico/Hospitalar e Cível/Imobiliário. |
| 5 | **Seção de Confiança** | Estatísticas do Grupo Durão (17+ anos, 12 estados, 800+ colaboradores), selos de certificação e 4 diferenciais. |
| 6 | **Reveal Animations** | Componente `Reveal.jsx` com `IntersectionObserver` para fade-in + slide-up conforme o usuário rola a página. |
| 7 | **Responsivo** | Layout de 1 coluna no mobile até 4 colunas no desktop via Tailwind CSS v4. |

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | [Next.js 15](https://nextjs.org) — App Router, JavaScript |
| UI | [React 19](https://react.dev) |
| Estilo | [Tailwind CSS 4](https://tailwindcss.com) — configurado via `@theme` em `globals.css` (sem `tailwind.config.js`) |
| Fontes | `next/font/google`: Spectral · IBM Plex Sans · IBM Plex Mono |
| API | Rota de API Next.js (`app/api/chat/route.js`) → API RAG externa (Google Cloud Run) |
| Auth | JWT Bearer token em variável de ambiente |
| Imagens | Componente `<Image>` do Next.js (domínios externos em `next.config.mjs`) |

---

## Estrutura do Projeto

```
ia_daphne_chatbot/
├── app/
│   ├── layout.js               # Root layout: fontes, metadata, SEO
│   ├── page.js                 # Composição das seções da página
│   ├── globals.css             # Tailwind v4 @theme + paleta + keyframes
│   └── api/
│       └── chat/
│           └── route.js        # POST /api/chat — ponto de integração da API RAG
├── components/
│   ├── Hero.jsx                # Brand strip + headline + widget de Chat
│   ├── Chat.jsx                # Chat interativo com animação e fontes (client)
│   ├── ComoFunciona.jsx        # Fluxo de 3 passos do RAG
│   ├── DireitosCarousel.jsx    # Carrossel animado de casos jurídicos (client)
│   ├── Areas.jsx               # Grid das 8 áreas de atuação
│   ├── Confianca.jsx           # Stats do Grupo Durão + selos + diferenciais
│   ├── CTA.jsx                 # Bloco de conversão final
│   ├── Footer.jsx              # Rodapé com contato e links
│   └── Reveal.jsx              # Utilitário de fade-in via IntersectionObserver
├── lib/
│   ├── data.js                 # Constantes de conteúdo (AREAS, SLIDES, DIFERENCIAIS)
│   └── answers.js              # Respostas simuladas para modo demo/fallback
├── .env.example                # Template de variáveis de ambiente
├── next.config.mjs             # Padrões de domínio para <Image> remoto
└── jsconfig.json               # Alias "@/*" → raiz do projeto
```

---

## Como Rodar

### Pré-requisitos

- Node.js 18+
- npm ou yarn

### Desenvolvimento

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Edite .env com as suas credenciais (veja seção abaixo)

# 3. Iniciar servidor de desenvolvimento
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

### Produção

```bash
npm run build
npm start
```

---

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com:

```bash
# URL do endpoint da API RAG
RAG_API_URL=https://sua-api.com/webhook/chat

# Token Bearer para autenticação com a API (se necessário)
RAG_API_KEY=seu_token_aqui
```

> **Segurança:** Nunca exponha `RAG_API_KEY` no cliente. A variável é lida exclusivamente pelo servidor Next.js em `app/api/chat/route.js`.

---

## Integração com a API RAG

### Contrato da rota `/api/chat`

**Request:**
```json
POST /api/chat
Content-Type: application/json

{ "message": "Meu carro foi apreendido, o que faço?" }
```

**Response:**
```json
{
  "reply": "Em caso de busca e apreensão...",
  "sources": ["CDC Art. 51", "STJ REsp 1.418.593"]
}
```

### Payload enviado à API RAG externa

```json
{
  "mensagem": "mensagem do usuário",
  "session_id": "session-web-<timestamp>"
}
```

O handler normaliza automaticamente os seguintes campos de resposta: `resposta`, `reply`, `answer`, `text`, `response` (e `fontes`/`sources` para as fontes).

---

## Paleta de Cores

Definida em `app/globals.css` via `@theme`. Use diretamente como classes Tailwind:

| Token | Cor | Uso |
|---|---|---|
| `bg-navy` / `text-navy` | `#0a1924` | Fundo principal |
| `bg-navy2` | `#122a3d` | Cards e seções alternadas |
| `bg-darknavy` | `#060f17` | Fundo escuro máximo |
| `text-gold` | `#c9a86a` | Destaques e acentos |
| `text-gold2` | `#d8bd87` | Acentos secundários |
| `text-golddk` | `#9c7b3f` | Gold mais escuro |
| `bg-cream` | `#f6f3ec` | Seções claras |
| `bg-card` | `#fbfaf7` | Fundo de cards claros |
| `text-ink` | `#14202b` | Texto sobre fundo claro |

---

## Animações

Keyframes definidos em `app/globals.css` e expostos como variantes Tailwind via `--animate-*` no `@theme`:

| Variante | Efeito |
|---|---|
| `animate-msg-in` | Entrada de mensagem no chat (slide + fade) |
| `animate-float` | Flutuação suave (card de referência no carrossel) |
| `animate-glow` | Pulsação de brilho dourado |
| `animate-blink` | Piscada de cursor |
| `animate-dot-pulse` | 3 pontos pulsantes (estado "digitando...") |

---

## Comandos Disponíveis

```bash
npm run dev      # Servidor de desenvolvimento (hot-reload)
npm run build    # Build de produção
npm run start    # Servidor de produção (requer build)
npm run lint     # ESLint
```

---

## Notas

- Os selos e logotipos são carregados das URLs públicas da DAP e do Grupo Durão. Para empacotar localmente, baixe os arquivos para `public/` e atualize os `src`.
- O carrossel usa um sistema de eventos customizados (`dap:ask`) para comunicar o clique no carrossel com o componente `Chat.jsx` sem prop drilling.
- A página foi projetada para pontuação 100 no Lighthouse: `<h1>` único por página, `<Image>` com `priority` no hero, fontes via `next/font`, tags Open Graph completas e estrutura HTML5 semântica.
