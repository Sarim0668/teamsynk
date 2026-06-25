import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

// ─── Sport icon map ───────────────────────────────────────────────────────────
const SPORT_ICONS: Record<string, string> = {
  Football: '⚽', Basketball: '🏀', Cricket: '🏏', Tennis: '🎾',
  Badminton: '🏸', Volleyball: '🏐', Swimming: '🏊', Running: '🏃',
  Cycling: '🚴', Hockey: '🏑', Other: '🎯',
}

// ─── Role config ──────────────────────────────────────────────────────────────
const ROLE_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  Player:    { color: '#4ade80', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.25)',   label: 'Player' },
  Coach:     { color: '#60a5fa', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.25)',  label: 'Coach' },
  Organizer: { color: '#c084fc', bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.25)', label: 'Organizer' },
}
const getRole = (role: string) => ROLE_CONFIG[role] || ROLE_CONFIG.Player

// ─── University colors ──────────────────────────────────────────────────────
const UNIVERSITY_COLORS: Record<string, string> = {
  'FAST University': '#FF6B35',
  'NUST': '#00A651',
  'IIUI': '#8B1A4A',
  'Bahria University': '#003366',
  'Air University': '#FFD700',
  'COMSATS': '#005A9C',
  'GIKI': '#800000',
  'LUMS': '#663399',
}

const getUniversityColor = (university: string) => {
  return UNIVERSITY_COLORS[university] || '#6b7280'
}

