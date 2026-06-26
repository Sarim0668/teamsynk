// api/ai/chat.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, history } = req.body;

    // ─── Build conversation context ──────────────────────────────────────
    const context = history ? `Previous: ${history}\n` : '';

    const prompt = `You are a friendly, empathetic AI friend. You listen, understand, and respond like a real friend.

IMPORTANT RULES:
- Respond in 1-2 sentences (max 15 words)
- Show you understand their feelings
- Be warm, supportive, and caring
- Use casual language like a friend
- Use emojis naturally 😊

${context}
User: ${message}

Your caring, brief response:`;

    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'tinyllama',
        prompt: prompt,
        stream: false,
        temperature: 0.9,
        max_tokens: 40,
        num_predict: 40,
        num_ctx: 512,
        stop: ['\n', 'User:', 'AI:', 'Response:']
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama Error: ${response.status}`);
    }

    const data = await response.json();
    let aiReply = data.response || "I'm here for you! 😊";

    // Clean up response
    aiReply = aiReply.replace(/^(Response:|AI:|Assistant:|Answer:|Friend:)/i, '').trim();
    
    // If response is too long, truncate
    if (aiReply.split(' ').length > 20) {
      aiReply = aiReply.split(' ').slice(0, 20).join(' ') + '...';
    }

    return res.status(200).json({ success: true, response: aiReply });

  } catch (error) {
    console.error('AI Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}