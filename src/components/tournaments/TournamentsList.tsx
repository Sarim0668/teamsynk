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
}

interface Competition {
  id: string
  title: string
  sport_type: string
  description: string
  date: string
  start_time: string
  end_time: string
  status: string
  competition_type: string
  created_at: string
}

export const TournamentsList: React.FC = () => {
  const navigate = useNavigate()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'tournaments' | 'competitions'>('tournaments')
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    checkUserAndLoad()
  }, [])

  const checkUserAndLoad = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    if (currentUser) {
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', currentUser.id)
        .single()
      setIsAdmin(profile?.role === 'Admin')
    }

    await Promise.all([loadTournaments(), loadCompetitions()])
    setLoading(false)
  }

  const loadTournaments = async () => {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setTournaments(data)
    }
  }

  const loadCompetitions = async () => {
    const { data, error } = await supabase
      .from('competitions')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setCompetitions(data)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; color: string; label: string }> = {
      active: { bg: 'rgba(34,197,94,0.12)', color: '#4ade80', label: 'Active' },
      upcoming: { bg: 'rgba(200,162,0,0.12)', color: '#c8a200', label: 'Upcoming' },
      completed: { bg: 'rgba(107,114,128,0.12)', color: '#6b7280', label: 'Completed' },
      scheduled: { bg: 'rgba(96,165,250,0.12)', color: '#60a5fa', label: 'Scheduled' },
    }
    const s = styles[status] || styles.upcoming
    return (
      <span style={{
        padding: '2px 10px',
        borderRadius: '99px',
        background: s.bg,
        color: s.color,
        fontSize: '10px',
        fontWeight: 'bold'
      }}>
        {s.label}
      </span>
    )
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
          <p style={{ color: '#666' }}>Loading...</p>
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
          marginBottom: '24px'
        }}>
          <div>
            <h1 style={{ color: '#FFD700', fontSize: '32px' }}>🏆 Tournaments & Competitions</h1>
            <p style={{ color: '#6b7280' }}>Compete, win, and climb the leaderboard</p>
          </div>
          <Link
            to="/create-tournament"
            style={{
              padding: '10px 24px',
              background: 'linear-gradient(135deg, #c8a200, #FFD700)',
              border: 'none',
              borderRadius: '12px',
              color: '#0a0a0a',
              fontWeight: 'bold',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            ➕ Create Tournament
          </Link>
        </div>

        {/* ─── Tabs ─── */}
        <div style={{
          display: 'flex',
          gap: '4px',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '12px',
          padding: '4px',
          marginBottom: '24px',
          border: '1px solid rgba(255,255,255,0.04)'
        }}>
          <button
            onClick={() => setActiveTab('tournaments')}
            style={{
              flex: 1,
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'tournaments' ? 'rgba(200,162,0,0.15)' : 'transparent',
              color: activeTab === 'tournaments' ? '#FFD700' : '#6b7280',
              fontWeight: activeTab === 'tournaments' ? 'bold' : 'normal',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🏟️ Tournaments ({tournaments.length})
          </button>
          <button
            onClick={() => setActiveTab('competitions')}
            style={{
              flex: 1,
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'competitions' ? 'rgba(200,162,0,0.15)' : 'transparent',
              color: activeTab === 'competitions' ? '#FFD700' : '#6b7280',
              fontWeight: activeTab === 'competitions' ? 'bold' : 'normal',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🧪 Competitions ({competitions.length})
          </button>
        </div>

        {/* ─── Content ─── */}
        {activeTab === 'tournaments' ? (
          <>
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
                    padding: '10px 24px',
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
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '16px'
              }}>
                {tournaments.map(t => (
                  <div
                    key={t.id}
                    onClick={() => navigate(`/tournament/${t.id}`)}
                    style={{
                      background: 'rgba(16,16,22,0.9)',
                      backdropFilter: 'blur(24px)',
                      borderRadius: '16px',
                      border: '1px solid rgba(255,255,255,0.05)',
                      padding: '20px',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)'
                      e.currentTarget.style.borderColor = 'rgba(200,162,0,0.3)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                      <h3 style={{ color: 'white', fontSize: '16px', margin: 0 }}>{t.name}</h3>
                      {getStatusBadge(t.status)}
                    </div>
                    <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px' }}>
                      {t.description || 'No description'}
                    </p>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '12px', color: '#6b7280' }}>
                      <span>⚽ {t.sport_type}</span>
                      <span>📅 {t.start_date} → {t.end_date}</span>
                      <span>📍 {t.venue || 'TBD'}</span>
                      <span>👥 {t.max_teams} teams</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {competitions.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: 'rgba(16,16,22,0.9)',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🧪</div>
                <h3 style={{ color: '#6b7280' }}>No competitions yet</h3>
                <p style={{ color: '#4b5563' }}>Be the first to create a competition!</p>
                {isAdmin && (
                  <Link
                    to="/create-competition"
                    style={{
                      display: 'inline-block',
                      marginTop: '16px',
                      padding: '10px 24px',
                      background: 'linear-gradient(135deg, #c8a200, #FFD700)',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#0a0a0a',
                      fontWeight: 'bold',
                      textDecoration: 'none'
                    }}
                  >
                    ➕ Create Competition
                  </Link>
                )}
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '16px'
              }}>
                {competitions.map(c => (
                  <div
                    key={c.id}
                    onClick={() => navigate(`/competition/${c.id}`)}
                    style={{
                      background: 'rgba(16,16,22,0.9)',
                      backdropFilter: 'blur(24px)',
                      borderRadius: '16px',
                      border: '1px solid rgba(255,255,255,0.05)',
                      padding: '20px',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)'
                      e.currentTarget.style.borderColor = 'rgba(200,162,0,0.3)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                      <h3 style={{ color: 'white', fontSize: '16px', margin: 0 }}>{c.title}</h3>
                      {getStatusBadge(c.status)}
                    </div>
                    <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px' }}>
                      {c.description || 'No description'}
                    </p>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '12px', color: '#6b7280' }}>
                      <span>⚽ {c.sport_type}</span>
                      <span>📅 {c.date}</span>
                      <span>⏰ {c.start_time} → {c.end_time}</span>
                      {c.competition_type === 'inter_university' && (
                        <span style={{ color: '#c8a200' }}>🌍 Inter-University</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ─── Leaderboard Link ─── */}
        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <Link
            to="/leaderboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 24px',
              background: 'rgba(200,162,0,0.08)',
              border: '1px solid rgba(200,162,0,0.2)',
              borderRadius: '12px',
              color: '#c8a200',
              textDecoration: 'none',
              fontWeight: 'bold'
            }}
          >
            🏆 View University Leaderboard
          </Link>
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

export default TournamentsList