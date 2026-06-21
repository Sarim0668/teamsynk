import React, { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { IMAGES } from '../../constants/images'

// ─── Micro-animation hook ───────────────────────────────────────────────────
function useInView(threshold = 0.05) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(true) // default true so cards always show
  useEffect(() => {
    const el = ref.current
    if (!el) return
    // If already in viewport on mount, mark visible immediately
    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight) { setVisible(true); return }
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

// ─── Animated counter ───────────────────────────────────────────────────────
function AnimatedNumber({ value, delay = 0 }: { value: number; delay?: number }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const timeout = setTimeout(() => {
      let start = 0
      const end = value
      if (end === 0) return
      const step = Math.ceil(end / 30)
      const timer = setInterval(() => {
        start = Math.min(start + step, end)
        setDisplay(start)
        if (start >= end) clearInterval(timer)
      }, 30)
      return () => clearInterval(timer)
    }, delay)
    return () => clearTimeout(timeout)
  }, [value, delay])
  return <>{display}</>
}

// ─── Session card ───────────────────────────────────────────────────────────
function SessionCard({ session, index }: { session: any; index: number }) {
  const [hovered, setHovered] = useState(false)
  const { count: participantCount } = session.session_participants?.[0] || { count: 0 }
  const isFull = participantCount >= session.max_participants
  const progress = Math.min((participantCount / session.max_participants) * 100, 100)
  const spotsLeft = session.max_participants - participantCount

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered
          ? 'linear-gradient(135deg, rgba(30,30,38,0.95), rgba(26,26,32,0.98))'
          : 'rgba(18,18,24,0.9)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: `1px solid ${hovered ? 'rgba(200,162,0,0.35)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: '20px',
        padding: '22px',
        transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered
          ? '0 20px 60px rgba(200,162,0,0.12), 0 0 0 1px rgba(200,162,0,0.08)'
          : '0 4px 20px rgba(0,0,0,0.4)',
        animationDelay: `${index * 80}ms`,
        animation: 'fadeSlideUp 0.5s ease both',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Glow accent */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
        background: hovered
          ? 'linear-gradient(90deg, transparent, rgba(200,162,0,0.6), transparent)'
          : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
        transition: 'all 0.35s ease',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{
              fontSize: '15px', fontWeight: '700', color: 'white', letterSpacing: '-0.02em'
            }}>
              {session.sport_type}
            </span>
          </div>
        </div>
        <span style={{
          padding: '3px 10px',
          background: isFull ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.1)',
          color: isFull ? '#f87171' : '#4ade80',
          fontSize: '10px',
          fontWeight: '700',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          borderRadius: '20px',
          border: `1px solid ${isFull ? 'rgba(239,68,68,0.25)' : 'rgba(34,197,94,0.2)'}`,
          flexShrink: 0,
        }}>
          {isFull ? '● Full' : `${spotsLeft} open`}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '14px' }}>
        <p style={{ color: '#9ca3af', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
          <span style={{ color: '#c8a200', fontSize: '12px' }}>◉</span>
          {session.location}
        </p>
        <p style={{ color: '#6b7280', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
          <span style={{ color: '#6b7280', fontSize: '12px' }}>◷</span>
          {session.session_date} · {session.session_time.substring(0, 5)}
        </p>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ color: '#6b7280', fontSize: '11px', fontWeight: '500' }}>{participantCount} joined</span>
          <span style={{ color: '#4b5563', fontSize: '11px' }}>{session.max_participants} max</span>
        </div>
        <div style={{
          width: '100%', height: '3px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '99px', overflow: 'hidden',
        }}>
          <div style={{
            width: `${progress}%`, height: '100%',
            background: isFull
              ? 'linear-gradient(90deg, #ef4444, #dc2626)'
              : 'linear-gradient(90deg, #c8a200, #FFD700)',
            borderRadius: '99px',
            transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)',
            boxShadow: isFull ? 'none' : '0 0 8px rgba(200,162,0,0.5)',
          }} />
        </div>
      </div>

      <Link
        to={`/session/${session.id}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          padding: '9px 0',
          background: hovered ? 'linear-gradient(135deg, #c8a200, #FFD700)' : 'rgba(200,162,0,0.07)',
          color: hovered ? '#0a0a0a' : '#c8a200',
          border: `1px solid ${hovered ? 'transparent' : 'rgba(200,162,0,0.18)'}`,
          borderRadius: '12px',
          textDecoration: 'none',
          fontSize: '12px',
          fontWeight: '700',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          transition: 'all 0.3s ease',
          boxShadow: hovered ? '0 4px 20px rgba(200,162,0,0.3)' : 'none',
        }}
      >
        View Session
        <span style={{ fontSize: '11px', transition: 'transform 0.3s', transform: hovered ? 'translateX(3px)' : 'none' }}>→</span>
      </Link>
    </div>
  )
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────
export const Dashboard: React.FC = () => {
  const [profile, setProfile] = useState<any>(null)
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ sessionsJoined: 0, playersFound: 0, listings: 0, posts: 0 })
  const [statsReady, setStatsReady] = useState(false)

  const sessionsSection = useInView()
  const featureSection = useInView()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    const { data: profileData } = await supabase
      .from('users').select('*').eq('id', user?.id).single()
    setProfile(profileData)

    const { count: sessionsCount } = await supabase
      .from('session_participants')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user?.id)

    const { count: listingsCount } = await supabase
      .from('marketplace')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', user?.id)

    setStats({ sessionsJoined: sessionsCount || 0, playersFound: 5, listings: listingsCount || 0, posts: 8 })

    const today = new Date().toISOString().split('T')[0]
    const { data: sessions } = await supabase
      .from('sports_sessions')
      .select('*')
      .gte('session_date', today)
      .order('session_date', { ascending: true })
      .limit(4)
    setUpcomingSessions(sessions || [])
    setLoading(false)
    setTimeout(() => setStatsReady(true), 200)
  }

  // ── Loading screen ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0D0D0F',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          {/* Pulsing ring loader */}
          <div style={{ position: 'relative', width: '56px', height: '56px' }}>
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              border: '2px solid rgba(200,162,0,0.15)',
            }} />
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              border: '2px solid transparent',
              borderTopColor: '#c8a200',
              animation: 'spin 0.8s linear infinite',
            }} />
            <div style={{
              position: 'absolute', inset: '10px', borderRadius: '50%',
              background: 'rgba(200,162,0,0.08)',
              animation: 'pulse 1.6s ease-in-out infinite',
            }} />
          </div>
          <div>
            <p style={{ color: '#e5e7eb', fontSize: '14px', fontWeight: '600', margin: '0 0 4px' }}>Loading TeamSynk</p>
            <p style={{ color: '#4b5563', fontSize: '12px', margin: 0, letterSpacing: '0.04em' }}>Preparing your dashboard…</p>
          </div>
        </div>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:0.5;transform:scale(0.95)}50%{opacity:1;transform:scale(1.05)}}`}</style>
      </div>
    )
  }

  // ── Main render ──────────────────────────────────────────────────────────
  const firstName = profile?.full_name?.split(' ')[0] || 'Player'

  const statCards = [
    { label: 'Sessions Joined', value: stats.sessionsJoined, icon: '⚡', suffix: '' },
    { label: 'Players Found',   value: stats.playersFound,   icon: '👥', suffix: '' },
    { label: 'Active Listings', value: stats.listings,        icon: '🛒', suffix: '' },
    { label: 'Posts',           value: stats.posts,           icon: '✦',  suffix: '' },
  ]

  const featureCards = [
    { title: 'Find Players',    icon: '👥', path: '/find-players',    desc: 'Connect with players nearby',    accent: '#3b82f6' },
    { title: 'Create Session',  icon: '➕', path: '/create-session',  desc: 'Organize a sports session',      accent: '#22c55e' },
    { title: 'Browse Sessions', icon: '⚡', path: '/browse-sessions', desc: 'Find sessions to join today',    accent: '#a855f7' },
    { title: 'Marketplace',     icon: '🛒', path: '/marketplace',     desc: 'Buy & sell sports equipment',    accent: '#f97316' },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0D0D0F',
      color: 'white',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* ── Ambient background layers ── */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: `url(${IMAGES.dashboardBg}) center/cover no-repeat`,
        opacity: 0.04,
      }} />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(200,162,0,0.07) 0%, transparent 70%)',
      }} />
      <div style={{
        position: 'fixed', top: '30%', right: '-15%', width: '600px', height: '600px',
        borderRadius: '50%', background: 'rgba(200,162,0,0.03)',
        filter: 'blur(120px)', zIndex: 0, pointerEvents: 'none',
        animation: 'floatBlob 12s ease-in-out infinite',
      }} />
      <div style={{
        position: 'fixed', bottom: '-10%', left: '-10%', width: '500px', height: '500px',
        borderRadius: '50%', background: 'rgba(128,90,213,0.03)',
        filter: 'blur(100px)', zIndex: 0, pointerEvents: 'none',
        animation: 'floatBlob 16s ease-in-out infinite 3s',
      }} />

      {/* ── Content ── */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 24px 80px', position: 'relative', zIndex: 1 }}>

        {/* ──────────── HERO GREETING ──────────── */}
        <section style={{ marginBottom: '52px', animation: 'fadeSlideUp 0.6s ease both' }}>
          {/* Eyebrow */}
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

          {/* Headline */}
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

        {/* ──────────── STATS ──────────── */}
        <section style={{ marginBottom: '48px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
          }}>
            {statCards.map((stat, i) => (
              <StatCard key={stat.label} stat={stat} index={i} ready={statsReady} />
            ))}
          </div>
        </section>

        {/* ──────────── FEATURE CARDS ──────────── */}
        <section
          ref={featureSection.ref}
          style={{ marginBottom: '52px' }}
        >
          <SectionLabel label="Quick Access" />
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
          }}>
            {featureCards.map((card, i) => (
              <FeatureCard key={card.title} card={card} index={i} />
            ))}
          </div>
        </section>

        {/* ──────────── UPCOMING SESSIONS ──────────── */}
        <section ref={sessionsSection.ref}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
            marginBottom: '20px', flexWrap: 'wrap', gap: '12px',
          }}>
            <div>
              <SectionLabel label="Live Arena" />
              <h2 style={{
                fontSize: '22px', fontWeight: '700', color: 'white',
                letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2,
              }}>
                Upcoming Sessions
              </h2>
            </div>
            <ViewAllLink to="/browse-sessions" label="Browse all sessions" />
          </div>

          {upcomingSessions.length === 0 ? (
            <EmptySessionsState />
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
              opacity: sessionsSection.visible ? 1 : 0,
              transition: 'opacity 0.5s ease 0.1s',
            }}>
              {upcomingSessions.map((session, i) => (
                <SessionCard key={session.id} session={session} index={i} />
              ))}
            </div>
          )}
        </section>

        {/* ──────────── FOOTER ──────────── */}
        <div style={{ marginTop: '64px', display: 'flex', justifyContent: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            padding: '8px 20px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
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

      {/* ── Global keyframes ── */}
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
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }

        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0D0D0F; }
        ::-webkit-scrollbar-thumb { background: rgba(200,162,0,0.3); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(200,162,0,0.5); }

        @media (max-width: 640px) {
          .stat-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .feature-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .session-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px',
    }}>
      <div style={{ width: '16px', height: '1px', background: 'rgba(200,162,0,0.5)' }} />
      <span style={{ color: '#6b7280', fontSize: '10px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        {label}
      </span>
    </div>
  )
}

