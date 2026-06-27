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
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)

const IconUsers = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)

const IconCalendar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)

const IconShop = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
)

const IconMessages = ({ unreadCount = 0 }: { unreadCount?: number }) => (
  <div style={{ position: 'relative', display: 'inline-flex' }}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
    {unreadCount > 0 && (
      <span style={{
        position: 'absolute',
        top: '-6px',
        right: '-6px',
        minWidth: '18px',
        height: '18px',
        borderRadius: '50%',
        background: '#ef4444',
        color: 'white',
        fontSize: '9px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 4px',
      }}>
        {unreadCount > 9 ? '9+' : unreadCount}
      </span>
    )}
  </div>
)

const IconUser = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)

const IconLogout = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)

const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)

const IconAdmin = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <polyline points="9 12 11 14 15 10"/>
  </svg>
)

const IconTrophy = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
    <path d="M4 22h16"/>
    <path d="M12 15v7"/>
    <path d="M8 22v-3.5a3 3 0 0 1 3-3h2a3 3 0 0 1 3 3V22"/>
    <path d="M6 9h12a2 2 0 0 1 2 2v1.5a3.5 3.5 0 0 1-7 0"/>
    <path d="M6 9V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v5"/>
  </svg>
)

const IconMenu = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
)

const IconClose = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
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
        padding: '8px 16px',
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
          ? '0 0 28px rgba(200,162,0,0.55), 0 4px 20px rgba(200,162,0,0.4)'
          : '0 0 12px rgba(200,162,0,0.25), 0 2px 8px rgba(200,162,0,0.2)',
        transform: hovered ? 'scale(1.04) translateY(-1px)' : 'scale(1)',
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

// ─── Mobile Nav Item ──────────────────────────────────────────────────────────
function MobileNavItem({ item, isActive, onClick }: { item: NavItem; isActive: boolean; onClick: () => void }) {
  return (
    <Link
      to={item.path}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        borderRadius: '10px',
        textDecoration: 'none',
        color: isActive ? '#FFD700' : '#9ca3af',
        background: isActive ? 'rgba(200,162,0,0.08)' : 'transparent',
        border: isActive ? '1px solid rgba(200,162,0,0.2)' : '1px solid transparent',
        transition: 'all 0.2s ease',
        fontSize: '14px',
        fontWeight: isActive ? '700' : '500',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <span style={{ color: isActive ? '#FFD700' : '#6b7280' }}>{item.icon}</span>
      <span style={{ flex: 1 }}>{item.label}</span>
      {item.label === 'Chat' && (
        <span style={{
          background: '#ef4444',
          color: 'white',
          fontSize: '10px',
          fontWeight: 'bold',
          padding: '1px 8px',
          borderRadius: '99px',
        }}>
          {/* Show unread count if needed */}
        </span>
      )}
    </Link>
  )
}

