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
  const [storedOTP, setStoredOTP] = useState('')

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

  // ─── Generate random 6-digit OTP ──────────────────────────────────────────
  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  // ─── Send OTP via EmailJS (Free) ──────────────────────────────────────────
  const sendOTPEmail = async (email: string, otpCode: string, name: string) => {
    try {
      // Option 1: Use EmailJS (Free - 200 emails/month)
      // Sign up at https://www.emailjs.com/
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: 'YOUR_SERVICE_ID',
          template_id: 'YOUR_TEMPLATE_ID',
          user_id: 'YOUR_USER_ID',
          template_params: {
            to_email: email,
            otp: otpCode,
            user_name: name,
            app_name: 'TeamSynk'
          }
        })
      })
      
      if (!response.ok) throw new Error('Email sending failed')
      return true
    } catch (error) {
      console.error('Error sending OTP:', error)
      
      // Fallback: Show OTP in console for testing
      console.log('📧 ===== OTP CODE (TESTING) =====')
      console.log(`📧 OTP for ${email}: ${otpCode}`)
      console.log('📧 ================================')
      
      // Show alert with OTP for testing
      alert(`⚠️ Email sending failed. For testing, your OTP is: ${otpCode}\n\nIn production, this will be sent to your email.`)
      
      return false
    }
  }

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

      // Generate OTP
      const otpCode = generateOTP()
      setTempEmail(formData.email)
      setStoredOTP(otpCode)

      // Send OTP via email
      await sendOTPEmail(formData.email, otpCode, formData.full_name)

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

      setLoading(false)

    } catch (err: any) {
      console.error('Registration error:', err)
      setError(err.message || 'Registration failed. Please try again.')
      setLoading(false)
    }
  }

  // ─── Verify OTP and create account ──────────────────────────────────────
  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 6) {
      setError('Please enter the 6-digit code')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Verify OTP
      if (otp !== storedOTP) {
        setError('❌ Invalid code. Please try again.')
        setLoading(false)
        return
      }

      // ✅ OTP Verified - Create the account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: tempEmail,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            sport_interests: formData.sport_interests,
            location: formData.location,
            role: formData.role,
            university: formData.university
          },
          // IMPORTANT: Set this to false to avoid email confirmation
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

      // Insert into users table
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
      const otpCode = generateOTP()
      setStoredOTP(otpCode)
      
      await sendOTPEmail(tempEmail, otpCode, formData.full_name)

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

  // ─── SHOW OTP SCREEN ──────────────────────────────────────────────────────
  if (showOTP) {
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
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
          <h2 style={{ color: '#FFD700', fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
            Enter Verification Code
          </h2>
          
          <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '20px' }}>
            We sent a 6-digit code to <strong style={{ color: 'white' }}>{tempEmail}</strong>
          </p>

          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            autoFocus
            style={{
              width: '100%',
              padding: '16px',
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '12px',
              color: 'white',
              fontSize: '28px',
              textAlign: 'center',
              letterSpacing: '10px',
              fontWeight: 'bold',
              marginBottom: '20px',
              outline: 'none',
              transition: 'border-color 0.3s'
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#c8a200'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#333'}
          />

          <button
            onClick={handleVerifyOTP}
            disabled={loading || otp.length < 6}
            style={{
              width: '100%',
              padding: '14px',
              background: otp.length < 6 ? 'rgba(200,162,0,0.3)' : 'linear-gradient(to right, #c8a200, #FFD700)',
              border: 'none',
              borderRadius: '10px',
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

          {error && (
            <div style={{
              marginTop: '12px',
              padding: '10px',
              background: '#ff444433',
              borderRadius: '8px',
              color: '#ff4444',
              fontSize: '13px'
            }}>
              ⚠️ {error}
            </div>
          )}

          <p style={{
            color: '#374151',
            fontSize: '11px',
            marginTop: '16px'
          }}>
            🔐 Check your email spam folder if you don't see the code
          </p>

          {/* Debug: Show OTP in UI for testing (remove in production) */}
          <div style={{
            marginTop: '12px',
            padding: '8px',
            background: 'rgba(200,162,0,0.1)',
            borderRadius: '6px',
            border: '1px dashed rgba(200,162,0,0.3)'
          }}>
            <p style={{ color: '#666', fontSize: '11px', margin: 0 }}>
              🔧 Test OTP: <strong style={{ color: '#c8a200', fontSize: '16px' }}>{storedOTP}</strong>
              <br />
              <span style={{ color: '#444', fontSize: '10px' }}>(Remove this in production)</span>
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
            {loading ? 'Sending code...' : '📧 Create Account'}
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