function ViewAllLink({ to, label }: { to: string; label: string }) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link
      to={to}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        color: hovered ? '#FFD700' : '#c8a200',
        fontSize: '12px', fontWeight: '600',
        letterSpacing: '0.05em', textTransform: 'uppercase',
        textDecoration: 'none',
        transition: 'all 0.25s ease',
        paddingBottom: '2px',
        borderBottom: `1px solid ${hovered ? 'rgba(255,215,0,0.4)' : 'rgba(200,162,0,0.2)'}`,
      }}
    >
      {label}
      <span style={{ transition: 'transform 0.25s', transform: hovered ? 'translateX(4px)' : 'none', fontSize: '13px' }}>→</span>
    </Link>
  )
}

function StatCard({ stat, index, ready }: { stat: any; index: number; ready: boolean }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered
          ? 'linear-gradient(135deg, rgba(24,24,32,0.98), rgba(20,20,28,1))'
          : 'rgba(16,16,22,0.9)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: `1px solid ${hovered ? 'rgba(200,162,0,0.3)' : 'rgba(255,255,255,0.05)'}`,
        borderRadius: '18px',
        padding: '22px 22px 20px',
        transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hovered
          ? '0 16px 48px rgba(200,162,0,0.1), 0 0 0 1px rgba(200,162,0,0.06)'
          : '0 4px 16px rgba(0,0,0,0.3)',
        cursor: 'default',
        animationDelay: `${index * 70}ms`,
        animation: 'fadeSlideUp 0.5s ease both',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: '20%', right: '20%', height: '1px',
        background: hovered
          ? 'linear-gradient(90deg, transparent, rgba(200,162,0,0.6), transparent)'
          : 'transparent',
        transition: 'all 0.35s ease',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <p style={{ color: '#4b5563', fontSize: '11px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 10px' }}>
            {stat.label}
          </p>
          <p style={{
            fontSize: '34px', fontWeight: '800', color: 'white',
            letterSpacing: '-0.04em', lineHeight: 1, margin: 0,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {ready ? <AnimatedNumber value={stat.value} delay={index * 80} /> : 0}
          </p>
        </div>
        <div style={{
          width: '38px', height: '38px',
          background: hovered ? 'rgba(200,162,0,0.15)' : 'rgba(200,162,0,0.07)',
          border: `1px solid ${hovered ? 'rgba(200,162,0,0.3)' : 'rgba(200,162,0,0.1)'}`,
          borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '17px',
          transition: 'all 0.3s ease',
          transform: hovered ? 'scale(1.1) rotate(-3deg)' : 'scale(1) rotate(0deg)',
          flexShrink: 0,
        }}>
          {stat.icon}
        </div>
      </div>
    </div>
  )
}

function FeatureCard({ card, index }: { card: any; index: number }) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link
      to={card.path}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'block',
        background: hovered
          ? 'linear-gradient(135deg, rgba(26,26,34,0.98), rgba(22,22,30,1))'
          : 'rgba(14,14,20,0.9)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: `1px solid ${hovered ? 'rgba(200,162,0,0.35)' : 'rgba(255,255,255,0.05)'}`,
        borderRadius: '20px',
        padding: '26px 22px',
        textDecoration: 'none',
        color: 'white',
        transition: 'border-color 0.35s ease, box-shadow 0.35s ease, transform 0.35s cubic-bezier(0.4,0,0.2,1), background 0.35s ease',
        transform: hovered ? 'translateY(-5px)' : 'translateY(0)',
        boxShadow: hovered
          ? `0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(200,162,0,0.08), 0 0 40px ${card.accent}18`
          : '0 4px 16px rgba(0,0,0,0.3)',
        position: 'relative',
        overflow: 'hidden',
        animation: 'fadeSlideUp 0.5s ease both',
        animationDelay: `${index * 80 + 200}ms`,
      }}
    >
      {/* Corner accent */}
      <div style={{
        position: 'absolute', top: '-40px', right: '-40px', width: '120px', height: '120px',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${card.accent}20 0%, transparent 70%)`,
        transition: 'opacity 0.35s',
        opacity: hovered ? 1 : 0.4,
        filter: 'blur(20px)',
      }} />

      <div style={{ position: 'relative' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: '44px', height: '44px',
          background: hovered ? `rgba(200,162,0,0.15)` : 'rgba(200,162,0,0.07)',
          border: `1px solid ${hovered ? 'rgba(200,162,0,0.3)' : 'rgba(200,162,0,0.1)'}`,
          borderRadius: '12px',
          fontSize: '22px',
          marginBottom: '14px',
          transition: 'all 0.35s ease',
          transform: hovered ? 'scale(1.12) rotate(-5deg)' : 'scale(1) rotate(0deg)',
        }}>
          {card.icon}
        </div>

        <h3 style={{
          fontSize: '15px', fontWeight: '700',
          letterSpacing: '-0.01em', margin: '0 0 5px',
          color: hovered ? '#f9fafb' : '#e5e7eb',
          transition: 'color 0.25s',
        }}>
          {card.title}
        </h3>
        <p style={{ color: '#4b5563', fontSize: '12px', lineHeight: '1.4', margin: '0 0 16px' }}>
          {card.desc}
        </p>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          color: '#c8a200', fontSize: '11px', fontWeight: '700',
          letterSpacing: '0.06em', textTransform: 'uppercase',
          opacity: hovered ? 1 : 0,
          transform: hovered ? 'translateX(0)' : 'translateX(-6px)',
          transition: 'all 0.3s ease',
        }}>
          Go <span style={{ fontSize: '12px' }}>→</span>
        </div>
      </div>
    </Link>
  )
}

function EmptySessionsState() {
  return (
    <div style={{
      background: 'rgba(14,14,20,0.9)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: '24px',
      padding: '64px 32px',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '300px', height: '300px',
        borderRadius: '50%', background: 'rgba(200,162,0,0.04)',
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: '72px', height: '72px', borderRadius: '20px',
          background: 'rgba(200,162,0,0.08)',
          border: '1px solid rgba(200,162,0,0.15)',
          fontSize: '36px', marginBottom: '20px',
        }}>🏟️</div>

        <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'white', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
          No upcoming sessions
        </h3>
        <p style={{ color: '#4b5563', fontSize: '14px', margin: '0 0 28px', lineHeight: 1.5 }}>
          The arena is quiet. Be the first to start something.
        </p>
        <Link
          to="/create-session"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '11px 28px',
            background: 'linear-gradient(135deg, #c8a200, #FFD700)',
            color: '#0a0a0a',
            fontWeight: '800',
            fontSize: '13px',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            borderRadius: '12px',
            textDecoration: 'none',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 24px rgba(200,162,0,0.25)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.04)'
            e.currentTarget.style.boxShadow = '0 8px 36px rgba(200,162,0,0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = '0 4px 24px rgba(200,162,0,0.25)'
          }}
        >
          ➕ Create Session
        </Link>
      </div>
    </div>
  )
}