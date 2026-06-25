import React, { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { IMAGES } from '../../constants/images'

// ─── University Card ──────────────────────────────────────────────────────────
function UniversityCard({ uni, index }: { uni: any; index: number }) {
  const [hovered, setHovered] = useState(false)
  
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered
          ? 'linear-gradient(135deg, rgba(26,26,34,0.98), rgba(22,20,28,0.98))'
          : 'rgba(14,14,20,0.9)',
        backdropFilter: 'blur(24px)',
        border: `1px solid ${hovered ? 'rgba(200,162,0,0.3)' : 'rgba(255,255,255,0.05)'}`,
        borderRadius: '16px',
        padding: '20px',
        transition: 'all 0.35s ease',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered ? '0 20px 60px rgba(0,0,0,0.4)' : 'none',
        animation: `fadeSlideUp 0.5s ease ${index * 60 + 100}ms both`,
        cursor: 'default',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: `linear-gradient(135deg, ${uni.color}40, ${uni.color}20)`,
          border: `1px solid ${uni.color}40`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          fontWeight: 'bold',
          color: uni.color,
          flexShrink: 0,
        }}>
          {uni.short_name?.charAt(0)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: '15px' }}>
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
          <div style={{ display: 'flex', gap: '16px', marginTop: '6px', flexWrap: 'wrap' }}>
            <span style={{ color: '#6b7280', fontSize: '12px' }}>
              👥 {uni.member_count || 0} members
            </span>
            <span style={{ color: '#6b7280', fontSize: '12px' }}>
              🏟️ {uni.total_sessions || 0} sessions
            </span>
            <span style={{ color: '#FFD700', fontSize: '12px' }}>
              ⭐ {uni.total_points || 0} points
            </span>
          </div>
        </div>
        <div style={{
          padding: '4px 12px',
          borderRadius: '99px',
          background: 'rgba(200,162,0,0.1)',
          border: '1px solid rgba(200,162,0,0.2)',
          fontSize: '11px',
          fontWeight: 'bold',
          color: '#c8a200',
        }}>
          Rank #{uni.rank || index + 1}
        </div>
      </div>
    </div>
  )
}

