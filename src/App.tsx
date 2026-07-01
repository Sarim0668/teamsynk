// src/App.tsx
import React, { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { supabase } from './lib/supabaseClient'
import { Navbar } from './components/Navbar/Navbar'
import { Login } from './components/auth/Login'
import { Register } from './components/auth/Register'
import { Dashboard } from './components/dashboard/Dashboard'
import { CreateSession } from './components/sessions/CreateSession'
import { BrowseSessions } from './components/sessions/BrowseSessions'
import { Marketplace } from './components/marketplace/Marketplace'
import { FindPlayers } from './components/social/FindPlayers'
import { SessionDetail } from './components/sessions/SessionDetail'
import { Profile } from './components/profile/Profile'
import { Messages } from './components/messages/Messages'
import { AdminPanel } from './components/admin/AdminPanel'
import { CompetitionDetail } from './components/competitions/CompetitionDetail'
import { CreateCompetition } from './components/competitions/CreateCompetition'
import { Leaderboard } from './components/competitions/Leaderboard'
import { AIVoice } from './components/ai/AIVoice'
import { Music } from './components/music/Music'
import { CommunityHub } from './components/community/CommunityHub'
import { CommunityChat } from './components/community/CommunityChat'
import { CreateTournament } from './components/tournaments/CreateTournament'
import { TournamentDetail } from './components/tournaments/TournamentDetail'
import { TournamentsList } from './components/tournaments/TournamentsList'
import { HelpSupport } from './components/support/HelpSupport'
import { AuthCallback } from './components/auth/AuthCallback'
import './premiumMotion.css'

// ─── Placeholder page ─────────────────────────────────────────────────────────
const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div style={{
    minHeight: '100vh',
    background: '#0a0a0a',
    color: 'white',
    padding: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }}>
    <div style={{ textAlign: 'center' }}>
      <h1 style={{ color: '#FFD700', fontSize: '32px' }}>{title}</h1>
      <p style={{ color: '#666' }}>Coming soon! 🚀</p>
    </div>
  </div>
)

// ─── Premium Loading Screen ───────────────────────────────────────────────────
const LoadingScreen: React.FC = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0D0D0F',
    gap: '28px',
    position: 'relative',
    overflow: 'hidden',
  }}>
    <div style={{
      position: 'absolute',
      top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '500px', height: '500px',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(200,162,0,0.06) 0%, transparent 70%)',
      filter: 'blur(40px)',
      pointerEvents: 'none',
    }} />
    <div style={{ position: 'relative' }}>
      <div style={{
        position: 'absolute', inset: '-10px',
        borderRadius: '50%',
        background: 'conic-gradient(from 0deg, transparent 65%, rgba(200,162,0,0.8) 85%, rgba(255,215,0,1) 95%, rgba(200,162,0,0.8) 100%, transparent)',
        animation: 'appSpinRing 1.2s linear infinite',
      }} />
      <div style={{
        position: 'absolute', inset: '-8px',
        borderRadius: '50%',
        background: '#0D0D0F',
      }} />
      <div style={{
        position: 'relative',
        width: '64px', height: '64px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, #1a1a22, #111118)',
        border: '1px solid rgba(200,162,0,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 30px rgba(200,162,0,0.15), inset 0 1px 0 rgba(255,215,0,0.1)',
      }}>
        <span style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '22px', fontWeight: '900',
          letterSpacing: '-0.05em',
          background: 'linear-gradient(135deg, #c8a200, #FFD700)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>TS</span>
      </div>
    </div>
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: '20px', fontWeight: '900',
        letterSpacing: '-0.03em',
        background: 'linear-gradient(135deg, #c8a200, #FFD700)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        marginBottom: '4px',
      }}>TEAMSYNK</div>
      <div style={{
        fontSize: '10px', fontWeight: '700',
        letterSpacing: '0.2em', color: '#374151',
        textTransform: 'uppercase',
        fontFamily: "'Inter', sans-serif",
      }}>LINK · CONNECT · PLAY</div>
    </div>
    <div style={{
      width: '160px', height: '2px',
      background: 'rgba(255,255,255,0.05)',
      borderRadius: '99px',
      overflow: 'hidden',
    }}>
      <div style={{
        height: '100%',
        background: 'linear-gradient(90deg, #c8a200, #FFD700)',
        borderRadius: '99px',
        animation: 'appLoadBar 1.4s ease-in-out infinite',
        boxShadow: '0 0 8px rgba(200,162,0,0.6)',
      }} />
    </div>
    <style>{`
      @keyframes appSpinRing {
        from { transform: rotate(0deg); }
        to   { transform: rotate(360deg); }
      }
      @keyframes appLoadBar {
        0%   { width: 0%;   margin-left: 0%; }
        50%  { width: 70%;  margin-left: 15%; }
        100% { width: 0%;   margin-left: 100%; }
      }
    `}</style>
  </div>
)

