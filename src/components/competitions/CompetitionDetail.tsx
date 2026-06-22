import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { CodeEditor } from './CodeEditor'

export const CompetitionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [competition, setCompetition] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [registration, setRegistration] = useState<any>(null)

  useEffect(() => {
    if (id) {
      loadData()
    }
  }, [id])

  const loadData = async () => {
    setLoading(true)
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    setUser(currentUser)

    const { data: compData } = await supabase
      .from('competitions')
      .select('*')
      .eq('id', id)
      .single()
    setCompetition(compData)

    const { data: qData } = await supabase
      .from('competition_questions')
      .select('*')
      .eq('competition_id', id)
      .order('question_number', { ascending: true })
    setQuestions(qData || [])
    if (qData && qData.length > 0) {
      setSelectedQuestion(qData[0])
    }

    if (currentUser) {
      const { data: regData } = await supabase
        .from('competition_registrations')
        .select('*')
        .eq('competition_id', id)
        .eq('user_id', currentUser.id)
        .maybeSingle()
      setRegistration(regData)
    }

    setLoading(false)
  }

  const handleRunCode = async (code: string, language: string) => {
    console.log('Running code:', code)
  }

  const handleSaveSolution = async (code: string, language: string) => {
    if (!selectedQuestion || !user) return

    const { error } = await supabase
      .from('competition_submissions')
      .insert({
        competition_id: id,
        question_id: selectedQuestion.id,
        user_id: user.id,
        code: code,
        language: language,
        status: 'pending'
      })

    if (error) {
      alert('Failed to save: ' + error.message)
    }
  }

  if (loading) {
    return <div style={{ padding: '40px', color: '#666' }}>Loading...</div>
  }

  if (!competition) {
    return <div style={{ padding: '40px', color: '#666' }}>Competition not found</div>
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0D0D0F',
      color: 'white',
      padding: '24px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <Link to="/competitions" style={{ color: '#c8a200', textDecoration: 'none' }}>
          ← Back to Competitions
        </Link>

        <div style={{ margin: '20px 0' }}>
          <h1 style={{ color: '#FFD700', fontSize: '28px' }}>{competition.title}</h1>
          <p style={{ color: '#666' }}>{competition.subject}</p>
          <div style={{ display: 'flex', gap: '16px', marginTop: '8px', color: '#888', fontSize: '13px' }}>
            <span>📅 {competition.date}</span>
            <span>⏰ {competition.start_time.substring(0,5)} - {competition.end_time.substring(0,5)}</span>
            <span>⏱️ {competition.duration_minutes} min</span>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '300px 1fr',
          gap: '20px'
        }}>
          {/* Question List */}
          <div style={{
            background: 'rgba(13,13,13,0.95)',
            border: '1px solid #c8a20020',
            borderRadius: '12px',
            padding: '16px',
            maxHeight: '600px',
            overflow: 'auto'
          }}>
            <h3 style={{ color: '#c8a200', fontSize: '14px', marginBottom: '12px' }}>
              📝 Questions ({questions.length})
            </h3>
            {questions.map((q, i) => (
              <div
                key={q.id}
                onClick={() => setSelectedQuestion(q)}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: selectedQuestion?.id === q.id ? 'rgba(200,162,0,0.1)' : 'transparent',
                  border: selectedQuestion?.id === q.id ? '1px solid rgba(200,162,0,0.3)' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 'bold' }}>Q{i+1}. {q.title}</span>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    background: q.difficulty === 'Easy' ? 'rgba(82,192,122,0.15)' :
                               q.difficulty === 'Medium' ? 'rgba(200,162,0,0.15)' :
                               'rgba(255,68,68,0.15)',
                    color: q.difficulty === 'Easy' ? '#52c07a' :
                           q.difficulty === 'Medium' ? '#c8a200' :
                           '#ff4444'
                  }}>
                    {q.difficulty}
                  </span>
                </div>
                <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>
                  {q.points} points
                </div>
              </div>
            ))}
          </div>

          {/* Question + Editor */}
          <div>
            {selectedQuestion ? (
              <>
                <div style={{
                  background: 'rgba(13,13,13,0.95)',
                  border: '1px solid #c8a20020',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '20px'
                }}>
                  <h3 style={{ color: '#FFD700', fontSize: '18px' }}>
                    {selectedQuestion.title}
                  </h3>
                  <p style={{ color: '#aaa', marginTop: '8px', whiteSpace: 'pre-wrap' }}>
                    {selectedQuestion.description}
                  </p>
                  {selectedQuestion.sample_input && (
                    <div style={{ marginTop: '12px' }}>
                      <span style={{ color: '#666', fontSize: '12px' }}>Sample Input:</span>
                      <pre style={{
                        background: 'rgba(0,0,0,0.3)',
                        padding: '8px',
                        borderRadius: '4px',
                        color: '#888',
                        fontSize: '13px'
                      }}>
                        {selectedQuestion.sample_input}
                      </pre>
                    </div>
                  )}
                  {selectedQuestion.sample_output && (
                    <div style={{ marginTop: '8px' }}>
                      <span style={{ color: '#666', fontSize: '12px' }}>Sample Output:</span>
                      <pre style={{
                        background: 'rgba(0,0,0,0.3)',
                        padding: '8px',
                        borderRadius: '4px',
                        color: '#52c07a',
                        fontSize: '13px'
                      }}>
                        {selectedQuestion.sample_output}
                      </pre>
                    </div>
                  )}
                </div>

// Replace the CodeEditor section with:
<CodeEditor
  question={selectedQuestion}
  competitionId={id!}
  userId={user?.id}
  onRunCode={handleRunCode}
  onSaveSolution={handleSaveSolution}
  onTestSubmit={(code, language, results) => {
    console.log('Test submitted:', { code, language, results })
  }}
/>
              </>
            ) : (
              <div style={{
                background: 'rgba(13,13,13,0.95)',
                border: '1px solid #c8a20020',
                borderRadius: '12px',
                padding: '40px',
                textAlign: 'center',
                color: '#666'
              }}>
                No questions available for this competition.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}