// src/components/auth/AuthCallback.tsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('🔄 Auth callback triggered...')
        
        // Get the session
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('❌ Session error:', error)
          setError(error.message)
          setLoading(false)
          return
        }

        console.log('📡 Session data:', data)

        if (data?.session) {
          console.log('✅ User authenticated:', data.session.user.email)
          
          // Check if user exists in users table
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, full_name, email')
            .eq('id', data.session.user.id)
            .single()

          if (userError && userError.code === 'PGRST116') {
            console.log('📝 New user detected, creating profile...')
            // User doesn't exist in users table - create them
            const { error: insertError } = await supabase
              .from('users')
              .insert({
                id: data.session.user.id,
                full_name: data.session.user.user_metadata?.full_name || 
                          data.session.user.user_metadata?.name || 
                          'User',
                email: data.session.user.email,
                role: 'Player',
                status: 'active',
                avatar_url: data.session.user.user_metadata?.avatar_url || null,
                created_at: new Date().toISOString()
              })

            if (insertError) {
              console.error('❌ Failed to create user:', insertError)
            } else {
              console.log('✅ New user profile created!')
            }
          }

          // ✅ Force redirect to home page
          console.log('🚀 Redirecting to home...')
          window.location.href = '/'
        } else {
          console.log('❌ No session found')
          window.location.href = '/login?error=no_session'
        }
      } catch (err) {
        console.error('❌ Callback error:', err)
        window.location.href = '/login?error=callback_failed'
      } finally {
        setLoading(false)
      }
    }

    handleCallback()
  }, [navigate])

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0D0D0F',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #c8a200',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          margin: '0 auto 16px',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ color: '#666', fontFamily: "'Inter', sans-serif" }}>Completing sign in...</p>
        <p style={{ color: '#444', fontSize: '12px', marginTop: '8px', fontFamily: "'Inter', sans-serif" }}>
          Please wait while we log you in
        </p>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0D0D0F',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        padding: '20px'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
        <h2 style={{ color: '#ff4444', fontSize: '24px', fontFamily: "'Inter', sans-serif" }}>
          Authentication Failed
        </h2>
        <p style={{ color: '#888', fontSize: '14px', fontFamily: "'Inter', sans-serif", textAlign: 'center' }}>
          {error}
        </p>
        <button
          onClick={() => window.location.href = '/login'}
          style={{
            marginTop: '20px',
            padding: '10px 24px',
            background: 'linear-gradient(135deg, #c8a200, #FFD700)',
            border: 'none',
            borderRadius: '8px',
            color: '#0a0a0a',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontFamily: "'Inter', sans-serif"
          }}
        >
          Go to Login
        </button>
      </div>
    )
  }

  return null
}