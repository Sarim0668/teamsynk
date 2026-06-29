import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { IMAGES } from '../../constants/images'

/* ─── Keyframe injector ──────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

  .ts-body { font-family: 'Sora', sans-serif; }
  .ts-font2 { font-family: 'Plus Jakarta Sans', sans-serif; }

  @keyframes ts-float {
    0%,100% { transform: translateY(0px) rotate(0deg); }
    50%      { transform: translateY(-14px) rotate(3deg); }
  }
  @keyframes ts-float2 {
    0%,100% { transform: translateY(0px) rotate(-2deg); }
    50%      { transform: translateY(-10px) rotate(2deg); }
  }
  @keyframes ts-float3 {
    0%,100% { transform: translateY(0px); }
    50%      { transform: translateY(-18px) rotate(-3deg); }
  }
  @keyframes ts-shimmer {
    0%   { left: -100%; }
    100% { left: 200%; }
  }
  @keyframes ts-fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes ts-cardIn {
    from { opacity: 0; transform: translateY(24px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes ts-alertIn {
    from { opacity: 0; transform: translateX(-8px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes ts-pulse-gold {
    0%,100% { box-shadow: 0 0 24px rgba(200,162,0,0.2); }
    50%      { box-shadow: 0 0 48px rgba(200,162,0,0.45); }
  }
  @keyframes ts-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes ts-countUp {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes ts-particle {
    0%   { transform: translateY(0) scale(1);   opacity: 0.6; }
    100% { transform: translateY(-120px) scale(0); opacity: 0; }
  }
  @keyframes ts-tagIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes ts-networkPulse {
    0%,100% { opacity: 0.15; }
    50%      { opacity: 0.45; }
  }

  .ts-float-1 { animation: ts-float  5s ease-in-out infinite; }
  .ts-float-2 { animation: ts-float2 6s ease-in-out infinite; animation-delay: -1.5s; }
  .ts-float-3 { animation: ts-float3 4.5s ease-in-out infinite; animation-delay: -3s; }
  .ts-float-4 { animation: ts-float  5.5s ease-in-out infinite; animation-delay: -0.7s; }
  .ts-float-5 { animation: ts-float2 6.5s ease-in-out infinite; animation-delay: -2.2s; }

  .ts-shimmer-btn::after {
    content: '';
    position: absolute;
    top: 0; left: -100%;
    width: 60%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent);
    animation: ts-shimmer 2.5s infinite;
    pointer-events: none;
  }

  .ts-input:focus {
    border-color: #c8a200 !important;
    background: rgba(200,162,0,0.07) !important;
    box-shadow: 0 0 0 3px rgba(200,162,0,0.14) !important;
    outline: none !important;
  }
  .ts-input:focus + .ts-field-icon,
  .ts-field-wrap:focus-within .ts-field-icon { color: #f0c000 !important; }

  .ts-btn-gold:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 36px rgba(200,162,0,0.38) !important;
  }
  .ts-btn-gold:active:not(:disabled) { transform: translateY(0); }
  .ts-btn-gold:disabled { opacity: 0.6; cursor: not-allowed; }

  .ts-tag-1 { animation: ts-tagIn 0.5s ease 0.1s both; }
  .ts-tag-2 { animation: ts-tagIn 0.5s ease 0.3s both; }
  .ts-tag-3 { animation: ts-tagIn 0.5s ease 0.5s both; }
  .ts-card-in { animation: ts-cardIn 0.8s cubic-bezier(0.23,1,0.32,1) both; }

  .ts-net-line { animation: ts-networkPulse 3s ease-in-out infinite; }

  @media (max-width: 900px) {
    .ts-left-panel { display: none !important; }
    .ts-right-panel { width: 100% !important; }
  }
  @media (max-width: 480px) {
    .ts-auth-card { padding: 28px 20px !important; }
  }
`

/* ─── StatCounter ─────────────────────────────────────────────── */
const StatCounter: React.FC<{ target: number; suffix?: string; label: string }> = ({ target, suffix = '+', label }) => {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let cur = 0
    const step = target / 60
    const t = setInterval(() => {
      cur = Math.min(cur + step, target)
      setCount(Math.floor(cur))
      if (cur >= target) clearInterval(t)
    }, 25)
    return () => clearInterval(t)
  }, [target])
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 24, fontWeight: 700, color: '#FFD700', animation: 'ts-countUp 0.6s ease both' }}>
        {count}{count >= target ? suffix : ''}
      </span>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 500, letterSpacing: '0.5px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        {label}
      </span>
    </div>
  )
}

