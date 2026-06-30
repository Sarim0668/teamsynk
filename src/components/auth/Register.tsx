// src/components/auth/Register.tsx
import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { IMAGES } from '../../constants/images'

export const Register: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [tempEmail, setTempEmail] = useState('')

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    sport_interests: '',
    location: '',
    role: 'Player',
    university: ''
  })

  // ─── Check if email already exists ───────────────────────────────────────
  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      const { data } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single()
      
      return !!data
    } catch {
      return false
    }
  }

  // ─── Handle registration ──────────────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
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
      // Check if email already exists
      const exists = await checkEmailExists(formData.email)
      if (exists) {
        setError('❌ This email is already registered. Please login instead.')
        setLoading(false)
        return
      }

      // Create the user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            sport_interests: formData.sport_interests,
            location: formData.location,
            role: formData.role,
            university: formData.university
          },
          emailRedirectTo: window.location.origin + '/login'
        }
      })

      if (authError) {
        throw authError
      }

      if (!authData.user) {
        setError('Registration failed. Please try again.')
        setLoading(false)
        return
      }

      // Store email for display
      setTempEmail(formData.email)
      
      // If user is created but needs email confirmation
      if (authData.user?.identities?.length === 0) {
        // User already exists but not confirmed
        setError('⚠️ This email is already registered but not confirmed. Please check your email.')
        setLoading(false)
        return
      }

      // Try to insert user into users table
      try {
        await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            full_name: formData.full_name,
            email: formData.email,
            sport_interests: formData.sport_interests,
            location: formData.location,
            role: formData.role,
            university: formData.university,
            status: 'active'
          })
      } catch (insertErr) {
        console.error('Insert error (may already exist):', insertErr)
      }

      // Show confirmation message
      setShowConfirmation(true)
      setLoading(false)

    } catch (err: any) {
      console.error('Registration error:', err)
      if (err.message?.includes('already registered')) {
        setError('❌ This email is already registered. Please login instead.')
      } else {
        setError(err.message || 'Registration failed. Please try again.')
      }
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

  // ─── SHOW CONFIRMATION SCREEN ────────────────────────────────────────────
  if (showConfirmation) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        position: 'relative'
      }}>
        <div style={{
          position: 'fixed', inset: 0, zIndex: 0,
          background: 'radial-gradient(ellipse 70% 45% at 50% -5%, rgba(200,162,0,0.05) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          maxWidth: '480px',
          width: '100%',
          background: 'rgba(13,13,20,0.95)',
          border: '1px solid rgba(200,162,0,0.2)',
          borderRadius: '24px',
          padding: '40px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📧</div>
          <h2 style={{ color: '#FFD700', fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' }}>
            Verify Your Email
          </h2>
          
          <p style={{ color: '#aaa', fontSize: '15px', marginBottom: '8px' }}>
            We sent a confirmation link to:
          </p>
          <p style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', marginBottom: '20px' }}>
            {tempEmail}
          </p>

          <div style={{
            background: 'rgba(200,162,0,0.08)',
            border: '1px solid rgba(200,162,0,0.15)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px',
            textAlign: 'left'
          }}>
            <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0, lineHeight: '1.6' }}>
              <strong style={{ color: '#FFD700' }}>📌 Next Steps:</strong>
              <br />
              1. Check your email inbox (and spam folder)
              <br />
              2. Click the <strong style={{ color: '#FFD700' }}>confirmation link</strong> in the email
              <br />
              3. Return here and <strong style={{ color: '#FFD700' }}>Sign In</strong> to your account
            </p>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <Link
              to="/login"
              style={{
                padding: '14px',
                background: 'linear-gradient(to right, #c8a200, #FFD700)',
                border: 'none',
                borderRadius: '10px',
                color: '#0a0a0a',
                fontWeight: 'bold',
                fontSize: '16px',
                textDecoration: 'none',
                display: 'block'
              }}
            >
              Go to Login
            </Link>
            
            <button
              onClick={() => {
                setShowConfirmation(false)
                setError('')
              }}
              style={{
                padding: '12px',
                background: 'transparent',
                border: '1px solid #333',
                borderRadius: '10px',
                color: '#666',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              ← Change Email
            </button>
          </div>

          <div style={{
            marginTop: '16px',
            padding: '8px 12px',
            background: 'rgba(239,68,68,0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(239,68,68,0.2)'
          }}>
            <p style={{ color: '#f87171', fontSize: '12px', margin: 0 }}>
              ⚠️ Check your spam folder if you don't see the email
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ─── MAIN REGISTRATION FORM ──────────────────────────────────────────────
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

        <form onSubmit={handleRegister} style={{
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
              University
            </label>
            <select
              value={formData.university}
              onChange={(e) => setFormData({ ...formData, university: e.target.value })}
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
              <option value="">Select your university</option>
              {['FAST University', 'NUST', 'IIUI', 'Bahria University', 'Air University', 'COMSATS', 'GIKI', 'LUMS', 'Other'].map(uni => (
                <option key={uni} value={uni}>{uni}</option>
              ))}
            </select>
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
              cursor: 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Creating account...' : '📧 Create Account'}
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