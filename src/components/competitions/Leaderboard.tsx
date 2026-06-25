import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

export const Leaderboard: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [universities, setUniversities] = useState<any[]>([])
  const [userUniversity, setUserUniversity] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'overall' | 'sessions' | 'competitions'>('overall')

  useEffect(() => {
    loadLeaderboard()
    getUserUniversity()
  }, [])

  const getUserUniversity = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('university')
        .eq('id', user.id)
        .single()
      setUserUniversity(profile?.university || '')
    }
  }

  const loadLeaderboard = async () => {
    setLoading(true)
    
    const { data, error } = await supabase
      .from('university_overall_leaderboard')
      .select('*')
      .order('total_points', { ascending: false })

    if (!error && data) {
      setUniversities(data)
    }
    setLoading(false)
  }

  const getMedal = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  if (loading) {
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
          <p style={{ color: '#666' }}>Loading leaderboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0D0D0F',
      color: 'white',
      padding: '24px',
      position: 'relative'
    }}>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: 'radial-gradient(ellipse 70% 45% at 50% -5%, rgba(200,162,0,0.05) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <Link to="/" style={{ color: '#666', textDecoration: 'none', fontSize: '14px' }}>
            ← Back to Dashboard
          </Link>
          <h1 style={{ color: '#FFD700', fontSize: '32px', marginTop: '8px' }}>🏆 University Leaderboard</h1>
          <p style={{ color: '#666' }}>
            See how universities rank based on their total points
          </p>
        </div>

        {/* Stats Summary */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '12px',
          marginBottom: '24px'
        }}>
          <div style={{
            background: 'rgba(13,13,13,0.95)',
            border: '1px solid #c8a20020',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#FFD700' }}>
              {universities.length}
            </div>
            <div style={{ color: '#666', fontSize: '12px' }}>Universities</div>
          </div>
          <div style={{
            background: 'rgba(13,13,13,0.95)',
            border: '1px solid #c8a20020',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#4ade80' }}>
              {universities.reduce((sum, u) => sum + (u.total_members || 0), 0)}
            </div>
            <div style={{ color: '#666', fontSize: '12px' }}>Total Members</div>
          </div>
          <div style={{
            background: 'rgba(13,13,13,0.95)',
            border: '1px solid #c8a20020',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#60a5fa' }}>
              {universities.reduce((sum, u) => sum + (u.total_sessions_created || 0), 0)}
            </div>
            <div style={{ color: '#666', fontSize: '12px' }}>Total Sessions</div>
          </div>
          <div style={{
            background: 'rgba(13,13,13,0.95)',
            border: '1px solid #c8a20020',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#c084fc' }}>
              {universities.reduce((sum, u) => sum + (u.total_competitions_participated || 0), 0)}
            </div>
            <div style={{ color: '#666', fontSize: '12px' }}>Competitions</div>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div style={{
          background: 'rgba(13,13,13,0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid #c8a20020',
          borderRadius: '12px',
          overflow: 'hidden'
        }}>
          {/* Table Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '60px 1fr 80px 80px 80px 100px',
            padding: '14px 20px',
            background: 'rgba(200,162,0,0.05)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            fontSize: '11px',
            color: '#666',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            gap: '8px'
          }}>
            <span>Rank</span>
            <span>University</span>
            <span>Members</span>
            <span>Sessions</span>
            <span>Wins</span>
            <span style={{ textAlign: 'right' }}>Points</span>
          </div>

          {/* Table Rows */}
          {universities.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
              No universities found
            </div>
          ) : (
            universities.map((uni, index) => {
              const isUserUni = uni.name === userUniversity
              return (
                <div
                  key={uni.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '60px 1fr 80px 80px 80px 100px',
                    padding: '12px 20px',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    alignItems: 'center',
                    gap: '8px',
                    background: isUserUni ? 'rgba(200,162,0,0.05)' : 'transparent',
                    transition: 'background 0.2s'
                  }}
                >
                  <div style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: index < 3 ? '#FFD700' : '#888'
                  }}>
                    {getMedal(index + 1)}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{
                      fontWeight: isUserUni ? 'bold' : 'normal',
                      color: isUserUni ? '#FFD700' : 'white'
                    }}>
                      {uni.name}
                    </span>
                    {isUserUni && (
                      <span style={{
                        fontSize: '9px',
                        padding: '1px 8px',
                        background: 'rgba(200,162,0,0.2)',
                        borderRadius: '99px',
                        color: '#c8a200'
                      }}>
                        Your Uni
                      </span>
                    )}
                  </div>
                  <div style={{ color: '#aaa' }}>{uni.total_members || 0}</div>
                  <div style={{ color: '#aaa' }}>{uni.total_sessions_created || 0}</div>
                  <div style={{ color: '#aaa' }}>{uni.competitions_won || 0}</div>
                  <div style={{
                    textAlign: 'right',
                    fontWeight: 'bold',
                    color: '#FFD700',
                    fontSize: '16px'
                  }}>
                    {uni.total_points || 0}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '40px', textAlign: 'center' }}>
          <span style={{ color: '#374151', fontSize: '11px', letterSpacing: '0.06em' }}>
            🏆 Points: Members (5pts) + Sessions Created (10pts) + Sessions Joined (5pts) + Competition Wins (50pts)
          </span>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}