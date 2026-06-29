// src/components/dashboard/Dashboard.tsx
import React, { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { IMAGES } from '../../constants/images'

/* ═══════════════════════════════════════════════════════════════════
   GLOBAL STYLES
═══════════════════════════════════════════════════════════════════ */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --gold:  #FFD700;
    --gold2: #c8a200;
    --gold3: #f0c000;
    --bg:    #06060a;
    --bg2:   #0d0d14;
    --bg3:   #13131c;
    --glass: rgba(255,255,255,0.04);
    --glass-hover: rgba(255,255,255,0.07);
    --gb: rgba(200,162,0,0.18);
    --gb2: rgba(200,162,0,0.35);
    --text:  #ffffff;
    --text2: rgba(255,255,255,0.65);
    --text3: rgba(255,255,255,0.32);
    --font:  'Sora', sans-serif;
    --font2: 'Plus Jakarta Sans', sans-serif;
    --r: 14px;
    --r2: 20px;
  }

  body { background: var(--bg); color: var(--text); font-family: var(--font); }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(200,162,0,0.2); border-radius: 4px; }

  @keyframes ts-spin     { to { transform: rotate(360deg); } }
  @keyframes ts-pulse    { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.15)} }
  @keyframes ts-fadeUp   { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ts-fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes ts-float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
  @keyframes ts-shimmer  { 0%{left:-100%} 100%{left:200%} }
  @keyframes ts-countUp  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ts-glow     { 0%,100%{box-shadow:0 0 20px rgba(200,162,0,0.15)} 50%{box-shadow:0 0 40px rgba(200,162,0,0.4)} }
  @keyframes ts-ripple   { to{transform:scale(4);opacity:0} }
  @keyframes ts-slide-r  { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
  @keyframes ts-net      { 0%,100%{opacity:0.12} 50%{opacity:0.35} }

  .ts-stagger-1 { animation: ts-fadeUp .6s ease .05s both; }
  .ts-stagger-2 { animation: ts-fadeUp .6s ease .12s both; }
  .ts-stagger-3 { animation: ts-fadeUp .6s ease .20s both; }
  .ts-stagger-4 { animation: ts-fadeUp .6s ease .28s both; }
  .ts-stagger-5 { animation: ts-fadeUp .6s ease .36s both; }
  .ts-stagger-6 { animation: ts-fadeUp .6s ease .44s both; }

  .ts-card {
    background: var(--bg2);
    border: 1px solid rgba(255,255,255,0.055);
    border-radius: var(--r2);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    transition: border-color .25s ease, transform .25s ease, box-shadow .25s ease;
    position: relative;
    overflow: hidden;
  }
  .ts-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.025) 0%, transparent 60%);
    pointer-events: none;
    border-radius: inherit;
  }
  .ts-card:hover {
    border-color: rgba(200,162,0,0.28);
    transform: translateY(-3px);
    box-shadow: 0 20px 60px rgba(0,0,0,0.45), 0 0 40px rgba(200,162,0,0.06);
  }
  .ts-card-gold {
    border-color: rgba(200,162,0,0.28) !important;
    background: linear-gradient(135deg, rgba(200,162,0,0.1), rgba(200,162,0,0.04)) !important;
  }

  .ts-btn-shimmer { position: relative; overflow: hidden; }
  .ts-btn-shimmer::after {
    content: '';
    position: absolute;
    top: 0; left: -100%; width: 55%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
    animation: ts-shimmer 3s infinite;
    pointer-events: none;
  }

  .ts-cta {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 11px 22px;
    background: linear-gradient(135deg, #c8a200, #FFD700, #f0c840);
    border: none; border-radius: 11px;
    color: #0a0800; font-size: 13px; font-weight: 700;
    font-family: var(--font); cursor: pointer; text-decoration: none;
    transition: transform .2s ease, box-shadow .2s ease;
    box-shadow: 0 4px 20px rgba(200,162,0,0.25);
  }
  .ts-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 36px rgba(200,162,0,0.4); }
  .ts-cta:active { transform: translateY(0); }

  .ts-ghost {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 8px 16px;
    background: rgba(200,162,0,0.07);
    border: 1px solid rgba(200,162,0,0.18);
    border-radius: 9px;
    color: var(--gold3); font-size: 12px; font-weight: 600;
    text-decoration: none; font-family: var(--font2);
    transition: background .2s ease, border-color .2s ease;
  }
  .ts-ghost:hover { background: rgba(200,162,0,0.14); border-color: rgba(200,162,0,0.35); }

  .ts-sec-eyebrow {
    display: flex; align-items: center; gap: 8px;
    color: var(--text3); font-size: 10px; font-weight: 700;
    letter-spacing: .12em; text-transform: uppercase;
    font-family: var(--font2); margin-bottom: 4px;
  }
  .ts-sec-eyebrow::before {
    content: ''; display: block;
    width: 14px; height: 1px;
    background: rgba(200,162,0,0.4);
    flex-shrink: 0;
  }
  .ts-sec-title {
    font-size: 22px; font-weight: 700;
    color: var(--text); letter-spacing: -.02em; margin: 0;
  }

  .ts-pill {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 10px; border-radius: 99px;
    font-size: 10px; font-weight: 700; font-family: var(--font2);
    letter-spacing: .04em;
  }
  .ts-pill-gold { background: rgba(200,162,0,.1); border:1px solid rgba(200,162,0,.25); color: var(--gold3); }
  .ts-pill-green { background: rgba(34,197,94,.1); border:1px solid rgba(34,197,94,.25); color: #4ade80; }
  .ts-pill-blue  { background: rgba(59,130,246,.1); border:1px solid rgba(59,130,246,.25); color: #60a5fa; }
  .ts-pill-purple{ background: rgba(168,85,247,.1); border:1px solid rgba(168,85,247,.25); color: #c084fc; }
  .ts-pill-grey  { background: rgba(107,114,128,.1); border:1px solid rgba(107,114,128,.25); color: #6b7280; }

  .ts-medal {
    width: 38px; height: 38px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; font-size: 17px; font-weight: 800;
    transition: transform .2s ease;
  }

  .ts-qa {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 8px; padding: 20px 12px;
    background: var(--bg2);
    border: 1px solid rgba(255,255,255,0.055);
    border-radius: var(--r2);
    cursor: pointer; text-decoration: none;
    transition: all .25s ease;
    color: var(--text); font-family: var(--font2);
  }
  .ts-qa:hover {
    border-color: rgba(200,162,0,0.32);
    transform: translateY(-4px);
    box-shadow: 0 16px 48px rgba(0,0,0,0.4), 0 0 30px rgba(200,162,0,0.08);
  }
  .ts-qa-icon {
    width: 46px; height: 46px; border-radius: 13px;
    display: flex; align-items: center; justify-content: center;
    font-size: 22px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    transition: background .25s ease, transform .25s ease;
  }
  .ts-qa:hover .ts-qa-icon {
    background: rgba(200,162,0,0.14);
    border-color: rgba(200,162,0,0.28);
    transform: scale(1.1) rotate(-4deg);
  }
  .ts-qa-label { font-size: 12px; font-weight: 600; color: var(--text2); text-align: center; line-height: 1.3; }

  .ts-grid-2 { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px,1fr)); gap: 14px; }
  .ts-grid-3 { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px,1fr)); gap: 14px; }
  .ts-grid-qa{ display: grid; grid-template-columns: repeat(auto-fill, minmax(130px,1fr)); gap: 12px; }

  .ts-nav-item {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 14px; border-radius: 10px;
    color: var(--text2); font-size: 13px; font-weight: 500;
    text-decoration: none; font-family: var(--font2);
    transition: all .2s ease; position: relative;
  }
  .ts-nav-item:hover { background: rgba(255,255,255,0.05); color: var(--text); }
  .ts-nav-item.active { background: rgba(200,162,0,0.12); color: var(--gold3); }
  .ts-nav-item.active::before {
    content: ''; position: absolute; left: 0; top: 20%; bottom: 20%;
    width: 3px; border-radius: 0 3px 3px 0;
    background: linear-gradient(180deg, var(--gold2), var(--gold));
  }

  #ts-canvas { position: fixed; inset: 0; z-index: 0; pointer-events: none; }

  @media (max-width: 900px) {
    .ts-left-sidebar { display: none !important; }
    .ts-main-content { margin-left: 0 !important; }
  }
  @media (max-width: 640px) {
    .ts-hero-heading { font-size: 28px !important; }
    .ts-grid-qa { grid-template-columns: repeat(auto-fill, minmax(100px,1fr)) !important; }
  }
