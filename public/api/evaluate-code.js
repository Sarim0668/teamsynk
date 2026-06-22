export default async function handler(req, res) {
  // Enable CORS
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

    // Execute code using Piston API (server-to-server - NO CORS!)
    const results = await executeWithPiston(code, language, testCases || [{ input: '1,2', output: '3' }])
    
    return res.status(200).json(results)

  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ 
      error: 'Execution failed',
      details: error.message 
    })
  }
}

async function executeWithPiston(code, language, testCases) {
  const languageMap = {
    python: { language: 'python', version: '3.10.0' },
    javascript: { language: 'javascript', version: '18.15.0' },
    java: { language: 'java', version: '15.0.2' },
    cpp: { language: 'cpp', version: '10.2.0' },
  }

  const lang = languageMap[language] || languageMap.python
  const results = []

  for (const tc of testCases) {
    try {
      const stdin = tc.input || ''
      
      // Wrap C++ code with main function
      let fullCode = code
      if (language === 'cpp') {
        fullCode = `
#include <iostream>
using namespace std;

${code}

int main() {
    ${stdin ? `cout << solve(${stdin.replace(',', ', ')}) << endl;` : 'cout << solve() << endl;'}
    return 0;
}
        `
      } else if (language === 'python') {
        fullCode = `
${code}

if __name__ == "__main__":
    ${stdin ? `print(solve(${stdin.replace(',', ', ')}))` : 'print(solve())'}
        `
      } else if (language === 'javascript') {
        fullCode = `
${code}

console.log(solve(${stdin || ''}));
        `
      }

      const response = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: lang.language,
          version: lang.version,
          files: [{ content: fullCode }],
          stdin: stdin
        })
      })

      if (!response.ok) {
        throw new Error(`Piston API returned ${response.status}`)
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
        stderr: data.run?.stderr || '',
        time: data.run?.time || 0
      })

    } catch (error) {
      // Try alternative Piston API endpoint
      try {
        const response = await fetch('https://piston.khulnasoft.com/api/v2/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            language: lang.language,
            version: lang.version,
            files: [{ content: code }],
            stdin: tc.input || ''
          })
        })

        if (response.ok) {
          const data = await response.json()
          const actualOutput = data.run?.stdout?.trim() || data.run?.stderr?.trim() || ''
          const expected = tc.output.trim()
          const passed = actualOutput === expected

          results.push({
            input: tc.input,
            expected: expected,
            actual: actualOutput || 'No output',
            passed: passed,
            stderr: data.run?.stderr || '',
            time: data.run?.time || 0
          })
          continue
        }
      } catch (e) {
        // Both APIs failed
      }

      // If all APIs fail, try local evaluation
      results.push({
        input: tc.input,
        expected: tc.output,
        actual: 'Execution failed - using local fallback',
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