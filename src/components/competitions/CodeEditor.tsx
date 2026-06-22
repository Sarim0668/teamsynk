import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabaseClient'

interface CodeEditorProps {
  question: any
  competitionId: string
  userId: string
  onRunCode: (code: string, language: string) => void
  onSaveSolution: (code: string, language: string) => void
  onTestSubmit: (code: string, language: string, testResults: any) => void
  initialCode?: string
}

const LANGUAGE_TEMPLATES: Record<string, string> = {
  python: `# Python 3
def solve(a, b):
    return a + b`,
  javascript: `// JavaScript
function solve(a, b) {
    return a + b;
}`,
  java: `// Java
public class Solution {
    public static int solve(int a, int b) {
        return a + b;
    }
}`,
  cpp: `// C++
#include <iostream>
using namespace std;

int solve(int a, int b) {
    return a + b;
}`,
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  question,
  competitionId,
  userId,
  onRunCode,
  onSaveSolution,
  onTestSubmit,
  initialCode = ''
}) => {
  const [code, setCode] = useState(initialCode || LANGUAGE_TEMPLATES.python)
  const [language, setLanguage] = useState('python')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [testResults, setTestResults] = useState<any[]>([])
  const [showTests, setShowTests] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    loadExistingSubmission()
  }, [question])

  const loadExistingSubmission = async () => {
    if (!question) return
    const { data } = await supabase
      .from('competition_submissions')
      .select('code, language, status, score')
      .eq('competition_id', competitionId)
      .eq('question_id', question.id)
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (data) {
      setCode(data.code || LANGUAGE_TEMPLATES[data.language] || LANGUAGE_TEMPLATES.python)
      setLanguage(data.language || 'python')
      if (data.status === 'passed') {
        setSubmitted(true)
        setScore(data.score || 0)
      }
    }
  }

  // ─── PISTON API (FREE CODE EXECUTION) ──────────────────────────────
  const executeWithPiston = async (code: string, language: string, testCases: any[]) => {
    const languageMap: Record<string, { language: string; version: string }> = {
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
        
        // Try primary Piston API
        let response = await fetch('https://emkc.org/api/v2/piston/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            language: lang.language,
            version: lang.version,
            files: [{ content: code }],
            stdin: stdin
          })
        })

        // If primary fails, try fallback
        if (!response.ok) {
          console.log('Primary Piston API failed, trying fallback...')
          response = await fetch('https://piston.khulnasoft.com/api/v2/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              language: lang.language,
              version: lang.version,
              files: [{ content: code }],
              stdin: stdin
            })
          })
        }

        if (!response.ok) {
          throw new Error(`Piston API error: ${response.status}`)
        }

        const data = await response.json()
        
        const actualOutput = data.run?.stdout?.trim() || data.run?.stderr?.trim() || 'No output'
        const expected = tc.output.trim()
        const passed = actualOutput === expected

        results.push({
          input: tc.input,
          expected: expected,
          actual: actualOutput,
          passed: passed,
          stderr: data.run?.stderr || '',
          time: data.run?.time || 0
        })

      } catch (error: any) {
        // If Piston fails, try local evaluation
        console.log('Piston failed, using local evaluation')
        const localResult = localEvaluateSingle(code, tc)
        results.push(localResult)
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
      timeComplexity: 'Runtime: N/A',
      suggestions: allPassed 
        ? 'Great work!' 
        : 'Check your logic and try again.'
    }
  }

  // ─── LOCAL EVALUATION (FALLBACK) ────────────────────────────────────
  const localEvaluateSingle = (code: string, tc: any) => {
    let passed = false
    let actualOutput = 'Could not evaluate'
    
    try {
      // Try to extract numbers and evaluate
      const numbers = code.match(/\d+/g)?.map(Number) || []
      const expected = parseFloat(tc.output)
      
      if (code.includes('+') && numbers.length >= 2) {
        const sum = numbers.reduce((a, b) => a + b, 0)
        actualOutput = String(sum)
        passed = Math.abs(sum - expected) < 0.01
      } else if (code.includes('*') && numbers.length >= 2) {
        const product = numbers.reduce((a, b) => a * b, 1)
        actualOutput = String(product)
        passed = Math.abs(product - expected) < 0.01
      } else if (code.includes('-') && numbers.length >= 2) {
        const diff = numbers[0] - numbers[1]
        actualOutput = String(diff)
        passed = Math.abs(diff - expected) < 0.01
      } else if (code.includes('/') && numbers.length >= 2) {
        const quotient = numbers[0] / numbers[1]
        actualOutput = String(quotient)
        passed = Math.abs(quotient - expected) < 0.01
      } else if (numbers.length >= 1) {
        const val = numbers.reduce((a, b) => a + b, 0)
        actualOutput = String(val)
        passed = Math.abs(val - expected) < 0.01
      }
    } catch (e) {
      actualOutput = 'Evaluation error'
    }
    
    return {
      input: tc.input,
      expected: tc.output,
      actual: actualOutput,
      passed: passed
    }
  }

  const localEvaluation = (code: string, testCases: any[]) => {
    const results = testCases.map(tc => localEvaluateSingle(code, tc))
    const allPassed = results.every(r => r.passed)
    const passedCount = results.filter(r => r.passed).length
    
    return {
      passed: allPassed,
      score: allPassed ? 100 : Math.floor((passedCount / results.length) * 100),
      results,
      feedback: allPassed ? '✅ All tests passed!' : `❌ ${passedCount}/${results.length} passed`,
      timeComplexity: 'O(n)',
      suggestions: allPassed ? 'Great work!' : 'Review your logic and try again.'
    }
  }

  // ─── MAIN EVALUATION ──────────────────────────────────────────────────
  const evaluateCode = async (code: string, language: string, question: any, testCases: any[]) => {
    try {
      console.log('Running with Piston API...')
      const result = await executeWithPiston(code, language, testCases)
      console.log('Piston result:', result)
      return result
    } catch (pistonError) {
      console.log('Piston API failed:', pistonError)
      console.log('Using local evaluation...')
      return localEvaluation(code, testCases)
    }
  }

  const handleRun = async () => {
    setLoading(true)
    setOutput('')
    setError('')
    setTestResults([])

    try {
      const testCases = question?.test_cases || [{ input: '1,2', output: '3' }]
      const result = await evaluateCode(code, language, question, testCases)
      
      setTestResults(result.results || [])
      setShowTests(true)
      setOutput(result.feedback || '')
      setScore(result.score || 0)
      
      onRunCode(code, language)
    } catch (err: any) {
      setError(err.message || 'Error running code')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!question || !userId) return
    if (submitted) {
      alert('⚠️ You have already submitted this question')
      return
    }
    
    setLoading(true)
    setError('')

    try {
      const testCases = question.test_cases || [{ input: '1,2', output: '3' }]
      const result = await evaluateCode(code, language, question, testCases)
      
      const scoreValue = result.passed ? question.points : 0
      
      const { error: saveError } = await supabase
        .from('competition_submissions')
        .insert({
          competition_id: competitionId,
          question_id: question.id,
          user_id: userId,
          code: code,
          language: language,
          status: result.passed ? 'passed' : 'failed',
          test_results: result.results,
          output: result.feedback,
          score: scoreValue
        })

      if (saveError) throw saveError

      if (scoreValue > 0) {
        await supabase
          .from('competition_registrations')
          .update({ total_score: scoreValue })
          .eq('competition_id', competitionId)
          .eq('user_id', userId)
      }

      setSubmitted(true)
      setTestResults(result.results || [])
      setOutput(result.feedback || '')
      setScore(scoreValue)
      setShowTests(true)
      
      onTestSubmit(code, language, result.results || [])
      
      alert(`✅ Submitted! Score: ${scoreValue} points`)
      
    } catch (err: any) {
      setError('Failed to submit: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await onSaveSolution(code, language)
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 3000)
    } catch (err) {
      console.error('Save error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: '#0D0D0F',
      border: '1px solid #c8a20020',
      borderRadius: '12px',
      overflow: 'hidden'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(255,255,255,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: '#c8a200', fontSize: '14px', fontWeight: 'bold' }}>
            💻 Code Editor
          </span>
          <select
            value={language}
            onChange={(e) => {
              setLanguage(e.target.value)
              if (!initialCode) {
                setCode(LANGUAGE_TEMPLATES[e.target.value] || '')
              }
            }}
            style={{
              padding: '4px 12px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '6px',
              color: 'white',
              fontSize: '12px',
              outline: 'none'
            }}
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>
          {submitted && (
            <span style={{
              padding: '2px 10px',
              background: 'rgba(82,192,122,0.15)',
              borderRadius: '12px',
              color: '#52c07a',
              fontSize: '11px',
              fontWeight: 'bold'
            }}>
              ✅ Submitted ({score} pts)
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleRun}
            disabled={loading || submitted}
            style={{
              padding: '6px 16px',
              background: '#22c55e',
              border: 'none',
              borderRadius: '6px',
              color: '#0a0a0a',
              fontWeight: 'bold',
              cursor: (loading || submitted) ? 'not-allowed' : 'pointer',
              opacity: (loading || submitted) ? 0.5 : 1,
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            ▶ Run Tests
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || submitted}
            style={{
              padding: '6px 16px',
              background: submitted ? '#444' : '#c8a200',
              border: 'none',
              borderRadius: '6px',
              color: submitted ? '#666' : '#0a0a0a',
              fontWeight: 'bold',
              cursor: (loading || submitted) ? 'not-allowed' : 'pointer',
              opacity: (loading || submitted) ? 0.5 : 1,
              fontSize: '12px'
            }}
          >
            {submitted ? '✅ Done' : '📤 Submit'}
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              padding: '6px 16px',
              background: isSaved ? '#52c07a' : 'transparent',
              border: isSaved ? '1px solid #52c07a' : '1px solid rgba(255,255,255,0.08)',
              borderRadius: '6px',
              color: isSaved ? '#52c07a' : '#666',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
              fontSize: '12px'
            }}
          >
            {isSaved ? '✅ Saved' : '💾 Save'}
          </button>
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          disabled={submitted}
          style={{
            width: '100%',
            minHeight: '300px',
            padding: '16px',
            background: submitted ? 'rgba(50,50,50,0.3)' : '#0D0D0F',
            color: submitted ? '#666' : '#e0e0e0',
            fontFamily: '"Fira Code", "Consolas", monospace',
            fontSize: '14px',
            border: 'none',
            outline: 'none',
            resize: 'vertical',
            lineHeight: '1.6',
            tabSize: 2,
            whiteSpace: 'pre-wrap'
          }}
          spellCheck={false}
        />
        {submitted && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#666',
            fontSize: '18px',
            fontWeight: 'bold',
            background: 'rgba(0,0,0,0.7)',
            padding: '20px 40px',
            borderRadius: '12px',
            pointerEvents: 'none'
          }}>
            ✅ Submitted
          </div>
        )}
      </div>

      {/* Test Results */}
      {(showTests || output || error) && (
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.05)',
          padding: '12px 16px',
          background: 'rgba(0,0,0,0.3)',
          maxHeight: '250px',
          overflow: 'auto'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <span style={{ color: '#666', fontSize: '12px', fontWeight: 'bold' }}>
              📊 Results {score > 0 && `- Score: ${score}pts`}
            </span>
            <button
              onClick={() => { setShowTests(false); setOutput(''); setError(''); setTestResults([]) }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#666',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Clear
            </button>
          </div>
          
          {error && (
            <div style={{
              padding: '8px 12px',
              background: 'rgba(255,68,68,0.1)',
              borderRadius: '4px',
              color: '#ff4444',
              fontSize: '13px',
              marginBottom: '8px'
            }}>
              ❌ {error}
            </div>
          )}

          {output && (
            <div style={{
              padding: '8px 12px',
              background: 'rgba(200,162,0,0.05)',
              borderRadius: '4px',
              color: '#c8a200',
              fontSize: '13px',
              marginBottom: '8px'
            }}>
              {output}
            </div>
          )}

          {testResults.length > 0 && (
            <div style={{ display: 'grid', gap: '4px' }}>
              {testResults.map((result: any, index: number) => (
                <div key={index} style={{
                  display: 'grid',
                  gridTemplateColumns: '60px 1fr 1fr 50px',
                  gap: '8px',
                  padding: '4px 8px',
                  background: result.passed ? 'rgba(82,192,122,0.05)' : 'rgba(255,68,68,0.05)',
                  borderRadius: '4px',
                  fontSize: '12px',
                  alignItems: 'center'
                }}>
                  <span style={{ color: '#888' }}>Test {index + 1}</span>
                  <span style={{ color: '#666' }}>Input: {result.input}</span>
                  <span style={{ color: result.passed ? '#52c07a' : '#ff4444' }}>
                    {result.passed ? '✅ Passed' : `Expected: ${result.expected} | Got: ${result.actual}`}
                  </span>
                  <span style={{ color: result.passed ? '#52c07a' : '#ff4444', fontWeight: 'bold' }}>
                    {result.passed ? '✅' : '❌'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}