// POST /api/tts  ->  { audioUrl: string (base64 or blob URL) }
export async function POST(req) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return Response.json({ error: "Text is required" }, { status: 400 });
    }

    // Option 1: Use Google Cloud Text-to-Speech API (requires API key)
    const googleApiKey = process.env.GOOGLE_TTS_API_KEY;
    if (googleApiKey && googleApiKey !== "YOUR_GOOGLE_API_KEY") {
      const googleResponse = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${googleApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input: { text: text.trim() },
            voice: {
              languageCode: "pt-BR",
              name: "pt-BR-Standard-A",
            },
            audioConfig: {
              audioEncoding: "MP3",
              pitch: 0,
              speakingRate: 0.95,
            },
          }),
        }
      );

      if (!googleResponse.ok) {
        const error = await googleResponse.json();
        console.error("Google TTS error:", error);
        throw new Error(`Google TTS API error: ${googleResponse.status}`);
      }

      const data = await googleResponse.json();
      return Response.json({
        audioUrl: `data:audio/mp3;base64,${data.audioContent}`,
        source: "google",
      });
    }

    // Option 2: Use Azure Cognitive Services (requires API key and region)
    const azureApiKey = process.env.AZURE_TTS_API_KEY;
    const azureRegion = process.env.AZURE_REGION;
    if (azureApiKey && azureRegion && azureApiKey !== "YOUR_AZURE_KEY") {
      const ssml = `
        <speak version='1.0' xml:lang='pt-BR'>
          <voice name='pt-BR-AntonioNeural' xml:lang='pt-BR'>
            <prosody pitch='0%' rate='0.95'>
              ${escapeXml(text.trim())}
            </prosody>
          </voice>
        </speak>
      `;

      const azureResponse = await fetch(
        `https://${azureRegion}.tts.speech.microsoft.com/cognitiveservices/v1`,
        {
          method: "POST",
          headers: {
            "Ocp-Apim-Subscription-Key": azureApiKey,
            "Content-Type": "application/ssml+xml",
            "X-Microsoft-OutputFormat": "audio-16khz-32kbitrate-mono-mp3",
          },
          body: ssml,
        }
      );

      if (!azureResponse.ok) {
        const error = await azureResponse.text();
        console.error("Azure TTS error:", error);
        throw new Error(`Azure TTS API error: ${azureResponse.status}`);
      }

      const audioBuffer = await azureResponse.arrayBuffer();
      const base64Audio = Buffer.from(audioBuffer).toString("base64");
      return Response.json({
        audioUrl: `data:audio/mpeg;base64,${base64Audio}`,
        source: "azure",
      });
    }

    // Fallback: No external API configured
    return Response.json(
      {
        error: "No TTS service configured. Set GOOGLE_TTS_API_KEY or AZURE_TTS_API_KEY in environment variables.",
        source: "none",
      },
      { status: 503 }
    );
  } catch (error) {
    console.error("TTS error:", error);
    return Response.json(
      { error: error.message || "Failed to generate audio" },
      { status: 500 }
    );
  }
}

function escapeXml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
