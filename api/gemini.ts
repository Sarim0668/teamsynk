import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.GEMINI_API_KEY

  // ─── Debug log — check Vercel dashboard → Logs after a request ───────────
  console.log('=== GEMINI API DEBUG ===')
  console.log('API KEY EXISTS:', !!apiKey)
  console.log('API KEY LENGTH:', apiKey?.length ?? 0)
  console.log('API KEY PREVIEW:', apiKey ? apiKey.slice(0, 6) + '...' : 'UNDEFINED')
  console.log('========================')

  if (!apiKey) {
    return res.status(500).json({
      error: 'API key not configured on server. Add VITE_GEMINI_API_KEY to Vercel environment variables.'
    })
  }

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
      }
    )

    const data = await geminiRes.json()

    // Log what Gemini actually returned so we can see any errors
    console.log('Gemini status:', geminiRes.status)
    if (!geminiRes.ok) {
      console.log('Gemini error response:', JSON.stringify(data))
    }

    return res.status(geminiRes.status).json(data)

  } catch (err: any) {
    console.log('Fetch error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}