// ─── Avatar with gold ring ────────────────────────────────────────────────────
function PlayerAvatar({ name, avatarUrl, role, university, size = 52 }: {
  name: string; avatarUrl?: string; role: string; university?: string; size?: number
}) {
  const [hovered, setHovered] = useState(false)
  const initials = name?.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase() || '?'
  const rc = getRole(role)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}
    >
      <div style={{
        position: 'absolute', inset: '-3px', borderRadius: '50%',
        background: `conic-gradient(from 0deg, transparent 40%, ${rc.color}80 65%, ${rc.color} 75%, ${rc.color}80 85%, transparent)`,
        animation: 'rotateConic 4s linear infinite',
        opacity: hovered ? 1 : 0.4,
        transition: 'opacity 0.35s ease',
      }} />
      <div style={{ position: 'absolute', inset: '-1px', borderRadius: '50%', background: '#0D0D0F' }} />
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: `linear-gradient(135deg, ${rc.color}18, ${rc.color}08)`,
        border: `1px solid ${rc.color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        boxShadow: hovered ? `0 0 20px ${rc.color}40` : 'none',
        transition: 'box-shadow 0.35s ease',
      }}>
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{
            fontSize: size * 0.32, fontWeight: '800', color: rc.color,
            fontFamily: "'Inter', sans-serif", letterSpacing: '-0.02em',
          }}>{initials}</span>
        )}
      </div>
      <div style={{
        position: 'absolute', bottom: 1, right: 1,
        width: 10, height: 10, borderRadius: '50%',
        background: '#22c55e', border: '2px solid #0D0D0F',
        boxShadow: '0 0 6px rgba(34,197,94,0.6)',
      }} />
    </div>
  )
}

// ─── Player card ──────────────────────────────────────────────────────────────
function PlayerCard({ player, index, onMessage }: { player: any; index: number; onMessage: (player: any) => void }) {
  const [hovered, setHovered] = useState(false)
  const rc = getRole(player.role)
  const sportIcon = SPORT_ICONS[player.sport_interests] || '🎯'
  const uniColor = getUniversityColor(player.university)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        background: hovered
          ? 'linear-gradient(135deg, rgba(24,24,32,0.98), rgba(20,18,28,0.98))'
          : 'rgba(12,12,18,0.92)',
        backdropFilter: 'blur(28px)',
        borderRadius: '20px',
        border: `1px solid ${hovered ? `${rc.color}40` : 'rgba(255,255,255,0.05)'}`,
        overflow: 'hidden',
        transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hovered
          ? `0 20px 56px rgba(0,0,0,0.5), 0 0 0 1px rgba(200,162,0,0.06), 0 0 32px ${rc.color}18`
          : '0 4px 20px rgba(0,0,0,0.4)',
        animation: `fadeSlideUp 0.45s ease ${index * 55}ms both`,
        padding: '22px 24px',
      }}
    >
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px',
        background: `linear-gradient(180deg, ${rc.color}00 0%, ${rc.color} 40%, ${rc.color} 60%, ${rc.color}00 100%)`,
        opacity: hovered ? 1 : 0.4,
        transition: 'opacity 0.35s ease',
      }} />

      <div style={{
        position: 'absolute', top: 0, left: '3px', right: 0, height: '1px',
        background: hovered
          ? `linear-gradient(90deg, ${rc.color}30, rgba(200,162,0,0.2), transparent)`
          : 'linear-gradient(90deg, rgba(255,255,255,0.03), transparent)',
        transition: 'all 0.35s ease',
      }} />

      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <PlayerAvatar 
          name={player.full_name} 
          avatarUrl={player.avatar_url} 
          role={player.role} 
          university={player.university}
          size={54} 
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', flexWrap: 'wrap' }}>
            <h3 style={{
              fontSize: '15px', fontWeight: '800', color: 'white',
              letterSpacing: '-0.02em', margin: 0, lineHeight: 1.1,
              fontFamily: "'Inter', sans-serif",
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {player.full_name}
            </h3>
            <RoleBadge role={player.role} />
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            {player.sport_interests && (
              <MetaChip icon={sportIcon} text={player.sport_interests} color="#c8a200" />
            )}
            {player.location && (
              <MetaChip icon="◉" text={player.location} color="#6b7280" />
            )}
            {player.skill_level && (
              <MetaChip icon="◈" text={player.skill_level} color="#4b5563" />
            )}
          </div>

          {/* ─── UNIVERSITY BADGE ─── */}
          {player.university && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '6px',
              padding: '3px 10px',
              background: `${uniColor}20`,
              border: `1px solid ${uniColor}40`,
              borderRadius: '99px',
            }}>
              <span style={{ fontSize: '12px' }}>🎓</span>
              <span style={{ 
                color: uniColor, 
                fontSize: '11px', 
                fontWeight: '600',
                fontFamily: "'Inter', sans-serif",
              }}>
                {player.university}
              </span>
            </div>
          )}

          {player.bio && (
            <p style={{
              color: '#4b5563', fontSize: '12px', lineHeight: '1.5',
              margin: '8px 0 0', fontFamily: "'Inter', sans-serif",
              display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              fontStyle: 'italic',
            }}>
              "{player.bio}"
            </p>
          )}
        </div>

        <MessageButton onMessage={() => onMessage(player)} hovered={hovered} />
      </div>
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  const rc = getRole(role || 'Player')
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 9px', borderRadius: '99px',
      background: rc.bg, border: `1px solid ${rc.border}`,
      color: rc.color, fontSize: '10px', fontWeight: '800',
      letterSpacing: '0.06em', textTransform: 'uppercase',
      fontFamily: "'Inter', sans-serif", flexShrink: 0,
    }}>{rc.label}</span>
  )
}

function MetaChip({ icon, text, color }: { icon: string; text: string; color: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      color, fontSize: '12px', fontWeight: '500',
      fontFamily: "'Inter', sans-serif",
    }}>
      <span style={{ fontSize: '11px' }}>{icon}</span>
      {text}
    </span>
  )
}

function MessageButton({ onMessage, hovered: cardHovered }: { onMessage: () => void; hovered: boolean }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onMessage}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '9px 16px', borderRadius: '12px', border: 'none',
        background: hovered
          ? 'linear-gradient(135deg, #c8a200, #FFD700)'
          : cardHovered ? 'rgba(200,162,0,0.12)' : 'rgba(200,162,0,0.07)',
        color: hovered ? '#0a0a0a' : '#c8a200',
        fontSize: '12px', fontWeight: '800',
        letterSpacing: '0.03em', cursor: 'pointer',
        fontFamily: "'Inter', sans-serif",
        transform: hovered ? 'scale(1.06) translateY(-1px)' : 'scale(1)',
        boxShadow: hovered ? '0 0 20px rgba(200,162,0,0.45), 0 4px 14px rgba(200,162,0,0.3)' : 'none',
        transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
        whiteSpace: 'nowrap', flexShrink: 0,
      }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      Message
    </button>
  )
}

// ─── Search input ─────────────────────────────────────────────────────────────
function SearchInput({ value, onChange, placeholder, icon }: {
  value: string; onChange: (v: string) => void; placeholder: string; icon: React.ReactNode
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
      <div style={{
        position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
        color: focused ? '#c8a200' : '#4b5563', transition: 'color 0.2s ease',
        pointerEvents: 'none', display: 'flex',
      }}>
        {icon}
      </div>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%', padding: '13px 16px 13px 42px',
          background: focused ? 'rgba(200,162,0,0.05)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${focused ? 'rgba(200,162,0,0.45)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: '12px', color: '#f9fafb',
          fontSize: '14px', fontWeight: '500',
          fontFamily: "'Inter', sans-serif",
          outline: 'none', transition: 'all 0.22s ease',
          boxShadow: focused ? '0 0 0 3px rgba(200,162,0,0.08)' : 'none',
        }}
      />
    </div>
  )
}

// ─── Skeleton loader card ─────────────────────────────────────────────────────
function SkeletonCard({ index }: { index: number }) {
  return (
    <div style={{
      background: 'rgba(12,12,18,0.9)', borderRadius: '20px',
      border: '1px solid rgba(255,255,255,0.04)',
      padding: '22px 24px',
      animation: `fadeSlideUp 0.4s ease ${index * 60}ms both`,
    }}>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{
          width: 54, height: 54, borderRadius: '50%', flexShrink: 0,
          background: 'rgba(255,255,255,0.05)',
          animation: 'shimmer 1.6s ease-in-out infinite',
        }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: '14px', width: '140px', borderRadius: '7px', background: 'rgba(255,255,255,0.05)', marginBottom: '10px', animation: 'shimmer 1.6s ease-in-out infinite' }} />
          <div style={{ height: '11px', width: '200px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', animation: 'shimmer 1.6s ease-in-out infinite 0.2s' }} />
        </div>
        <div style={{ width: '80px', height: '36px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', animation: 'shimmer 1.6s ease-in-out infinite 0.4s' }} />
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div style={{
      background: 'rgba(12,12,18,0.9)', backdropFilter: 'blur(32px)',
      border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px',
      padding: '80px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden',
      animation: 'fadeSlideUp 0.5s ease both',
    }}>
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: '320px', height: '320px', borderRadius: '50%',
        background: 'rgba(200,162,0,0.03)', filter: 'blur(60px)', pointerEvents: 'none',
      }} />
      <div style={{ position: 'relative' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: '72px', height: '72px', borderRadius: '20px',
          background: 'rgba(200,162,0,0.08)', border: '1px solid rgba(200,162,0,0.15)',
          fontSize: '34px', marginBottom: '20px',
        }}>
          {hasFilters ? '🔍' : '👥'}
        </div>
        <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'white', margin: '0 0 8px', letterSpacing: '-0.02em', fontFamily: "'Inter', sans-serif" }}>
          {hasFilters ? 'No players found' : 'No players yet'}
        </h3>
        <p style={{ color: '#4b5563', fontSize: '14px', margin: 0, lineHeight: 1.6, maxWidth: '300px', marginLeft: 'auto', marginRight: 'auto', fontFamily: "'Inter', sans-serif" }}>
          {hasFilters ? 'Try adjusting your filters — different sport, location, or university.' : 'Be the first to create a profile and get discovered.'}
        </p>
      </div>
    </div>
  )
}

// ─── Stats banner ─────────────────────────────────────────────────────────────
function DiscoveryStats({ players }: { players: any[] }) {
  const roles = players.reduce((acc: any, p) => { acc[p.role || 'Player'] = (acc[p.role || 'Player'] || 0) + 1; return acc }, {})
  const sports = new Set(players.map(p => p.sport_interests).filter(Boolean)).size
  const universities = new Set(players.map(p => p.university).filter(Boolean)).size

  return (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '24px' }}>
      {[
        { label: 'Athletes',   value: players.length,          icon: '👥' },
        { label: 'Sports',     value: sports,                  icon: '🎯' },
        { label: 'Universities', value: universities,          icon: '🎓' },
        { label: 'Coaches',    value: roles['Coach'] || 0,     icon: '🎓' },
      ].map((s, i) => (
        <div key={s.label} style={{
          display: 'inline-flex', alignItems: 'center', gap: '10px',
          padding: '8px 16px', borderRadius: '12px',
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
          animation: `fadeSlideUp 0.5s ease ${200 + i * 55}ms both`,
        }}>
          <span style={{ fontSize: '14px' }}>{s.icon}</span>
          <div>
            <div style={{ fontSize: '17px', fontWeight: '800', color: 'white', lineHeight: 1, fontFamily: "'Inter', sans-serif", letterSpacing: '-0.03em' }}>
              {s.value}
            </div>
            <div style={{ fontSize: '9px', color: '#4b5563', fontWeight: '700', letterSpacing: '0.09em', textTransform: 'uppercase', fontFamily: "'Inter', sans-serif" }}>
              {s.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export const FindPlayers: React.FC = () => {
  const navigate = useNavigate()
  const [searchSport, setSearchSport] = useState('')
  const [searchLocation, setSearchLocation] = useState('')
  const [searchUniversity, setSearchUniversity] = useState('') // ← ADDED
  const [players, setPlayers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [universities, setUniversities] = useState<string[]>([]) // ← ADDED

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUser(data.user))
    loadUniversities()
    loadPlayers()
  }, [])

  // ─── Load universities for filter dropdown ─────────────────────────────────
  const loadUniversities = async () => {
    const { data, error } = await supabase
      .from('university_groups')
      .select('name')
      .order('name', { ascending: true })

    if (!error && data) {
      setUniversities(data.map(u => u.name))
    }
  }

  const loadPlayers = async () => {
    setLoading(true)
    let query = supabase
      .from('users')
      .select('*')
      .neq('id', currentUser?.id || '')
      .eq('status', 'active')

    if (searchSport) query = query.ilike('sport_interests', `%${searchSport}%`)
    if (searchLocation) query = query.ilike('location', `%${searchLocation}%`)
    if (searchUniversity) query = query.ilike('university', `%${searchUniversity}%`) // ← ADDED

    const { data, error } = await query
    if (!error) setPlayers(data || [])
    setLoading(false)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadPlayers()
  }

  const handleClear = () => {
    setSearchSport('')
    setSearchLocation('')
    setSearchUniversity('')
    loadPlayers()
  }

  const handleMessage = (player: any) => {
    console.log('🔍 Navigating to messages with player:', player)
    navigate('/messages', { state: { selectedUser: player } })
  }

  const hasFilters = !!(searchSport || searchLocation || searchUniversity)

  return (
    <div style={{
      minHeight: '100vh', background: '#0D0D0F', color: 'white',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      position: 'relative', overflowX: 'hidden',
    }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 70% 45% at 50% -5%, rgba(200,162,0,0.06) 0%, transparent 65%)' }} />
      <div style={{ position: 'fixed', top: '20%', right: '-18%', width: '600px', height: '600px',
        borderRadius: '50%', background: 'rgba(59,130,246,0.03)', filter: 'blur(120px)',
        zIndex: 0, pointerEvents: 'none', animation: 'floatBlob 16s ease-in-out infinite' }} />
      <div style={{ position: 'fixed', bottom: '-10%', left: '-12%', width: '550px', height: '550px',
        borderRadius: '50%', background: 'rgba(168,85,247,0.025)', filter: 'blur(100px)',
        zIndex: 0, pointerEvents: 'none', animation: 'floatBlob 20s ease-in-out infinite 6s' }} />

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 24px 80px', position: 'relative', zIndex: 1 }}>

        {/* Hero */}
        <section style={{ marginBottom: '40px', animation: 'fadeSlideUp 0.55s ease both' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '5px 14px 5px 8px',
            background: 'rgba(200,162,0,0.08)', border: '1px solid rgba(200,162,0,0.18)',
            borderRadius: '99px', marginBottom: '20px',
          }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '18px', height: '18px', borderRadius: '50%',
              background: 'rgba(200,162,0,0.2)', fontSize: '10px',
            }}>👥</span>
            <span style={{ color: '#c8a200', fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Inter', sans-serif" }}>
              Player Discovery
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(30px, 5vw, 50px)', fontWeight: '900',
            letterSpacing: '-0.04em', lineHeight: 1.05,
            color: 'white', margin: '0 0 10px',
            fontFamily: "'Inter', sans-serif",
          }}>
            Find Your{' '}
            <span style={{
              background: 'linear-gradient(135deg, #c8a200 0%, #FFD700 50%, #e8b800 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              display: 'inline-block',
            }}>Perfect Teammate</span>
          </h1>
          <p style={{ color: '#4b5563', fontSize: '15px', margin: 0, lineHeight: 1.5, maxWidth: '420px', fontFamily: "'Inter', sans-serif" }}>
            Discover athletes, coaches, and organizers who match your sport, location, or university.
          </p>

          {!loading && players.length > 0 && <DiscoveryStats players={players} />}
        </section>

        {/* Search */}
        <div style={{
          background: 'rgba(12,12,18,0.92)', backdropFilter: 'blur(32px)',
          border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px',
          padding: '24px', marginBottom: '32px',
          position: 'relative', overflow: 'hidden',
          animation: 'fadeSlideUp 0.55s ease 0.08s both',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(200,162,0,0.2), transparent)' }} />

          <form onSubmit={handleSearch}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <SearchInput
                value={searchSport}
                onChange={setSearchSport}
                placeholder="Sport (Football, Tennis…)"
                icon={
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                }
              />
              <SearchInput
                value={searchLocation}
                onChange={setSearchLocation}
                placeholder="Location (Lahore, Karachi…)"
                icon={
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                }
              />
              {/* ─── UNIVERSITY SEARCH ─── */}
              <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
                <div style={{
                  position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                  color: '#4b5563', pointerEvents: 'none', display: 'flex',
                }}>
                  <span style={{ fontSize: '15px' }}>🎓</span>
                </div>
                <select
                  value={searchUniversity}
                  onChange={(e) => setSearchUniversity(e.target.value)}
                  style={{
                    width: '100%', padding: '13px 16px 13px 42px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px', color: '#f9fafb',
                    fontSize: '14px', fontWeight: '500',
                    fontFamily: "'Inter', sans-serif",
                    outline: 'none', appearance: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.22s ease',
                  }}
                >
                  <option value="">All Universities</option>
                  {universities.map(uni => (
                    <option key={uni} value={uni} style={{ background: '#111118', color: '#f9fafb' }}>
                      {uni}
                    </option>
                  ))}
                </select>
                <div style={{
                  position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                  pointerEvents: 'none', color: '#4b5563',
                }}>
                  ▼
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <SearchButton />
                {hasFilters && <ClearButton onClear={handleClear} />}
              </div>
            </div>
          </form>
        </div>

        {/* Results */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[0,1,2,3].map(i => <SkeletonCard key={i} index={i} />)}
          </div>
        ) : players.length === 0 ? (
          <EmptyState hasFilters={hasFilters} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <div style={{ width: '16px', height: '1px', background: 'rgba(200,162,0,0.4)' }} />
              <span style={{ color: '#374151', fontSize: '10px', fontWeight: '700', letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap' }}>
                {players.length} Athlete{players.length !== 1 ? 's' : ''} Found
              </span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.04)' }} />
            </div>

            {players.map((player, i) => (
              <PlayerCard key={player.id} player={player} index={i} onMessage={handleMessage} />
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: '60px', display: 'flex', justifyContent: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            padding: '8px 20px', background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.04)', borderRadius: '99px',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#c8a200', boxShadow: '0 0 6px rgba(200,162,0,0.6)', display: 'inline-block', animation: 'pulse 2s ease-in-out infinite' }} />
            <span style={{ color: '#374151', fontSize: '11px', fontWeight: '500', letterSpacing: '0.06em', fontFamily: "'Inter', sans-serif" }}>
              TEAMSYNK · PLAYER NETWORK
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        input::placeholder { color: #374151; }
        @keyframes rotateConic { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes floatBlob   { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-28px) scale(1.04)} }
        @keyframes pulse       { 0%,100%{opacity:0.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.1)} }
        @keyframes shimmer     { 0%{opacity:0.5} 50%{opacity:1} 100%{opacity:0.5} }
        ::-webkit-scrollbar       { width: 6px; }
        ::-webkit-scrollbar-track { background: #0D0D0F; }
        ::-webkit-scrollbar-thumb { background: rgba(200,162,0,0.3); border-radius: 3px; }
      `}</style>
    </div>
  )
}

