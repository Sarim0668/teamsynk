// ─── GEMINI API CONFIG ──────────────────────────────────────────
const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY_HERE'  // ← REPLACE WITH YOUR KEY

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

    if (!code || !testCases) {
      return res.status(400).json({ error: 'Code and test cases required' })
    }

    const results = await evaluateWithAI(code, language, testCases)
    return res.status(200).json(results)

  } catch (error) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return res.status(500).json({ error: errorMessage })
  }
}

async function evaluateWithAI(code, language, testCases) {
  const results = []

  for (const tc of testCases) {
    const prompt = `
You are a code evaluator. Given the code and test case, determine if the code produces the expected output.

CODE:
${code}

LANGUAGE: ${language}

TEST CASE:
Input: ${tc.input}
Expected Output: ${tc.output}

Instructions:
1. Mentally execute or analyze the code with the given input
2. Determine what the code would output
3. Compare with expected output
4. Respond with ONLY a JSON object in this exact format:
{"passed": true/false, "actual": "what the code would output"}

IMPORTANT: 
- If the code has syntax errors, set "passed" to false and "actual" to "Syntax error"
- If the code would produce a different output, set "passed" to false
- Only return the JSON object, no other text
`

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 200 }
        })
      })

      const data = await response.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{"passed": false, "actual": "Error"}'
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { passed: false, actual: 'Parse error' }

      results.push({
        input: tc.input,
        expected: tc.output,
        actual: result.actual || 'No output',
        passed: result.passed || false
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      results.push({
        input: tc.input,
        expected: tc.output,
        actual: 'AI Error: ' + errorMessage,
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