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
  const [showOTP, setShowOTP] = useState(false)
  const [otp, setOtp] = useState('')
  const [resendTimer, setResendTimer] = useState(0)
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
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single()
      
      return !!data
    } catch {
      return false
    }
  }

  // ─── Handle initial registration ─────────────────────────────────────────
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
      // Check if email already exists in users table
      const exists = await checkEmailExists(formData.email)
      if (exists) {
        setError('❌ This email is already registered. Please login instead.')
        setLoading(false)
        return
      }

      // ✅ STEP 1: Create the user account with email confirmation disabled
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

      // ✅ STEP 2: Store email for OTP verification
      setTempEmail(formData.email)
      
      // ✅ STEP 3: Send OTP for verification
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: formData.email,
        options: {
          shouldCreateUser: false,
        }
      })

      if (otpError) {
        // If OTP fails, the user is created but not verified
        console.error('OTP error:', otpError)
        // Try to insert user manually anyway
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
          console.error('Insert error:', insertErr)
        }
        setSuccess(true)
        setTimeout(() => navigate('/login'), 2000)
        setLoading(false)
        return
      }

      // Show OTP screen
      setShowOTP(true)
      setResendTimer(60)
      
      const interval = setInterval(() => {
        setResendTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      setError('')
      setLoading(false)

    } catch (err: any) {
      console.error('Registration error:', err)
      // Check if it's a duplicate email error from auth
      if (err.message?.includes('already registered')) {
        setError('❌ This email is already registered. Please login instead.')
      } else {
        setError(err.message || 'Registration failed. Please try again.')
      }
      setLoading(false)
    }
  }

  // ─── Verify OTP and complete registration ──────────────────────────────
  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 6) {
      setError('Please enter the 6-digit code')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Verify OTP
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: tempEmail,
        token: otp,
        type: 'email',
      })

      if (verifyError) {
        // If verification fails, the user might still be created
        console.error('OTP verification error:', verifyError)
        setError('Invalid or expired code. Please try again or check your email.')
        setLoading(false)
        return
      }

      // ✅ OTP verified - now get the user and create profile if not exists
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Check if user already has a profile
        const { data: existingProfile } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single()

        if (!existingProfile) {
          // Create profile
          await supabase
            .from('users')
            .insert({
              id: user.id,
              full_name: formData.full_name,
              email: formData.email,
              sport_interests: formData.sport_interests,
              location: formData.location,
              role: formData.role,
              university: formData.university,
              status: 'active'
            })
        }
      }

      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)

    } catch (err: any) {
      console.error('OTP verification error:', err)
      setError(err.message || 'Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ─── Resend OTP ──────────────────────────────────────────────────────────
  const handleResendOTP = async () => {
    if (resendTimer > 0) return

    setLoading(true)
    setError('')

    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: formData.email,
        options: {
          shouldCreateUser: false,
        }
      })

      if (otpError) {
        throw otpError
      }

      setResendTimer(60)
      const interval = setInterval(() => {
        setResendTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      setError('')
    } catch (err: any) {
      setError(err.message || 'Failed to resend code')
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
          <p style={{ color: '#666' }}>
            {!showOTP ? 'Create your account' : 'Verify your email'}
          </p>
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

        {/* ─── REGISTRATION FORM ─── */}
        {!showOTP ? (
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
        ) : (
          // ─── OTP VERIFICATION ───
          <div style={{
            background: '#0d0d0d',
            border: '1px solid #c8a20020',
            borderRadius: '16px',
            padding: '32px 24px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
            <h2 style={{ color: '#FFD700', marginBottom: '8px' }}>Verify Your Email</h2>
            <p style={{ color: '#888', fontSize: '14px', marginBottom: '20px' }}>
              We sent a 6-digit code to <strong style={{ color: 'white' }}>{tempEmail}</strong>
            </p>

            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              style={{
                width: '100%',
                padding: '14px',
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '8px',
                color: 'white',
                fontSize: '24px',
                textAlign: 'center',
                letterSpacing: '8px',
                fontWeight: 'bold',
                marginBottom: '20px'
              }}
            />

            <button
              onClick={handleVerifyOTP}
              disabled={loading || otp.length < 6}
              style={{
                width: '100%',
                padding: '14px',
                background: otp.length < 6 ? 'rgba(200,162,0,0.3)' : 'linear-gradient(to right, #c8a200, #FFD700)',
                border: 'none',
                borderRadius: '8px',
                color: otp.length < 6 ? '#666' : '#0a0a0a',
                fontWeight: 'bold',
                fontSize: '16px',
                cursor: otp.length < 6 ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Verifying...' : '✅ Verify & Create Account'}
            </button>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '16px'
            }}>
              <button
                onClick={handleResendOTP}
                disabled={resendTimer > 0}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: resendTimer > 0 ? '#444' : '#c8a200',
                  fontSize: '13px',
                  cursor: resendTimer > 0 ? 'not-allowed' : 'pointer'
                }}
              >
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
              </button>
              <button
                onClick={() => {
                  setShowOTP(false)
                  setOtp('')
                  setError('')
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#666',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                ← Change Email
              </button>
            </div>

            <p style={{
              color: '#374151',
              fontSize: '11px',
              marginTop: '16px'
            }}>
              🔐 Check your email spam folder if you don't see the code
            </p>
          </div>
        )}

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