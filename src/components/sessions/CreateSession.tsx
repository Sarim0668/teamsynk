import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { IMAGES } from '../../constants/images'

export const CreateSession: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)

  const [formData, setFormData] = useState({
    sport_type: '',
    session_date: '',
    session_time: '',
    location: '',
    max_participants: 10,
    description: '',
    whatsapp_link: ''
  })

  // ─── SPORT TYPES WITH ICONS ──────────────────────────────────────────────
  const sportTypes = [
    { value: 'Football', icon: '⚽' },
    { value: 'Basketball', icon: '🏀' },
    { value: 'Cricket', icon: '🏏' },
    { value: 'Tennis', icon: '🎾' },
    { value: 'Badminton', icon: '🏸' },
    { value: 'Volleyball', icon: '🏐' },
    { value: 'Swimming', icon: '🏊' },
    { value: 'Running', icon: '🏃' },
    { value: 'Cycling', icon: '🚴' },
    { value: 'Hockey', icon: '🏑' },
    { value: 'Table Tennis', icon: '🏓' },  // ← ADDED
    { value: 'Study Group', icon: '📚' },    // ← ADDED
    { value: 'Other', icon: '🎯' },
  ]

  useEffect(() => {
    getCurrentUser()
  }, [])

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserId(user.id)
      
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
      setUserProfile(profile)
    } else {
      setError('Please login first')
      setTimeout(() => navigate('/login'), 1500)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!userId) {
      setError('Please login first')
      setLoading(false)
      return
    }

    if (!formData.sport_type || !formData.session_date || !formData.session_time || !formData.location) {
      setError('Please fill in all required fields')
      setLoading(false)
      return
    }

    if (formData.max_participants < 2 || formData.max_participants > 50) {
      setError('Max participants must be between 2 and 50')
      setLoading(false)
      return
    }

    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('sports_sessions')
        .insert({
          created_by: userId,
          sport_type: formData.sport_type,
          session_date: formData.session_date,
          session_time: formData.session_time,
          location: formData.location,
          max_participants: formData.max_participants,
          description: formData.description || '',
          whatsapp_link: formData.whatsapp_link || '',
          status: 'Upcoming'
        })
        .select()

      if (sessionError) throw sessionError

      const newSession = sessionData?.[0]
      if (!newSession) {
        throw new Error('Failed to create session')
      }

      const { error: joinError } = await supabase
        .from('session_participants')
        .insert({
          session_id: newSession.id,
          user_id: userId
        })

      if (joinError) {
        console.error('Failed to auto-join creator:', joinError)
        setError('⚠️ Session created but you were not added as participant. Please join manually.')
        setLoading(false)
        return
      }

      console.log('✅ Session created and creator auto-joined!')
      setSuccess(true)
      setTimeout(() => navigate('/browse-sessions'), 1500)
      
    } catch (err: any) {
      console.error('Error details:', err)
      setError(err.message || 'Failed to create session')
    } finally {
      setLoading(false)
    }
  }

  if (!userId) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#FFD700' }}>Please login first</h2>
          <p style={{ color: '#666' }}>Redirecting to login...</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
          <h1 style={{ color: '#52c07a', fontSize: '28px' }}>Session Created!</h1>
          <p style={{ color: '#888' }}>Your session has been created successfully.</p>
          <p style={{ color: '#52c07a', fontSize: '14px', marginTop: '8px' }}>
            👑 You have been added as the first participant!
          </p>
          <p style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: `url(${IMAGES.createSessionBg}) center/cover no-repeat`,
      backgroundColor: '#0a0a0a',
      color: 'white',
      padding: '24px',
      position: 'relative'
    }}>
      {/* Dark Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 0
      }} />
      
      {/* CONTENT - MUST HAVE position: relative AND zIndex: 1 */}
      <div style={{ 
        maxWidth: '600px', 
        margin: '0 auto', 
        position: 'relative', 
        zIndex: 1 
      }}>
        <h1 style={{ color: '#FFD700', fontSize: '28px', marginBottom: '8px' }}>🏃 Create Session</h1>
        <p style={{ color: '#666', marginBottom: '24px' }}>
          Organise a sports session or study group for others to join 
          <span style={{ color: '#52c07a', display: 'block', fontSize: '13px', marginTop: '4px' }}>
            👑 You will automatically be added as the first participant
          </span>
        </p>

        {error && (
          <div style={{
            background: '#ff444433',
            color: '#ff4444',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{
          background: '#0d0d0d',
          border: '1px solid #c8a20020',
          borderRadius: '16px',
          padding: '24px'
        }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: '#aaa', fontSize: '14px', display: 'block', marginBottom: '6px' }}>
              Sport / Activity *
            </label>
            <select
              value={formData.sport_type}
              onChange={(e) => setFormData({ ...formData, sport_type: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '8px',
                color: 'white',
                fontSize: '16px'
              }}
              required
            >
              <option value="">Select a sport or activity</option>
              {sportTypes.map((sport) => (
                <option key={sport.value} value={sport.value}>
                  {sport.icon} {sport.value}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: '#aaa', fontSize: '14px', display: 'block', marginBottom: '6px' }}>
              Date *
            </label>
            <input
              type="date"
              value={formData.session_date}
              onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              style={{
                width: '100%',
                padding: '12px',
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '8px',
                color: 'white',
                fontSize: '16px'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: '#aaa', fontSize: '14px', display: 'block', marginBottom: '6px' }}>
              Time *
            </label>
            <input
              type="time"
              value={formData.session_time}
              onChange={(e) => setFormData({ ...formData, session_time: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '8px',
                color: 'white',
                fontSize: '16px'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: '#aaa', fontSize: '14px', display: 'block', marginBottom: '6px' }}>
              Location *
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. City Sports Complex"
              style={{
                width: '100%',
                padding: '12px',
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '8px',
                color: 'white',
                fontSize: '16px'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: '#aaa', fontSize: '14px', display: 'block', marginBottom: '6px' }}>
              Max Participants (2-50) *
            </label>
            <input
              type="number"
              value={formData.max_participants}
              onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) || 10 })}
              min="2"
              max="50"
              style={{
                width: '100%',
                padding: '12px',
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '8px',
                color: 'white',
                fontSize: '16px'
              }}
              required
            />
            <div style={{ color: '#555', fontSize: '12px', marginTop: '4px' }}>
              👑 You will take 1 slot automatically
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: '#aaa', fontSize: '14px', display: 'block', marginBottom: '6px' }}>
              WhatsApp Group Link
            </label>
            <input
              type="url"
              value={formData.whatsapp_link}
              onChange={(e) => setFormData({ ...formData, whatsapp_link: e.target.value })}
              placeholder="https://chat.whatsapp.com/..."
              style={{
                width: '100%',
                padding: '12px',
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '8px',
                color: 'white',
                fontSize: '16px'
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ color: '#aaa', fontSize: '14px', display: 'block', marginBottom: '6px' }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the session, skill level, what to bring..."
              rows={3}
              style={{
                width: '100%',
                padding: '12px',
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '8px',
                color: 'white',
                fontSize: '16px',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={() => navigate('/')}
              style={{
                padding: '12px 24px',
                background: 'transparent',
                border: '1px solid #333',
                borderRadius: '8px',
                color: '#666',
                cursor: 'pointer',
                fontSize: '16px',
                flex: 1
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(to right, #c8a200, #FFD700)',
                border: 'none',
                borderRadius: '8px',
                color: '#0a0a0a',
                fontWeight: 'bold',
                fontSize: '16px',
                cursor: 'pointer',
                flex: 2
              }}
            >
              {loading ? 'Creating...' : '🚀 Create Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}