// ─── Profile University Selector ─────────────────────────────────────────────
export const UniversitySelector: React.FC<{ value: string; onChange: (val: string) => void }> = ({ value, onChange }) => {
  const universities = [
    'FAST University',
    'NUST',
    'IIUI',
    'Bahria University',
    'Air University',
    'COMSATS',
    'GIKI',
    'LUMS',
    'Other'
  ]

  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '12px 16px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px',
          color: 'white',
          fontSize: '14px',
          outline: 'none',
          appearance: 'none',
          cursor: 'pointer',
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <option value="" style={{ background: '#1a1a22' }}>Select your university</option>
        {universities.map(uni => (
          <option key={uni} value={uni} style={{ background: '#1a1a22' }}>
            {uni}
          </option>
        ))}
      </select>
      <div style={{
        position: 'absolute',
        right: '14px',
        top: '50%',
        transform: 'translateY(-50%)',
        pointerEvents: 'none',
        color: '#4b5563',
      }}>
        ▼
      </div>
    </div>
  )
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export const Dashboard: React.FC = () => {
  const [profile, setProfile] = useState<any>(null)
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([])
  const [universityStats, setUniversityStats] = useState<any[]>([])
  const [userUniversity, setUserUniversity] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ sessionsJoined: 0, playersFound: 0, listings: 0, posts: 0 })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    // ─── Get user profile ────────────────────────────────────────────────────
    const { data: profileData } = await supabase
      .from('users')
      .select('*')
      .eq('id', user?.id)
      .single()
    setProfile(profileData)
    setUserUniversity(profileData?.university || '')

    // ─── Get university stats ───────────────────────────────────────────────
    const { data: uniData } = await supabase
      .from('university_groups')
      .select(`
        *,
        university_stats (
          total_sessions,
          total_participants,
          total_points,
          competitions_won
        )
      `)
      .order('member_count', { ascending: false })

    // Add rank
    const uniWithRank = uniData?.map((uni: any, index: number) => ({
      ...uni,
      rank: index + 1,
      total_sessions: uni.university_stats?.[0]?.total_sessions || 0,
      total_points: uni.university_stats?.[0]?.total_points || 0,
      competitions_won: uni.university_stats?.[0]?.competitions_won || 0,
    })) || []
    setUniversityStats(uniWithRank)

    // ─── Get sessions ──────────────────────────────────────────────────────
    const { count: sessionsCount } = await supabase
      .from('session_participants')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user?.id)

    const { count: listingsCount } = await supabase
      .from('marketplace')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', user?.id)

    setStats({ sessionsJoined: sessionsCount || 0, playersFound: 5, listings: listingsCount || 0, posts: 8 })

    // ─── Get upcoming sessions ──────────────────────────────────────────────
    const today = new Date().toISOString().split('T')[0]
    const { data: sessions } = await supabase
      .from('sports_sessions')
      .select('*')
      .gte('session_date', today)
      .order('session_date', { ascending: true })
      .limit(4)
    setUpcomingSessions(sessions || [])
    setLoading(false)
  }

  // ─── Join university ──────────────────────────────────────────────────────
  const handleUniversityChange = async (university: string) => {
    if (!profile) return

    // Update user profile
    const { error } = await supabase
      .from('users')
      .update({ university: university || null })
      .eq('id', profile.id)

    if (!error) {
      setUserUniversity(university)
      setProfile({ ...profile, university: university })
      // Refresh stats
      loadData()
    }
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
  const userUni = universityStats.find(u => u.name === userUniversity)

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
        background: `url(${IMAGES.dashboardBg}) center/cover no-repeat`,
        opacity: 0.04,
      }} />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(200,162,0,0.07) 0%, transparent 70%)',
      }} />

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 24px 80px', position: 'relative', zIndex: 1 }}>

        {/* ─── HERO ─── */}
        <section style={{ marginBottom: '40px', animation: 'fadeSlideUp 0.6s ease both' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '5px 14px 5px 8px',
            background: 'rgba(200,162,0,0.08)',
            border: '1px solid rgba(200,162,0,0.18)',
            borderRadius: '99px',
            marginBottom: '20px',
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
            margin: '0 0 12px',
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
          <p style={{ color: '#6b7280', fontSize: '16px', fontWeight: '400', margin: 0, maxWidth: '480px', lineHeight: '1.5' }}>
            Ready to play? Here's what's happening in your arena today.
          </p>
        </section>

        {/* ─── UNIVERSITY SELECTOR ─── */}
        <section style={{ marginBottom: '32px' }}>
          <div style={{
            background: 'rgba(14,14,20,0.9)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '16px',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '24px' }}>🏛️</span>
              <div>
                <div style={{ fontSize: '12px', color: '#4b5563' }}>Your University</div>
                <div style={{ fontWeight: 'bold', color: userUniversity ? '#FFD700' : '#6b7280' }}>
                  {userUniversity || 'Not set'}
                </div>
              </div>
            </div>

            <div style={{ flex: 1, minWidth: '200px', maxWidth: '300px' }}>
              <select
                value={userUniversity}
                onChange={(e) => handleUniversityChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px',
                  color: 'white',
                  fontSize: '13px',
                  outline: 'none',
                  appearance: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="" style={{ background: '#1a1a22' }}>Select your university</option>
                {universityStats.map(uni => (
                  <option key={uni.id} value={uni.name} style={{ background: '#1a1a22' }}>
                    {uni.name} ({uni.member_count || 0} members)
                  </option>
                ))}
              </select>
            </div>

            {userUni && (
              <div style={{
                padding: '6px 14px',
                borderRadius: '99px',
                background: 'rgba(34,197,94,0.1)',
                border: '1px solid rgba(34,197,94,0.2)',
                color: '#4ade80',
                fontSize: '12px',
                fontWeight: '600',
              }}>
                ✅ Member
              </div>
            )}
          </div>
        </section>

        {/* ─── UNIVERSITY LEADERBOARD ─── */}
        <section style={{ marginBottom: '40px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}>
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <div style={{ width: '16px', height: '1px', background: 'rgba(200,162,0,0.4)' }} />
                <span style={{ color: '#6b7280', fontSize: '10px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  University Leaderboard
                </span>
              </div>
              <h2 style={{
                fontSize: '22px',
                fontWeight: '700',
                color: 'white',
                letterSpacing: '-0.02em',
                margin: '4px 0 0',
              }}>
                🏆 Top Universities
              </h2>
            </div>
            <span style={{ color: '#4b5563', fontSize: '12px' }}>
              {universityStats.length} universities
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '12px',
          }}>
            {universityStats.slice(0, 6).map((uni, i) => {
              const isUserUni = uni.name === userUniversity
              return (
                <div
                  key={uni.id}
                  style={{
                    background: isUserUni
                      ? 'linear-gradient(135deg, rgba(200,162,0,0.12), rgba(200,162,0,0.04))'
                      : 'rgba(14,14,20,0.9)',
                    backdropFilter: 'blur(24px)',
                    border: `1px solid ${isUserUni ? 'rgba(200,162,0,0.3)' : 'rgba(255,255,255,0.05)'}`,
                    borderRadius: '14px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    transition: 'all 0.3s ease',
                    animation: `fadeSlideUp 0.5s ease ${i * 50 + 200}ms both`,
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: isUserUni
                      ? 'linear-gradient(135deg, #c8a200, #FFD700)'
                      : 'rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: isUserUni ? '#0a0a0a' : '#6b7280',
                  }}>
                    #{i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}>
                      <span style={{
                        fontWeight: isUserUni ? 'bold' : '500',
                        color: isUserUni ? '#FFD700' : 'white',
                      }}>
                        {uni.name}
                      </span>
                      {isUserUni && (
                        <span style={{
                          fontSize: '9px',
                          padding: '1px 8px',
                          borderRadius: '99px',
                          background: 'rgba(200,162,0,0.2)',
                          color: '#c8a200',
                        }}>
                          Your Uni
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '2px' }}>
                      <span style={{ color: '#6b7280', fontSize: '11px' }}>
                        👥 {uni.member_count || 0}
                      </span>
                      <span style={{ color: '#6b7280', fontSize: '11px' }}>
                        🏟️ {uni.total_sessions || 0}
                      </span>
                      <span style={{ color: '#FFD700', fontSize: '11px' }}>
                        ⭐ {uni.total_points || 0}
                      </span>
                    </div>
                  </div>
                  <div style={{
                    padding: '2px 10px',
                    borderRadius: '99px',
                    background: isUserUni
                      ? 'rgba(200,162,0,0.2)'
                      : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isUserUni ? 'rgba(200,162,0,0.3)' : 'rgba(255,255,255,0.05)'}`,
                    fontSize: '10px',
                    color: isUserUni ? '#FFD700' : '#4b5563',
                  }}>
                    {isUserUni ? '⭐' : ''}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ─── STATS ─── */}
        <section style={{ marginBottom: '40px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
          }}>
            <StatCard label="Sessions Joined" value={stats.sessionsJoined} icon="⚡" />
            <StatCard label="Players Found" value={stats.playersFound} icon="👥" />
            <StatCard label="Active Listings" value={stats.listings} icon="🛒" />
            <StatCard label="Posts" value={stats.posts} icon="✦" />
          </div>
        </section>

        {/* ─── SESSIONS ─── */}
        <section>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}>
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <div style={{ width: '16px', height: '1px', background: 'rgba(200,162,0,0.4)' }} />
                <span style={{ color: '#6b7280', fontSize: '10px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  Live Arena
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
              borderRadius: '20px',
              padding: '60px 20px',
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
                  marginTop: '16px',
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
              TEAMSYNK · PREMIUM · v2.0
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }

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
        @keyframes floatBlob {
          0%, 100% { transform: translateY(0px) scale(1); }
          50%       { transform: translateY(-30px) scale(1.05); }
        }
      `}</style>
    </div>
  )
}

// ─── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div style={{
      background: 'rgba(14,14,20,0.9)',
      backdropFilter: 'blur(24px)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: '16px',
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
    }}>
      <div style={{
        width: '44px',
        height: '44px',
        borderRadius: '12px',
        background: 'rgba(200,162,0,0.08)',
        border: '1px solid rgba(200,162,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>
          {value}
        </div>
        <div style={{ fontSize: '12px', color: '#6b7280' }}>
          {label}
        </div>
      </div>
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
        background: hovered
          ? 'linear-gradient(135deg, rgba(26,26,34,0.98), rgba(22,20,28,0.98))'
          : 'rgba(14,14,20,0.9)',
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