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

    console.log('📝 Received request:', { language, testCasesCount: testCases?.length })

    const results = await executeWithJDoodle(code, language, testCases || [{ input: '1', output: '1' }])
    return res.status(200).json(results)

  } catch (error) {
    console.error('❌ API Error:', error)
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

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i]
    try {
      // ─── DEBUG: Log everything ──────────────────────────────────
      console.log(`\n🔵 Test ${i + 1}:`)
      console.log(`  📥 Input: "${tc.input}"`)
      console.log(`  🎯 Expected: "${tc.output}"`)
      console.log(`  💻 Language: ${lang}`)

      // ─── FIX: Properly format input ────────────────────────────
      let stdin = (tc.input || '').toString()
      // Ensure input ends with newline for C++
      if (stdin && !stdin.endsWith('\n')) {
        stdin += '\n'
      }

      console.log(`  📤 Sending to JDoodle: "${stdin.replace(/\n/g, '\\n')}"`)

      // ─── Call JDoodle API ───────────────────────────────────────
      const requestBody = {
        clientId: JDOODLE_CLIENT_ID,
        clientSecret: JDOODLE_CLIENT_SECRET,
        script: code,
        language: lang,
        versionIndex: '0',
        stdin: stdin
      }

      console.log(`  📦 Request body:`, JSON.stringify(requestBody, null, 2))

      const response = await fetch('https://api.jdoodle.com/v1/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()

      // ─── DEBUG: Log response ────────────────────────────────────
      console.log(`  📥 JDoodle Response:`, JSON.stringify(data, null, 2))

      if (!response.ok) {
        throw new Error(`JDoodle API returned ${response.status}: ${data.error || 'Unknown error'}`)
      }

      // ─── Extract output ─────────────────────────────────────────
      let actualOutput = data.output || data.error || ''
      actualOutput = actualOutput.trim()

      const expected = tc.output.trim()
      const passed = actualOutput === expected

      console.log(`  ✅ Passed: ${passed}`)
      console.log(`  📊 Actual: "${actualOutput}"`)

      results.push({
        input: tc.input,
        expected: expected,
        actual: actualOutput || 'No output',
        passed: passed,
        stderr: data.error || '',
        time: data.cpuTime || 0
      })

    } catch (error) {
      console.error(`❌ Test ${i + 1} Error:`, error.message)
      results.push({
        input: tc.input,
        expected: tc.output,
        actual: `Error: ${error.message}`,
        passed: false
      })
    }
  }

  // ─── Summary ──────────────────────────────────────────────────
  const allPassed = results.every(r => r.passed)
  const passedCount = results.filter(r => r.passed).length

  console.log(`\n📊 Summary: ${passedCount}/${results.length} passed`)

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