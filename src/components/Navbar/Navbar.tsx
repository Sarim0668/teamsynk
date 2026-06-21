import React, { useEffect, useState, useRef, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

// ─── Types ───────────────────────────────────────────────────────────────────
interface NavItem {
  path: string
  label: string
  icon: React.ReactNode
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const IconHome = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)

const IconUsers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)

const IconCalendar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)

const IconShop = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
)

// ─── Messages Icon with Badge Support ──────────────────────────────────────
const IconMessages = ({ unreadCount = 0 }: { unreadCount?: number }) => (
  <div style={{ position: 'relative', display: 'inline-flex' }}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
    {unreadCount > 0 && (
      <span style={{
        position: 'absolute',
        top: '-6px',
        right: '-6px',
        minWidth: '16px',
        height: '16px',
        borderRadius: '50%',
        background: '#ef4444',
        color: 'white',
        fontSize: '9px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 4px',
        boxShadow: '0 0 8px rgba(239,68,68,0.6)',
        animation: 'pulseDot 2s ease-in-out infinite',
      }}>
        {unreadCount > 9 ? '9+' : unreadCount}
      </span>
    )}
  </div>
)

const IconUser = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)

const IconLogout = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)

const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)

// ─── Admin Icon ──────────────────────────────────────────────────────────────
const IconAdmin = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <polyline points="9 12 11 14 15 10"/>
  </svg>
)

// ─── Shimmer button ──────────────────────────────────────────────────────────
function ShimmerButton({ to, children }: { to: string; children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link
      to={to}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 18px',
        borderRadius: '10px',
        textDecoration: 'none',
        fontFamily: "'Inter', sans-serif",
        fontSize: '13px',
        fontWeight: '700',
        letterSpacing: '0.02em',
        color: '#0a0a0a',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #c8a200 0%, #FFD700 45%, #e8b800 100%)',
        boxShadow: hovered
          ? '0 0 28px rgba(200,162,0,0.55), 0 4px 20px rgba(200,162,0,0.4), inset 0 1px 0 rgba(255,255,255,0.25)'
          : '0 0 12px rgba(200,162,0,0.25), 0 2px 8px rgba(200,162,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)',
        transform: hovered ? 'scale(1.04) translateY(-1px)' : 'scale(1) translateY(0)',
        transition: 'all 0.28s cubic-bezier(0.4,0,0.2,1)',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{
        position: 'absolute',
        top: 0, left: '-100%',
        width: '60%', height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
        animation: 'shimmerSweep 2.4s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
      {children}
    </Link>
  )
}

// ─── Nav item with magnetic hover ───────────────────────────────────────────
function NavItem({ item, isActive, unreadCount = 0 }: { item: NavItem; isActive: boolean; unreadCount?: number }) {
  const [hovered, setHovered] = useState(false)
  const [magnetPos, setMagnetPos] = useState({ x: 0, y: 0 })
  const ref = useRef<HTMLAnchorElement>(null)

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = (e.clientX - cx) * 0.22
    const dy = (e.clientY - cy) * 0.22
    setMagnetPos({ x: dx, y: dy })
  }, [])

  const handleMouseLeave = useCallback(() => {
    setHovered(false)
    setMagnetPos({ x: 0, y: 0 })
  }, [])

  return (
    <Link
      ref={ref}
      to={item.path}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      title={item.label}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '3px',
        padding: '8px 12px',
        borderRadius: '12px',
        textDecoration: 'none',
        color: isActive ? '#FFD700' : hovered ? '#e8b800' : '#6b7280',
        position: 'relative',
        transition: 'color 0.25s ease',
        transform: `translate(${magnetPos.x}px, ${magnetPos.y}px)`,
        willChange: 'transform',
      }}
    >
      <span style={{
        position: 'absolute', inset: 0,
        borderRadius: '12px',
        background: isActive
          ? 'rgba(200,162,0,0.12)'
          : hovered ? 'rgba(200,162,0,0.07)' : 'transparent',
        border: isActive
          ? '1px solid rgba(200,162,0,0.25)'
          : hovered ? '1px solid rgba(200,162,0,0.12)' : '1px solid transparent',
        transition: 'all 0.25s ease',
        boxShadow: isActive ? '0 0 16px rgba(200,162,0,0.15)' : 'none',
      }} />

      <span style={{
        position: 'relative',
        filter: isActive
          ? 'drop-shadow(0 0 6px rgba(200,162,0,0.7))'
          : hovered ? 'drop-shadow(0 0 4px rgba(200,162,0,0.4))' : 'none',
        transition: 'filter 0.25s ease',
        transform: (isActive || hovered) ? 'scale(1.1)' : 'scale(1)',
        display: 'flex',
        alignItems: 'center',
      }}>
        {item.label === 'Chat' ? (
          <IconMessages unreadCount={unreadCount} />
        ) : (
          item.icon
        )}
      </span>

      <span style={{
        fontSize: '9px',
        fontWeight: '700',
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
        position: 'relative',
        opacity: isActive || hovered ? 1 : 0.5,
        transition: 'opacity 0.25s ease',
        fontFamily: "'Inter', sans-serif",
      }}>
        {item.label}
        {unreadCount > 0 && (
          <span style={{
            marginLeft: '4px',
            color: '#ef4444',
            fontSize: '8px',
          }}>
            ●
          </span>
        )}
      </span>

      {isActive && (
        <span style={{
          position: 'absolute',
          bottom: '-6px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '4px', height: '4px',
          borderRadius: '50%',
          background: '#FFD700',
          boxShadow: '0 0 8px rgba(255,215,0,0.8)',
          animation: 'pulseDot 2s ease-in-out infinite',
        }} />
      )}
    </Link>
  )
}