// ─── Particle System ──────────────────────────────────────────────────────────
const ParticleSystem: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const frameRef = useRef(0)
  const particlesRef = useRef<any[]>([])
  const mouseRef = useRef({ x: -9999, y: -9999 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const COLORS = [
      'rgba(200,162,0,', 'rgba(255,215,0,',
      'rgba(232,184,0,', 'rgba(180,140,0,',
    ]

    const makeParticle = () => {
      const type = Math.random() < 0.15 ? 'orb' : Math.random() < 0.4 ? 'spark' : 'dust'
      const angle = Math.random() * Math.PI * 2
      const speed = type === 'orb' ? 0.1 : type === 'spark' ? 0.28 : 0.16
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: Math.cos(angle) * speed * (0.4 + Math.random() * 0.6),
        vy: Math.sin(angle) * speed * (0.4 + Math.random() * 0.6) - 0.04,
        size: type === 'orb' ? 2 + Math.random() * 2.5 : type === 'spark' ? 0.7 + Math.random() * 1 : 0.3 + Math.random() * 0.7,
        opacity: 0.08 + Math.random() * 0.45,
        opacityDir: Math.random() > 0.5 ? 1 : -1,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        type,
        phase: Math.random() * Math.PI * 2,
        phaseSpeed: 0.004 + Math.random() * 0.012,
      }
    }

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
      const count = Math.min(Math.floor((canvas.width * canvas.height) / 16000), 70)
      particlesRef.current = Array.from({ length: count }, makeParticle)
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      frameRef.current++
      const W = canvas.width, H = canvas.height
      const mx = mouseRef.current.x, my = mouseRef.current.y

      particlesRef.current.forEach(p => {
        const dx = p.x - mx, dy = p.y - my
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 130 && dist > 0) {
          const f = ((130 - dist) / 130) * 0.35
          p.vx += (dx / dist) * f * 0.07
          p.vy += (dy / dist) * f * 0.07
        }
        p.vx *= 0.996; p.vy *= 0.996
        p.x += p.vx;   p.y += p.vy
        p.opacity += p.opacityDir * 0.0025
        if (p.opacity > 0.6 || p.opacity < 0.04) p.opacityDir *= -1
        if (p.x < -8) p.x = W + 8
        if (p.x > W + 8) p.x = -8
        if (p.y < -8) p.y = H + 8
        if (p.y > H + 8) p.y = -8

        const pulse = Math.sin(p.phase + frameRef.current * p.phaseSpeed)
        ctx.save()

        if (p.type === 'orb') {
          const r = p.size * (1 + pulse * 0.25)
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 6)
          g.addColorStop(0, p.color + (p.opacity * 0.9).toFixed(2) + ')')
          g.addColorStop(0.35, p.color + (p.opacity * 0.35).toFixed(2) + ')')
          g.addColorStop(1, p.color + '0)')
          ctx.beginPath(); ctx.arc(p.x, p.y, r * 6, 0, Math.PI * 2)
          ctx.fillStyle = g; ctx.fill()
          ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
          ctx.fillStyle = p.color + Math.min(p.opacity * 2, 1).toFixed(2) + ')'; ctx.fill()
        } else if (p.type === 'spark') {
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fillStyle = p.color + p.opacity.toFixed(2) + ')'; ctx.fill()
          const g2 = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3.5)
          g2.addColorStop(0, p.color + (p.opacity * 0.4).toFixed(2) + ')')
          g2.addColorStop(1, p.color + '0)')
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 3.5, 0, Math.PI * 2)
          ctx.fillStyle = g2; ctx.fill()
        } else {
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fillStyle = p.color + (p.opacity * 0.5).toFixed(2) + ')'; ctx.fill()
        }
        ctx.restore()
      })

      if (frameRef.current % 2 === 0) {
        const orbs = particlesRef.current.filter(p => p.type === 'orb')
        for (let i = 0; i < orbs.length; i++) {
          for (let j = i + 1; j < orbs.length; j++) {
            const a = orbs[i], b = orbs[j]
            const d = Math.sqrt((a.x-b.x)**2 + (a.y-b.y)**2)
            if (d < 200) {
              ctx.beginPath()
              ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y)
              ctx.strokeStyle = `rgba(200,162,0,${((1 - d/200) * 0.05).toFixed(3)})`
              ctx.lineWidth = 0.4; ctx.stroke()
            }
          }
        }
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    const onMouseMove = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY } }
    const onMouseLeave = () => { mouseRef.current = { x: -9999, y: -9999 } }

    resize()
    window.addEventListener('resize', resize, { passive: true })
    window.addEventListener('mousemove', onMouseMove, { passive: true })
    document.addEventListener('mouseleave', onMouseLeave)
    rafRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed', top: 0, left: 0,
        width: '100%', height: '100%',
        zIndex: 0, pointerEvents: 'none', opacity: 0.6,
      }}
    />
  )
}

