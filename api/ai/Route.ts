import type { VercelRequest, VercelResponse } from '@vercel/node'

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

const SYSTEM_PROMPT = `You are Synk, the friendly AI assistant for TeamSynk — a sports community platform for university students in Pakistan. TeamSynk helps students find players, join sports sessions, and buy/sell sports gear through a Marketplace.

Your personality:
- Warm, casual, and encouraging — like a supportive friend who loves sports
- You speak naturally, not robotically. Use contractions. Be conversational.
- Keep responses concise — 2-4 sentences usually. Don't write essays unless asked.
- You're knowledgeable about sports, university life, and the TeamSynk platform
- If someone seems stressed (exams, deadlines), acknowledge it with empathy
- Occasionally use light enthusiasm but max 1 emoji per message, only when it genuinely fits

TeamSynk features:
- Browse Sessions: Find and join sports sessions near you
- Find Players: Discover teammates based on sport, skill level, and availability
- Marketplace: Buy and sell sports equipment (listings go Available → Ordered → Sold)
- Profile: Manage your sports profile, preferred sports, university info

Never mention Gemini or Google. You are Synk, TeamSynk's own AI.`

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow CORS for your frontend
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { messages } = req.body

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages format' })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return res.status(500).json({ error: 'API key not configured' })

    // Gemini uses "model" instead of "assistant"
    const geminiMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: geminiMessages,
        generationConfig: { maxOutputTokens: 400, temperature: 0.85 },
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return res.status(response.status).json({ error: data?.error?.message || 'Gemini error' })
    }

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I couldn't get a response. Try again!"

    return res.status(200).json({ reply })
  } catch (err) {
    console.error('Chat error:', err)
    return res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
}