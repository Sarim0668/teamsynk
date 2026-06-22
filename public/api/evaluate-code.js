// ─── JDoodle API Configuration ──────────────────────────────
// Get your free keys from: https://www.jdoodle.com/compiler-api
const JDOODLE_CLIENT_ID = '3aXXXXXXXXXXXXXXXX'  // ← REPLACE WITH YOUR CLIENT ID
const JDOODLE_CLIENT_SECRET = 'aXXXXXXXXXXXXXXXX'  // ← REPLACE WITH YOUR CLIENT SECRET

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
    console.error('API Error:', error)
    return res.status(500).json({ 
      error: 'Execution failed',
      details: error.message 
    })
  }
}

async function executeWithJDoodle(code, language, testCases) {
  const languageMap = {
    python: 'python3',
    javascript: 'nodejs',
    java: 'java',
    cpp: 'cpp14',
  }

  const lang = languageMap[language] || 'python3'
  const results = []

  for (const tc of testCases) {
    try {
      // ─── FIX: Pass input as string with newline ────────────────
      const stdin = (tc.input || '').toString().trim() + '\n'
      
      console.log(`📝 Input: "${stdin}"`)
      console.log(`🎯 Expected: "${tc.output}"`)
      console.log(`💻 Language: ${lang}`)
      console.log(`📄 Code length: ${code.length}`)

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
        const errorText = await response.text()
        console.error('JDoodle API error:', response.status, errorText)
        throw new Error(`JDoodle API returned ${response.status}`)
      }

      const data = await response.json()
      
      console.log('📤 JDoodle Response:', JSON.stringify(data, null, 2))
      
      const actualOutput = data.output?.trim() || data.error?.trim() || ''
      const expected = tc.output.trim()
      const passed = actualOutput === expected

      results.push({
        input: tc.input,
        expected: expected,
        actual: actualOutput || 'No output',
        passed: passed,
        stderr: data.error || '',
        time: data.cpuTime || 0
      })

    } catch (error) {
      console.error('❌ Execution error:', error)
      results.push({
        input: tc.input,
        expected: tc.output,
        actual: `Error: ${error.message}`,
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
    feedback: allPassed 
      ? '✅ All test cases passed!' 
      : `❌ ${passedCount}/${results.length} test cases passed`,
    timeComplexity: 'Runtime: ' + (results[0]?.time || 'N/A') + 's',
    suggestions: allPassed 
      ? 'Great work!' 
      : 'Check your logic and try again.'
  }
}