// ─── Search / Clear buttons ───────────────────────────────────────────────────
function SearchButton() {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      type="submit"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '13px 22px', borderRadius: '12px', border: 'none',
        background: hovered ? 'linear-gradient(135deg, #c8a200, #FFD700)' : 'linear-gradient(135deg, #b89200, #d4a500)',
        color: '#0a0a0a', fontSize: '13px', fontWeight: '800',
        letterSpacing: '0.03em', cursor: 'pointer',
        fontFamily: "'Inter', sans-serif",
        display: 'inline-flex', alignItems: 'center', gap: '7px',
        transform: hovered ? 'scale(1.04) translateY(-1px)' : 'scale(1)',
        boxShadow: hovered ? '0 0 24px rgba(200,162,0,0.5), 0 4px 14px rgba(200,162,0,0.3)' : '0 0 10px rgba(200,162,0,0.18)',
        transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)', whiteSpace: 'nowrap',
      }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      Search
    </button>
  )
}

function ClearButton({ onClear }: { onClear: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      type="button"
      onClick={onClear}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '13px 18px', borderRadius: '12px',
        background: hovered ? 'rgba(255,255,255,0.07)' : 'transparent',
        border: `1px solid ${hovered ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.07)'}`,
        color: hovered ? '#e5e7eb' : '#6b7280',
        fontSize: '13px', fontWeight: '600', cursor: 'pointer',
        fontFamily: "'Inter', sans-serif",
        transition: 'all 0.22s ease', whiteSpace: 'nowrap',
      }}
    >
      Clear
    </button>
  )
}