// ─── Logo ────────────────────────────────────────────────────────────────────
function LogoArea() {
  const [hovered, setHovered] = useState(false)
  return (
    <Link
      to="/"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        textDecoration: 'none',
        position: 'relative',
      }}
    >
      <div style={{ position: 'relative', width: '36px', height: '36px', flexShrink: 0 }}>
        <div style={{
          position: 'absolute', inset: '-4px',
          borderRadius: '50%',
          background: 'conic-gradient(from 0deg, transparent 60%, rgba(200,162,0,0.6) 80%, rgba(255,215,0,0.8) 90%, rgba(200,162,0,0.6) 100%, transparent)',
          animation: 'rotateConic 3s linear infinite',
          opacity: hovered ? 1 : 0.5,
          transition: 'opacity 0.3s',
        }} />
        <div style={{
          position: 'absolute', inset: '-2px',
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.9)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #1a1a1a, #111)',
          border: '1px solid rgba(200,162,0,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
          boxShadow: hovered
            ? '0 0 20px rgba(200,162,0,0.4), inset 0 1px 0 rgba(255,215,0,0.1)'
            : '0 0 8px rgba(200,162,0,0.15), inset 0 1px 0 rgba(255,215,0,0.05)',
          transition: 'box-shadow 0.3s ease',
        }}>
          <span style={{
            fontSize: '16px',
            fontWeight: '900',
            fontFamily: "'Inter', sans-serif",
            background: 'linear-gradient(135deg, #c8a200, #FFD700)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.05em',
          }}>TS</span>
        </div>

        {[
          { top: '-6px', right: '-3px', delay: '0s',   size: 3 },
          { top: '2px',  right: '-8px', delay: '0.4s', size: 2 },
          { top: '-3px', left: '-6px',  delay: '0.8s', size: 2 },
          { bottom: '-4px', right: '-5px', delay: '1.2s', size: 2 },
        ].map((s, i) => (
          <span key={i} style={{
            position: 'absolute',
            width: `${s.size}px`, height: `${s.size}px`,
            borderRadius: '50%',
            background: '#FFD700',
            top: s.top, right: s.right, left: s.left, bottom: s.bottom,
            boxShadow: '0 0 4px rgba(255,215,0,0.9)',
            animation: `sparkle 2s ease-in-out infinite ${s.delay}`,
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.3s',
          }} />
        ))}
      </div>

      <div style={{ lineHeight: 1 }}>
        <div style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '15px',
          fontWeight: '900',
          letterSpacing: '-0.03em',
          background: hovered
            ? 'linear-gradient(135deg, #c8a200 0%, #FFD700 40%, #fff 60%, #FFD700 80%, #c8a200 100%)'
            : 'linear-gradient(135deg, #c8a200, #FFD700)',
          backgroundSize: hovered ? '200% auto' : '100% auto',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          animation: hovered ? 'textShimmer 1.5s linear infinite' : 'none',
          transition: 'all 0.3s ease',
        }}>
          TEAMSYNK
        </div>
        <div style={{
          fontSize: '7px',
          fontWeight: '700',
          letterSpacing: '0.2em',
          color: '#4b5563',
          textTransform: 'uppercase',
          fontFamily: "'Inter', sans-serif",
          marginTop: '1px',
        }}>
          LINK · CONNECT · PLAY
        </div>
      </div>
    </Link>
  )
}

