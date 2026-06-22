import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

export const CreateCompetition: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [checkingAdmin, setCheckingAdmin] = useState(true)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    date: '',
    start_time: '09:00',
    end_time: '11:00',
    duration_minutes: 120,
    max_participants: 50
  })
  
  const [questions, setQuestions] = useState([
    { 
      title: '', 
      description: '', 
      difficulty: 'Medium', 
      points: 20, 
      sample_input: '', 
      sample_output: '',
      test_cases: [{ input: '', output: '' }]
    }
  ])

  useEffect(() => {
    checkAdmin()
  }, [])

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      navigate('/login')
      return
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'Admin') {
      navigate('/')
      return
    }

    setIsAdmin(true)
    setCheckingAdmin(false)
  }

  const addTestCase = (questionIndex: number) => {
    const newQuestions = [...questions]
    newQuestions[questionIndex].test_cases.push({ input: '', output: '' })
    setQuestions(newQuestions)
  }

  const removeTestCase = (questionIndex: number, testIndex: number) => {
    const newQuestions = [...questions]
    if (newQuestions[questionIndex].test_cases.length > 1) {
      newQuestions[questionIndex].test_cases.splice(testIndex, 1)
      setQuestions(newQuestions)
    }
  }

  const updateTestCase = (questionIndex: number, testIndex: number, field: 'input' | 'output', value: string) => {
    const newQuestions = [...questions]
    newQuestions[questionIndex].test_cases[testIndex][field] = value
    setQuestions(newQuestions)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isAdmin) {
      setError('Only admins can create competitions')
      return
    }

    // Validation
    if (!formData.title.trim()) {
      setError('Please enter a competition title')
      return
    }
    
    if (!formData.date) {
      setError('Please select a date')
      return
    }
    
    if (!formData.start_time) {
      setError('Please select a start time')
      return
    }
    
    if (!formData.end_time) {
      setError('Please select an end time')
      return
    }

    if (formData.start_time >= formData.end_time) {
      setError('Start time must be before end time')
      return
    }

    const emptyQuestions = questions.some(q => !q.title.trim() || !q.description.trim())
    if (emptyQuestions) {
      setError('Please fill in all question titles and descriptions')
      return
    }

    // Check if any test cases are empty
    const emptyTestCases = questions.some(q => 
      q.test_cases.some(tc => !tc.input.trim() || !tc.output.trim())
    )
    if (emptyTestCases) {
      setError('Please fill in all test case inputs and outputs')
      return
    }

    setLoading(true)
    setError('')

    try {
      // 1. Create competition
      const { data: compData, error: compError } = await supabase
        .from('competitions')
        .insert({
          title: formData.title.trim(),
          description: formData.description.trim(),
          subject: formData.subject,
          date: formData.date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          duration_minutes: formData.duration_minutes,
          max_participants: formData.max_participants,
          status: 'upcoming'
        })
        .select()
        .single()

      if (compError) throw compError

      // 2. Create questions with test cases
      const questionData = questions.map((q, i) => ({
        competition_id: compData.id,
        question_number: i + 1,
        title: q.title.trim(),
        description: q.description.trim(),
        difficulty: q.difficulty,
        points: q.points,
        sample_input: q.sample_input || '',
        sample_output: q.sample_output || '',
        test_cases: q.test_cases
      }))

      const { error: qError } = await supabase
        .from('competition_questions')
        .insert(questionData)

      if (qError) throw qError

      alert('✅ Competition created successfully!')
      navigate('/competitions')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const addQuestion = () => {
    if (questions.length < 5) {
      setQuestions([...questions, { 
        title: '', 
        description: '', 
        difficulty: 'Medium', 
        points: 20, 
        sample_input: '', 
        sample_output: '',
        test_cases: [{ input: '', output: '' }]
      }])
    }
  }

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index))
    }
  }

  if (checkingAdmin) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0D0D0F',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #c8a200',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            margin: '0 auto 16px',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ color: '#666' }}>Checking permissions...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0D0D0F',
      color: 'white',
      padding: '24px'
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ color: '#FFD700', fontSize: '28px' }}>🏆 Create Competition</h1>
        <p style={{ color: '#666', marginBottom: '20px' }}>Only admins can create competitions</p>

        {error && (
          <div style={{
            padding: '12px',
            background: 'rgba(255,68,68,0.1)',
            border: '1px solid rgba(255,68,68,0.2)',
            borderRadius: '8px',
            color: '#ff4444',
            margin: '16px 0'
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Basic Details - Same as before */}
          <div style={{ background: 'rgba(13,13,13,0.95)', border: '1px solid #c8a20020', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ color: '#c8a200', marginBottom: '16px' }}>Basic Details</h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: '#888', fontSize: '13px', display: 'block', marginBottom: '4px' }}>Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none'
                }}
                required
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: '#888', fontSize: '13px', display: 'block', marginBottom: '4px' }}>Subject</label>
              <select
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none'
                }}
              >
                <option value="">Select Subject</option>
                <option value="Programming Fundamentals">Programming Fundamentals</option>
                <option value="Object Oriented Programming">Object Oriented Programming</option>
                <option value="Data Structures">Data Structures</option>
                <option value="Algorithms">Algorithms</option>
                <option value="Database Systems">Database Systems</option>
                <option value="Artificial Intelligence">Artificial Intelligence</option>
                <option value="Operating Systems">Operating Systems</option>
                <option value="Computer Networks">Computer Networks</option>
                <option value="Software Engineering">Software Engineering</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: '#888', fontSize: '13px', display: 'block', marginBottom: '4px' }}>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ color: '#888', fontSize: '13px', display: 'block', marginBottom: '4px' }}>Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                  required
                />
              </div>
              <div>
                <label style={{ color: '#888', fontSize: '13px', display: 'block', marginBottom: '4px' }}>Start Time *</label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                  required
                />
              </div>
              <div>
                <label style={{ color: '#888', fontSize: '13px', display: 'block', marginBottom: '4px' }}>End Time *</label>
                <input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ color: '#888', fontSize: '13px', display: 'block', marginBottom: '4px' }}>Duration (min)</label>
                <input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                  min="30"
                  max="180"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
              <div>
                <label style={{ color: '#888', fontSize: '13px', display: 'block', marginBottom: '4px' }}>Max Participants</label>
                <input
                  type="number"
                  value={formData.max_participants}
                  onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) })}
                  min="1"
                  max="200"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Questions Section with Test Cases */}
          <div style={{ background: 'rgba(13,13,13,0.95)', border: '1px solid #c8a20020', borderRadius: '12px', padding: '24px', marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ color: '#c8a200' }}>📝 Questions (max 5)</h3>
              {questions.length < 5 && (
                <button
                  type="button"
                  onClick={addQuestion}
                  style={{
                    padding: '6px 16px',
                    background: 'rgba(200,162,0,0.1)',
                    border: '1px solid #c8a200',
                    borderRadius: '6px',
                    color: '#c8a200',
                    cursor: 'pointer'
                  }}
                >
                  + Add Question
                </button>
              )}
            </div>

            {questions.map((q, qIndex) => (
              <div key={qIndex} style={{
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px',
                background: 'rgba(255,255,255,0.02)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ color: '#c8a200', fontSize: '13px', fontWeight: 'bold' }}>Question {qIndex + 1}</span>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(qIndex)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#ff4444',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      ✕ Remove
                    </button>
                  )}
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <input
                    type="text"
                    value={q.title}
                    onChange={(e) => {
                      const newQuestions = [...questions]
                      newQuestions[qIndex].title = e.target.value
                      setQuestions(newQuestions)
                    }}
                    placeholder="Question Title *"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '6px',
                      color: 'white',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                    required
                  />
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <textarea
                    value={q.description}
                    onChange={(e) => {
                      const newQuestions = [...questions]
                      newQuestions[qIndex].description = e.target.value
                      setQuestions(newQuestions)
                    }}
                    placeholder="Question Description *"
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '6px',
                      color: 'white',
                      fontSize: '13px',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                  <div>
                    <input
                      type="text"
                      value={q.sample_input}
                      onChange={(e) => {
                        const newQuestions = [...questions]
                        newQuestions[qIndex].sample_input = e.target.value
                        setQuestions(newQuestions)
                      }}
                      placeholder="Sample Input"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={q.sample_output}
                      onChange={(e) => {
                        const newQuestions = [...questions]
                        newQuestions[qIndex].sample_output = e.target.value
                        setQuestions(newQuestions)
                      }}
                      placeholder="Sample Output"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                  <div>
                    <select
                      value={q.difficulty}
                      onChange={(e) => {
                        const newQuestions = [...questions]
                        newQuestions[qIndex].difficulty = e.target.value
                        setQuestions(newQuestions)
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                  <div>
                    <input
                      type="number"
                      value={q.points}
                      onChange={(e) => {
                        const newQuestions = [...questions]
                        newQuestions[qIndex].points = parseInt(e.target.value) || 0
                        setQuestions(newQuestions)
                      }}
                      min="5"
                      max="50"
                      placeholder="Points"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div style={{ color: '#888', fontSize: '12px', display: 'flex', alignItems: 'center' }}>
                    {q.test_cases.length} test cases
                  </div>
                </div>

                {/* Test Cases */}
                <div style={{
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: '6px',
                  padding: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ color: '#888', fontSize: '12px', fontWeight: 'bold' }}>🧪 Test Cases</span>
                    <button
                      type="button"
                      onClick={() => addTestCase(qIndex)}
                      style={{
                        padding: '2px 10px',
                        background: 'rgba(200,162,0,0.1)',
                        border: '1px solid rgba(200,162,0,0.3)',
                        borderRadius: '4px',
                        color: '#c8a200',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      + Add Test Case
                    </button>
                  </div>

                  {q.test_cases.map((tc: any, tIndex: number) => (
                    <div key={tIndex} style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr auto',
                      gap: '8px',
                      marginBottom: '6px',
                      alignItems: 'center'
                    }}>
                      <input
                        type="text"
                        value={tc.input}
                        onChange={(e) => updateTestCase(qIndex, tIndex, 'input', e.target.value)}
                        placeholder={`Test ${tIndex + 1} Input`}
                        style={{
                          padding: '6px 10px',
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '4px',
                          color: 'white',
                          fontSize: '12px',
                          outline: 'none'
                        }}
                      />
                      <input
                        type="text"
                        value={tc.output}
                        onChange={(e) => updateTestCase(qIndex, tIndex, 'output', e.target.value)}
                        placeholder={`Test ${tIndex + 1} Output`}
                        style={{
                          padding: '6px 10px',
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '4px',
                          color: 'white',
                          fontSize: '12px',
                          outline: 'none'
                        }}
                      />
                      {q.test_cases.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTestCase(qIndex, tIndex)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ff4444',
                            cursor: 'pointer',
                            fontSize: '14px',
                            padding: '0 6px'
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 32px',
                background: 'linear-gradient(135deg, #c8a200, #FFD700)',
                border: 'none',
                borderRadius: '10px',
                color: '#0a0a0a',
                fontWeight: 'bold',
                fontSize: '16px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1
              }}
            >
              {loading ? 'Creating...' : '🏆 Create Competition'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/competitions')}
              style={{
                padding: '12px 32px',
                background: 'transparent',
                border: '1px solid #333',
                borderRadius: '10px',
                color: '#666',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}