# Diretrizes de Desenvolvimento — DAP.IA Chatbot

Este arquivo contém as melhores práticas de engenharia, padrões de projeto, SEO e diretrizes de TDD para o projeto **dap-ia-landing**.

## Comandos do Projeto
- **Iniciar Servidor de Desenvolvimento:** `npm run dev`
- **Compilar para Produção:** `npm run build`
- **Iniciar Servidor de Produção:** `npm run start`
- **Executar Linter:** `npm run lint`
- **Executar Testes (TDD):** `npm run test` (Vitest/Jest, caso configurado)

---

## Mentalidade e Práticas de Test-Driven-Development (TDD)
Siga estritamente o ciclo **Red-Green-Refactor**:
1. **Escreva o Teste Primeiro (Red):** Antes de implementar qualquer feature ou rota de API, crie um arquivo de teste `.test.js` ou `.spec.js` descrevendo o comportamento esperado e veja-o falhar.
2. **Implemente o Mínimo (Green):** Escreva o código de produção mais simples possível que faça o teste passar.
3. **Refatore (Refactor):** Limpe o código, elimine duplicações, melhore nomes de variáveis e a estrutura sem alterar o comportamento externo. Garanta que todos os testes continuem passando.

### Diretrizes de Teste
- **Mock de APIs Externas:** Nunca faça requisições reais para APIs de terceiros nos testes unitários. Use ferramentas de mock (como `msw` ou mocks nativos do Vitest/Jest) para simular respostas e cenários de erro da API RAG.
- **Testes de Rota de API (Backend):** Teste os handlers de API (`app/api/*/route.js`) enviando payloads simulados e verificando os cabeçalhos de resposta, status HTTP e estrutura do JSON retornado.
- **Testes de Componentes (Frontend):** Foque no comportamento do usuário (ex: digitar no input, submeter o formulário, verificar se a resposta aparece em tela). Mokeie chamadas de `fetch` globais.

---

## Diretrizes de Alto SEO (Search Engine Optimization)
Para garantir indexação máxima e pontuação de 100 no Lighthouse:

1. **Uso da Metadata API do Next.js:**
   - Defina metadados estáticos no `layout.js` usando `export const metadata`.
   - Use `generateMetadata` dinâmico em páginas com parâmetros dinâmicos.
   - Forneça sempre títulos descritivos curtos (~50-60 caracteres) e descrições atraentes (~150-160 caracteres).
   - Inclua sempre configurações de `openGraph` (og:title, og:description, og:image, og:type, og:locale) e `twitter` cards.

2. **Tags Semânticas e Acessibilidade:**
   - Garanta exatamente **um** elemento `<h1>` principal por página.
   - Use elementos estruturais do HTML5 (`<main>`, `<header>`, `<footer>`, `<section>`, `<article>`).
   - Elementos interativos não-botão devem possuir `role="button"` ou ser de fato elementos `<button>` com atribuição correta de `tabIndex` e `aria-label`.

3. **Otimização de Performance e Recursos:**
   - **Imagens:** Use o componente `<Image>` do Next.js (`next/image`). Defina `priority` para a imagem principal da Hero page para otimizar o LCP (Largest Contentful Paint).
   - **Fontes:** Use fontes do Google via `next/font/google` para evitar CLS (Cumulative Layout Shift) e carregar fontes de forma assíncrona.
   - **Links:** Sempre utilize o `<Link>` do Next.js (`next/link`) para navegação interna, garantindo prefetching automático das páginas.

---

## Integração com Inteligência Artificial (Práticas de Engenharia)
Ao integrar com a API RAG ou LLMs:

1. **Segurança de Credenciais:**
   - **Nunca** realize requisições diretas do navegador para a API de IA se houver chaves de autenticação envolvidas.
   - Roteie todas as requisições de IA por meio de Rotas de API no Next.js (`app/api/chat/route.js`). Isso mantém os tokens de acesso (como Bearer tokens) protegidos no ambiente do servidor (`process.env.RAG_API_KEY`).

2. **Resiliência e Tratamento de Erros:**
   - Sempre implemente blocos `try/catch` robustos ao fazer requisições a APIs externas.
   - Defina um limite de tempo (timeout) para evitar requisições presas indefinitivamente.
   - Caso a API externa falhe, retorne uma resposta HTTP estruturada com fallback amigável em português para que a UI do chatbot exiba um erro claro e não quebre.

3. **Otimização de Custos e Latência:**
   - Limite a quantidade de contexto/histórico enviada na requisição de chat para economizar tokens de contexto.
   - Prefira formatos de resposta compactos e estruturados.