`

/* ═══════════════════════════════════════════════════════════════════
   CANVAS BACKGROUND
═══════════════════════════════════════════════════════════════════ */
const CanvasBackground: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current!
    const ctx = canvas.getContext('2d')!
    let id: number
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize(); window.addEventListener('resize', resize)
    const rnd = (a: number, b: number) => Math.random() * (b - a) + a
    type P = { x:number;y:number;size:number;speed:number;opacity:number;hue:number;drift:number;life:number;maxLife:number }
    const make = (init=false): P => ({
      x: rnd(0, canvas.width), y: init ? rnd(0, canvas.height) : canvas.height + 10,
      size: rnd(.4, 2), speed: rnd(.15, .7), opacity: rnd(.2, .65),
      hue: rnd(40, 58), drift: rnd(-.25, .25), life: 0, maxLife: rnd(180, 560),
    })
    const particles: P[] = Array.from({length: 90}, () => make(true))
    const orbs = [
      {x:.12,y:.5,r:260,c:'rgba(200,162,0,0.055)'},
      {x:.88,y:.55,r:300,c:'rgba(200,162,0,0.04)'},
      {x:.5,y:.05,r:180,c:'rgba(255,215,0,0.04)'},
    ]
    const loop = () => {
      const W=canvas.width, H=canvas.height
      ctx.fillStyle='#06060a'; ctx.fillRect(0,0,W,H)
      orbs.forEach(o=>{
        const g=ctx.createRadialGradient(o.x*W,o.y*H,0,o.x*W,o.y*H,o.r)
        g.addColorStop(0,o.c); g.addColorStop(1,'transparent')
        ctx.fillStyle=g; ctx.fillRect(0,0,W,H)
      })
      ctx.strokeStyle='rgba(200,162,0,0.028)'; ctx.lineWidth=1
      for(let x=0;x<W;x+=90){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke()}
      for(let y=0;y<H;y+=90){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
      particles.forEach(p=>{
        p.y-=p.speed; p.x+=p.drift; p.life++
        if(p.life>p.maxLife||p.y<-10) Object.assign(p,make())
        ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2)
        ctx.fillStyle=`hsla(${p.hue},88%,65%,${p.opacity*(1-p.life/p.maxLife)})`
        ctx.fill()
      })
      id=requestAnimationFrame(loop)
    }
    loop()
    return ()=>{cancelAnimationFrame(id); window.removeEventListener('resize',resize)}
  },[])
  return <canvas ref={ref} id="ts-canvas" />
}

/* ═══════════════════════════════════════════════════════════════════
   TINY HELPERS
═══════════════════════════════════════════════════════════════════ */
const Divider = () => (
  <div style={{height:1, background:'linear-gradient(90deg,transparent,rgba(200,162,0,0.18),transparent)', margin:'28px 0'}} />
)

const SectionHeader: React.FC<{
  eyebrow: string; title: string; action?: React.ReactNode
}> = ({eyebrow, title, action}) => (
  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:18,flexWrap:'wrap',gap:10}}>
    <div>
      <div className="ts-sec-eyebrow">{eyebrow}</div>
      <h2 className="ts-sec-title">{title}</h2>
    </div>
    {action}
  </div>
)

function getMedal(rank: number) {
  if (rank===1) return '🥇'
  if (rank===2) return '🥈'
  if (rank===3) return '🥉'
  return `#${rank}`
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
}

