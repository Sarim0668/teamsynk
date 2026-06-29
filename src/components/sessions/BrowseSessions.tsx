import React, { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

// ─── Sport config: icon + accent color ───────────────────────────────────────
const SPORT_CONFIG: Record<string, { icon: string; color: string; glow: string }> = {
  Football:    { icon: '⚽', color: '#22c55e',  glow: 'rgba(34,197,94,0.2)' },
  Basketball:  { icon: '🏀', color: '#f97316',  glow: 'rgba(249,115,22,0.2)' },
  Cricket:     { icon: '🏏', color: '#3b82f6',  glow: 'rgba(59,130,246,0.2)' },
  Tennis:      { icon: '🎾', color: '#eab308',  glow: 'rgba(234,179,8,0.2)' },
  Badminton:   { icon: '🏸', color: '#a855f7',  glow: 'rgba(168,85,247,0.2)' },
  Volleyball:  { icon: '🏐', color: '#ec4899',  glow: 'rgba(236,72,153,0.2)' },
  Swimming:    { icon: '🏊', color: '#06b6d4',  glow: 'rgba(6,182,212,0.2)' },
  Running:     { icon: '🏃', color: '#f43f5e',  glow: 'rgba(244,63,94,0.2)' },
  Cycling:     { icon: '🚴', color: '#10b981',  glow: 'rgba(16,185,129,0.2)' },
  Hockey:      { icon: '🏑', color: '#8b5cf6',  glow: 'rgba(139,92,246,0.2)' },
 'Table Tennis': { icon: '🏓', color: '#06b6d4', glow: 'rgba(6,182,212,0.2)' },  // ← ADDED
  'Study Group':  { icon: '📚', color: '#8b5cf6', glow: 'rgba(139,92,246,0.2)' },  // ← ADDED
}

const getSport = (type: string) =>
  SPORT_CONFIG[type] || { icon: '🎯', color: '#c8a200', glow: 'rgba(200,162,0,0.2)' }

// ─── Format date nicely ───────────────────────────────────────────────────────
function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date(); today.setHours(0,0,0,0)
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  if (d.getTime() === today.getTime()) return 'Today'
  if (d.getTime() === tomorrow.getTime()) return 'Tomorrow'
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

// ─── Capacity color ───────────────────────────────────────────────────────────
function capacityColor(pct: number, isFull: boolean) {
  if (isFull) return '#ef4444'
  if (pct > 0.75) return '#f97316'
  if (pct > 0.5) return '#eab308'
  return '#22c55e'
}

// ─── Session Card ─────────────────────────────────────────────────────────────
interface CardProps {
  session: any
  isCreator: boolean
  hasJoined: boolean
  isFull: boolean
  currentCount: number
  joiningId: string | null
  leavingId: string | null
  onJoin: (id: string) => void
  onLeave: (id: string) => void
  index: number
}

function SessionCard({
  session, isCreator, hasJoined, isFull, currentCount,
  joiningId, leavingId, onJoin, onLeave, index,
}: CardProps) {
  const [hovered, setHovered] = useState(false)
  const sport = getSport(session.sport_type)
  const pct = currentCount / session.max_participants
  const spotsLeft = session.max_participants - currentCount
  const isJoining = joiningId === session.id
  const isLeaving = leavingId === session.id
  const canJoin = !isCreator && !isFull && !hasJoined

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        background: hovered
          ? 'linear-gradient(135deg, rgba(26,26,34,0.98), rgba(22,20,28,0.98))'
          : 'rgba(14,14,20,0.92)',
        backdropFilter: 'blur(28px)',
        borderRadius: '20px',
        border: `1px solid ${hovered
          ? hasJoined ? 'rgba(34,197,94,0.35)' : 'rgba(200,162,0,0.3)'
          : hasJoined ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)'}`,
        overflow: 'hidden',
        transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered
          ? `0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(200,162,0,0.08), 0 0 40px ${sport.glow}`
          : '0 4px 24px rgba(0,0,0,0.4)',
        animation: `fadeSlideUp 0.5s ease ${index * 60}ms both`,
      }}
    >
      {/* Sport-keyed left accent stripe */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px',
        background: `linear-gradient(180deg, ${sport.color}00 0%, ${sport.color} 40%, ${sport.color} 60%, ${sport.color}00 100%)`,
        opacity: hovered ? 1 : 0.5,
        transition: 'opacity 0.35s ease',
      }} />

      {/* Top shimmer line */}
      <div style={{
        position: 'absolute', top: 0, left: '3px', right: 0, height: '1px',
        background: hovered
          ? `linear-gradient(90deg, ${sport.color}40, rgba(200,162,0,0.3), transparent)`
          : 'linear-gradient(90deg, rgba(255,255,255,0.04), transparent)',
        transition: 'all 0.35s ease',
      }} />

      <div style={{ padding: '24px 24px 24px 28px' }}>
        {/* ── Card Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Sport icon bubble */}
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
              background: `linear-gradient(135deg, ${sport.color}18, ${sport.color}08)`,
              border: `1px solid ${sport.color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px',
              transition: 'all 0.3s ease',
              transform: hovered ? 'scale(1.08) rotate(-4deg)' : 'scale(1) rotate(0)',
              boxShadow: hovered ? `0 0 16px ${sport.color}30` : 'none',
            }}>
              {sport.icon}
            </div>
            <div>
              <h3 style={{
                fontSize: '17px', fontWeight: '800', color: 'white',
                letterSpacing: '-0.02em', margin: 0, lineHeight: 1.1,
                fontFamily: "'Inter', sans-serif",
              }}>
                {session.sport_type}
              </h3>
              <div style={{ display: 'flex', gap: '6px', marginTop: '5px', flexWrap: 'wrap' }}>
                {isCreator && <StatusBadge label="Your Session" color="#c8a200" bg="rgba(200,162,0,0.1)" border="rgba(200,162,0,0.25)" />}
                {hasJoined && <StatusBadge label="✓ Joined" color="#4ade80" bg="rgba(34,197,94,0.1)" border="rgba(34,197,94,0.25)" />}
                {isFull && !isCreator && <StatusBadge label="● Full" color="#f87171" bg="rgba(239,68,68,0.1)" border="rgba(239,68,68,0.25)" />}
                {!isFull && !isCreator && !hasJoined && spotsLeft <= 3 && (
                  <StatusBadge label={`${spotsLeft} spot${spotsLeft > 1 ? 's' : ''} left`} color="#f97316" bg="rgba(249,115,22,0.1)" border="rgba(249,115,22,0.25)" />
                )}
              </div>
            </div>
          </div>

          {/* Date chip */}
          <div style={{
            padding: '6px 12px', borderRadius: '10px', textAlign: 'center',
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            flexShrink: 0,
          }}>
            <div style={{ color: '#c8a200', fontSize: '10px', fontWeight: '800', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'Inter', sans-serif" }}>
              {formatDate(session.session_date)}
            </div>
            <div style={{ color: '#6b7280', fontSize: '13px', fontWeight: '600', fontFamily: "'Inter', sans-serif", marginTop: '1px' }}>
              {session.session_time.substring(0, 5)}
            </div>
          </div>
        </div>

        {/* ── Meta row ── */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <MetaItem icon="◉" color={sport.color} text={session.location} />
          {session.description && (
            <p style={{
              color: '#4b5563', fontSize: '12px', lineHeight: '1.5',
              margin: 0, width: '100%',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              fontFamily: "'Inter', sans-serif",
            }}>{session.description}</p>
          )}
        </div>

        {/* ── Footer: participants + actions ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {/* Capacity section */}
          <div style={{ flex: 1, minWidth: '120px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: '#6b7280', fontSize: '11px', fontWeight: '600', letterSpacing: '0.05em', fontFamily: "'Inter', sans-serif" }}>
                {currentCount} / {session.max_participants} players
              </span>
              {!isFull && spotsLeft > 0 && (
                <span style={{ color: capacityColor(pct, isFull), fontSize: '11px', fontWeight: '700', fontFamily: "'Inter', sans-serif" }}>
                  {spotsLeft} open
                </span>
              )}
            </div>
            <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.min(pct * 100, 100)}%`,
                background: `linear-gradient(90deg, ${capacityColor(pct, isFull)}99, ${capacityColor(pct, isFull)})`,
                borderRadius: '99px',
                boxShadow: `0 0 8px ${capacityColor(pct, isFull)}60`,
                transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)',
              }} />
            </div>
          </div>

          {/* WhatsApp link */}
          {session.whatsapp_link && (
            <a
              href={session.whatsapp_link}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '5px 12px', borderRadius: '8px',
                background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.2)',
                color: '#25D366', fontSize: '11px', fontWeight: '700',
                textDecoration: 'none', letterSpacing: '0.04em', fontFamily: "'Inter', sans-serif",
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(37,211,102,0.15)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(37,211,102,0.08)' }}
            >
              💬 WhatsApp
            </a>
          )}

          {/* ─── View Details Button ─── */}
          <Link
            to={`/session/${session.id}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 18px',
              borderRadius: '12px',
              background: hovered ? 'rgba(200,162,0,0.15)' : 'rgba(200,162,0,0.08)',
              border: '1px solid rgba(200,162,0,0.2)',
              color: '#c8a200',
              fontSize: '12px',
              fontWeight: '700',
              textDecoration: 'none',
              fontFamily: "'Inter', sans-serif",
              transition: 'all 0.25s ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(200,162,0,0.2)'
              e.currentTarget.style.borderColor = 'rgba(200,162,0,0.4)'
              e.currentTarget.style.transform = 'scale(1.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(200,162,0,0.08)'
              e.currentTarget.style.borderColor = 'rgba(200,162,0,0.2)'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            👁️ View Details
          </Link>

          {/* Action button */}
          <ActionButton
            canJoin={canJoin} hasJoined={hasJoined} isCreator={isCreator}
            isFull={isFull} isJoining={isJoining} isLeaving={isLeaving}
            onJoin={() => onJoin(session.id)}
            onLeave={() => onLeave(session.id)}
          />
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ label, color, bg, border }: { label: string; color: string; bg: string; border: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 9px', borderRadius: '99px',
      background: bg, border: `1px solid ${border}`,
      color, fontSize: '10px', fontWeight: '800',
      letterSpacing: '0.05em', fontFamily: "'Inter', sans-serif",
    }}>{label}</span>
  )
}

function MetaItem({ icon, color, text }: { icon: string; color: string; text: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#9ca3af', fontSize: '13px', fontFamily: "'Inter', sans-serif" }}>
      <span style={{ color, fontSize: '11px' }}>{icon}</span>
      {text}
    </span>
  )
}

function ActionButton({ canJoin, hasJoined, isCreator, isFull, isJoining, isLeaving, onJoin, onLeave }: {
  canJoin: boolean; hasJoined: boolean; isCreator: boolean; isFull: boolean
  isJoining: boolean; isLeaving: boolean; onJoin: () => void; onLeave: () => void
}) {
  const [hovered, setHovered] = useState(false)

  if (canJoin) {
    return (
      <button
        onClick={onJoin}
        disabled={isJoining}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          padding: '10px 22px', borderRadius: '12px', border: 'none', cursor: isJoining ? 'not-allowed' : 'pointer',
          background: isJoining ? 'rgba(200,162,0,0.4)' : hovered
            ? 'linear-gradient(135deg, #c8a200, #FFD700)'
            : 'linear-gradient(135deg, #b89200, #e8b800)',
          color: '#0a0a0a', fontSize: '13px', fontWeight: '800',
          letterSpacing: '0.03em', fontFamily: "'Inter', sans-serif",
          transform: hovered && !isJoining ? 'scale(1.04) translateY(-1px)' : 'scale(1)',
          boxShadow: hovered && !isJoining ? '0 0 24px rgba(200,162,0,0.5), 0 4px 16px rgba(200,162,0,0.3)' : '0 0 12px rgba(200,162,0,0.2)',
          transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
          whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '6px',
        }}
      >
        {isJoining ? (
          <><Spinner /> Joining…</>
        ) : 'Join Session'}
      </button>
    )
  }

  if (hasJoined) {
    return (
      <button
        onClick={onLeave}
        disabled={isLeaving}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          padding: '10px 22px', borderRadius: '12px',
          background: hovered ? 'rgba(239,68,68,0.12)' : 'transparent',
          border: `1px solid ${hovered ? 'rgba(239,68,68,0.5)' : 'rgba(239,68,68,0.25)'}`,
          color: hovered ? '#f87171' : '#ef4444',
          fontSize: '13px', fontWeight: '700', fontFamily: "'Inter', sans-serif",
          cursor: isLeaving ? 'not-allowed' : 'pointer',
          transition: 'all 0.25s ease', whiteSpace: 'nowrap',
          display: 'inline-flex', alignItems: 'center', gap: '6px',
        }}
      >
        {isLeaving ? <><Spinner color="#ef4444" /> Leaving…</> : 'Leave'}
      </button>
    )
  }

  if (isCreator) {
    return (
      <span style={{
        padding: '10px 18px', borderRadius: '12px',
        background: 'rgba(200,162,0,0.06)', border: '1px solid rgba(200,162,0,0.15)',
        color: '#c8a200', fontSize: '12px', fontWeight: '700',
        fontFamily: "'Inter', sans-serif", letterSpacing: '0.04em', whiteSpace: 'nowrap',
      }}>
        ✦ Your Session
      </span>
    )
  }

  if (isFull) {
    return (
      <span style={{
        padding: '10px 18px', borderRadius: '12px',
        background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)',
        color: '#6b7280', fontSize: '12px', fontWeight: '600',
        fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap',
      }}>
        Session Full
      </span>
    )
  }

  return null
}

function Spinner({ color = '#0a0a0a' }: { color?: string }) {
  return (
    <div style={{
      width: '13px', height: '13px', borderRadius: '50%',
      border: `2px solid ${color}30`, borderTopColor: color,
      animation: 'spin 0.7s linear infinite', flexShrink: 0,
    }} />
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div style={{
      background: 'rgba(12,12,18,0.9)', backdropFilter: 'blur(32px)',
      border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px',
      padding: '80px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: '300px', height: '300px', borderRadius: '50%',
        background: 'rgba(200,162,0,0.04)', filter: 'blur(60px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'relative',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: '72px', height: '72px', borderRadius: '20px',
        background: 'rgba(200,162,0,0.08)', border: '1px solid rgba(200,162,0,0.15)',
        fontSize: '36px', marginBottom: '20px',
      }}>🏟️</div>
      <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'white', margin: '0 0 8px', letterSpacing: '-0.02em', fontFamily: "'Inter', sans-serif" }}>
        No sessions yet
      </h3>
      <p style={{ color: '#4b5563', fontSize: '14px', margin: '0 0 28px', lineHeight: 1.5, fontFamily: "'Inter', sans-serif" }}>
        The arena is quiet. Be the first to kick things off.
      </p>
      <Link to="/create-session" style={{
        display: 'inline-flex', alignItems: 'center', gap: '8px',
        padding: '12px 28px', background: 'linear-gradient(135deg, #c8a200, #FFD700)',
        color: '#0a0a0a', fontWeight: '800', fontSize: '13px',
        letterSpacing: '0.04em', textTransform: 'uppercase',
        borderRadius: '12px', textDecoration: 'none',
        boxShadow: '0 4px 24px rgba(200,162,0,0.3)',
        fontFamily: "'Inter', sans-serif",
      }}>
        ➕ Create Session
      </Link>
    </div>
  )
}

// ─── Live stats banner ────────────────────────────────────────────────────────
function HeroStats({ sessions, participants }: { sessions: any[]; participants: Record<string, number> }) {
  const totalSessions = sessions.length
  const totalSpots = sessions.reduce((a, s) => a + (s.max_participants - (participants[s.id] || 0)), 0)
  const sports = new Set(sessions.map(s => s.sport_type)).size

  const stats = [
    { label: 'Live Sessions', value: totalSessions, icon: '⚡' },
    { label: 'Open Spots',    value: totalSpots,    icon: '🎯' },
    { label: 'Sports',        value: sports,        icon: '🏟️' },
  ]

  return (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '24px' }}>
      {stats.map((s, i) => (
        <div key={s.label} style={{
          display: 'inline-flex', alignItems: 'center', gap: '10px',
          padding: '10px 18px', borderRadius: '12px',
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
          animation: `fadeSlideUp 0.5s ease ${200 + i * 60}ms both`,
        }}>
          <span style={{ fontSize: '16px' }}>{s.icon}</span>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: 'white', lineHeight: 1, fontFamily: "'Inter', sans-serif", letterSpacing: '-0.03em' }}>
              {s.value}
            </div>
            <div style={{ fontSize: '10px', color: '#4b5563', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'Inter', sans-serif" }}>
              {s.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Message banner ───────────────────────────────────────────────────────────
function MessageBanner({ message }: { message: { text: string; type: 'success' | 'error' | 'info' } }) {
  const cfg = {
    success: { bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.2)',  color: '#4ade80', icon: '✓' },
    error:   { bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)',  color: '#f87171', icon: '✕' },
    info:    { bg: 'rgba(200,162,0,0.08)',  border: 'rgba(200,162,0,0.2)',  color: '#c8a200', icon: 'ℹ' },
  }[message.type]

  return (
    <div style={{
      padding: '14px 20px', borderRadius: '14px', marginBottom: '20px',
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      color: cfg.color, fontSize: '13px', fontWeight: '600',
      display: 'flex', alignItems: 'center', gap: '10px',
      animation: 'fadeSlideUp 0.3s ease both',
      fontFamily: "'Inter', sans-serif",
    }}>
      <span style={{ fontSize: '15px', flexShrink: 0 }}>{cfg.icon}</span>
      {message.text}
    </div>
  )
}

// ─── Loading screen ───────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh', background: '#0D0D0F',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
        <div style={{ position: 'relative', width: '52px', height: '52px' }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid rgba(200,162,0,0.12)' }} />
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid transparent', borderTopColor: '#c8a200', animation: 'spin 0.8s linear infinite' }} />
          <div style={{ position: 'absolute', inset: '10px', borderRadius: '50%', background: 'rgba(200,162,0,0.08)', animation: 'pulse 1.6s ease-in-out infinite' }} />
        </div>
        <div>
          <p style={{ color: '#e5e7eb', fontSize: '14px', fontWeight: '600', margin: '0 0 4px', fontFamily: "'Inter', sans-serif" }}>Finding sessions</p>
          <p style={{ color: '#374151', fontSize: '12px', margin: 0, letterSpacing: '0.06em', fontFamily: "'Inter', sans-serif" }}>Scanning your area…</p>
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:0.5;transform:scale(0.95)}50%{opacity:1;transform:scale(1.05)}}`}</style>
    </div>
  )
}

