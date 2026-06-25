# Text-to-Speech (TTS) Setup Guide

Este projeto suporta dois serviços de síntese de voz por IA:

## Option 1: Google Cloud Text-to-Speech API (Recomendado)

### Setup
1. Crie um projeto no [Google Cloud Console](https://console.cloud.google.com/)
2. Ative a API "Cloud Text-to-Speech"
3. Crie uma chave de API
4. Adicione ao `.env.local`:
```
GOOGLE_TTS_API_KEY=your_google_api_key_here
```

### Características
- Vozes naturais em português brasileiro
- Suporte a controle de pitch e velocidade
- Qualidade de áudio: MP3 320kbps
- Pricing: ~$16 USD por 1M caracteres

### Vozes disponíveis (português brasileiro)
- `pt-BR-Standard-A` (Padrão, recomendado)
- `pt-BR-Standard-B`
- `pt-BR-Neural2-A` (Mais natural, melhor qualidade)
- `pt-BR-Neural2-B`

---

## Option 2: Azure Cognitive Services (Text-to-Speech)

### Setup
1. Crie um recurso "Speech Service" no [Azure Portal](https://portal.azure.com/)
2. Obtenha a chave de API e região
3. Adicione ao `.env.local`:
```
AZURE_TTS_API_KEY=your_azure_key_here
AZURE_REGION=your_region_here
```

### Características
- Vozes neurais de alta qualidade
- SSML (Speech Synthesis Markup Language) completo
- Suporte a múltiplas emoções e estilos
- Pricing: ~$1 USD por 1M caracteres (mais barato)

### Vozes disponíveis (português brasileiro)
- `pt-BR-AntonioNeural` (Voz masculina natural)
- `pt-BR-FranciscaNeural` (Voz feminina natural)

---

## Fallback: Browser Native Web Speech API

Se nenhum serviço externo estiver configurado, o sistema usa a **Web Speech Synthesis API** nativa do navegador:
- ✅ Funciona offline
- ❌ Qualidade menor
- ❌ Limitações por navegador

---

## Qual escolher?

| Aspecto | Google | Azure | Browser |
|--------|--------|-------|---------|
| Qualidade | Excelente | Muito Boa | Boa |
| Custo | Médio | Mais barato | Grátis |
| Natural | Sim | Sim | Sim |
| Offline | Não | Não | Sim |
| SSML | Limitado | Completo | Não |

**Recomendação:** Google Cloud (melhor qualidade) ou Azure (melhor custo-benefício).

---

## Testing

```javascript
// Test the TTS API
const response = await fetch('/api/tts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: 'Olá, isso é um teste!' })
});
const data = await response.json();
console.log(data);
```

---

## Troubleshooting

### "No TTS service configured"
→ Adicione `GOOGLE_TTS_API_KEY` ou `AZURE_TTS_API_KEY` ao `.env.local`

### "Audio playback error"
→ O sistema automaticamente usa o fallback nativo do navegador

### "API returned error 401/403"
→ Verifique se a chave de API está correta e com permissões ativas

---

## Próximos Passos

1. Escolha um serviço de TTS
2. Configure a chave de API
3. Teste clicando no ícone de microfone próximo às mensagens
4. O chat responderá com áudio automaticamente!
