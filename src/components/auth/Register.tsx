import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { IMAGES } from '../../constants/images'

export const Register: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    sport_interests: '',
    location: '',
    role: 'Player'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    // Validation
    if (!formData.full_name || !formData.email || !formData.password) {
      setError('Please fill in all required fields')
      setLoading(false)
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      console.log('Registering user:', formData.email)

      // 1. Sign up the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            sport_interests: formData.sport_interests,
            location: formData.location,
            role: formData.role
          }
        }
      })

      if (authError) {
        console.error('Auth error:', authError)
        throw authError
      }

      if (!authData.user) {
        setError('Registration failed. Please try again.')
        setLoading(false)
        return
      }

      console.log('Auth user created:', authData.user.id)

      // 2. Manually insert into users table (in case trigger doesn't work)
      try {
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            full_name: formData.full_name,
            email: formData.email,
            sport_interests: formData.sport_interests,
            location: formData.location,
            role: formData.role,
            status: 'active'
          })

        if (insertError) {
          console.error('Insert error (might be okay if trigger worked):', insertError)
          // If error is duplicate, it's fine (trigger already created it)
          if (!insertError.message.includes('duplicate')) {
            throw insertError
          }
        }
      } catch (insertErr: any) {
        console.error('Manual insert failed:', insertErr)
        // Don't throw, the user might still exist from trigger
      }

      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)

    } catch (err: any) {
      console.error('Registration error:', err)
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
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
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
          <h1 style={{ color: '#52c07a', fontSize: '28px' }}>Account Created!</h1>
          <p style={{ color: '#888' }}>Your account has been created successfully.</p>
          <p style={{ color: '#666', fontSize: '14px', marginTop: '8px' }}>Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
  minHeight: '100vh',
  background: `url(${IMAGES.loginBg}) center/cover no-repeat`,
  backgroundColor: '#0a0a0a',
  color: 'white',
  padding: '24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative'
}}>
  {/* Dark Overlay */}
  <div style={{
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.7)',
    zIndex: 0
  }} />

  <div style={{
    maxWidth: '500px',
    width: '100%',
    position: 'relative',
    zIndex: 1
  }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ color: '#FFD700', fontSize: '32px', fontWeight: 'bold' }}>TEAMSYNK</h1>
          <p style={{ color: '#666' }}>Create your account</p>
        </div>

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
              Full Name *
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Enter your full name"
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
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="your@email.com"
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
              Password (min 8 chars) *
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
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
              Confirm Password *
            </label>
            <input
              type="password"
              value={formData.confirm_password}
              onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
              placeholder="••••••••"
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
              Sport Interest
            </label>
            <select
              value={formData.sport_interests}
              onChange={(e) => setFormData({ ...formData, sport_interests: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '8px',
                color: 'white',
                fontSize: '16px'
              }}
            >
              <option value="">Select your sport</option>
              {['Football', 'Basketball', 'Cricket', 'Tennis', 'Badminton', 'Volleyball', 'Swimming', 'Running', 'Cycling', 'Hockey', 'Other'].map(sport => (
                <option key={sport} value={sport}>{sport}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: '#aaa', fontSize: '14px', display: 'block', marginBottom: '6px' }}>
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="City, Country"
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
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '8px',
                color: 'white',
                fontSize: '16px'
              }}
            >
              <option value="Player">Player</option>
              <option value="Coach">Coach</option>
              <option value="Organizer">Organizer</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(to right, #c8a200, #FFD700)',
              border: 'none',
              borderRadius: '8px',
              color: '#0a0a0a',
              fontWeight: 'bold',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: '#666', marginTop: '20px' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#c8a200', textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}