function formatDate() {
  return new Date().toLocaleDateString('en-PK', {weekday:'long', day:'numeric', month:'long'})
}

const MOTIVATIONAL_QUOTES = [
  "Champions train when nobody is watching.",
  "Every game begins with one decision.",
  "Your next teammate is one session away.",
  "The field doesn't care about excuses.",
  "Great teams are built, not found.",
]
const DAILY_QUOTE = MOTIVATIONAL_QUOTES[new Date().getDate() % MOTIVATIONAL_QUOTES.length]

/* ═══════════════════════════════════════════════════════════════════
   INVITE FRIENDS MODAL
═══════════════════════════════════════════════════════════════════ */
const InviteModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [copied, setCopied] = useState(false)
  const shareUrl = window.location.origin

  const shareLinks = [
    { name: 'WhatsApp', icon: '💬', url: `https://wa.me/?text=Join%20me%20on%20TeamSynk!%20${shareUrl}` },
    { name: 'Instagram', icon: '📸', url: `https://www.instagram.com/` },
    { name: 'Facebook', icon: '👍', url: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}` },
    { name: 'LinkedIn', icon: '💼', url: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}` },
    { name: 'Twitter/X', icon: '🐦', url: `https://twitter.com/intent/tweet?text=Join%20me%20on%20TeamSynk!&url=${shareUrl}` },
    { name: 'Copy Link', icon: '📋', url: '#' },
  ]

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch (err) {
      // Fallback
      const textArea = document.createElement('textarea')
      textArea.value = shareUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }
  }

  const handleShare = (url: string, name: string) => {
    if (name === 'Copy Link') {
      handleCopyLink()
      return
    }
    if (name === 'Instagram') {
      alert('📸 Open Instagram app and share your profile link!\n\nYour link: ' + shareUrl)
      return
    }
    window.open(url, '_blank', 'width=600,height=400')
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      animation: 'ts-fadeIn 0.3s ease'
    }} onClick={onClose}>
      <div style={{
        background: 'rgba(13,13,20,0.98)',
        borderRadius: '24px',
        border: '1px solid rgba(200,162,0,0.2)',
        maxWidth: '480px',
        width: '100%',
        padding: '32px',
        position: 'relative',
        animation: 'ts-fadeUp 0.3s ease'
      }} onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,0.3)',
            fontSize: '24px',
            cursor: 'pointer',
            transition: 'color 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'white'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
        >
          ✕
        </button>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📢</div>
          <h2 style={{ color: '#FFD700', fontSize: '24px', fontWeight: '700' }}>
            Invite Friends
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Share TeamSynk with your friends and build your network!
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: '10px',
          marginBottom: '16px'
        }}>
          {shareLinks.map((link) => (
            <button
              key={link.name}
              onClick={() => handleShare(link.url, link.name)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                padding: '14px 10px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: '11px',
                fontWeight: '600'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(200,162,0,0.12)'
                e.currentTarget.style.borderColor = 'rgba(200,162,0,0.3)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <span style={{ fontSize: '24px' }}>{link.icon}</span>
              {link.name}
              {link.name === 'Copy Link' && copied && (
                <span style={{
                  fontSize: '9px',
                  color: '#4ade80',
                  fontWeight: 'bold'
                }}>
                  ✅ Copied!
                </span>
              )}
            </button>
          ))}
        </div>

        <div style={{
          padding: '12px',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '10px',
          border: '1px solid rgba(255,255,255,0.05)',
          marginBottom: '12px'
        }}>
          <p style={{
            color: 'rgba(255,255,255,0.3)',
            fontSize: '11px',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            textAlign: 'center',
            wordBreak: 'break-all'
          }}>
            🔗 {shareUrl}
          </p>
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '12px',
            background: 'linear-gradient(135deg, #c8a200, #FFD700)',
            border: 'none',
            borderRadius: '10px',
            color: '#0a0800',
            fontWeight: '700',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          Close
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   STAT PILL
═══════════════════════════════════════════════════════════════════ */
function StatPill({ icon, value, label, highlight }: { icon:string; value:number; label:string; highlight?:boolean }) {
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:3,
      color: highlight ? '#FFD700' : 'rgba(255,255,255,0.38)',
      fontSize: 11, fontWeight: highlight ? 700 : 500,
      fontFamily: 'Plus Jakarta Sans, sans-serif',
    }}>
      {icon} {value}
    </span>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   UNIVERSITY LEADERBOARD CARD
