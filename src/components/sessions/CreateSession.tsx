// src/components/sessions/CreateSession.tsx
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
    current_participants: 1, // ← NEW: Current players already have
    description: '',
    whatsapp_link: ''
  })

  // ─── SPORT TYPES WITH ICONS ──────────────────────────────────────────────
  const sportTypes = [
    // ─── Sports ──────────────────────────────────────────────────────────────
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
    { value: 'Table Tennis', icon: '🏓' },
    // ─── Group Games ────────────────────────────────────────────────────────
    { value: 'Group Games', icon: '🎯' },
    { value: 'Board Games', icon: '🎲' },
    { value: 'Card Games', icon: '🃏' },
    { value: 'Escape Room', icon: '🔐' },
    { value: 'Treasure Hunt', icon: '🗺️' },
    { value: 'Team Building', icon: '🤝' },
    { value: 'Quiz Competition', icon: '🧠' },
    { value: 'Debate', icon: '🎤' },
    { value: 'Drama / Skit', icon: '🎭' },
    { value: 'Photography Walk', icon: '📸' },
    // ─── Study / Clubs ──────────────────────────────────────────────────────
    { value: 'Study Group', icon: '📚' },
    { value: 'Coding Club', icon: '💻' },
    { value: 'Book Club', icon: '📖' },
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

    if (formData.current_participants < 1 || formData.current_participants > formData.max_participants) {
      setError(`Current players must be between 1 and ${formData.max_participants}`)
      setLoading(false)
      return
    }

    try {
      // Create the session
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

      // ─── Add current participants (including creator) ───────────────────
      // First, add the creator
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

      // ─── If there are additional players to add ─────────────────────────
      // Note: In a real scenario, you'd add other players by their user IDs
      // For now, we'll just add the creator and show the current count
      // The actual participant count will be tracked in the session_participants table

      console.log('✅ Session created!')
      console.log(`📊 Current players: ${formData.current_participants}/${formData.max_participants}`)
      
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
          <p style={{ color: '#888', fontSize: '13px', marginTop: '4px' }}>
            📊 {formData.current_participants} / {formData.max_participants} players
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
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 0
      }} />
      
      <div style={{ 
        maxWidth: '600px', 
        margin: '0 auto', 
        position: 'relative', 
        zIndex: 1 
      }}>
        <h1 style={{ color: '#FFD700', fontSize: '28px', marginBottom: '8px' }}>🏃 Create Session</h1>
        <p style={{ color: '#666', marginBottom: '24px' }}>
          Organise a sports session, group game, or study group for others to join
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
              <optgroup label="⚽ Sports">
                {sportTypes.filter(s => ['Football', 'Basketball', 'Cricket', 'Tennis', 'Badminton', 'Volleyball', 'Swimming', 'Running', 'Cycling', 'Hockey', 'Table Tennis'].includes(s.value)).map(sport => (
                  <option key={sport.value} value={sport.value}>
                    {sport.icon} {sport.value}
                  </option>
                ))}
              </optgroup>
              <optgroup label="🎯 Group Games">
                {sportTypes.filter(s => ['Group Games', 'Board Games', 'Card Games', 'Escape Room', 'Treasure Hunt', 'Team Building', 'Quiz Competition', 'Debate', 'Drama / Skit', 'Photography Walk'].includes(s.value)).map(sport => (
                  <option key={sport.value} value={sport.value}>
                    {sport.icon} {sport.value}
                  </option>
                ))}
              </optgroup>
              <optgroup label="📚 Study / Clubs">
                {sportTypes.filter(s => ['Study Group', 'Coding Club', 'Book Club'].includes(s.value)).map(sport => (
                  <option key={sport.value} value={sport.value}>
                    {sport.icon} {sport.value}
                  </option>
                ))}
              </optgroup>
              <optgroup label="🎯 Other">
                {sportTypes.filter(s => s.value === 'Other').map(sport => (
                  <option key={sport.value} value={sport.value}>
                    {sport.icon} {sport.value}
                  </option>
                ))}
              </optgroup>
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
              placeholder="e.g. City Sports Complex, Room 301"
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

          {/* ─── PLAYER COUNT SECTION ─── */}
          <div style={{
            background: 'rgba(200,162,0,0.05)',
            border: '1px solid rgba(200,162,0,0.15)',
            borderRadius: '10px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '18px' }}>👥</span>
              <span style={{ color: '#FFD700', fontSize: '14px', fontWeight: 'bold' }}>
                Player Count
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ color: '#aaa', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                  Total Players *
                </label>
                <input
                  type="number"
                  value={formData.max_participants}
                  onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) || 10 })}
                  min="2"
                  max="50"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '16px'
                  }}
                  required
                />
              </div>
              <div>
                <label style={{ color: '#aaa', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                  Already Have (including you) *
                </label>
                <input
                  type="number"
                  value={formData.current_participants}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1
                    if (val <= formData.max_participants) {
                      setFormData({ ...formData, current_participants: val })
                    }
                  }}
                  min="1"
                  max={formData.max_participants}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '16px'
                  }}
                  required
                />
              </div>
            </div>

            {/* ─── Progress bar ─── */}
            <div style={{ marginTop: '10px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                color: '#6b7280',
                fontSize: '12px',
                marginBottom: '4px'
              }}>
                <span>{formData.current_participants} players have joined</span>
                <span>{formData.max_participants - formData.current_participants} spots left</span>
              </div>
              <div style={{
                height: '4px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '99px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${(formData.current_participants / formData.max_participants) * 100}%`,
                  background: (formData.current_participants / formData.max_participants) >= 0.9 
                    ? '#ef4444' 
                    : (formData.current_participants / formData.max_participants) >= 0.7 
                      ? '#f97316' 
                      : '#4ade80',
                  borderRadius: '99px',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>

            <div style={{ color: '#4b5563', fontSize: '11px', marginTop: '8px' }}>
              💡 You will be automatically added as a participant
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
              placeholder="Describe the session, what to bring, skill level..."
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