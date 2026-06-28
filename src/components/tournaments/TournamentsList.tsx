// src/components/tournaments/TournamentsList.tsx
import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

interface Tournament {
  id: string
  name: string
  sport_type: string
  description: string
  start_date: string
  end_date: string
  venue: string
  status: string
  created_by: string
  max_teams: number
  teams_per_group: number
  created_at: string
  creator_name?: string
}

export const TournamentsList: React.FC = () => {
  const navigate = useNavigate()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    setUser(currentUser)

    const { data, error } = await supabase
      .from('tournaments')
      .select(`
        *,
        creator:users!created_by(full_name)
      `)
      .order('created_at', { ascending: false })

    if (!error && data) {
      const tournamentsWithCreator = data.map((t: any) => ({
        ...t,
        creator_name: t.creator?.full_name || 'Unknown'
      }))
      setTournaments(tournamentsWithCreator)
    }

    setLoading(false)
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; color: string; label: string }> = {
      active: { bg: 'rgba(34,197,94,0.12)', color: '#4ade80', label: '🟢 Active' },
      upcoming: { bg: 'rgba(200,162,0,0.12)', color: '#c8a200', label: '🟡 Upcoming' },
      completed: { bg: 'rgba(107,114,128,0.12)', color: '#6b7280', label: '⚪ Completed' },
      draft: { bg: 'rgba(96,165,250,0.12)', color: '#60a5fa', label: '🔵 Draft' },
    }
    const s = styles[status] || styles.upcoming
    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '99px',
        background: s.bg,
        color: s.color,
        fontSize: '11px',
        fontWeight: '600'
      }}>
        {s.label}
      </span>
    )
  }

  const handleDeleteTournament = async (tournamentId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!window.confirm('⚠️ Are you sure you want to delete this tournament? All data will be lost!')) return

    // Delete all related data (cascade will handle it)
    const { error } = await supabase
      .from('tournaments')
      .delete()
      .eq('id', tournamentId)

    if (error) {
      alert('Failed to delete tournament: ' + error.message)
    } else {
      await loadData()
    }
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
          <p style={{ color: '#666' }}>Loading tournaments...</p>
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
        {/* ─── Header ─── */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '8px'
        }}>
          <div>
            <h1 style={{ color: '#FFD700', fontSize: '32px' }}>🏆 Tournaments</h1>
            <p style={{ color: '#6b7280' }}>Browse upcoming tournaments or create your own</p>
          </div>
          <Link
            to="/create-tournament"
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #c8a200, #FFD700)',
              border: 'none',
              borderRadius: '12px',
              color: '#0a0a0a',
              fontWeight: 'bold',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 0 20px rgba(200,162,0,0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)'
              e.currentTarget.style.boxShadow = '0 0 40px rgba(200,162,0,0.5)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = '0 0 20px rgba(200,162,0,0.3)'
            }}
          >
            ➕ Create Tournament
          </Link>
        </div>

        {/* ─── Stats ─── */}
        <div style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}>
          <div style={{
            padding: '8px 16px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <span style={{ color: '#6b7280', fontSize: '12px' }}>Total</span>
            <span style={{ color: '#FFD700', fontWeight: 'bold', marginLeft: '8px' }}>
              {tournaments.length}
            </span>
          </div>
          <div style={{
            padding: '8px 16px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <span style={{ color: '#6b7280', fontSize: '12px' }}>🟢 Active</span>
            <span style={{ color: '#4ade80', fontWeight: 'bold', marginLeft: '8px' }}>
              {tournaments.filter(t => t.status === 'active').length}
            </span>
          </div>
          <div style={{
            padding: '8px 16px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <span style={{ color: '#6b7280', fontSize: '12px' }}>🟡 Upcoming</span>
            <span style={{ color: '#c8a200', fontWeight: 'bold', marginLeft: '8px' }}>
              {tournaments.filter(t => t.status === 'upcoming').length}
            </span>
          </div>
        </div>

        {/* ─── Tournament Cards ─── */}
        {tournaments.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'rgba(16,16,22,0.9)',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏟️</div>
            <h3 style={{ color: '#6b7280' }}>No tournaments yet</h3>
            <p style={{ color: '#4b5563' }}>Be the first to create a tournament!</p>
            <Link
              to="/create-tournament"
              style={{
                display: 'inline-block',
                marginTop: '16px',
                padding: '12px 28px',
                background: 'linear-gradient(135deg, #c8a200, #FFD700)',
                border: 'none',
                borderRadius: '12px',
                color: '#0a0a0a',
                fontWeight: 'bold',
                textDecoration: 'none'
              }}
            >
              ➕ Create Tournament
            </Link>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '16px'
          }}>
            {tournaments.map(t => {
              const isCreator = t.created_by === user?.id
              const isCompleted = t.status === 'completed'
              return (
                <div
                  key={t.id}
                  onClick={() => navigate(`/tournament/${t.id}`)}
                  style={{
                    background: 'rgba(16,16,22,0.9)',
                    backdropFilter: 'blur(24px)',
                    borderRadius: '16px',
                    border: `1px solid ${isCompleted ? 'rgba(107,114,128,0.2)' : 'rgba(255,255,255,0.05)'}`,
                    padding: '20px',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    opacity: isCompleted ? 0.7 : 1
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.borderColor = 'rgba(200,162,0,0.3)'
                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.borderColor = isCompleted ? 'rgba(107,114,128,0.2)' : 'rgba(255,255,255,0.05)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start',
                    marginBottom: '8px'
                  }}>
                    <h3 style={{ color: isCompleted ? '#6b7280' : 'white', fontSize: '18px', margin: 0 }}>
                      {t.name}
                    </h3>
                    {getStatusBadge(t.status)}
                  </div>
                  
                  <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '12px' }}>
                    {t.description || 'No description'}
                  </p>
                  
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    flexWrap: 'wrap',
                    fontSize: '12px',
                    color: '#6b7280'
                  }}>
                    <span>⚽ {t.sport_type}</span>
                    <span>📅 {t.start_date} → {t.end_date}</span>
                    {t.venue && <span>📍 {t.venue}</span>}
                    <span>👥 {t.max_teams} teams</span>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    <span style={{ color: '#4b5563', fontSize: '11px' }}>
                      by {t.creator_name || 'Unknown'}
                    </span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {isCreator && !isCompleted && (
                        <span style={{
                          fontSize: '10px',
                          color: '#c8a200',
                          background: 'rgba(200,162,0,0.1)',
                          padding: '2px 10px',
                          borderRadius: '99px',
                          border: '1px solid rgba(200,162,0,0.2)'
                        }}>
                          👑 Creator
                        </span>
                      )}
                      {isCompleted && (
                        <span style={{
                          fontSize: '10px',
                          color: '#6b7280',
                          background: 'rgba(107,114,128,0.1)',
                          padding: '2px 10px',
                          borderRadius: '99px'
                        }}>
                          ✅ Ended
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ─── Footer ─── */}
        <div style={{ marginTop: '40px', textAlign: 'center' }}>
          <span style={{ color: '#374151', fontSize: '11px', letterSpacing: '0.06em' }}>
            🏆 Tournaments • Create • Compete • Win
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