/* ─── SportsSVGScene ──────────────────────────────────────────── */
const SportsSVGScene: React.FC = () => (
  <svg viewBox="0 0 300 400" xmlns="http://www.w3.org/2000/svg" width="300" height="400" style={{ display: 'block' }}>
    <defs>
      <radialGradient id="ts-gball" cx="35%" cy="30%">
        <stop offset="0%" stopColor="#fff8c0" />
        <stop offset="60%" stopColor="#FFD700" />
        <stop offset="100%" stopColor="#8B6A00" />
      </radialGradient>
      <radialGradient id="ts-gcricket" cx="35%" cy="30%">
        <stop offset="0%" stopColor="#ff9999" />
        <stop offset="50%" stopColor="#cc2200" />
        <stop offset="100%" stopColor="#660000" />
      </radialGradient>
      <radialGradient id="ts-gbball" cx="35%" cy="30%">
        <stop offset="0%" stopColor="#ffcc88" />
        <stop offset="50%" stopColor="#dd6600" />
        <stop offset="100%" stopColor="#884400" />
      </radialGradient>
      <radialGradient id="ts-gtrophy" cx="40%" cy="20%">
        <stop offset="0%" stopColor="#fff8d0" />
        <stop offset="50%" stopColor="#FFD700" />
        <stop offset="100%" stopColor="#9a7000" />
      </radialGradient>
      <filter id="ts-glow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
        <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>

    {/* Network lines */}
    <g opacity="0.22" stroke="#FFD700" strokeWidth="0.8" fill="none" className="ts-net-line">
      <line x1="75"  y1="90"  x2="210" y2="55"  strokeDasharray="4 3" />
      <line x1="210" y1="55"  x2="248" y2="190" strokeDasharray="4 3" />
      <line x1="248" y1="190" x2="150" y2="300" strokeDasharray="4 3" />
      <line x1="75"  y1="90"  x2="150" y2="300" strokeDasharray="4 3" />
      <line x1="75"  y1="90"  x2="248" y2="190" strokeDasharray="4 3" />
    </g>
    <g fill="#FFD700" opacity="0.5">
      <circle cx="75"  cy="90"  r="2.5" />
      <circle cx="210" cy="55"  r="2.5" />
      <circle cx="248" cy="190" r="2.5" />
      <circle cx="150" cy="300" r="2.5" />
    </g>

    {/* Football */}
    <g className="ts-float-1" transform="translate(45,52)">
      <circle cx="30" cy="30" r="30" fill="url(#ts-gball)" filter="url(#ts-glow)" />
      <path d="M30 5 L38 18 L23 18 Z"  fill="#1a1a00" opacity="0.55" />
      <path d="M30 55 L22 42 L37 42 Z" fill="#1a1a00" opacity="0.55" />
      <path d="M5 30 L18 22 L18 37 Z"  fill="#1a1a00" opacity="0.45" />
      <path d="M55 30 L42 22 L42 37 Z" fill="#1a1a00" opacity="0.45" />
      <circle cx="30" cy="30" r="30" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
    </g>

    {/* Cricket ball */}
    <g className="ts-float-2" transform="translate(186,26)">
      <circle cx="24" cy="24" r="24" fill="url(#ts-gcricket)" filter="url(#ts-glow)" />
      <path d="M8 17 Q24 11 40 17" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
      <path d="M8 31 Q24 37 40 31" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
      <circle cx="24" cy="24" r="24" fill="none" stroke="rgba(255,200,200,0.18)" strokeWidth="1" />
    </g>

    {/* University outline */}
    <g transform="translate(98,124)" opacity="0.32">
      <rect x="20" y="58" width="66" height="56" fill="none" stroke="#FFD700" strokeWidth="1" />
      <polygon points="53,18 8,58 98,58" fill="none" stroke="#FFD700" strokeWidth="1" />
      <rect x="37" y="76" width="13" height="18" fill="rgba(255,215,0,0.14)" stroke="#FFD700" strokeWidth="0.5" />
      <rect x="57" y="76" width="13" height="18" fill="rgba(255,215,0,0.14)" stroke="#FFD700" strokeWidth="0.5" />
      <rect x="38" y="100" width="29" height="14" fill="rgba(255,215,0,0.2)" stroke="#FFD700" strokeWidth="0.5" />
      <line x1="53" y1="4" x2="53" y2="20" stroke="#FFD700" strokeWidth="1" />
      <polygon points="53,6 65,11 53,16" fill="#FFD700" opacity="0.8" />
    </g>

    {/* Basketball */}
    <g className="ts-float-3" transform="translate(218,162)">
      <circle cx="26" cy="26" r="26" fill="url(#ts-gbball)" filter="url(#ts-glow)" />
      <path d="M4 19 Q26 8 48 19" fill="none" stroke="#440000" strokeWidth="1.5" opacity="0.6" />
      <path d="M4 33 Q26 44 48 33" fill="none" stroke="#440000" strokeWidth="1.5" opacity="0.6" />
      <line x1="26" y1="0" x2="26" y2="52" stroke="#440000" strokeWidth="1.5" opacity="0.5" />
      <circle cx="26" cy="26" r="26" fill="none" stroke="rgba(255,200,100,0.18)" strokeWidth="1" />
    </g>

    {/* Trophy */}
    <g className="ts-float-4" transform="translate(116,258)">
      <filter id="ts-tglow">
        <feGaussianBlur stdDeviation="4" result="b" />
        <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <g filter="url(#ts-tglow)">
        <path d="M28 5 Q46 5 46 23 Q46 42 33 52 L33 66 L42 66 L42 72 L14 72 L14 66 L23 66 L23 52 Q10 42 10 23 Q10 5 28 5Z" fill="url(#ts-gtrophy)" />
        <path d="M10 14 Q0 14 0 24 Q0 33 10 36" fill="none" stroke="#FFD700" strokeWidth="2.5" />
        <path d="M46 14 Q56 14 56 24 Q56 33 46 36" fill="none" stroke="#FFD700" strokeWidth="2.5" />
      </g>
      <text x="-9"  y="28" fill="#FFD700" fontSize="9"  opacity="0.6">✦</text>
      <text x="62"  y="28" fill="#FFD700" fontSize="7"  opacity="0.5">✦</text>
      <text x="23"  y="-4" fill="#FFD700" fontSize="7"  opacity="0.5">✦</text>
    </g>

    {/* Gold particles */}
    {[
      { cx: 162, cy: 38,  r: 1.5, d1: '2s',   d2: '0s'    },
      { cx: 38,  cy: 195, r: 1,   d1: '3s',   d2: '-0.5s' },
      { cx: 278, cy: 95,  r: 1.5, d1: '1.8s', d2: '-1s'   },
      { cx: 142, cy: 372, r: 1,   d1: '2.5s', d2: '-1.5s' },
      { cx: 18,  cy: 310, r: 2,   d1: '4s',   d2: '-2s'   },
    ].map((p, i) => (
      <circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill="#FFD700">
        <animate attributeName="opacity" values="0.5;1;0.5" dur={p.d1} begin={p.d2} repeatCount="indefinite" />
      </circle>
    ))}

    {/* Ambient streak */}
    <line x1="0" y1="0" x2="300" y2="400" stroke="rgba(255,215,0,0.04)" strokeWidth="36" />
  </svg>
)

