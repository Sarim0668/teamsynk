import React, { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { IMAGES } from '../../constants/images'

// ─── University Leaderboard Card ─────────────────────────────────────────────
function UniversityLeaderboardCard({ uni, index, isUserUni }: { uni: any; index: number; isUserUni: boolean }) {
  const [hovered, setHovered] = useState(false)
  
  const getMedal = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: isUserUni
          ? 'linear-gradient(135deg, rgba(200,162,0,0.15), rgba(200,162,0,0.05))'
          : hovered ? 'rgba(24,24,32,0.98)' : 'rgba(14,14,20,0.9)',
        backdropFilter: 'blur(24px)',
        border: `1px solid ${
          isUserUni ? 'rgba(200,162,0,0.4)' :
          hovered ? 'rgba(200,162,0,0.3)' : 'rgba(255,255,255,0.05)'
        }`,
        borderRadius: '16px',
        padding: '18px 22px',
        transition: 'all 0.35s ease',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hovered ? '0 20px 60px rgba(0,0,0,0.4), 0 0 40px rgba(200,162,0,0.05)' : 'none',
        animation: `fadeSlideUp 0.5s ease ${index * 50 + 100}ms both`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {isUserUni && (
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          padding: '4px 12px',
          background: 'linear-gradient(135deg, #c8a200, #FFD700)',
          color: '#0a0a0a',
          fontSize: '9px',
          fontWeight: 'bold',
          borderRadius: '0 16px 0 12px',
        }}>
          YOUR UNIVERSITY
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Rank */}
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: isUserUni 
            ? 'linear-gradient(135deg, #c8a200, #FFD700)'
            : index < 3 ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${
            isUserUni ? 'rgba(200,162,0,0.5)' :
            index < 3 ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.05)'
          }`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: index < 3 ? '18px' : '12px',
          fontWeight: 'bold',
          color: isUserUni ? '#0a0a0a' : index < 3 ? '#FFD700' : '#4b5563',
          flexShrink: 0,
        }}>
          {getMedal(uni.rank || index + 1)}
        </div>

        {/* University Info */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontWeight: isUserUni ? 'bold' : '600',
              color: isUserUni ? '#FFD700' : 'white',
              fontSize: '15px',
            }}>
              {uni.name}
            </span>
            <span style={{
              fontSize: '10px',
              color: '#4b5563',
              background: 'rgba(255,255,255,0.05)',
              padding: '2px 8px',
              borderRadius: '99px',
            }}>
              {uni.short_name}
            </span>
          </div>
          
          {/* Stats Row */}
          <div style={{ display: 'flex', gap: '16px', marginTop: '4px', flexWrap: 'wrap' }}>
            <StatPill icon="👥" value={uni.total_members || 0} label="Members" />
            <StatPill icon="🏟️" value={uni.total_sessions_created || 0} label="Sessions" />
            <StatPill icon="🏆" value={uni.competitions_won || 0} label="Wins" />
            <StatPill icon="⭐" value={uni.total_points || 0} label="Points" highlight />
          </div>
        </div>

        {/* Points Badge */}
        <div style={{
          padding: '6px 16px',
          borderRadius: '99px',
          background: isUserUni 
            ? 'linear-gradient(135deg, #c8a200, #FFD700)'
            : 'rgba(200,162,0,0.08)',
          border: `1px solid ${isUserUni ? 'rgba(200,162,0,0.5)' : 'rgba(200,162,0,0.2)'}`,
          fontSize: '14px',
          fontWeight: 'bold',
          color: isUserUni ? '#0a0a0a' : '#FFD700',
          textAlign: 'center',
          flexShrink: 0,
        }}>
          {uni.total_points || 0}
        </div>
      </div>
    </div>
  )
}

function StatPill({ icon, value, label, highlight }: { icon: string; value: number; label: string; highlight?: boolean }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '3px',
      color: highlight ? '#FFD700' : '#6b7280',
      fontSize: '11px',
      fontWeight: highlight ? 'bold' : '500',
    }}>
      {icon} {value}
    </span>
  )
}

// ─── Competition Card ─────────────────────────────────────────────────────────
function CompetitionCard({ competition, index }: { competition: any; index: number }) {
  const [hovered, setHovered] = useState(false)
  
  const typeColors = {
    internal: { bg: 'rgba(59,130,246,0.1)', color: '#60a5fa', label: '🏠 Internal' },
    inter_university: { bg: 'rgba(168,85,247,0.1)', color: '#c084fc', label: '🌍 Inter-University' }
  }
  const type = typeColors[competition.competition_type as keyof typeof typeColors] || typeColors.internal

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'rgba(24,24,32,0.98)' : 'rgba(14,14,20,0.9)',
        backdropFilter: 'blur(24px)',
        border: `1px solid ${hovered ? 'rgba(200,162,0,0.3)' : 'rgba(255,255,255,0.05)'}`,
        borderRadius: '16px',
        padding: '20px',
        transition: 'all 0.35s ease',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hovered ? '0 20px 60px rgba(0,0,0,0.4)' : 'none',
        animation: `fadeSlideUp 0.5s ease ${index * 60 + 200}ms both`,
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'white' }}>
            {competition.title}
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
            ⚽ {competition.sport_type || 'Sports'}
          </div>
        </div>
        <span style={{
          padding: '3px 10px',
          borderRadius: '99px',
          background: type.bg,
          border: `1px solid ${type.color}30`,
          color: type.color,
          fontSize: '10px',
          fontWeight: 'bold',
        }}>
          {type.label}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '12px' }}>
        <span style={{ color: '#4b5563', fontSize: '12px' }}>
          📅 {new Date(competition.start_date).toLocaleDateString()}
        </span>
        <span style={{ color: '#4b5563', fontSize: '12px' }}>
          👥 {competition.participants_count || 0} participants
        </span>
        {competition.prize && (
          <span style={{ color: '#FFD700', fontSize: '12px' }}>
            🏆 {competition.prize}
          </span>
        )}
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        paddingTop: '12px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}>
        <span style={{
          padding: '4px 12px',
          borderRadius: '99px',
          background: competition.status === 'active' ? 'rgba(34,197,94,0.1)' : 
                     competition.status === 'upcoming' ? 'rgba(200,162,0,0.1)' : 'rgba(107,114,128,0.1)',
          border: `1px solid ${competition.status === 'active' ? 'rgba(34,197,94,0.3)' : 
                    competition.status === 'upcoming' ? 'rgba(200,162,0,0.3)' : 'rgba(107,114,128,0.3)'}`,
          color: competition.status === 'active' ? '#4ade80' : 
                 competition.status === 'upcoming' ? '#c8a200' : '#6b7280',
          fontSize: '10px',
          fontWeight: 'bold',
          textTransform: 'uppercase',
        }}>
          {competition.status === 'active' ? '🟢 Live' : 
           competition.status === 'upcoming' ? '🟡 Upcoming' : '⚪ Completed'}
        </span>
        <Link
          to={`/competition/${competition.id}`}
          style={{
            marginLeft: 'auto',
            padding: '6px 14px',
            borderRadius: '8px',
            background: hovered ? '#c8a200' : 'rgba(200,162,0,0.08)',
            color: hovered ? '#0a0a0a' : '#c8a200',
            textDecoration: 'none',
            fontSize: '11px',
            fontWeight: 'bold',
            transition: 'all 0.3s ease',
          }}
        >
          View Details →
        </Link>
      </div>
    </div>
  )
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export const Dashboard: React.FC = () => {
  const [profile, setProfile] = useState<any>(null)
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([])
  const [universityStats, setUniversityStats] = useState<any[]>([])
  const [competitions, setCompetitions] = useState<any[]>([])
  const [userUniversity, setUserUniversity] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    // ─── Get user profile ────────────────────────────────────────────────────
    if (user) {
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(profileData)
      setUserUniversity(profileData?.university || '')
    }

    // ─── Get university leaderboard ─────────────────────────────────────────
    const { data: uniData, error: uniError } = await supabase
      .from('university_overall_leaderboard')
      .select('*')

    if (!uniError && uniData) {
      setUniversityStats(uniData)
    } else {
      console.error('Error loading university stats:', uniError)
      setUniversityStats([])
    }

    // ─── Get upcoming sessions ──────────────────────────────────────────────
    const today = new Date().toISOString().split('T')[0]
    const { data: sessions, error: sessionsError } = await supabase
      .from('sports_sessions')
      .select('*')
      .gte('session_date', today)
      .order('session_date', { ascending: true })
      .limit(4)

    if (!sessionsError && sessions) {
      setUpcomingSessions(sessions)
    } else {
      console.error('Error loading sessions:', sessionsError)
      setUpcomingSessions([])
    }

    // ─── Get competitions with participant count ─────────────────────────────
    const { data: compData, error: compError } = await supabase
      .from('competitions')
      .select(`
        *,
        competition_participants(count)
      `)
      .in('status', ['upcoming', 'active'])
      .order('start_date', { ascending: true })
      .limit(4)

    if (!compError && compData) {
      const compsWithCount = compData.map((comp: any) => ({
        ...comp,
        participants_count: comp.competition_participants?.[0]?.count || 0
      }))
      setCompetitions(compsWithCount)
    } else {
      console.error('Error loading competitions:', compError)
      setCompetitions([])
    }

    setLoading(false)
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0D0D0F',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px', height: '48px',
            border: '4px solid #c8a200',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            margin: '0 auto 16px',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ color: '#666' }}>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'Player'

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0D0D0F',
      color: 'white',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* ── Background ── */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(200,162,0,0.07) 0%, transparent 70%)',
      }} />

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 24px 80px', position: 'relative', zIndex: 1 }}>

        {/* ─── HERO ─── */}
        <section style={{ marginBottom: '32px', animation: 'fadeSlideUp 0.6s ease both' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '5px 14px 5px 8px',
            background: 'rgba(200,162,0,0.08)',
            border: '1px solid rgba(200,162,0,0.18)',
            borderRadius: '99px',
            marginBottom: '16px',
          }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '18px', height: '18px', borderRadius: '50%',
              background: 'rgba(200,162,0,0.2)', fontSize: '10px',
            }}>✦</span>
            <span style={{ color: '#c8a200', fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Dashboard
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(32px, 5vw, 56px)',
            fontWeight: '800',
            lineHeight: '1.05',
            letterSpacing: '-0.03em',
            color: 'white',
            margin: '0 0 8px',
          }}>
            Welcome back,{' '}
            <span style={{
              background: 'linear-gradient(135deg, #c8a200 0%, #FFD700 50%, #e8b800 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              display: 'inline-block',
            }}>
              {firstName}
            </span>
            <span style={{ WebkitTextFillColor: 'initial', color: 'white', fontSize: '0.85em' }}> 👋</span>
          </h1>
          
          {userUniversity && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: 'rgba(200,162,0,0.08)',
              border: '1px solid rgba(200,162,0,0.2)',
              borderRadius: '99px',
            }}>
              <span style={{ fontSize: '16px' }}>🎓</span>
              <span style={{ color: '#FFD700', fontSize: '13px', fontWeight: '600' }}>
                {userUniversity}
              </span>
              <span style={{ color: '#4b5563', fontSize: '11px' }}>
                ({universityStats.find(u => u.name === userUniversity)?.total_members || 0} members)
              </span>
            </div>
          )}
        </section>

        {/* ─── UNIVERSITY LEADERBOARD ─── */}
        <section style={{ marginBottom: '40px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <div style={{ width: '16px', height: '1px', background: 'rgba(200,162,0,0.4)' }} />
                <span style={{ color: '#6b7280', fontSize: '10px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  🏆 University Rankings
                </span>
              </div>
              <h2 style={{
                fontSize: '22px',
                fontWeight: '700',
                color: 'white',
                letterSpacing: '-0.02em',
                margin: '4px 0 0',
              }}>
                Leaderboard
              </h2>
            </div>
            <div style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
            }}>
              <span style={{ color: '#4b5563', fontSize: '12px' }}>
                {universityStats.length} universities
              </span>
              <Link
                to="/leaderboard"
                style={{
                  padding: '6px 16px',
                  borderRadius: '8px',
                  background: 'rgba(200,162,0,0.08)',
                  color: '#c8a200',
                  textDecoration: 'none',
                  fontSize: '12px',
                  fontWeight: '600',
                }}
              >
                View All →
              </Link>
            </div>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}>
            {universityStats.length === 0 ? (
              <div style={{
                background: 'rgba(14,14,20,0.9)',
                borderRadius: '12px',
                padding: '30px',
                textAlign: 'center',
                color: '#4b5563'
              }}>
                No universities found. Add universities to get started.
              </div>
            ) : (
              universityStats.slice(0, 5).map((uni, i) => {
                const isUserUni = uni.name === userUniversity
                return (
                  <UniversityLeaderboardCard
                    key={uni.id}
                    uni={uni}
                    index={i}
                    isUserUni={isUserUni}
                  />
                )
              })
            )}
          </div>
        </section>

        {/* ─── SESSIONS ─── */}
        <section style={{ marginBottom: '40px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <div style={{ width: '16px', height: '1px', background: 'rgba(200,162,0,0.4)' }} />
                <span style={{ color: '#6b7280', fontSize: '10px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  ⚡ Live Arena
                </span>
              </div>
              <h2 style={{
                fontSize: '22px',
                fontWeight: '700',
                color: 'white',
                letterSpacing: '-0.02em',
                margin: '4px 0 0',
              }}>
                Upcoming Sessions
              </h2>
            </div>
            <Link
              to="/browse-sessions"
              style={{
                color: '#c8a200',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              View all →
            </Link>
          </div>

          {upcomingSessions.length === 0 ? (
            <div style={{
              background: 'rgba(14,14,20,0.9)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '16px',
              padding: '40px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏟️</div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'white', margin: '0 0 8px' }}>
                No upcoming sessions
              </h3>
              <p style={{ color: '#4b5563', fontSize: '14px' }}>
                The arena is quiet. Be the first to start something.
              </p>
              <Link
                to="/create-session"
                style={{
                  display: 'inline-block',
                  marginTop: '12px',
                  padding: '10px 24px',
                  background: 'linear-gradient(135deg, #c8a200, #FFD700)',
                  color: '#0a0a0a',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                }}
              >
                ➕ Create Session
              </Link>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '14px',
            }}>
              {upcomingSessions.map((session, i) => (
                <SessionCard key={session.id} session={session} index={i} />
              ))}
            </div>
          )}
        </section>

        {/* ─── COMPETITIONS ─── */}
        <section style={{ marginBottom: '40px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <div style={{ width: '16px', height: '1px', background: 'rgba(200,162,0,0.4)' }} />
                <span style={{ color: '#6b7280', fontSize: '10px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  🏅 Competitions
                </span>
              </div>
              <h2 style={{
                fontSize: '22px',
                fontWeight: '700',
                color: 'white',
                letterSpacing: '-0.02em',
                margin: '4px 0 0',
              }}>
                Live & Upcoming
              </h2>
            </div>
            {/* ─── CREATE TOURNAMENT BUTTON ─── */}
            <Link
              to="/create-tournament"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '10px 22px',
                borderRadius: '12px',
                textDecoration: 'none',
                background: 'linear-gradient(135deg, #c8a200, #FFD700)',
                color: '#0a0a0a',
                fontSize: '13px',
                fontWeight: '800',
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
              🏆 Create Tournament
            </Link>
          </div>

          {competitions.length === 0 ? (
            <div style={{
              background: 'rgba(14,14,20,0.9)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '16px',
              padding: '40px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏆</div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'white', margin: '0 0 8px' }}>
                No active competitions
              </h3>
              <p style={{ color: '#4b5563', fontSize: '14px' }}>
                Competitions will be announced here soon!
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '14px',
            }}>
              {competitions.map((comp, i) => (
                <CompetitionCard key={comp.id} competition={comp} index={i} />
              ))}
            </div>
          )}
        </section>

        {/* ─── FOOTER ─── */}
        <div style={{ marginTop: '60px', display: 'flex', justifyContent: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            padding: '8px 20px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.04)',
            borderRadius: '99px',
          }}>
            <span style={{
              display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%',
              background: '#c8a200', boxShadow: '0 0 6px rgba(200,162,0,0.6)',
              animation: 'pulse 2s ease-in-out infinite',
            }} />
            <span style={{ color: '#374151', fontSize: '11px', fontWeight: '500', letterSpacing: '0.06em' }}>
              TEAMSYNK · UNIVERSITY SPORTS NETWORK
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.05); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

// ─── Session Card ────────────────────────────────────────────────────────────
function SessionCard({ session, index }: { session: any; index: number }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'rgba(24,24,32,0.98)' : 'rgba(14,14,20,0.9)',
        backdropFilter: 'blur(24px)',
        border: `1px solid ${hovered ? 'rgba(200,162,0,0.3)' : 'rgba(255,255,255,0.05)'}`,
        borderRadius: '16px',
        padding: '20px',
        transition: 'all 0.35s ease',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        animation: `fadeSlideUp 0.5s ease ${index * 60 + 300}ms both`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'white' }}>
            {session.sport_type}
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
            📍 {session.location}
          </div>
        </div>
        <div style={{
          padding: '4px 10px',
          borderRadius: '99px',
          background: 'rgba(200,162,0,0.1)',
          border: '1px solid rgba(200,162,0,0.2)',
          fontSize: '10px',
          color: '#c8a200',
          fontWeight: 'bold',
        }}>
          {session.session_date}
        </div>
      </div>
      <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#4b5563', fontSize: '12px' }}>
          ⏰ {session.session_time.substring(0, 5)}
        </span>
        <Link
          to={`/session/${session.id}`}
          style={{
            padding: '6px 16px',
            borderRadius: '8px',
            background: hovered ? '#c8a200' : 'rgba(200,162,0,0.1)',
            color: hovered ? '#0a0a0a' : '#c8a200',
            textDecoration: 'none',
            fontSize: '12px',
            fontWeight: '600',
            transition: 'all 0.3s ease',
          }}
        >
          View →
        </Link>
      </div>
    </div>
  )
}