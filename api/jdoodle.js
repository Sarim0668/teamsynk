// ─── JDoodle API Configuration ──────────────────────────────────────────
// Get your free keys from: https://www.jdoodle.com/compiler-api
// These are server-side ONLY - never exposed to browser!

const JDOODLE_CLIENT_ID = process.env.JDOODLE_CLIENT_ID || 'da8dc1b3451ec148570ac8011623038c'
const JDOODLE_CLIENT_SECRET = process.env.JDOODLE_CLIENT_SECRET || 'e59bce95342c96914bf8110b672914f09728b0e3c747be92428af567487ddadf'

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

  try {
    const { code, language, testCases } = req.body

    if (!code) {
      return res.status(400).json({ error: 'Code is required' })
    }

    const results = await executeWithJDoodle(code, language, testCases || [{ input: '1', output: '1' }])
    return res.status(200).json(results)

  } catch (error) {
    console.error('Error:', error)
    return res.status(500).json({ error: error.message })
  }
}

async function executeWithJDoodle(code, language, testCases) {
  const languageMap = {
    cpp: 'cpp14',
    python: 'python3',
    javascript: 'nodejs'
  }

  const lang = languageMap[language] || 'cpp14'
  const results = []

  for (const tc of testCases) {
    try {
      const stdin = tc.input || ''

      const response = await fetch('https://api.jdoodle.com/v1/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: JDOODLE_CLIENT_ID,
          clientSecret: JDOODLE_CLIENT_SECRET,
          script: code,
          language: lang,
          versionIndex: '0',
          stdin: stdin
        })
      })

      if (!response.ok) {
        throw new Error(`JDoodle API error: ${response.status}`)
      }

      const data = await response.json()
      
      const actualOutput = data.output?.trim() || data.error?.trim() || ''
      const expected = tc.output?.toString().trim() || ''
      const passed = actualOutput === expected

      results.push({
        input: tc.input,
        expected: expected,
        actual: actualOutput || 'No output',
        passed: passed,
        time: data.cpuTime || 0
      })

    } catch (error) {
      results.push({
        input: tc.input,
        expected: tc.output,
        actual: 'Error: ' + error.message,
        passed: false
      })
    }
  }

  const allPassed = results.every(r => r.passed)
  const passedCount = results.filter(r => r.passed).length

  return {
    passed: allPassed,
    score: allPassed ? 100 : Math.floor((passedCount / results.length) * 100),
    results: results,
    feedback: allPassed ? '✅ All test cases passed!' : `❌ ${passedCount}/${results.length} test cases passed`,
    suggestions: allPassed ? 'Great work!' : 'Check your logic and try again.'
  }
}