// ─── Profile dropdown ────────────────────────────────────────────────────────
function ProfileMenu() {
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const navigate = useNavigate()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: '36px', height: '36px',
          borderRadius: '10px',
          border: `1px solid ${open || hovered ? 'rgba(200,162,0,0.4)' : 'rgba(255,255,255,0.08)'}`,
          background: open || hovered
            ? 'rgba(200,162,0,0.1)'
            : 'rgba(255,255,255,0.04)',
          color: open || hovered ? '#FFD700' : '#6b7280',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.25s ease',
          boxShadow: open || hovered ? '0 0 14px rgba(200,162,0,0.2)' : 'none',
          outline: 'none',
        }}
      >
        <IconUser />
      </button>

      <div style={{
        position: 'absolute',
        top: 'calc(100% + 10px)',
        right: 0,
        minWidth: '180px',
        background: 'rgba(12,12,18,0.96)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(200,162,0,0.15)',
        borderRadius: '14px',
        padding: '6px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(200,162,0,0.08)',
        opacity: open ? 1 : 0,
        transform: open ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(0.96)',
        pointerEvents: open ? 'all' : 'none',
        transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)',
        transformOrigin: 'top right',
        zIndex: 100,
      }}>
        <DropdownItem to="/profile" icon={<IconUser />} label="My Profile" />
        <DropdownItem to="/messages" icon={<IconMessages />} label="Messages" />
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '9px 12px', width: '100%', borderRadius: '9px',
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: '#ef4444', fontSize: '13px', fontWeight: '500',
            fontFamily: "'Inter', sans-serif",
            transition: 'background 0.2s ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <IconLogout />
          Sign out
        </button>
      </div>
    </div>
  )
}

function DropdownItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '9px 12px', borderRadius: '9px',
        color: '#9ca3af', fontSize: '13px', fontWeight: '500',
        textDecoration: 'none', fontFamily: "'Inter', sans-serif",
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(200,162,0,0.08)'
        e.currentTarget.style.color = '#FFD700'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color = '#9ca3af'
      }}
    >
      {icon}
      {label}
    </Link>
  )
}