═══════════════════════════════════════════════════════════════════ */
function UniversityLeaderboardCard({ uni, index, isUserUni }: { uni:any; index:number; isUserUni:boolean }) {
  const [hovered, setHovered] = useState(false)
  const rank = uni.rank || index + 1

  return (
    <div
      className={`ts-card ${isUserUni ? 'ts-card-gold' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '18px 22px',
        animation: `ts-fadeUp .5s ease ${index * 55 + 80}ms both`,
        background: isUserUni
          ? 'linear-gradient(135deg,rgba(200,162,0,0.13),rgba(200,162,0,0.04))'
          : hovered ? 'rgba(18,18,26,0.98)' : 'rgba(13,13,20,0.9)',
      }}
    >
      {isUserUni && (
        <div style={{
          position:'absolute', top:0, right:0,
          padding:'4px 12px',
          background:'linear-gradient(135deg,#c8a200,#FFD700)',
          color:'#0a0800', fontSize:9, fontWeight:800,
          borderRadius:'0 20px 0 12px', letterSpacing:'.08em',
        }}>YOUR UNIVERSITY</div>
      )}

      <div style={{display:'flex', alignItems:'center', gap:16}}>
        <div className="ts-medal" style={{
          background: isUserUni
            ? 'linear-gradient(135deg,#c8a200,#FFD700)'
            : rank <= 3 ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.04)',
          border:`1px solid ${isUserUni ? 'rgba(200,162,0,0.5)' : rank<=3 ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.06)'}`,
          color: isUserUni ? '#0a0800' : rank<=3 ? '#FFD700' : 'rgba(255,255,255,0.3)',
          fontSize: rank<=3 ? 18 : 12,
        }}>
          {getMedal(rank)}
        </div>

        <div style={{flex:1, minWidth:0}}>
          <div style={{display:'flex', alignItems:'center', gap:8, flexWrap:'wrap'}}>
            <span style={{fontWeight: isUserUni?800:600, color: isUserUni?'#FFD700':'white', fontSize:15, letterSpacing:'-.01em'}}>
              {uni.name}
            </span>
            <span style={{
              fontSize:10, color:'rgba(255,255,255,0.3)',
              background:'rgba(255,255,255,0.05)', padding:'2px 8px', borderRadius:99,
              fontFamily:'Plus Jakarta Sans,sans-serif',
            }}>{uni.short_name}</span>
          </div>
          <div style={{display:'flex', gap:16, marginTop:5, flexWrap:'wrap'}}>
            <StatPill icon="👥" value={uni.total_members||0} label="Members" />
            <StatPill icon="🏟️" value={uni.total_sessions_created||0} label="Sessions" />
            <StatPill icon="🏆" value={uni.competitions_won||0} label="Wins" />
            <StatPill icon="⭐" value={uni.total_points||0} label="Points" highlight />
          </div>
        </div>

        <div style={{
          padding:'7px 18px', borderRadius:99,
          background: isUserUni ? 'linear-gradient(135deg,#c8a200,#FFD700)' : 'rgba(200,162,0,0.08)',
          border:`1px solid ${isUserUni ? 'rgba(200,162,0,0.5)' : 'rgba(200,162,0,0.2)'}`,
          fontSize:14, fontWeight:800,
          color: isUserUni ? '#0a0800' : '#FFD700',
          flexShrink:0, fontFamily:'Sora,sans-serif',
        }}>{uni.total_points||0}</div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   COMPETITION CARD
═══════════════════════════════════════════════════════════════════ */
function CompetitionCard({ competition, index }: { competition:any; index:number }) {
  const [hovered, setHovered] = useState(false)

  const typeMap: Record<string,{bg:string;color:string;label:string}> = {
    internal:          {bg:'rgba(59,130,246,.1)',  color:'#60a5fa', label:'🏠 Internal'},
    inter_university:  {bg:'rgba(168,85,247,.1)', color:'#c084fc', label:'🌍 Inter-Uni'},
  }
  const type = typeMap[competition.competition_type] || typeMap.internal

  const statusCls = competition.status==='active' ? 'ts-pill-green'
    : competition.status==='upcoming' ? 'ts-pill-gold' : 'ts-pill-grey'
  const statusLabel = competition.status==='active' ? '🟢 Live'
    : competition.status==='upcoming' ? '🟡 Upcoming' : '⚪ Completed'

  return (
    <div
      className="ts-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding:20, cursor:'pointer',
        animation:`ts-fadeUp .5s ease ${index*60+200}ms both`,
        background: hovered ? 'rgba(18,18,26,0.98)' : 'rgba(13,13,20,0.9)',
      }}
    >
      <div style={{
        position:'absolute', top:0, left:0, right:0, height:2,
        background:`linear-gradient(90deg, ${type.color}50, transparent)`,
        borderRadius:'20px 20px 0 0',
      }} />

      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12}}>
        <div>
          <div style={{fontSize:16, fontWeight:700, color:'white', marginBottom:3, letterSpacing:'-.01em'}}>
            {competition.title}
          </div>
          <div style={{fontSize:12, color:'rgba(255,255,255,0.4)', fontFamily:'Plus Jakarta Sans,sans-serif'}}>
            ⚽ {competition.sport_type || 'Sports'}
          </div>
        </div>
        <span className={`ts-pill ${statusCls}`}>{statusLabel}</span>
      </div>

      <div style={{display:'flex', gap:14, flexWrap:'wrap', marginBottom:14}}>
        <span style={{color:'rgba(255,255,255,0.35)', fontSize:12, fontFamily:'Plus Jakarta Sans,sans-serif'}}>
          📅 {new Date(competition.start_date).toLocaleDateString()}
        </span>
        <span style={{color:'rgba(255,255,255,0.35)', fontSize:12, fontFamily:'Plus Jakarta Sans,sans-serif'}}>
          👥 {competition.participants_count||0}
        </span>
        {competition.prize && (
          <span style={{color:'#FFD700', fontSize:12, fontFamily:'Plus Jakarta Sans,sans-serif'}}>
            🏆 {competition.prize}
          </span>
        )}
      </div>

      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        paddingTop:12, borderTop:'1px solid rgba(255,255,255,0.06)',
      }}>
        <span className={`ts-pill`} style={{background:type.bg, border:`1px solid ${type.color}30`, color:type.color}}>
          {type.label}
        </span>
        <Link
          to={`/competition/${competition.id}`}
          className="ts-ghost"
          style={{fontSize:11}}
        >
          Details →
        </Link>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   SESSION CARD
