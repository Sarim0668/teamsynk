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

    const results = await executeWithPiston(code, language, testCases || [{ input: '1 2', output: '3' }])
    return res.status(200).json(results)

  } catch (error) {
    console.error('Error:', error)
    return res.status(500).json({ error: error.message })
  }
}

async function executeWithPiston(code, language, testCases) {
  const languageMap = {
    cpp: { language: 'cpp', version: '10.2.0' },
    python: { language: 'python', version: '3.10.0' },
    javascript: { language: 'javascript', version: '18.15.0' }
  }

  const lang = languageMap[language] || languageMap.cpp
  const results = []

  for (const tc of testCases) {
    try {
      const response = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: lang.language,
          version: lang.version,
          files: [{ content: code }],
          stdin: tc.input || ''
        })
      })

      if (!response.ok) {
        throw new Error(`Piston API error: ${response.status}`)
      }

      const data = await response.json()
      
      const actualOutput = data.run?.stdout?.trim() || data.run?.stderr?.trim() || ''
      const expected = tc.output.trim()
      const passed = actualOutput === expected

      results.push({
        input: tc.input,
        expected: expected,
        actual: actualOutput || 'No output',
        passed: passed,
        time: data.run?.time || 0
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