// ─── Scroll Reveal ────────────────────────────────────────────────────────────
function useScrollReveal() {
  const location = useLocation()
  useEffect(() => {
    const sel = '.ts-reveal, .ts-reveal-left, .ts-reveal-right, .ts-reveal-scale, .ts-reveal-fade'
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('ts-visible') }),
      { threshold: 0.07, rootMargin: '0px 0px -30px 0px' }
    )
    const timer = setTimeout(() => {
      document.querySelectorAll(sel).forEach(el => {
        const rect = el.getBoundingClientRect()
        if (rect.top < window.innerHeight * 0.95) el.classList.add('ts-visible')
        else obs.observe(el)
      })
    }, 60)
    return () => { clearTimeout(timer); obs.disconnect() }
  }, [location.pathname])
}

// ─── Inner app ────────────────────────────────────────────────────────────────
function AppInner({ user }: { user: any }) {
  useScrollReveal()

  return (
    <>
      <ParticleSystem />
      <div className="ts-bg-blobs" />
      <div className="ts-bg-spotlight" />
      {user && <Navbar />}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(14,14,20,0.95)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(200,162,0,0.18)',
            borderLeft: '3px solid #c8a200',
            color: '#f9fafb',
            fontFamily: "'Inter', sans-serif",
            fontSize: '13px',
            fontWeight: '500',
            borderRadius: '12px',
            boxShadow: '0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(200,162,0,0.06)',
          },
          success: {
            iconTheme: { primary: '#FFD700', secondary: '#0a0a0a' },
            style: { borderLeft: '3px solid #22c55e' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
            style: { borderLeft: '3px solid #ef4444' },
          },
        }}
      />
      <main style={{ position: 'relative', zIndex: 1 }}>
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
          <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
          
          <Route path="/create-session" element={user ? <CreateSession /> : <Navigate to="/login" />} />
          <Route path="/browse-sessions" element={user ? <BrowseSessions /> : <Navigate to="/login" />} />
          <Route path="/session/:id" element={user ? <SessionDetail /> : <Navigate to="/login" />} />
          
          <Route path="/competition/:id" element={user ? <CompetitionDetail /> : <Navigate to="/login" />} />
          <Route path="/create-competition" element={user ? <CreateCompetition /> : <Navigate to="/login" />} />
          <Route path="/leaderboard" element={user ? <Leaderboard /> : <Navigate to="/login" />} />
          
          <Route path="/tournaments" element={user ? <TournamentsList /> : <Navigate to="/login" />} />
          <Route path="/create-tournament" element={user ? <CreateTournament /> : <Navigate to="/login" />} />
          <Route path="/tournament/:id" element={user ? <TournamentDetail /> : <Navigate to="/login" />} />
          
          <Route path="/find-players" element={user ? <FindPlayers /> : <Navigate to="/login" />} />
          <Route path="/marketplace" element={user ? <Marketplace /> : <Navigate to="/login" />} />
          <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
          <Route path="/messages" element={user ? <Messages /> : <Navigate to="/login" />} />
          <Route path="/admin" element={user ? <AdminPanel /> : <Navigate to="/login" />} />
          <Route path="/ai-assistant" element={user ? <AIVoice /> : <Navigate to="/login" />} />
          <Route path="/music" element={user ? <Music /> : <Navigate to="/login" />} />  
          <Route path="/community" element={user ? <CommunityHub /> : <Navigate to="/login" />} />
          <Route path="/community/:id" element={user ? <CommunityChat /> : <Navigate to="/login" />} />
          <Route path="/help" element={user ? <HelpSupport /> : <Navigate to="/login" />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
        </Routes>
      </main>
    </>
  )
}

// ─── Root App ─────────────────────────────────────────────────────────────────
function App() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isSuspended, setIsSuspended] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('status')
          .eq('id', session.user.id)
          .single()

        if (profile?.status === 'suspended') {
          setIsSuspended(true)
          await supabase.auth.signOut()
          setUser(null)
        } else {
          setUser(session.user)
          setIsSuspended(false)
        }
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('status')
          .eq('id', session.user.id)
          .single()

        if (profile?.status === 'suspended') {
          setIsSuspended(true)
          await supabase.auth.signOut()
          setUser(null)
        } else {
          setUser(session.user)
          setIsSuspended(false)
        }
      } else {
        setUser(null)
        setIsSuspended(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <LoadingScreen />

  if (isSuspended) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0D0D0F',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        padding: '20px'
      }}>
        <div style={{
          background: 'rgba(13,13,13,0.95)',
          border: '1px solid #ff444440',
          borderRadius: '16px',
          padding: '40px',
          maxWidth: '500px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚫</div>
          <h2 style={{ color: '#ff4444', fontSize: '24px', marginBottom: '8px' }}>
            Account Suspended
          </h2>
          <p style={{ color: '#888', marginBottom: '24px' }}>
            Your account has been suspended. Please contact support for assistance.
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            style={{
              padding: '10px 24px',
              background: '#c8a200',
              border: 'none',
              borderRadius: '8px',
              color: '#0a0a0a',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <AppInner user={user} />
    </BrowserRouter>
  )
}

export default App