═══════════════════════════════════════════════════════════════════ */
function SessionCard({ session, index }: { session:any; index:number }) {
  const [hovered, setHovered] = useState(false)
  const SPORT_ICONS: Record<string,string> = {
    Football:'⚽', Cricket:'🏏', Basketball:'🏀', Volleyball:'🏐',
    Badminton:'🏸', Tennis:'🎾', Running:'🏃', Swimming:'🏊', default:'🏟️',
  }
  const icon = SPORT_ICONS[session.sport_type] || SPORT_ICONS.default

  return (
    <div
      className="ts-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding:22,
        animation:`ts-fadeUp .5s ease ${index*65+300}ms both`,
        background: hovered ? 'rgba(18,18,26,0.98)' : 'rgba(13,13,20,0.9)',
      }}
    >
      <div style={{
        display:'inline-flex', alignItems:'center', justifyContent:'center',
        width:46, height:46, borderRadius:13,
        background:'rgba(255,255,255,0.05)',
        border:'1px solid rgba(255,255,255,0.08)',
        fontSize:22, marginBottom:14,
        transition:'transform .25s ease, background .25s ease',
        transform: hovered ? 'scale(1.1) rotate(-5deg)' : 'none',
        ...(hovered ? {background:'rgba(200,162,0,0.14)', borderColor:'rgba(200,162,0,0.3)'} : {}),
      }}>{icon}</div>

      <div style={{fontSize:16, fontWeight:700, color:'white', marginBottom:4, letterSpacing:'-.01em'}}>
        {session.sport_type}
      </div>
      <div style={{fontSize:12, color:'rgba(255,255,255,0.38)', fontFamily:'Plus Jakarta Sans,sans-serif', marginBottom:16}}>
        📍 {session.location}
      </div>

      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        paddingTop:12, borderTop:'1px solid rgba(255,255,255,0.06)',
      }}>
        <div>
          <div className="ts-pill ts-pill-gold">{session.session_date}</div>
          <div style={{fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:4, fontFamily:'Plus Jakarta Sans,sans-serif'}}>
            ⏰ {session.session_time?.substring(0,5)}
          </div>
        </div>
        <Link
          to={`/session/${session.id}`}
          className="ts-ghost"
          style={{fontSize:11}}
        >
          Join →
        </Link>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   QUICK ACTIONS (FIXED)
═══════════════════════════════════════════════════════════════════ */
const QUICK_ACTIONS = [
  {icon:'➕', label:'Create Session',   to:'/create-session'},
  {icon:'🔍', label:'Find Players',     to:'/find-players'},
  {icon:'🏪', label:'Marketplace',      to:'/marketplace'},
  {icon:'👥', label:'Communities',      to:'/community'},
  {icon:'🏆', label:'Tournaments',      to:'/tournaments'},
  {icon:'📢', label:'Invite Friends',   to:'#invite'},
]

/* ═══════════════════════════════════════════════════════════════════
   NAV ITEMS
═══════════════════════════════════════════════════════════════════ */
const NAV_ITEMS = [
  {icon:'🏠', label:'Dashboard',     to:'/'},
  {icon:'⚽', label:'Sessions',      to:'/browse-sessions'},
  {icon:'👥', label:'Communities',   to:'/community'},
  {icon:'🛒', label:'Marketplace',   to:'/marketplace'},
  {icon:'🏆', label:'Tournaments',   to:'/tournaments'},
  {icon:'🏅', label:'Leaderboard',   to:'/leaderboard'},
  {icon:'👤', label:'Profile',       to:'/profile'},
]