/* ─── PasswordInput ───────────────────────────────────────────── */
const PasswordInput: React.FC<{
  value: string
  onChange: (v: string) => void
  placeholder?: string
  id?: string
  autoComplete?: string
}> = ({ value, onChange, placeholder = '••••••••', id, autoComplete }) => {
  const [show, setShow] = useState(false)
  return (
    <div className="ts-field-wrap" style={{ position: 'relative' }}>
      {/* lock icon */}
      <svg
        className="ts-field-icon"
        style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none', transition: 'color 0.2s' }}
        width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        className="ts-input"
        style={{
          width: '100%', padding: '13px 44px 13px 42px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10, color: '#fff', fontSize: 14,
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          transition: 'all 0.25s ease',
          boxSizing: 'border-box',
        }}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        aria-label={show ? 'Hide password' : 'Show password'}
        style={{
          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(255,255,255,0.35)', fontSize: 15, padding: 4, lineHeight: 1,
          transition: 'color 0.2s',
        }}
      >
        {show ? '🙈' : '👁'}
      </button>
    </div>
  )
}

/* ─── FieldLabel ──────────────────────────────────────────────── */
const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{
    fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)',
    letterSpacing: '1px', textTransform: 'uppercase',
    marginBottom: 7, fontFamily: 'Plus Jakarta Sans, sans-serif',
  }}>
    {children}
  </div>
)