// ─── Main Navbar ─────────────────────────────────────────────────────────────
export const Navbar: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [userRole, setUserRole] = useState<string>('')
  const [user, setUser] = useState<any>(null)

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

  const getUserRole = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    setUser(currentUser)
    if (currentUser) {
      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('id', currentUser.id)
        .single()
      setUserRole(data?.role || '')
    }
  }

  useEffect(() => {
    getUnreadCount()
    getUserRole()

    const interval = setInterval(() => {
      getUnreadCount()
    }, 10000)

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        getUnreadCount()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // ─── Navigation Items ─────────────────────────────────────────────────────
  const navItems: NavItem[] = [
    { path: '/', label: 'Home', icon: <IconHome /> },
    { path: '/find-players', label: 'Players', icon: <IconUsers /> },
    { path: '/browse-sessions', label: 'Sessions', icon: <IconCalendar /> },
    { path: '/marketplace', label: 'Market', icon: <IconShop /> },
    { path: '/messages', label: 'Chat', icon: <IconMessages unreadCount={unreadCount} /> },
    { path: '/competitions', label: 'Compete', icon: <IconTrophy /> },
    { path: '/ai-assistant', label: 'AI Voice', icon: <span>🎙️</span> },
  ]

  if (userRole === 'Admin') {
    navItems.push({ path: '/admin', label: 'Admin', icon: <IconAdmin /> })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
    setMobileMenuOpen(false)
  }

  return (
    <>
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        padding: '10px 16px',
        background: scrolled
          ? 'rgba(8,8,12,0.95)'
          : 'rgba(8,8,12,0.7)',
        backdropFilter: scrolled ? 'blur(28px) saturate(180%)' : 'blur(16px)',
        WebkitBackdropFilter: scrolled ? 'blur(28px) saturate(180%)' : 'blur(16px)',
        borderBottom: `1px solid ${scrolled ? 'rgba(200,162,0,0.12)' : 'rgba(255,255,255,0.04)'}`,
        boxShadow: scrolled ? '0 4px 40px rgba(0,0,0,0.6)' : 'none',
        transition: 'all 0.3s ease',
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* ─── Logo ─── */}
          <Link to="/" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #c8a200, #FFD700)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: '900',
              color: '#0a0a0a',
              fontFamily: "'Inter', sans-serif",
            }}>
              TS
            </div>
            <span style={{
              fontSize: '16px',
              fontWeight: '900',
              color: '#FFD700',
              fontFamily: "'Inter', sans-serif",
              letterSpacing: '-0.03em',
            }}>
              TEAMSYNK
            </span>
          </Link>

          {/* ─── Desktop Nav ─── */}
          <div style={{
            display: 'none',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '12px',
          }} className="navbar-desktop">
            {navItems.map(item => (
              <DesktopNavItem
                key={item.path}
                item={item}
                isActive={
                  item.path === '/'
                    ? location.pathname === '/'
                    : location.pathname === item.path || location.pathname.startsWith(item.path + '/')
                }
              />
            ))}
          </div>

          {/* ─── Desktop Actions ─── */}
          <div style={{
            display: 'none',
            alignItems: 'center',
            gap: '10px',
          }} className="navbar-desktop">
            <ShimmerButton to="/create-session">
              <IconPlus />
              New Session
            </ShimmerButton>
            <ProfileButton />
          </div>

          {/* ─── Mobile Menu Toggle ─── */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'flex',
              background: 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '4px',
            }}
            className="navbar-mobile"
          >
            {mobileMenuOpen ? <IconClose /> : <IconMenu />}
          </button>
        </div>
      </nav>

      {/* ─── Mobile Menu ─── */}
      <div style={{
        position: 'fixed',
        top: '60px',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9998,
        background: 'rgba(8,8,12,0.98)',
        backdropFilter: 'blur(20px)',
        transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        padding: '20px',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }} className="navbar-mobile">
        <div style={{ flex: 1 }}>
          {navItems.map(item => (
            <MobileNavItem
              key={item.path}
              item={item}
              isActive={
                item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname === item.path || location.pathname.startsWith(item.path + '/')
              }
              onClick={() => setMobileMenuOpen(false)}
            />
          ))}

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '16px 0' }} />

          {/* ─── Mobile Actions ─── */}
          <Link
            to="/create-session"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #c8a200, #FFD700)',
              color: '#0a0a0a',
              textDecoration: 'none',
              fontWeight: '700',
              fontSize: '14px',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <IconPlus />
            Create Session
          </Link>

          <Link
            to="/profile"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              borderRadius: '10px',
              color: '#9ca3af',
              textDecoration: 'none',
              fontSize: '14px',
              fontFamily: "'Inter', sans-serif",
              marginTop: '8px',
            }}
          >
            <IconUser />
            Profile
          </Link>

          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              borderRadius: '10px',
              background: 'transparent',
              border: 'none',
              color: '#ef4444',
              fontSize: '14px',
              fontFamily: "'Inter', sans-serif",
              cursor: 'pointer',
              width: '100%',
              marginTop: '8px',
            }}
          >
            <IconLogout />
            Sign Out
          </button>
        </div>

        <div style={{
          textAlign: 'center',
          padding: '20px 0',
          color: '#374151',
          fontSize: '10px',
          fontFamily: "'Inter', sans-serif",
          letterSpacing: '0.06em',
        }}>
          TEAMSYNK v2.0
        </div>
      </div>

      {/* ─── Spacer ─── */}
      <div style={{ height: '60px' }} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        @keyframes shimmerSweep {
          0%   { left: -100%; }
          60%  { left: 150%; }
          100% { left: 150%; }
        }

        @media (max-width: 768px) {
          .navbar-desktop { display: none !important; }
          .navbar-mobile { display: flex !important; }
        }

        @media (min-width: 769px) {
          .navbar-desktop { display: flex !important; }
          .navbar-mobile { display: none !important; }
        }
      `}</style>
    </>
  )
}

// ─── Desktop Nav Item ────────────────────────────────────────────────────────
function DesktopNavItem({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link
      to={item.path}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2px',
        padding: '6px 12px',
        borderRadius: '10px',
        textDecoration: 'none',
        color: isActive ? '#FFD700' : hovered ? '#e8b800' : '#6b7280',
        position: 'relative',
        transition: 'color 0.25s ease',
        fontSize: '10px',
        fontWeight: isActive ? '700' : '500',
        fontFamily: "'Inter', sans-serif",
        minHeight: '44px',
      }}
    >
      <span style={{
        position: 'absolute',
        inset: 0,
        borderRadius: '10px',
        background: isActive ? 'rgba(200,162,0,0.12)' : hovered ? 'rgba(200,162,0,0.07)' : 'transparent',
        border: isActive ? '1px solid rgba(200,162,0,0.2)' : hovered ? '1px solid rgba(200,162,0,0.1)' : '1px solid transparent',
        transition: 'all 0.25s ease',
      }} />
      <span style={{ position: 'relative' }}>{item.icon}</span>
      <span style={{ position: 'relative', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {item.label}
      </span>
      {isActive && (
        <span style={{
          position: 'absolute',
          bottom: '2px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '4px',
          height: '4px',
          borderRadius: '50%',
          background: '#FFD700',
          boxShadow: '0 0 8px rgba(255,215,0,0.8)',
        }} />
      )}
    </Link>
  )
}

// ─── Profile Button ──────────────────────────────────────────────────────────
function ProfileButton() {
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
    setOpen(false)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          border: `1px solid ${open || hovered ? 'rgba(200,162,0,0.4)' : 'rgba(255,255,255,0.08)'}`,
          background: open || hovered ? 'rgba(200,162,0,0.1)' : 'rgba(255,255,255,0.04)',
          color: open || hovered ? '#FFD700' : '#6b7280',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.25s ease',
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
        border: '1px solid rgba(200,162,0,0.15)',
        borderRadius: '12px',
        padding: '6px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
        opacity: open ? 1 : 0,
        transform: open ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(0.96)',
        pointerEvents: open ? 'all' : 'none',
        transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)',
        transformOrigin: 'top right',
        zIndex: 100,
      }}>
        <DropdownItem to="/profile" icon={<IconUser />} label="Profile" />
        <DropdownItem to="/messages" icon={<IconMessages />} label="Messages" />
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '9px 12px',
            width: '100%',
            borderRadius: '9px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#ef4444',
            fontSize: '13px',
            fontWeight: '500',
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
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '9px 12px',
        borderRadius: '9px',
        color: '#9ca3af',
        fontSize: '13px',
        fontWeight: '500',
        textDecoration: 'none',
        fontFamily: "'Inter', sans-serif",
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
}// ─── Add this icon function in your Navbar.tsx ────────────────────────────
const IconChat = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    <circle cx="9" cy="10" r="1"/>
    <circle cx="15" cy="10" r="1"/>
  </svg>
)