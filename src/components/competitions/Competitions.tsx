import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

export const Competitions: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [competitions, setCompetitions] = useState<any[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkUserAndLoad()
  }, [])

  const checkUserAndLoad = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    setUser(currentUser)
    
    if (currentUser) {
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', currentUser.id)
        .single()
      setIsAdmin(profile?.role === 'Admin')
    }
    
    await loadCompetitions()
  }

  const loadCompetitions = async () => {
    setLoading(true)
    
    const { data, error } = await supabase
      .from('competitions')
      .select(`
        *,
        competition_participants(count),
        university_groups(name, short_name)
      `)
      .order('start_date', { ascending: true })

    if (!error && data) {
      setCompetitions(data)
    }
    setLoading(false)
  }

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return { label: '🟢 Active', color: '#4ade80', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)' }
    } else if (status === 'upcoming') {
      return { label: '🟡 Upcoming', color: '#c8a200', bg: 'rgba(200,162,0,0.1)', border: 'rgba(200,162,0,0.3)' }
    }
    return { label: '⚪ Completed', color: '#6b7280', bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.3)' }
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
          <p style={{ color: '#666' }}>Loading competitions...</p>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <Link to="/" style={{ color: '#666', textDecoration: 'none', fontSize: '14px' }}>
              ← Back to Dashboard
            </Link>
            <h1 style={{ color: '#FFD700', fontSize: '32px', marginTop: '8px' }}>🏟️ Competitions</h1>
            <p style={{ color: '#666' }}>Participate and win trophies for your university</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => navigate('/create-competition')}
              style={{
                padding: '10px 24px',
                background: 'linear-gradient(135deg, #c8a200, #FFD700)',
                border: 'none',
                borderRadius: '10px',
                color: '#0a0a0a',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              ➕ Create Competition
            </button>
          )}
        </div>

        {/* Competition List */}
        {competitions.length === 0 ? (
          <div style={{
            background: 'rgba(13,13,13,0.95)',
            border: '1px solid #c8a20020',
            borderRadius: '12px',
            padding: '60px 20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏆</div>
            <h3 style={{ color: '#666', fontSize: '20px' }}>No competitions yet</h3>
            <p style={{ color: '#444' }}>Check back later or create a new competition</p>
            {isAdmin && (
              <button
                onClick={() => navigate('/create-competition')}
                style={{
                  marginTop: '16px',
                  padding: '10px 24px',
                  background: 'linear-gradient(135deg, #c8a200, #FFD700)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#0a0a0a',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                ➕ Create First Competition
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {competitions.map((comp) => {
              const status = getStatusBadge(comp.status)
              const participantCount = comp.competition_participants?.[0]?.count || 0
              const typeLabel = comp.competition_type === 'inter_university' ? '🌍 Inter-University' : '🏠 Internal'
              
              return (
                <div
                  key={comp.id}
                  style={{
                    background: 'rgba(13,13,13,0.95)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid #c8a20020',
                    borderRadius: '12px',
                    padding: '20px 24px',
                    transition: 'all 0.3s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#c8a200'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(200,162,0,0.125)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h3 style={{ color: 'white', fontSize: '18px', margin: 0 }}>
                          {comp.title}
                        </h3>
                        <span style={{
                          padding: '2px 10px',
                          borderRadius: '99px',
                          background: status.bg,
                          border: `1px solid ${status.border}`,
                          color: status.color,
                          fontSize: '11px',
                          fontWeight: 'bold'
                        }}>
                          {status.label}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '16px', marginTop: '6px', flexWrap: 'wrap' }}>
                        <span style={{ color: '#888', fontSize: '13px' }}>
                          ⚽ {comp.sport_type || 'Sports'}
                        </span>
                        <span style={{ color: '#888', fontSize: '13px' }}>
                          {typeLabel}
                        </span>
                        {comp.university_groups && (
                          <span style={{ color: '#888', fontSize: '13px' }}>
                            🏛️ {comp.university_groups.name}
                          </span>
                        )}
                        <span style={{ color: '#888', fontSize: '13px' }}>
                          📅 {new Date(comp.start_date).toLocaleDateString()}
                        </span>
                        <span style={{ color: '#888', fontSize: '13px' }}>
                          👥 {participantCount} participants
                        </span>
                        {comp.prize && (
                          <span style={{ color: '#FFD700', fontSize: '13px' }}>
                            🏆 {comp.prize}
                          </span>
                        )}
                      </div>
                    </div>
                    <Link
                      to={`/competition/${comp.id}`}
                      style={{
                        padding: '8px 20px',
                        background: 'rgba(200,162,0,0.1)',
                        border: '1px solid rgba(200,162,0,0.3)',
                        borderRadius: '8px',
                        color: '#c8a200',
                        textDecoration: 'none',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: '40px', textAlign: 'center' }}>
          <span style={{ color: '#374151', fontSize: '11px', letterSpacing: '0.06em' }}>
            🏆 Compete. Win. Represent your university.
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