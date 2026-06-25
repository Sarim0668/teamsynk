import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

// ─── Animated counter (reused from Dashboard pattern) ───────────────────────
function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    let start = 0
    const step = Math.ceil(value / 24)
    const timer = setInterval(() => {
      start = Math.min(start + step, value)
      setDisplay(start)
      if (start >= value) clearInterval(timer)
    }, 35)
    return () => clearInterval(timer)
  }, [value])
  return <>{display}</>
}

// ─── Skill level bar ─────────────────────────────────────────────────────────
function SkillBar({ level }: { level: string }) {
  const levels: Record<string, { pct: number; color: string }> = {
    Beginner:     { pct: 25,  color: '#6b7280' },
    Intermediate: { pct: 55,  color: '#3b82f6' },
    Advanced:     { pct: 80,  color: '#c8a200' },
    Professional: { pct: 100, color: '#FFD700' },
  }
  const info = levels[level] || levels.Beginner
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ color: '#9ca3af', fontSize: '11px', fontWeight: '600', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Skill Level</span>
        <span style={{ color: info.color, fontSize: '11px', fontWeight: '700' }}>{level}</span>
      </div>
      <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${info.pct}%`,
          background: `linear-gradient(90deg, ${info.color}cc, ${info.color})`,
          borderRadius: '99px',
          boxShadow: `0 0 8px ${info.color}60`,
          transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>
    </div>
  )
}

// ─── Premium input ────────────────────────────────────────────────────────────
function PremiumInput({
  label, value, onChange, disabled, type = 'text', placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void
  disabled: boolean; type?: string; placeholder?: string
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <label style={{
        display: 'block', marginBottom: '8px',
        fontSize: '11px', fontWeight: '700',
        letterSpacing: '0.09em', textTransform: 'uppercase',
        color: focused && !disabled ? '#c8a200' : '#4b5563',
        transition: 'color 0.2s ease',
        fontFamily: "'Inter', sans-serif",
      }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%', padding: '13px 16px',
            background: disabled ? 'rgba(255,255,255,0.02)' : focused ? 'rgba(200,162,0,0.06)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${focused && !disabled ? 'rgba(200,162,0,0.5)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: '12px',
            color: disabled ? '#4b5563' : '#f9fafb',
            fontSize: '14px', fontWeight: '500',
            fontFamily: "'Inter', sans-serif",
            outline: 'none',
            transition: 'all 0.22s ease',
            boxShadow: focused && !disabled ? '0 0 0 3px rgba(200,162,0,0.08), inset 0 1px 0 rgba(255,255,255,0.04)' : 'inset 0 1px 0 rgba(255,255,255,0.02)',
            cursor: disabled ? 'not-allowed' : 'text',
          }}
        />
        {focused && !disabled && (
          <div style={{
            position: 'absolute', bottom: 0, left: '16px', right: '16px', height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(200,162,0,0.6), transparent)',
            borderRadius: '99px',
          }} />
        )}
      </div>
    </div>
  )
}

// ─── Premium select ───────────────────────────────────────────────────────────
function PremiumSelect({
  label, value, onChange, disabled, options,
}: {
  label: string; value: string; onChange: (v: string) => void
  disabled: boolean; options: string[] | { value: string; label: string }[]
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <label style={{
        display: 'block', marginBottom: '8px',
        fontSize: '11px', fontWeight: '700',
        letterSpacing: '0.09em', textTransform: 'uppercase',
        color: focused && !disabled ? '#c8a200' : '#4b5563',
        transition: 'color 0.2s ease',
        fontFamily: "'Inter', sans-serif",
      }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%', padding: '13px 40px 13px 16px',
            background: disabled ? 'rgba(255,255,255,0.02)' : focused ? 'rgba(200,162,0,0.06)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${focused && !disabled ? 'rgba(200,162,0,0.5)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: '12px',
            color: disabled ? '#4b5563' : '#f9fafb',
            fontSize: '14px', fontWeight: '500',
            fontFamily: "'Inter', sans-serif",
            outline: 'none',
            appearance: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.22s ease',
            boxShadow: focused && !disabled ? '0 0 0 3px rgba(200,162,0,0.08)' : 'none',
          }}
        >
          {options.map((opt: any) => {
            const v = typeof opt === 'string' ? opt : opt.value
            const l = typeof opt === 'string' ? opt : opt.label
            return <option key={v} value={v} style={{ background: '#111118', color: '#f9fafb' }}>{l}</option>
          })}
        </select>
        {/* Chevron */}
        <svg style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#4b5563' }}
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, delay }: { label: string; value: number; icon: string; delay: number }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'rgba(26,26,34,0.98)' : 'rgba(16,16,22,0.9)',
        backdropFilter: 'blur(24px)',
        border: `1px solid ${hovered ? 'rgba(200,162,0,0.3)' : 'rgba(255,255,255,0.05)'}`,
        borderRadius: '18px',
        padding: '22px 20px',
        transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered ? '0 16px 48px rgba(200,162,0,0.1), 0 0 0 1px rgba(200,162,0,0.06)' : '0 4px 16px rgba(0,0,0,0.3)',
        cursor: 'default',
        position: 'relative', overflow: 'hidden',
        animation: `fadeSlideUp 0.5s ease ${delay}ms both`,
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: '20%', right: '20%', height: '1px',
        background: hovered ? 'linear-gradient(90deg, transparent, rgba(200,162,0,0.5), transparent)' : 'transparent',
        transition: 'all 0.35s',
      }} />
      <div style={{
        width: '36px', height: '36px',
        background: hovered ? 'rgba(200,162,0,0.15)' : 'rgba(200,162,0,0.07)',
        border: `1px solid ${hovered ? 'rgba(200,162,0,0.3)' : 'rgba(200,162,0,0.1)'}`,
        borderRadius: '10px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '16px', marginBottom: '14px',
        transition: 'all 0.3s ease',
        transform: hovered ? 'scale(1.1) rotate(-4deg)' : 'scale(1) rotate(0)',
      }}>{icon}</div>
      <div style={{
        fontSize: '30px', fontWeight: '800', color: 'white',
        letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '6px',
        fontFamily: "'Inter', sans-serif",
      }}>
        <AnimatedNumber value={value} />
      </div>
      <div style={{ color: '#4b5563', fontSize: '11px', fontWeight: '600', letterSpacing: '0.07em', textTransform: 'uppercase', fontFamily: "'Inter', sans-serif" }}>
        {label}
      </div>
    </div>
  )
}

// ─── Avatar ring ──────────────────────────────────────────────────────────────
function AvatarRing({ avatarUrl, initials, editMode, uploading, onUpload }: {
  avatarUrl: string | null; initials: string
  editMode: boolean; uploading: boolean
  onUpload: () => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ position: 'relative', width: '120px', height: '120px', flexShrink: 0 }}
    >
      {/* Rotating gold ring */}
      <div style={{
        position: 'absolute', inset: '-5px',
        borderRadius: '50%',
        background: 'conic-gradient(from 0deg, transparent 30%, rgba(200,162,0,0.5) 55%, rgba(255,215,0,1) 70%, rgba(200,162,0,0.5) 85%, transparent)',
        animation: 'rotateConic 3.5s linear infinite',
        opacity: hovered ? 1 : 0.7,
        transition: 'opacity 0.4s ease',
      }} />
      {/* Ring mask */}
      <div style={{
        position: 'absolute', inset: '-3px', borderRadius: '50%',
        background: '#0D0D0F',
      }} />
      {/* Glow behind avatar */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        boxShadow: hovered
          ? '0 0 40px rgba(200,162,0,0.4), 0 0 80px rgba(200,162,0,0.15)'
          : '0 0 20px rgba(200,162,0,0.2)',
        transition: 'box-shadow 0.4s ease',
        zIndex: 1,
      }} />
      {/* Avatar circle */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(200,162,0,0.15), rgba(255,215,0,0.08))',
        border: '2px solid rgba(200,162,0,0.3)',
        overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 2,
      }}>
        {avatarUrl ? (
          <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{
            fontSize: '40px', fontWeight: '900', fontFamily: "'Inter', sans-serif",
            background: 'linear-gradient(135deg, #c8a200, #FFD700)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>{initials}</span>
        )}
      </div>
      {/* Upload button */}
      {editMode && (
        <button
          onClick={onUpload}
          disabled={uploading}
          style={{
            position: 'absolute', bottom: '4px', right: '4px',
            width: '32px', height: '32px', borderRadius: '50%',
            background: uploading ? 'rgba(200,162,0,0.5)' : 'linear-gradient(135deg, #c8a200, #FFD700)',
            border: '2px solid #0D0D0F',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: uploading ? 'not-allowed' : 'pointer',
            zIndex: 3, boxShadow: '0 4px 16px rgba(200,162,0,0.4)',
            transition: 'all 0.25s ease',
            transform: hovered ? 'scale(1.1)' : 'scale(1)',
          }}
        >
          {uploading ? (
            <div style={{ width: '14px', height: '14px', border: '2px solid rgba(0,0,0,0.4)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          )}
        </button>
      )}
    </div>
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────────
function Badge({ label, variant = 'gold' }: { label: string; variant?: 'gold' | 'blue' | 'green' | 'purple' }) {
  const colors: Record<string, { bg: string; border: string; text: string }> = {
    gold:   { bg: 'rgba(200,162,0,0.1)',  border: 'rgba(200,162,0,0.3)',  text: '#FFD700' },
    blue:   { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)', text: '#60a5fa' },
    green:  { bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.3)',  text: '#4ade80' },
    purple: { bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.3)', text: '#c084fc' },
  }
  const c = colors[variant]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '4px 12px',
      background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: '99px', color: c.text,
      fontSize: '11px', fontWeight: '700',
      letterSpacing: '0.06em', textTransform: 'uppercase',
      fontFamily: "'Inter', sans-serif",
    }}>{label}</span>
  )
}

// ─── Section divider ──────────────────────────────────────────────────────────
function SectionDivider({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '32px 0 24px' }}>
      <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
      <span style={{
        color: '#374151', fontSize: '10px', fontWeight: '700',
        letterSpacing: '0.15em', textTransform: 'uppercase',
        fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap',
      }}>{label}</span>
      <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
    </div>
  )
}

// ─── Main Profile Component ───────────────────────────────────────────────────
export const Profile: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [editMode, setEditMode] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null)

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    sport_interests: '',
    location: '',
    role: 'Player',
    bio: '',
    skill_level: 'Beginner',
    university: '', // ← ADDED
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  // ─── University options ──────────────────────────────────────────────────────
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

  useEffect(() => { loadProfile() }, [])

  const loadProfile = async () => {
    setLoading(true); setMessage(null)
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) { navigate('/login'); return }
    setUser(currentUser)

    const { data: profileData, error } = await supabase
      .from('users').select('*').eq('id', currentUser.id).single()

    if (error) {
      setMessage({ text: 'Failed to load profile', type: 'error' })
    } else if (profileData) {
      setProfile(profileData)
      setFormData({
        full_name: profileData.full_name || '',
        email: profileData.email || '',
        sport_interests: profileData.sport_interests || '',
        location: profileData.location || '',
        role: profileData.role || 'Player',
        bio: profileData.bio || '',
        skill_level: profileData.skill_level || 'Beginner',
        university: profileData.university || '', // ← ADDED
      })
      setAvatarUrl(profileData.avatar_url || null)
    }
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true); setMessage(null)
    if (!formData.full_name.trim() || !formData.email.trim()) {
      setMessage({ text: 'Name and email are required', type: 'error' })
      setSaving(false); return
    }
    const { error } = await supabase
      .from('users').update({
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        sport_interests: formData.sport_interests || null,
        location: formData.location || null,
        role: formData.role,
        bio: formData.bio || null,
        skill_level: formData.skill_level,
        university: formData.university || null, // ← ADDED
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      }).eq('id', user.id)

    if (error) {
      setMessage({ text: 'Failed to save: ' + error.message, type: 'error' })
    } else {
      setMessage({ text: 'Profile saved successfully', type: 'success' })
      setEditMode(false)
      await loadProfile()
    }
    setSaving(false)
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      setMessage({ text: 'Please upload a JPEG, PNG, GIF, or WEBP image', type: 'error' }); return
    }
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ text: 'Image must be less than 2MB', type: 'error' }); return
    }
    setUploading(true); setMessage(null)
    try {
      const fileExt = file.name.split('.').pop()
      const filePath = `avatars/${user.id}-${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file)
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)
      setAvatarUrl(publicUrl)
      setMessage({ text: 'Avatar uploaded', type: 'success' })
    } catch (err: any) {
      setMessage({ text: 'Upload failed: ' + err.message, type: 'error' })
    }
    setUploading(false)
  }

  const handleCancel = () => {
    setEditMode(false)
    setFormData({
      full_name: profile?.full_name || '',
      email: profile?.email || '',
      sport_interests: profile?.sport_interests || '',
      location: profile?.location || '',
      role: profile?.role || 'Player',
      bio: profile?.bio || '',
      skill_level: profile?.skill_level || 'Beginner',
      university: profile?.university || '', // ← ADDED
    })
    setAvatarUrl(profile?.avatar_url || null)
    setMessage(null)
  }

  // ── Skill level → badge variant ──────────────────────────────────────────
  const skillVariant: Record<string, 'gold' | 'blue' | 'green' | 'purple'> = {
    Beginner: 'blue', Intermediate: 'green', Advanced: 'gold', Professional: 'purple',
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0D0D0F',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <div style={{ position: 'relative', width: '52px', height: '52px' }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid rgba(200,162,0,0.12)' }} />
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid transparent', borderTopColor: '#c8a200', animation: 'spin 0.8s linear infinite' }} />
          </div>
          <p style={{ color: '#4b5563', fontSize: '13px', fontFamily: "'Inter', sans-serif" }}>Loading profile…</p>
        </div>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  const firstName = formData.full_name?.split(' ')[0] || 'Player'
  const initials = formData.full_name?.charAt(0)?.toUpperCase() || '?'

  return (
    <div style={{
      minHeight: '100vh', background: '#0D0D0F', color: 'white',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      position: 'relative', overflowX: 'hidden',
    }}>
      {/* ── Ambient layers ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(200,162,0,0.06) 0%, transparent 70%)' }} />
      <div style={{ position: 'fixed', top: '20%', right: '-20%', width: '700px', height: '700px',
        borderRadius: '50%', background: 'rgba(200,162,0,0.025)', filter: 'blur(130px)',
        zIndex: 0, pointerEvents: 'none', animation: 'floatBlob 14s ease-in-out infinite' }} />
      <div style={{ position: 'fixed', bottom: '-15%', left: '-15%', width: '600px', height: '600px',
        borderRadius: '50%', background: 'rgba(128,90,213,0.025)', filter: 'blur(110px)',
        zIndex: 0, pointerEvents: 'none', animation: 'floatBlob 18s ease-in-out infinite 4s' }} />

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px 80px', position: 'relative', zIndex: 1 }}>

        {/* ══════════ HERO SECTION ══════════ */}
        <div style={{
          position: 'relative', borderRadius: '28px', overflow: 'hidden',
          marginBottom: '24px',
          animation: 'fadeSlideUp 0.6s ease both',
        }}>
          {/* Hero gradient banner */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg, rgba(20,18,10,0.98) 0%, rgba(12,12,18,0.98) 60%, rgba(16,12,6,0.98) 100%)',
            backdropFilter: 'blur(40px)',
          }} />
          {/* Gold shimmer top border */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(200,162,0,0.3) 20%, rgba(255,215,0,0.7) 50%, rgba(200,162,0,0.3) 80%, transparent 100%)',
          }} />
          {/* Decorative corner glow */}
          <div style={{
            position: 'absolute', top: '-60px', right: '-60px', width: '300px', height: '300px',
            borderRadius: '50%', background: 'rgba(200,162,0,0.04)', filter: 'blur(60px)', pointerEvents: 'none',
          }} />

          <div style={{
            position: 'relative', border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '28px', padding: '40px',
          }}>
            {/* Top row: eyebrow + edit button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '36px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '5px 14px 5px 8px',
                background: 'rgba(200,162,0,0.08)', border: '1px solid rgba(200,162,0,0.18)',
                borderRadius: '99px' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: '18px', height: '18px', borderRadius: '50%',
                  background: 'rgba(200,162,0,0.2)', fontSize: '10px',
                }}>✦</span>
                <span style={{ color: '#c8a200', fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Athlete Profile
                </span>
              </div>

              {!editMode ? (
                <EditButton onClick={() => setEditMode(true)} />
              ) : (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <GhostButton onClick={handleCancel} disabled={saving}>Cancel</GhostButton>
                  <GoldButton onClick={handleSave} loading={saving}>Save Changes</GoldButton>
                </div>
              )}
            </div>

            {/* Main hero content */}
            <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {/* Avatar */}
              <AvatarRing
                avatarUrl={avatarUrl}
                initials={initials}
                editMode={editMode}
                uploading={uploading}
                onUpload={() => fileInputRef.current?.click()}
              />
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />

              {/* Info */}
              <div style={{ flex: 1, minWidth: '200px' }}>
                <h1 style={{
                  fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: '800',
                  letterSpacing: '-0.03em', color: 'white',
                  margin: '0 0 4px', lineHeight: 1.1,
                }}>
                  {formData.full_name || 'Your Name'}
                </h1>
                <p style={{ color: '#4b5563', fontSize: '14px', margin: '0 0 16px', fontWeight: '500' }}>
                  {formData.email}
                </p>

                {/* Badges row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                  <Badge label={formData.role} variant="gold" />
                  <Badge label={formData.skill_level} variant={skillVariant[formData.skill_level] || 'gold'} />
                  {formData.sport_interests && <Badge label={formData.sport_interests} variant="blue" />}
                  {formData.university && (
                    <Badge label={'🎓 ' + formData.university} variant="purple" />
                  )}
                  {formData.location && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#6b7280', fontSize: '12px', fontWeight: '500' }}>
                      <span style={{ fontSize: '12px' }}>◉</span> {formData.location}
                    </span>
                  )}
                </div>

                {/* Skill bar */}
                <div style={{ maxWidth: '280px' }}>
                  <SkillBar level={formData.skill_level} />
                </div>

                {/* Bio preview (when not editing) */}
                {!editMode && formData.bio && (
                  <p style={{
                    color: '#6b7280', fontSize: '13px', lineHeight: '1.6',
                    margin: '16px 0 0', maxWidth: '420px',
                    fontStyle: 'italic',
                  }}>
                    "{formData.bio}"
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ══════════ MESSAGE BANNER ══════════ */}
        {message && (
          <div style={{
            padding: '14px 20px', borderRadius: '14px', marginBottom: '20px',
            animation: 'fadeSlideUp 0.35s ease both',
            background: message.type === 'success' ? 'rgba(34,197,94,0.08)'
              : message.type === 'error' ? 'rgba(239,68,68,0.08)' : 'rgba(59,130,246,0.08)',
            border: `1px solid ${message.type === 'success' ? 'rgba(34,197,94,0.2)'
              : message.type === 'error' ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)'}`,
            color: message.type === 'success' ? '#4ade80' : message.type === 'error' ? '#f87171' : '#60a5fa',
            fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <span style={{ fontSize: '15px' }}>
              {message.type === 'success' ? '✓' : message.type === 'error' ? '✕' : 'ℹ'}
            </span>
            {message.text}
          </div>
        )}

        {/* ══════════ EDITOR CARD ══════════ */}
        <div style={{
          background: 'rgba(12,12,18,0.9)', backdropFilter: 'blur(32px)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '24px', overflow: 'hidden',
          marginBottom: '24px',
          animation: 'fadeSlideUp 0.6s ease 0.1s both',
        }}>
          {/* Card top gold line */}
          <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(200,162,0,0.25), transparent)' }} />

          <div style={{ padding: '36px' }}>
            <SectionDivider label="Personal Information" />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
              <PremiumInput label="Full Name *" value={formData.full_name}
                onChange={v => setFormData({ ...formData, full_name: v })}
                disabled={!editMode} placeholder="Your full name" />
              <PremiumInput label="Email Address *" value={formData.email} type="email"
                onChange={v => setFormData({ ...formData, email: v })}
                disabled={!editMode} placeholder="your@email.com" />
              <PremiumInput label="Location" value={formData.location}
                onChange={v => setFormData({ ...formData, location: v })}
                disabled={!editMode} placeholder="City, Country" />
              <PremiumSelect label="Sport Interest" value={formData.sport_interests}
                onChange={v => setFormData({ ...formData, sport_interests: v })}
                disabled={!editMode}
                options={[
                  { value: '', label: 'Select a sport' },
                  ...['Football', 'Basketball', 'Cricket', 'Tennis', 'Badminton', 'Volleyball', 'Swimming', 'Running', 'Cycling', 'Hockey', 'Other']
                    .map(s => ({ value: s, label: s }))
                ]} />
            </div>

            <SectionDivider label="Role & Level" />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
              <PremiumSelect label="Role" value={formData.role}
                onChange={v => setFormData({ ...formData, role: v })}
                disabled={!editMode}
                options={['Player', 'Coach', 'Organizer']} />
              <PremiumSelect label="Skill Level" value={formData.skill_level}
                onChange={v => setFormData({ ...formData, skill_level: v })}
                disabled={!editMode}
                options={['Beginner', 'Intermediate', 'Advanced', 'Professional']} />
            </div>

            <SectionDivider label="University" />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
              <PremiumSelect label="🎓 University" value={formData.university}
                onChange={v => setFormData({ ...formData, university: v })}
                disabled={!editMode}
                options={[
                  { value: '', label: 'Select your university' },
                  ...universities.map(u => ({ value: u, label: u }))
                ]} />
            </div>

            <SectionDivider label="About You" />

            {/* Bio textarea */}
            <div>
              <label style={{
                display: 'block', marginBottom: '8px',
                fontSize: '11px', fontWeight: '700', letterSpacing: '0.09em', textTransform: 'uppercase',
                color: '#4b5563', fontFamily: "'Inter', sans-serif",
              }}>Bio</label>
              <textarea
                value={formData.bio}
                onChange={e => setFormData({ ...formData, bio: e.target.value })}
                disabled={!editMode}
                rows={4}
                placeholder="Tell others about yourself and your sports experience…"
                style={{
                  width: '100%', padding: '14px 16px',
                  background: !editMode ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px', color: !editMode ? '#4b5563' : '#f9fafb',
                  fontSize: '14px', lineHeight: '1.6', fontFamily: "'Inter', sans-serif",
                  outline: 'none', resize: 'vertical',
                  cursor: !editMode ? 'not-allowed' : 'text',
                  transition: 'all 0.22s ease', boxSizing: 'border-box',
                }}
                onFocus={e => { e.target.style.borderColor = 'rgba(200,162,0,0.5)'; e.target.style.background = 'rgba(200,162,0,0.05)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = !editMode ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)' }}
              />
            </div>

            {/* Action row inside card (mobile-friendly secondary) */}
            {editMode && (
              <div style={{ display: 'flex', gap: '12px', marginTop: '28px', justifyContent: 'flex-end' }}>
                <GhostButton onClick={handleCancel} disabled={saving}>Cancel</GhostButton>
                <GoldButton onClick={handleSave} loading={saving}>Save Changes</GoldButton>
              </div>
            )}
          </div>
        </div>

        {/* ══════════ STATS ══════════ */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '16px',
        }}>
          <StatCard label="Sessions Joined"   value={12} icon="📅" delay={0} />
          <StatCard label="Sessions Created"  value={5}  icon="🏃" delay={70} />
          <StatCard label="Active Listings"   value={3}  icon="🛒" delay={140} />
          <StatCard label="Posts"             value={8}  icon="✦"  delay={210} />
        </div>

      </div>

      {/* ── Global keyframes ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        @keyframes spin        { from{transform:rotate(0deg)}  to{transform:rotate(360deg)} }
        @keyframes rotateConic { from{transform:rotate(0deg)}  to{transform:rotate(360deg)} }
        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes floatBlob   { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-28px) scale(1.04)} }

        *  { box-sizing: border-box; }

        input::placeholder, textarea::placeholder { color: #374151; }
        select option { background: #111118; color: #f9fafb; }

        ::-webkit-scrollbar       { width: 6px; }
        ::-webkit-scrollbar-track { background: #0D0D0F; }
        ::-webkit-scrollbar-thumb { background: rgba(200,162,0,0.3); border-radius: 3px; }
      `}</style>
    </div>
  )
}

// ─── Small shared button components ──────────────────────────────────────────

function GoldButton({ onClick, loading, children }: { onClick: () => void; loading: boolean; children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      disabled={loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '8px',
        padding: '11px 24px', borderRadius: '12px', border: 'none',
        background: loading ? 'rgba(200,162,0,0.5)' : 'linear-gradient(135deg, #c8a200, #FFD700)',
        color: '#0a0a0a', fontSize: '13px', fontWeight: '800',
        letterSpacing: '0.03em', cursor: loading ? 'not-allowed' : 'pointer',
        fontFamily: "'Inter', sans-serif",
        transform: hovered && !loading ? 'scale(1.04) translateY(-1px)' : 'scale(1) translateY(0)',
        boxShadow: hovered && !loading
          ? '0 0 28px rgba(200,162,0,0.5), 0 4px 20px rgba(200,162,0,0.3)'
          : '0 0 12px rgba(200,162,0,0.2)',
        transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
        whiteSpace: 'nowrap',
      }}
    >
      {loading ? (
        <>
          <div style={{ width: '13px', height: '13px', border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          Saving…
        </>
      ) : <>💾 {children}</>}
    </button>
  )
}

function GhostButton({ onClick, disabled, children }: { onClick: () => void; disabled: boolean; children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex', alignItems: 'center',
        padding: '11px 22px', borderRadius: '12px',
        border: `1px solid ${hovered ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)'}`,
        background: hovered ? 'rgba(255,255,255,0.06)' : 'transparent',
        color: hovered ? '#e5e7eb' : '#6b7280',
        fontSize: '13px', fontWeight: '600',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: "'Inter', sans-serif",
        transition: 'all 0.22s ease', whiteSpace: 'nowrap',
      }}
    >{children}</button>
  )
}

function EditButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '7px',
        padding: '10px 20px', borderRadius: '12px', border: '1px solid rgba(200,162,0,0.25)',
        background: hovered ? 'rgba(200,162,0,0.12)' : 'rgba(200,162,0,0.07)',
        color: hovered ? '#FFD700' : '#c8a200',
        fontSize: '13px', fontWeight: '700',
        cursor: 'pointer', fontFamily: "'Inter', sans-serif",
        transform: hovered ? 'translateY(-1px)' : 'none',
        boxShadow: hovered ? '0 0 20px rgba(200,162,0,0.2)' : 'none',
        transition: 'all 0.25s ease',
      }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
      Edit Profile
    </button>
  )
}