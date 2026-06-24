export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  console.log('🔵 Received request body:', req.body)

  const { code, language, testCases } = req.body

  console.log('📝 Code:', code)
  console.log('💻 Language:', language)
  console.log('🧪 Test Cases:', testCases)

  // Return a simple response with what we received
  return res.status(200).json({
    message: 'Received!',
    received: {
      codeLength: code?.length || 0,
      language: language,
      testCases: testCases
    },
    results: testCases.map(tc => ({
      input: tc.input,
      expected: tc.output,
      actual: 'Test response',
      passed: false
    }))
  })
}