/* ─── EmailInput ──────────────────────────────────────────────── */
const EmailInput: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => (
  <div className="ts-field-wrap" style={{ position: 'relative' }}>
    <svg
      className="ts-field-icon"
      style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none', transition: 'color 0.2s' }}
      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
    <input
      type="email"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder="your@university.edu.pk"
      autoComplete="email"
      required
      className="ts-input"
      style={{
        width: '100%', padding: '13px 14px 13px 42px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10, color: '#fff', fontSize: 14,
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        transition: 'all 0.25s ease',
        boxSizing: 'border-box',
      }}
    />
  </div>
)

/* ─── Alert ───────────────────────────────────────────────────── */
const Alert: React.FC<{ message: string; type?: 'error' | 'success' }> = ({ message, type = 'error' }) => (
  <div style={{
    display: 'flex', alignItems: 'flex-start', gap: 10,
    padding: '12px 16px', borderRadius: 10, marginBottom: 16,
    background: type === 'error' ? 'rgba(220,50,50,0.12)' : 'rgba(50,200,100,0.1)',
    border: `1px solid ${type === 'error' ? 'rgba(220,50,50,0.3)' : 'rgba(50,200,100,0.25)'}`,
    color: type === 'error' ? '#ff7070' : '#60e090',
    fontSize: 13, fontFamily: 'Plus Jakarta Sans, sans-serif',
    animation: 'ts-alertIn 0.3s ease both',
  }}>
    <span style={{ flexShrink: 0, marginTop: 1 }}>{type === 'error' ? '⚠' : '✓'}</span>
    {message}
  </div>
)

/* ─── Spinner ─────────────────────────────────────────────────── */
const Spinner: React.FC = () => (
  <span style={{
    display: 'inline-block', width: 16, height: 16,
    border: '2px solid rgba(10,8,0,0.3)',
    borderTopColor: '#0a0800',
    borderRadius: '50%',
    animation: 'ts-spin 0.7s linear infinite',
    marginRight: 8, verticalAlign: 'middle',
  }} />
)