/* ═══════════════════════════════════════════════════════════════════
   MAIN DASHBOARD COMPONENT
═══════════════════════════════════════════════════════════════════ */
export const Dashboard: React.FC = () => {
  const [profile,          setProfile]          = useState<any>(null)
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([])
  const [universityStats,  setUniversityStats]  = useState<any[]>([])
  const [competitions,     setCompetitions]     = useState<any[]>([])
  const [userUniversity,   setUserUniversity]   = useState<string>('')
  const [loading,          setLoading]          = useState(true)
  const [showInviteModal,  setShowInviteModal]  = useState(false)

  useEffect(() => {
    loadData()

    const tournamentSub = supabase
      .channel('dashboard-tournaments')
      .on('postgres_changes', {event:'*', schema:'public', table:'tournaments'}, () => {
        console.log('🔄 Dashboard: Tournament change detected'); loadData()
      }).subscribe()

    const sessionSub = supabase
      .channel('dashboard-sessions')
      .on('postgres_changes', {event:'*', schema:'public', table:'sports_sessions'}, () => {
        console.log('🔄 Dashboard: Session change detected'); loadData()
      }).subscribe()

    const competitionSub = supabase
      .channel('dashboard-competitions')
      .on('postgres_changes', {event:'*', schema:'public', table:'competitions'}, () => {
        console.log('🔄 Dashboard: Competition change detected'); loadData()
      }).subscribe()

    return () => {
      tournamentSub.unsubscribe()
      sessionSub.unsubscribe()
      competitionSub.unsubscribe()
    }
  }, [])

  const loadData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: profileData } = await supabase
        .from('users').select('*').eq('id', user.id).single()
      setProfile(profileData)
      setUserUniversity(profileData?.university || '')
    }

    const { data: uniData, error: uniError } = await supabase
      .from('university_overall_leaderboard').select('*')
    if (!uniError && uniData) setUniversityStats(uniData)
    else { console.error('Error loading university stats:', uniError); setUniversityStats([]) }

    const today = new Date().toISOString().split('T')[0]
    const { data: sessions, error: sessionsError } = await supabase
      .from('sports_sessions').select('*')
      .gte('session_date', today)
      .order('session_date', {ascending:true})
      .limit(4)
    if (!sessionsError && sessions) setUpcomingSessions(sessions)
    else { console.error('Error loading sessions:', sessionsError); setUpcomingSessions([]) }

    const { data: compData, error: compError } = await supabase
      .from('competitions')
      .select('*, competition_participants(count)')
      .in('status', ['upcoming','active'])
      .order('start_date', {ascending:true})
      .limit(4)
    if (!compError && compData) {
      setCompetitions(compData.map((c:any) => ({...c, participants_count: c.competition_participants?.[0]?.count||0})))
    } else { console.error('Error loading competitions:', compError); setCompetitions([]) }

    setLoading(false)
  }

  // Handle quick action click
  const handleQuickAction = (action: {icon:string; label:string; to:string}) => {
    if (action.to === '#invite') {
      setShowInviteModal(true)
      return
    }
    // Navigation handled by Link component
  }

  if (loading) {
    return (
      <>
        <style>{GLOBAL_CSS}</style>
        <CanvasBackground />
        <div style={{
          minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
          fontFamily:'Sora,sans-serif', position:'relative', zIndex:1,
        }}>
          <div style={{textAlign:'center'}}>
            <div style={{
              width:52, height:52,
              border:'3px solid rgba(200,162,0,0.2)',
              borderTopColor:'#FFD700',
              borderRadius:'50%',
              margin:'0 auto 20px',
              animation:'ts-spin 0.8s linear infinite',
            }} />
            <div style={{fontSize:14, color:'rgba(255,255,255,0.4)', fontFamily:'Plus Jakarta Sans,sans-serif'}}>
              Loading your arena…
            </div>
          </div>
        </div>
      </>
    )
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'Player'
  const uniMemberCount = universityStats.find(u => u.name === userUniversity)?.total_members || 0

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <CanvasBackground />

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteModal onClose={() => setShowInviteModal(false)} />
      )}

      <div style={{
        display:'flex', minHeight:'100vh',
        fontFamily:'Sora,sans-serif', position:'relative', zIndex:1,
      }}>

        {/* LEFT SIDEBAR */}
        <aside className="ts-left-sidebar" style={{
          width:220, flexShrink:0, position:'fixed', top:0, left:0, bottom:0,
          background:'rgba(6,6,10,0.9)',
          borderRight:'1px solid rgba(255,255,255,0.06)',
          backdropFilter:'blur(20px)',
          WebkitBackdropFilter:'blur(20px)',
          display:'flex', flexDirection:'column',
          padding:'28px 12px', zIndex:100,
          overflowY:'auto',
        }}>
          <div style={{display:'flex', alignItems:'center', gap:10, padding:'0 4px', marginBottom:32}}>
            <div style={{
              width:34, height:34, borderRadius:9,
              background:'linear-gradient(135deg,#c8a200,#FFD700)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:14, fontWeight:800, color:'#0a0800', flexShrink:0,
            }}>TS</div>
            <span style={{fontSize:16, fontWeight:700}}>
              Team<span style={{color:'#FFD700'}}>Synk</span>
            </span>
          </div>

          <nav style={{display:'flex', flexDirection:'column', gap:2, flex:1}}>
            {NAV_ITEMS.map(n => (
              <Link key={n.to} to={n.to} className="ts-nav-item">
                <span style={{fontSize:16}}>{n.icon}</span>
                {n.label}
              </Link>
            ))}
          </nav>

          {profile && (
            <div style={{
              display:'flex', alignItems:'center', gap:10, padding:'12px 10px',
              background:'rgba(255,255,255,0.04)', borderRadius:12,
              border:'1px solid rgba(255,255,255,0.07)', marginTop:16,
            }}>
              <div style={{
                width:30, height:30, borderRadius:'50%',
                background:'linear-gradient(135deg,#c8a200,#FFD700)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:12, fontWeight:800, color:'#0a0800', flexShrink:0,
              }}>
                {firstName[0]}
              </div>
              <div style={{minWidth:0}}>
                <div style={{fontSize:12, fontWeight:600, color:'white', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{firstName}</div>
                <div style={{fontSize:10, color:'rgba(255,255,255,0.3)', fontFamily:'Plus Jakarta Sans,sans-serif', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{profile?.university || 'Student'}</div>
              </div>
            </div>
          )}
        </aside>

        {/* MAIN CONTENT */}
        <main className="ts-main-content" style={{
          marginLeft:220, flex:1,
          padding:'40px 32px 80px',
          maxWidth:'100%', overflowX:'hidden',
        }}>

          {/* HERO */}
          <section className="ts-stagger-1" style={{marginBottom:40}}>
            <div style={{
              position:'relative',
              background:'linear-gradient(135deg, rgba(200,162,0,0.08) 0%, rgba(13,13,20,0.6) 60%)',
              border:'1px solid rgba(200,162,0,0.16)',
              borderRadius:24, padding:'36px 40px',
              overflow:'hidden',
            }}>
              <div style={{
                position:'absolute', top:-40, right:-40, width:240, height:240,
                borderRadius:'50%', background:'rgba(200,162,0,0.07)',
                filter:'blur(60px)', pointerEvents:'none',
              }} />

              <div style={{
                display:'inline-flex', alignItems:'center', gap:8,
                padding:'5px 14px 5px 10px',
                background:'rgba(200,162,0,0.08)',
                border:'1px solid rgba(200,162,0,0.2)',
                borderRadius:99, marginBottom:20,
              }}>
                <span style={{
                  width:18, height:18, borderRadius:'50%',
                  background:'rgba(200,162,0,0.2)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:10,
                }}>✦</span>
                <span style={{color:'#c8a200', fontSize:11, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', fontFamily:'Plus Jakarta Sans,sans-serif'}}>
                  {formatDate()}
                </span>
              </div>

              <h1 className="ts-hero-heading" style={{
                fontSize:'clamp(28px,4vw,52px)', fontWeight:800,
                lineHeight:1.08, letterSpacing:'-.03em', marginBottom:10,
              }}>
                {getGreeting()},{' '}
                <span style={{
                  background:'linear-gradient(135deg,#c8a200,#FFD700,#fff8c0)',
                  WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
                }}>{firstName}</span>
                {' '}<span style={{WebkitTextFillColor:'initial'}}>👋</span>
              </h1>

              <p style={{
                fontSize:15, color:'rgba(255,255,255,0.55)', lineHeight:1.6,
                fontFamily:'Plus Jakarta Sans,sans-serif', marginBottom:24, maxWidth:480,
              }}>
                {DAILY_QUOTE}
              </p>

              {userUniversity && (
                <div style={{display:'flex', alignItems:'center', gap:12, flexWrap:'wrap'}}>
                  <div style={{
                    display:'inline-flex', alignItems:'center', gap:8,
                    padding:'8px 16px',
                    background:'rgba(200,162,0,0.1)',
                    border:'1px solid rgba(200,162,0,0.22)',
                    borderRadius:99,
                  }}>
                    <span style={{fontSize:16}}>🎓</span>
                    <span style={{color:'#FFD700', fontSize:13, fontWeight:700}}>{userUniversity}</span>
                    {uniMemberCount > 0 && (
                      <span style={{color:'rgba(255,255,255,0.3)', fontSize:11, fontFamily:'Plus Jakarta Sans,sans-serif'}}>
                        · {uniMemberCount} members
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* QUICK ACTIONS */}
          <section className="ts-stagger-2" style={{marginBottom:40}}>
            <SectionHeader eyebrow="⚡ Quick Actions" title="What do you want to do?" />
            <div className="ts-grid-qa">
              {QUICK_ACTIONS.map((qa, i) => (
                <div
                  key={qa.to}
                  onClick={() => handleQuickAction(qa)}
                  style={{ cursor: 'pointer' }}
                >
                  {qa.to === '#invite' ? (
                    <div className="ts-qa" style={{animation:`ts-fadeUp .5s ease ${i*45+80}ms both`}}>
                      <div className="ts-qa-icon">{qa.icon}</div>
                      <div className="ts-qa-label">{qa.label}</div>
                    </div>
                  ) : (
                    <Link to={qa.to} className="ts-qa" style={{animation:`ts-fadeUp .5s ease ${i*45+80}ms both`}}>
                      <div className="ts-qa-icon">{qa.icon}</div>
                      <div className="ts-qa-label">{qa.label}</div>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </section>

          <Divider />

          {/* UNIVERSITY LEADERBOARD */}
          <section className="ts-stagger-3" style={{marginBottom:40}}>
            <SectionHeader
              eyebrow="🏆 University Rankings"
              title="Leaderboard"
              action={
                <div style={{display:'flex', alignItems:'center', gap:12}}>
                  <span style={{color:'rgba(255,255,255,0.28)', fontSize:12, fontFamily:'Plus Jakarta Sans,sans-serif'}}>
                    {universityStats.length} universities
                  </span>
                  <Link to="/leaderboard" className="ts-ghost">View All →</Link>
                </div>
              }
            />

            {universityStats.length === 0 ? (
              <div className="ts-card" style={{padding:40, textAlign:'center'}}>
                <div style={{fontSize:40, marginBottom:12}}>🏛️</div>
                <h3 style={{fontSize:17, fontWeight:700, marginBottom:6}}>No universities yet</h3>
                <p style={{color:'rgba(255,255,255,0.38)', fontSize:14, fontFamily:'Plus Jakarta Sans,sans-serif'}}>
                  Add universities to see the rankings.
                </p>
              </div>
            ) : (
              <div style={{display:'flex', flexDirection:'column', gap:10}}>
                {universityStats.slice(0, 5).map((uni, i) => (
                  <UniversityLeaderboardCard
                    key={uni.id}
                    uni={uni}
                    index={i}
                    isUserUni={uni.name === userUniversity}
                  />
                ))}
              </div>
            )}
          </section>

          <Divider />

          {/* UPCOMING SESSIONS */}
          <section className="ts-stagger-4" style={{marginBottom:40}}>
            <SectionHeader
              eyebrow="⚡ Live Arena"
              title="Upcoming Sessions"
              action={<Link to="/browse-sessions" className="ts-ghost">Browse All →</Link>}
            />

            {upcomingSessions.length === 0 ? (
              <div className="ts-card" style={{padding:48, textAlign:'center'}}>
                <div style={{fontSize:44, marginBottom:14, animation:'ts-float 4s ease-in-out infinite'}}>🏟️</div>
                <h3 style={{fontSize:18, fontWeight:700, marginBottom:8}}>No upcoming sessions</h3>
                <p style={{color:'rgba(255,255,255,0.38)', fontSize:14, fontFamily:'Plus Jakarta Sans,sans-serif', marginBottom:20}}>
                  The arena is quiet. Be the first to start something.
                </p>
                <Link to="/create-session" className="ts-cta ts-btn-shimmer">
                  ➕ Create Session
                </Link>
              </div>
            ) : (
              <div className="ts-grid-2">
                {upcomingSessions.map((session, i) => (
                  <SessionCard key={session.id} session={session} index={i} />
                ))}
              </div>
            )}
          </section>

          <Divider />

          {/* COMPETITIONS */}
          <section className="ts-stagger-5" style={{marginBottom:40}}>
            <SectionHeader
              eyebrow="🏅 Competitions"
              title="Live & Upcoming"
              action={
                <Link
                  to="/create-tournament"
                  className="ts-cta ts-btn-shimmer"
                  onMouseEnter={e => {
                    e.currentTarget.style.transform='scale(1.04)'
                    e.currentTarget.style.boxShadow='0 8px 36px rgba(200,162,0,0.45)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform='scale(1)'
                    e.currentTarget.style.boxShadow='0 4px 20px rgba(200,162,0,0.25)'
                  }}
                >
                  🏆 Create Tournament
                </Link>
              }
            />

            {competitions.length === 0 ? (
              <div className="ts-card" style={{padding:48, textAlign:'center'}}>
                <div style={{fontSize:44, marginBottom:14, animation:'ts-float 4s ease-in-out infinite'}}>🏆</div>
                <h3 style={{fontSize:18, fontWeight:700, marginBottom:8}}>No active competitions</h3>
                <p style={{color:'rgba(255,255,255,0.38)', fontSize:14, fontFamily:'Plus Jakarta Sans,sans-serif'}}>
                  Competitions will be announced here soon!
                </p>
              </div>
            ) : (
              <div className="ts-grid-2">
                {competitions.map((comp, i) => (
                  <CompetitionCard key={comp.id} competition={comp} index={i} />
                ))}
              </div>
            )}
          </section>

          {/* FOOTER */}
          <div style={{display:'flex', justifyContent:'center', marginTop:56}}>
            <div style={{
              display:'inline-flex', alignItems:'center', gap:10,
              padding:'8px 22px',
              background:'rgba(255,255,255,0.02)',
              border:'1px solid rgba(255,255,255,0.045)',
              borderRadius:99,
            }}>
              <span style={{
                width:6, height:6, borderRadius:'50%',
                background:'#c8a200',
                boxShadow:'0 0 8px rgba(200,162,0,0.7)',
                animation:'ts-pulse 2s ease-in-out infinite',
                display:'inline-block',
              }} />
              <span style={{
                color:'rgba(255,255,255,0.25)', fontSize:10, fontWeight:600,
                letterSpacing:'.1em', fontFamily:'Plus Jakarta Sans,sans-serif',
                textTransform:'uppercase',
              }}>
                TeamSynk · University Sports Network
              </span>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}