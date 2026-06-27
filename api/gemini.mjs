export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.GEMINI_API_KEY

  console.log('KEY EXISTS:', !!apiKey, '| LENGTH:', apiKey?.length ?? 0)

  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not set in Vercel environment variables' })
  }

  let body
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' })
  }

  if (!body) return res.status(400).json({ error: 'Empty request body' })

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }
    )

    const data = await geminiRes.json()
    console.log('Gemini status:', geminiRes.status)
    if (!geminiRes.ok) console.log('Gemini error:', JSON.stringify(data))

    return res.status(geminiRes.status).json(data)

  } catch (err) {
    console.log('CRASH:', err.message)
    return res.status(500).json({ error: 'Server error: ' + err.message })
  }
}