// ─── MAIN NAVBAR ─────────────────────────────────────────────────────────────
export const Navbar: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [userRole, setUserRole] = useState<string>('')

  // ─── Get unread message count ─────────────────────────────────────────────
  const getUnreadCount = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (currentUser) {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', currentUser.id)
        .eq('is_read', false)
      setUnreadCount(count || 0)
    }
  }

  // ─── Get user role for admin access ──────────────────────────────────────
  const getUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
      setUserRole(data?.role || '')
    }
  }

  useEffect(() => {
    getUnreadCount()
    getUserRole()

    // Refresh unread count every 10 seconds
    const interval = setInterval(() => {
      getUnreadCount()
      getUserRole()
    }, 10000)

    // Also refresh when page becomes visible again
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        getUnreadCount()
        getUserRole()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Listen for custom refresh event from Messages component
    const handleRefresh = () => {
      getUnreadCount()
    }
    window.addEventListener('refreshUnreadCount', handleRefresh)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('refreshUnreadCount', handleRefresh)
    }
  }, [])

  // ─── Listen for auth changes ──────────────────────────────────────────────
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      getUnreadCount()
      getUserRole()
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    setMounted(true)
    const onScroll = () => {
      setScrollY(window.scrollY)
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // ─── Navigation Items ─────────────────────────────────────────────────────
  const navItems: NavItem[] = [
    { path: '/',                label: 'Home',     icon: <IconHome /> },
    { path: '/find-players',    label: 'Players',  icon: <IconUsers /> },
    { path: '/browse-sessions', label: 'Sessions', icon: <IconCalendar /> },
    { path: '/marketplace',     label: 'Market',   icon: <IconShop /> },
    { path: '/messages',        label: 'Chat',     icon: <IconMessages /> },
  ]

  // Add Admin link only if user has Admin role
  if (userRole === 'Admin') {
    navItems.push({ path: '/admin', label: 'Admin', icon: <IconAdmin /> })
  }

  const shrink = Math.min(scrollY / 120, 1)
  const paddingV = 14 - shrink * 5
  const logoScale = 1 - shrink * 0.08

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        zIndex: 9999,
        padding: `${paddingV}px 24px`,
        background: scrolled
          ? 'rgba(8,8,12,0.92)'
          : 'rgba(8,8,12,0.6)',
        backdropFilter: scrolled ? 'blur(28px) saturate(180%)' : 'blur(16px)',
        WebkitBackdropFilter: scrolled ? 'blur(28px) saturate(180%)' : 'blur(16px)',
        borderBottom: `1px solid ${scrolled ? 'rgba(200,162,0,0.12)' : 'rgba(255,255,255,0.04)'}`,
        boxShadow: scrolled
          ? '0 4px 40px rgba(0,0,0,0.6), 0 1px 0 rgba(200,162,0,0.06)'
          : 'none',
        transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(-100%)',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(200,162,0,0.4) 30%, rgba(255,215,0,0.6) 50%, rgba(200,162,0,0.4) 70%, transparent 100%)',
          opacity: scrolled ? 1 : 0.4,
          transition: 'opacity 0.4s ease',
        }} />

        {scrolled && (
          <div style={{
            position: 'absolute', bottom: '-20px', left: '20%', right: '20%',
            height: '20px',
            background: 'rgba(200,162,0,0.04)',
            filter: 'blur(12px)',
            pointerEvents: 'none',
          }} />
        )}

        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}>
          <div style={{
            transform: `scale(${logoScale})`,
            transformOrigin: 'left center',
            transition: 'transform 0.3s ease',
            flexShrink: 0,
          }}>
            <LogoArea />
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            padding: '5px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '16px',
            backdropFilter: 'blur(8px)',
          }}>
            {navItems.map(item => (
              <NavItem
                key={item.path}
                item={item}
                isActive={
                  item.path === '/'
                    ? location.pathname === '/'
                    : location.pathname === item.path || location.pathname.startsWith(item.path + '/')
                }
                unreadCount={item.path === '/messages' ? unreadCount : 0}
              />
            ))}
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexShrink: 0,
          }}>
            <ShimmerButton to="/create-session">
              <IconPlus />
              New Session
            </ShimmerButton>
            <ProfileMenu />
          </div>
        </div>
      </nav>

      <div style={{ height: '70px' }} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        @keyframes rotateConic {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0.5); }
          50%       { opacity: 1; transform: scale(1.2); }
        }
        @keyframes shimmerSweep {
          0%   { left: -100%; }
          60%  { left: 150%; }
          100% { left: 150%; }
        }
        @keyframes textShimmer {
          0%   { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 0.7; transform: translateX(-50%) scale(1); }
          50%       { opacity: 1;   transform: translateX(-50%) scale(1.4); box-shadow: 0 0 12px rgba(255,215,0,1); }
        }
      `}</style>
    </>
  )
}