/* ═══════════════════════════════════════════════════════════════
   LOGIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export const Login: React.FC = () => {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const cardRef = useRef<HTMLDivElement>(null)

  /* ── original Supabase auth logic — untouched ── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('status')
          .eq('id', data.user.id)
          .single()

        if (profileError) throw profileError

        if (profile?.status === 'suspended') {
          await supabase.auth.signOut()
          setError('⚠️ Your account has been suspended. Please contact support.')
          setLoading(false)
          return
        }

        window.location.href = '/'
      }
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  /* ── 3-D card tilt on mouse move ── */
  const handleMouseMove = (e: React.MouseEvent) => {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const dx = (e.clientX - (rect.left + rect.width  / 2)) / (rect.width  / 2)
    const dy = (e.clientY - (rect.top  + rect.height / 2)) / (rect.height / 2)
    card.style.transform = `perspective(1200px) rotateY(${dx * 4}deg) rotateX(${-dy * 3}deg)`
  }
  const handleMouseLeave = () => {
    if (cardRef.current) cardRef.current.style.transform = 'perspective(1200px) rotateY(0deg) rotateX(0deg)'
  }

  return (
    <>
      <style>{CSS}</style>

      <div
        className="ts-body"
        style={{
          minHeight: '100vh', display: 'flex', alignItems: 'stretch',
          background: '#060608', position: 'relative', overflow: 'hidden',
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* ── Particle canvas background ── */}
        <ParticleBackground />

        {/* ══ LEFT BRANDING PANEL ══ */}
        <div
          className="ts-left-panel"
          style={{
            width: '52%', display: 'flex', flexDirection: 'column',
            justifyContent: 'center', padding: '60px 50px',
            position: 'relative', zIndex: 1, overflow: 'hidden',
          }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 48 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: 'linear-gradient(135deg,#c8a200,#FFD700)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 800, color: '#0a0800',
              boxShadow: '0 0 30px rgba(200,162,0,0.4)',
            }}>TS</div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '0.5px' }}>
              Team<span style={{ color: '#FFD700' }}>Synk</span>
            </div>
          </div>

          {/* Tagline */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 52, alignItems: 'center', flexWrap: 'wrap' }}>
            {['LINK.', 'CONNECT.', 'PLAY.'].map((w, i) => (
              <React.Fragment key={w}>
                <span className={`ts-tag-${i + 1}`} style={{ fontSize: 11, fontWeight: 600, letterSpacing: 3, color: '#f0c000' }}>{w}</span>
                {i < 2 && <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11 }}>·</span>}
              </React.Fragment>
            ))}
          </div>

          {/* Heading */}
          <div style={{ fontSize: 42, fontWeight: 800, lineHeight: 1.15, marginBottom: 20, letterSpacing: '-1px', animation: 'ts-fadeUp 0.7s ease 0.2s both' }}>
            Where Pakistani<br />
            <span style={{
              background: 'linear-gradient(90deg,#c8a200,#FFD700,#fff8c0)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>Student Athletes</span><br />
            Find Their Team
          </div>

          {/* Sub */}
          <div className="ts-font2" style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, maxWidth: 380, marginBottom: 52, animation: 'ts-fadeUp 0.7s ease 0.35s both' }}>
            Join the fastest-growing university sports network in Pakistan.
            Find teammates, organise sessions, buy gear — all in one premium platform.
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 32, marginBottom: 52, animation: 'ts-fadeUp 0.7s ease 0.5s both' }}>
            <StatCounter target={10}   suffix="+"  label="Universities"    />
            <StatCounter target={1000} suffix="+"  label="Students"        />
            <StatCounter target={500}  suffix="+"  label="Sports Sessions" />
          </div>

          {/* Testimonial */}
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(200,162,0,0.22)',
            borderRadius: 14, padding: '18px 22px', maxWidth: 380,
            animation: 'ts-fadeUp 0.7s ease 0.65s both',
          }}>
            <div className="ts-font2" style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, marginBottom: 10 }}>
              "Found my cricket squad in literally 10 minutes. TeamSynk is exactly what FAST needed."
            </div>
            <div style={{ fontSize: 12, color: '#f0c000', fontWeight: 600 }}>
              — Ali Hassan, FAST Islamabad · Computer Science
            </div>
          </div>

          {/* SVG sports scene */}
          <div style={{ position: 'absolute', right: -20, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: 0.9 }}>
            <SportsSVGScene />
          </div>
        </div>

        {/* ══ RIGHT AUTH PANEL ══ */}
        <div
          className="ts-right-panel"
          style={{
            width: '48%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', padding: '40px 50px 40px 30px',
            position: 'relative', zIndex: 1,
          }}
        >
          <div
            ref={cardRef}
            className="ts-auth-card ts-card-in"
            style={{
              background: 'rgba(13,13,20,0.88)',
              border: '1px solid rgba(200,162,0,0.25)',
              borderRadius: 20, padding: 44,
              width: '100%', maxWidth: 420,
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              boxShadow: '0 0 0 1px rgba(200,162,0,0.07), 0 30px 80px rgba(0,0,0,0.6), 0 0 60px rgba(200,162,0,0.06)',
              transition: 'transform 0.12s ease',
            }}
          >
            {/* Card logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28, justifyContent: 'center' }}>
              <div style={{
                width: 34, height: 34, borderRadius: 9,
                background: 'linear-gradient(135deg,#c8a200,#FFD700)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 800, color: '#0a0800',
              }}>TS</div>
              <div style={{ fontSize: 17, fontWeight: 700 }}>
                Team<span style={{ color: '#FFD700' }}>Synk</span>
              </div>
            </div>

            {/* Heading */}
            <div style={{ fontSize: 26, fontWeight: 700, textAlign: 'center', marginBottom: 6, letterSpacing: '-0.5px' }}>
              Welcome back!
            </div>
            <div className="ts-font2" style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginBottom: 28, lineHeight: 1.5 }}>
              Continue your journey with TeamSynk.
            </div>

            {/* Alert */}
            {error && <Alert message={error} type="error" />}

            {/* Form */}
            <form onSubmit={handleLogin} noValidate>
              {/* Email field */}
              <div style={{ marginBottom: 16 }}>
                <FieldLabel>Email</FieldLabel>
                <EmailInput value={email} onChange={setEmail} />
              </div>

              {/* Password field */}
              <div style={{ marginBottom: 28 }}>
                <FieldLabel>Password</FieldLabel>
                <PasswordInput
                  value={password}
                  onChange={setPassword}
                  autoComplete="current-password"
                />
              </div>

              {/* CTA button */}
              <button
                type="submit"
                disabled={loading}
                className="ts-btn-gold ts-shimmer-btn"
                style={{
                  width: '100%', padding: '15px 0',
                  background: 'linear-gradient(135deg,#c8a200 0%,#FFD700 50%,#f0c840 100%)',
                  border: 'none', borderRadius: 11,
                  color: '#0a0800', fontSize: 15, fontWeight: 700,
                  fontFamily: 'Sora, sans-serif', cursor: 'pointer',
                  position: 'relative', overflow: 'hidden',
                  transition: 'all 0.25s ease', letterSpacing: '0.3px',
                  boxShadow: '0 4px 20px rgba(200,162,0,0.2)',
                }}
              >
                {loading ? <><Spinner />Signing you in…</> : 'Sign In to TeamSynk'}
              </button>
            </form>

            {/* Footer */}
            <div className="ts-font2" style={{ textAlign: 'center', marginTop: 22, fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
              No account?{' '}
              <Link to="/register" style={{ color: '#f0c000', textDecoration: 'none', fontWeight: 600 }}>
                Join the community →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

/* ─── Canvas particle background ────────────────────────────── */
const ParticleBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let animId: number

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    interface P { x: number; y: number; size: number; speed: number; opacity: number; hue: number; drift: number; life: number; maxLife: number }
    const rnd = (a: number, b: number) => Math.random() * (b - a) + a

    const make = (init = false): P => ({
      x: rnd(0, canvas.width),
      y: init ? rnd(0, canvas.height) : canvas.height + 10,
      size:    rnd(0.5, 2.5),
      speed:   rnd(0.2, 0.8),
      opacity: rnd(0.2, 0.7),
      hue:     rnd(40, 60),
      drift:   rnd(-0.3, 0.3),
      life: 0, maxLife: rnd(200, 600),
    })

    const particles: P[] = Array.from({ length: 80 }, () => make(true))

    const orbs = [
      { x: 0.15, y: 0.4, r: 200, c: 'rgba(200,162,0,0.06)' },
      { x: 0.85, y: 0.6, r: 250, c: 'rgba(200,162,0,0.04)' },
      { x: 0.5,  y: 0.1, r: 150, c: 'rgba(255,215,0,0.05)' },
    ]

    const loop = () => {
      const W = canvas.width, H = canvas.height
      ctx.fillStyle = '#060608'
      ctx.fillRect(0, 0, W, H)

      orbs.forEach(o => {
        const g = ctx.createRadialGradient(o.x * W, o.y * H, 0, o.x * W, o.y * H, o.r)
        g.addColorStop(0, o.c); g.addColorStop(1, 'transparent')
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
      })

      ctx.strokeStyle = 'rgba(200,162,0,0.035)'; ctx.lineWidth = 1
      for (let x = 0; x < W; x += 80) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
      for (let y = 0; y < H; y += 80) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }

      particles.forEach(p => {
        p.y -= p.speed; p.x += p.drift; p.life++
        if (p.life > p.maxLife || p.y < -10) Object.assign(p, make())
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${p.hue},90%,65%,${p.opacity * (1 - p.life / p.maxLife)})`
        ctx.fill()
      })

      animId = requestAnimationFrame(loop)
    }
    loop()

    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}
    />
  )
}