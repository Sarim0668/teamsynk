import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { IMAGES } from '../../constants/images'

export const Login: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)
  setError('')

  try {
    // 1. First, try to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error

    if (data.user) {
      // 2. Check if user is suspended
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('status')
        .eq('id', data.user.id)
        .single()

      if (profileError) throw profileError

      // 3. If user is suspended, sign them out and show error
      if (profile?.status === 'suspended') {
        await supabase.auth.signOut()
        setError('⚠️ Your account has been suspended. Please contact support.')
        setLoading(false)
        return
      }

      // 4. User is active, proceed
      window.location.href = '/'
    }
  } catch (err: any) {
    setError(err.message || 'Login failed')
  } finally {
    setLoading(false)
  }
}

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `url(${IMAGES.loginBg}) center/cover no-repeat`,
      backgroundColor: '#0a0a0a',
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
        background: '#0d0d0d',
        border: '1px solid #c8a200',
        borderRadius: '16px',
        padding: '40px',
        maxWidth: '400px',
        width: '100%',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <img 
            src={IMAGES.logo} 
            alt="TeamSynk Logo" 
            style={{ 
              height: '80px', 
              objectFit: 'contain',
              marginBottom: '10px'
            }}
          />
          <p style={{ color: '#666' }}>LINK. CONNECT. PLAY.</p>
        </div>

        {error && (
          <div style={{
            background: '#ff444433',
            color: '#ff4444',
            padding: '10px',
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: '#aaa', fontSize: '14px', display: 'block', marginBottom: '6px' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '8px',
                color: 'white',
                fontSize: '16px'
              }}
              placeholder="your@email.com"
              required
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ color: '#aaa', fontSize: '14px', display: 'block', marginBottom: '6px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '8px',
                color: 'white',
                fontSize: '16px'
              }}
              placeholder="••••••••"
              required
            />
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
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: '#666', marginTop: '20px' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#c8a200', textDecoration: 'none' }}>
            Register here
          </Link>
        </p>
      </div>
    </div>
  )
}