// ─── Create session button ────────────────────────────────────────────────────
function CreateSessionButton() {
  const [hovered, setHovered] = useState(false)
  return (
    <Link
      to="/create-session"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '7px',
        padding: '12px 24px', borderRadius: '14px', textDecoration: 'none',
        background: hovered ? 'linear-gradient(135deg, #c8a200, #FFD700)' : 'linear-gradient(135deg, #b89200, #d4a500)',
        color: '#0a0a0a', fontSize: '13px', fontWeight: '800',
        letterSpacing: '0.03em', fontFamily: "'Inter', sans-serif",
        transform: hovered ? 'scale(1.04) translateY(-1px)' : 'scale(1)',
        boxShadow: hovered ? '0 0 32px rgba(200,162,0,0.55), 0 8px 24px rgba(200,162,0,0.3)' : '0 0 16px rgba(200,162,0,0.2)',
        transition: 'all 0.28s cubic-bezier(0.4,0,0.2,1)',
        whiteSpace: 'nowrap', flexShrink: 0,
        position: 'relative', overflow: 'hidden',
      }}
    >
      <span style={{
        position: 'absolute', top: 0, left: '-100%', width: '60%', height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
        animation: 'shimmerSweep 2.4s ease-in-out infinite', pointerEvents: 'none',
      }} />
      ➕ Create Session
      <style>{`@keyframes shimmerSweep{0%{left:-100%}60%{left:150%}100%{left:150%}}`}</style>
    </Link>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export const BrowseSessions: React.FC = () => {
  const [sessions, setSessions]             = useState<any[]>([])
  const [loading, setLoading]               = useState(true)
  const [user, setUser]                     = useState<any>(null)
  const [participants, setParticipants]     = useState<Record<string, number>>({})
  const [joinedSessions, setJoinedSessions] = useState<Set<string>>(new Set())
  const [joiningId, setJoiningId]           = useState<string | null>(null)
  const [leavingId, setLeavingId]           = useState<string | null>(null)
  const [message, setMessage]               = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null)

  // ─── Function to delete expired sessions ──────────────────────────────────
  const deleteExpiredSessions = async () => {
    const today = new Date().toISOString().split('T')[0]
    const now = new Date().toTimeString().slice(0, 5)
    
    console.log(`🗑️ Checking for expired sessions (date: ${today}, time: ${now})`)
    
    // Delete sessions with date < today
    const { data: expiredSessions, error: fetchError } = await supabase
      .from('sports_sessions')
      .select('id')
      .lt('session_date', today)

    if (fetchError) {
      console.error('❌ Error fetching expired sessions:', fetchError)
      return
    }

    if (expiredSessions && expiredSessions.length > 0) {
      console.log(`🗑️ Found ${expiredSessions.length} expired sessions to delete`)
      
      const { error: deleteError } = await supabase
        .from('sports_sessions')
        .delete()
        .lt('session_date', today)

      if (deleteError) {
        console.error('❌ Error deleting expired sessions:', deleteError)
      } else {
        console.log(`✅ Deleted ${expiredSessions.length} expired sessions`)
      }
    }

    // Delete sessions that are today but already passed the time
    const { data: todayExpired, error: todayFetchError } = await supabase
      .from('sports_sessions')
      .select('id')
      .eq('session_date', today)
      .lt('session_time', now)

    if (todayFetchError) {
      console.error('❌ Error fetching today\'s expired sessions:', todayFetchError)
      return
    }

    if (todayExpired && todayExpired.length > 0) {
      console.log(`🗑️ Found ${todayExpired.length} today's expired sessions to delete`)
      
      const { error: todayDeleteError } = await supabase
        .from('sports_sessions')
        .delete()
        .eq('session_date', today)
        .lt('session_time', now)

      if (todayDeleteError) {
        console.error('❌ Error deleting today\'s expired sessions:', todayDeleteError)
      } else {
        console.log(`✅ Deleted ${todayExpired.length} today's expired sessions`)
      }
    }
  }

  const loadData = async () => {
    setLoading(true)
    setMessage(null)

    // ─── FIRST: Delete expired sessions ──────────────────────────────────────
    await deleteExpiredSessions()

    const { data: { user: currentUser } } = await supabase.auth.getUser()
    setUser(currentUser)

    const today = new Date().toISOString().split('T')[0]
    const { data: sessionsData, error: sessionsError } = await supabase
      .from('sports_sessions')
      .select('*')
      .gte('session_date', today)
      .order('session_date', { ascending: true })
      .order('session_time', { ascending: true })

    if (sessionsError) { 
      console.error(sessionsError)
      setLoading(false)
      return 
    }
    
    setSessions(sessionsData || [])

    if (sessionsData && sessionsData.length > 0) {
      const counts: Record<string, number> = {}
      const joined: Set<string> = new Set()
      for (const session of sessionsData) {
        const { count } = await supabase
          .from('session_participants')
          .select('*', { count: 'exact', head: true })
          .eq('session_id', session.id)
        counts[session.id] = count || 0
        if (currentUser) {
          const { data: joinedData } = await supabase
            .from('session_participants')
            .select('*')
            .eq('session_id', session.id)
            .eq('user_id', currentUser.id)
          if (joinedData && joinedData.length > 0) joined.add(session.id)
        }
      }
      setParticipants(counts)
      setJoinedSessions(joined)
    }
    setLoading(false)
  }

  // src/components/sessions/BrowseSessions.tsx - Add this useEffect

  useEffect(() => {
    loadData()

    // ─── REAL-TIME SUBSCRIPTION ──────────────────────────────────────────
    const sessionSubscription = supabase
      .channel('sessions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sports_sessions'
        },
        (payload) => {
          console.log('🔄 Session change detected:', payload)
          loadData()
        }
      )
      .subscribe()

    const participantsSubscription = supabase
      .channel('session-participants-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_participants'
        },
        () => {
          console.log('🔄 Session participants change detected')
          loadData()
        }
      )
      .subscribe()

    return () => {
      sessionSubscription.unsubscribe()
      participantsSubscription.unsubscribe()
    }
  }, [])

  // ─── Auto-refresh every 60 seconds to clean up expired sessions ──────────
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing sessions...')
      loadData()
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  const handleJoin = async (sessionId: string) => {
    if (!user) { setMessage({ text: 'Please login first', type: 'error' }); return }
    setJoiningId(sessionId)
    const session = sessions.find(s => s.id === sessionId)
    if (!session) { setJoiningId(null); return }
    if (joinedSessions.has(sessionId)) { setMessage({ text: 'You already joined this session', type: 'info' }); setJoiningId(null); return }
    if (session.created_by === user.id) { setMessage({ text: 'You cannot join your own session', type: 'error' }); setJoiningId(null); return }
    const currentCount = participants[sessionId] || 0
    if (currentCount >= session.max_participants) { setMessage({ text: 'This session is full', type: 'error' }); setJoiningId(null); return }
    const { error } = await supabase.from('session_participants').insert({ session_id: sessionId, user_id: user.id })
    if (error) { setMessage({ text: 'Failed to join: ' + error.message, type: 'error' }) }
    else { setMessage({ text: 'You have joined the session', type: 'success' }); await loadData() }
    setJoiningId(null)
  }

  const handleLeave = async (sessionId: string) => {
    if (!user) return
    if (!window.confirm('Are you sure you want to leave this session?')) return
    setLeavingId(sessionId)
    const { error } = await supabase.from('session_participants').delete().eq('session_id', sessionId).eq('user_id', user.id)
    if (error) { setMessage({ text: 'Failed to leave: ' + error.message, type: 'error' }) }
    else { setMessage({ text: 'You have left the session', type: 'success' }); await loadData() }
    setLeavingId(null)
  }

  if (loading) return <LoadingScreen />

  return (
    <div style={{
      minHeight: '100vh', background: '#0D0D0F', color: 'white',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      position: 'relative', overflowX: 'hidden',
    }}>
      {/* ── Ambient background ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 80% 50% at 50% -5%, rgba(200,162,0,0.06) 0%, transparent 65%)' }} />
      <div style={{ position: 'fixed', top: '25%', right: '-18%', width: '650px', height: '650px',
        borderRadius: '50%', background: 'rgba(200,162,0,0.025)', filter: 'blur(120px)',
        zIndex: 0, pointerEvents: 'none', animation: 'floatBlob 15s ease-in-out infinite' }} />
      <div style={{ position: 'fixed', bottom: '-10%', left: '-12%', width: '550px', height: '550px',
        borderRadius: '50%', background: 'rgba(59,130,246,0.025)', filter: 'blur(100px)',
        zIndex: 0, pointerEvents: 'none', animation: 'floatBlob 19s ease-in-out infinite 5s' }} />

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 24px 80px', position: 'relative', zIndex: 1 }}>

        {/* ══════════ HERO ══════════ */}
        <section style={{ marginBottom: '48px', animation: 'fadeSlideUp 0.55s ease both' }}>
          {/* Eyebrow */}
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
            }}>⚡</span>
            <span style={{ color: '#c8a200', fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Inter', sans-serif" }}>
              Live Now
            </span>
          </div>

          {/* Headline */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
            <div>
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
                }}>Next Game</span>
              </h1>
              <p style={{ color: '#4b5563', fontSize: '15px', margin: 0, lineHeight: 1.5, maxWidth: '400px', fontFamily: "'Inter', sans-serif" }}>
                Upcoming sessions in your area — join one or create your own.
              </p>
            </div>

            {/* CTA */}
            <CreateSessionButton />
          </div>

          {/* Live stats */}
          {sessions.length > 0 && <HeroStats sessions={sessions} participants={participants} />}
        </section>

        {/* ══════════ MESSAGE ══════════ */}
        {message && <MessageBanner message={message} />}

        {/* ══════════ SESSION LIST ══════════ */}
        {sessions.length === 0 ? (
          <EmptyState />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Section label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <div style={{ width: '16px', height: '1px', background: 'rgba(200,162,0,0.4)' }} />
              <span style={{ color: '#374151', fontSize: '10px', fontWeight: '700', letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: "'Inter', sans-serif" }}>
                {sessions.length} Session{sessions.length !== 1 ? 's' : ''} Available
              </span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.04)' }} />
            </div>

            {sessions.map((session, i) => {
              const isCreator = session.created_by === user?.id
              const currentCount = participants[session.id] || 0
              const isFull = currentCount >= session.max_participants
              const hasJoined = joinedSessions.has(session.id)

              return (
                <SessionCard
                  key={session.id}
                  session={session}
                  isCreator={isCreator}
                  hasJoined={hasJoined}
                  isFull={isFull}
                  currentCount={currentCount}
                  joiningId={joiningId}
                  leavingId={leavingId}
                  onJoin={handleJoin}
                  onLeave={handleLeave}
                  index={i}
                />
              )
            })}
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: '60px', display: 'flex', justifyContent: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            padding: '8px 20px', background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.04)', borderRadius: '99px',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.6)', display: 'inline-block' }} />
            <span style={{ color: '#374151', fontSize: '11px', fontWeight: '500', letterSpacing: '0.06em', fontFamily: "'Inter', sans-serif" }}>
              LIVE · AUTO-CLEANUP ACTIVE
            </span>
          </div>
        </div>
      </div>

      {/* ── Global keyframes ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin        { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes floatBlob   { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-30px) scale(1.04)} }
        @keyframes pulse       { 0%,100%{opacity:0.5;transform:scale(0.95)} 50%{opacity:1;transform:scale(1.05)} }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0D0D0F; }
        ::-webkit-scrollbar-thumb { background: rgba(200,162,0,0.3); border-radius: 3px; }
      `}</style>
    </div>
  )
}