# 🎤 Funcionalidades de Áudio - DAP.IA Chatbot

## ✅ Implementado

### 1. **Botão de Gravação de Áudio (Speech-to-Text)**
- **Localização:** Lado esquerdo da textarea
- **Ícone:** Microfone (SVG)
- **Como usar:**
  1. Clique no botão de microfone
  2. Fale sua dúvida jurídica em português
  3. O texto é automaticamente adicionado ao input
  4. Pressione Enter ou clique no botão de enviar

**Requisitos:**
- Navegador moderno com suporte a Web Speech API:
  - ✅ Chrome/Edge 25+
  - ✅ Firefox 25+ (com flag experimental)
  - ✅ Safari 14.1+
- Permissão de acesso ao microfone

### 2. **Botão de Reprodução (Text-to-Speech)**
- **Localização:** Lado direito de cada mensagem do bot
- **Ícone:** Microfone para ouvir
- **Como usar:**
  1. Ao receber uma resposta do bot, o áudio é reproduzido automaticamente
  2. Ou clique no ícone de reprodução para ouvir novamente

**Duas opções de qualidade:**
- **Modo Padrão (nativo):** Usa a Web Speech Synthesis API do navegador
- **Modo IA (recomendado):** Usa Google Cloud TTS ou Azure Cognitive Services

### 3. **Padronização de Transições**
- Todas as transições foram padronizadas para: `duration-200 ease-out`
- Aplicado a:
  - Botão de microfone
  - Botão de enviar
  - Textarea
  - Buttons dos chips
  - Ícone de reprodução

---

## 🚀 Setup de TTS por IA (opcional mas recomendado)

### Google Cloud Text-to-Speech (Melhor qualidade)
```bash
# 1. Crie um projeto no Google Cloud Console
# 2. Ative "Cloud Text-to-Speech API"
# 3. Crie uma Service Account key (JSON)
# 4. Obtenha a API Key

# .env.local
GOOGLE_TTS_API_KEY=sua_chave_aqui
```

**Vozes disponíveis (português brasileiro):**
- `pt-BR-Standard-A` (Padrão)
- `pt-BR-Neural2-A` (Mais natural)

---

### Azure Cognitive Services (Mais barato)
```bash
# 1. Crie um recurso "Speech Service" no Azure Portal
# 2. Copie a chave de API e região

# .env.local
AZURE_TTS_API_KEY=sua_chave_aqui
AZURE_REGION=centralus  # ou sua região
```

**Vozes disponíveis (português brasileiro):**
- `pt-BR-AntonioNeural` (Voz masculina)
- `pt-BR-FranciscaNeural` (Voz feminina)

---

## 🔧 Troubleshooting

### "O botão de microfone não funciona"
1. **Verifique permissões:** O navegador deve ter acesso ao microfone
2. **Verifique o console:** Abra DevTools (F12) e procure por erros
3. **Teste em Chrome:** O Chrome tem melhor suporte a Web Speech API
4. **Verifique HTTPS:** Alguns navegadores requerem HTTPS para acesso ao microfone

### "Áudio não toca ou toca com baixa qualidade"
1. **Configure um serviço de TTS:** Google Cloud ou Azure
2. **Verifique o volume do computador**
3. **Teste em outro navegador**

### "Erro 401/403 no TTS"
- Verifique se a chave de API está correta
- Verifique se a API está ativada no painel de controle (Google/Azure)
- Certifique-se de que o `.env.local` foi recarregado

---

## 📋 Estrutura de Código

### Arquivos principais:
- `components/Chat.jsx` - Componente do chat com funcionalidades de áudio
- `app/api/tts/route.js` - Rota de API para Text-to-Speech
- `TTS_SETUP.md` - Guia completo de setup

### Hooks e Callbacks:
```javascript
// Reconhecimento de voz (browser nativo)
const toggleListening = useCallback(() => {
  // Ativa/desativa gravação
}, [isListening]);

// Síntese de voz (com fallback)
const speakText = useCallback(async (text) => {
  // Tenta usar API, depois fallback nativo
}, [useFallbackSynthesis]);

// Fallback para navegadores/ambientes sem TTS externo
const useFallbackSynthesis = useCallback((text) => {
  // Usa Web Speech Synthesis API
}, []);
```

---

## 📊 Comparação de Qualidades

| Recurso | Browser Nativo | Google TTS | Azure TTS |
|---------|---|---|---|
| Qualidade | 6/10 | 9/10 | 8/10 |
| Funciona Offline | ✅ | ❌ | ❌ |
| Costo | Grátis | ~$16/1M chars | ~$1/1M chars |
| Natural | Médio | Excelente | Muito Bom |
| Suporte português | ✅ | ✅ | ✅ |
| Controle de pitch/rate | ❌ | ✅ | ✅ |

---

## 🎯 Próximos passos

1. **Teste o reconhecimento de voz** (funciona sem configuração)
2. **Configure Google Cloud ou Azure** para melhor qualidade de áudio
3. **Teste em diferentes navegadores** para garantir compatibilidade
4. **Monitore os logs** da API de TTS para otimizar custos

---

## ❓ Perguntas Frequentes

**P: Funciona em dispositivos móveis?**
R: Sim, mas com limitações. O Chrome mobile tem excelente suporte, Safari mobile tem suporte parcial.

**P: Posso usar um serviço TTS diferente?**
R: Sim! Edite `app/api/tts/route.js` para adicionar outro serviço (ElevenLabs, Amazon Polly, etc.)

**P: Como custos variam?**
R: Google cobram por caracteres enviados. Azure cobra por milissegundo de áudio. Teste ambos!

**P: Posso salvar áudios local?**
R: Sim, modifique `app/api/tts/route.js` para salvar em `/public` em vez de retornar base64.
