// src/components/music/Music.tsx
import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabaseClient'

const CATEGORIES = [
  '🎧 All',
  '💪 Workout',
  '⚡ Pre-Match',
  '😌 Cool Down',
  '🎉 Party',
  '📚 Study Focus',
  '🏆 Campus Hits'
]

// ─── THEME CONFIG PER CATEGORY ───────────────────────────────────────────────
const CATEGORY_THEMES: Record<string, {
  hero: string
  subtitle: string
  accent: string
  glow: string
  bg: string
  particle: string
  icon: string
}> = {
  '🎧 All': {
    hero: 'Campus Tunes',
    subtitle: 'Music to keep you motivated, focused, and energized.',
    accent: '#FFD700',
    glow: 'rgba(255,215,0,0.18)',
    bg: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(255,215,0,0.07) 0%, transparent 65%)',
    particle: '#FFD700',
    icon: '🎵'
  },
  '💪 Workout': {
    hero: 'Power Your Workout',
    subtitle: 'High-energy tracks to fuel every rep and every sprint.',
    accent: '#FF6B35',
    glow: 'rgba(255,107,53,0.22)',
    bg: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(255,107,53,0.1) 0%, transparent 65%)',
    particle: '#FF6B35',
    icon: '💪'
  },
  '⚡ Pre-Match': {
    hero: 'Get Game Ready',
    subtitle: 'Build confidence before stepping onto the field.',
    accent: '#00D4FF',
    glow: 'rgba(0,212,255,0.2)',
    bg: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(0,212,255,0.08) 0%, transparent 65%)',
    particle: '#00D4FF',
    icon: '⚡'
  },
  '😌 Cool Down': {
    hero: 'Slow Down',
    subtitle: 'Relax, recover, and recharge after every session.',
    accent: '#A78BFA',
    glow: 'rgba(167,139,250,0.2)',
    bg: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(167,139,250,0.09) 0%, transparent 65%)',
    particle: '#A78BFA',
    icon: '😌'
  },
  '🎉 Party': {
    hero: 'Campus Party',
    subtitle: 'Bring the energy wherever your friends gather.',
    accent: '#F059DA',
    glow: 'rgba(240,89,218,0.22)',
    bg: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(240,89,218,0.09) 0%, transparent 65%)',
    particle: '#F059DA',
    icon: '🎉'
  },
  '📚 Study Focus': {
    hero: 'Stay Focused',
    subtitle: 'Music designed to help you concentrate and study longer.',
    accent: '#34D399',
    glow: 'rgba(52,211,153,0.2)',
    bg: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(52,211,153,0.07) 0%, transparent 65%)',
    particle: '#34D399',
    icon: '📚'
  },
  '🏆 Campus Hits': {
    hero: 'Campus Favorites',
    subtitle: 'The most loved tracks across your university.',
    accent: '#FFD700',
    glow: 'rgba(255,215,0,0.25)',
    bg: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(255,215,0,0.1) 0%, transparent 65%)',
    particle: '#FFD700',
    icon: '🏆'
  }
}

// ─── SONG DATA ────────────────────────────────────────────────────────────────
const COOLDOWN_SONGS = [
  { id: 'cooldown-1', title: 'Calm Down', artist: 'Rema ft. Selena Gomez', category: '😌 Cool Down', youtube_url: 'https://www.youtube.com/embed/MLjhE6EHgkk', votes: 12, suggested_by_user: { full_name: 'TeamSynk' } },
  { id: 'cooldown-2', title: 'Perfect', artist: 'Ed Sheeran', category: '😌 Cool Down', youtube_url: 'https://www.youtube.com/embed/heK-1nbZMCE', votes: 11, suggested_by_user: { full_name: 'TeamSynk' } },
  { id: 'cooldown-3', title: 'Latthay Di Chaadar', artist: 'Farhan Saeed', category: '😌 Cool Down', youtube_url: 'https://www.youtube.com/embed/m1wKgdQ8bCw', votes: 10, suggested_by_user: { full_name: 'TeamSynk' } },
  { id: 'cooldown-4', title: 'Tu Na Samjhe', artist: 'Hellow Raja & MaxxTurnn', category: '😌 Cool Down', youtube_url: 'https://www.youtube.com/embed/VNPlb2d3LFE', votes: 9, suggested_by_user: { full_name: 'TeamSynk' } },
  { id: 'cooldown-5', title: 'High School', artist: 'Sammy Rash', category: '😌 Cool Down', youtube_url: 'https://www.youtube.com/embed/S8Rq5H-PLXY', votes: 8, suggested_by_user: { full_name: 'TeamSynk' } }
]
const PARTY_SONGS = [
  { id: 'party-1', title: 'Sapphire', artist: 'Ed Sheeran', category: '🎉 Party', youtube_url: 'https://www.youtube.com/embed/PZZRr04Q7zM', votes: 25, suggested_by_user: { full_name: 'TeamSynk' } },
  { id: 'party-2', title: 'For A Reason', artist: 'Karan Aujla, Ikky', category: '🎉 Party', youtube_url: 'https://www.youtube.com/embed/wfVwF1E5WJk', votes: 22, suggested_by_user: { full_name: 'TeamSynk' } },
  { id: 'party-3', title: 'Nach Punjaban', artist: 'Abrar ul haq', category: '🎉 Party', youtube_url: 'https://www.youtube.com/embed/G2m37J03hg0', votes: 20, suggested_by_user: { full_name: 'TeamSynk' } }
]
const WORKOUT_SONGS = [
  { id: 'workout-1', title: 'You Got This', artist: 'Fotty Seven', category: '💪 Workout', youtube_url: 'https://www.youtube.com/embed/_PXCqGLJuVc', votes: 30, suggested_by_user: { full_name: 'TeamSynk' } },
  { id: 'workout-2', title: 'Winning Speech', artist: 'Karan Aujla', category: '💪 Workout', youtube_url: 'https://www.youtube.com/embed/iCGdF4YMvFY', votes: 28, suggested_by_user: { full_name: 'TeamSynk' } },
  { id: 'workout-3', title: 'Born To Shin', artist: 'Diljit Dosanjh', category: '💪 Workout', youtube_url: 'https://www.youtube.com/embed/iLHEGrNVf5Y', votes: 26, suggested_by_user: { full_name: 'TeamSynk' } },
  { id: 'workout-4', title: 'Hall Of Fame', artist: 'The Script', category: '💪 Workout', youtube_url: 'https://www.youtube.com/embed/3Kxf2dHlDpQ', votes: 24, suggested_by_user: { full_name: 'TeamSynk' } },
  { id: 'workout-5', title: 'Superstar', artist: 'Parmish Verma & Paradox', category: '💪 Workout', youtube_url: 'https://www.youtube.com/embed/XKBol-3Eliw', votes: 23, suggested_by_user: { full_name: 'TeamSynk' } },
  { id: 'workout-6', title: 'Dhakk Champion', artist: 'PARMISH VERMA', category: '💪 Workout', youtube_url: 'https://www.youtube.com/embed/oeyqrg-gL24', votes: 21, suggested_by_user: { full_name: 'TeamSynk' } }
]
const STUDY_SONGS = [
  { id: 'study-1', title: 'GAME', artist: 'Shooter Kahlon | Sidhu Moose Wala', category: '📚 Study Focus', youtube_url: 'https://www.youtube.com/embed/2L6gsn7rGqI', votes: 15, suggested_by_user: { full_name: 'TeamSynk' } },
  { id: 'study-2', title: 'Bandeya Rey Bandeya', artist: 'Arijit Singh | Asees Kaur', category: '📚 Study Focus', youtube_url: 'https://www.youtube.com/embed/Wj8C_bpnkTY', votes: 14, suggested_by_user: { full_name: 'TeamSynk' } },
  { id: 'study-3', title: 'Train', artist: 'Raghu Dixit & Karsh Kale', category: '📚 Study Focus', youtube_url: 'https://www.youtube.com/embed/nmK3dXXE_Vg', votes: 13, suggested_by_user: { full_name: 'TeamSynk' } },
  { id: 'study-4', title: 'Meri Kahani', artist: 'Atif Aslam', category: '📚 Study Focus', youtube_url: 'https://www.youtube.com/embed/Wamoy4hoMZI', votes: 12, suggested_by_user: { full_name: 'TeamSynk' } },
  { id: 'study-5', title: 'laree Choote', artist: 'Lofi Music', category: '📚 Study Focus', youtube_url: 'https://www.youtube.com/embed/OTYtQKm8O9E', votes: 11, suggested_by_user: { full_name: 'TeamSynk' } }
]
const DEFAULT_SONGS = [
  ...WORKOUT_SONGS, ...PARTY_SONGS, ...COOLDOWN_SONGS, ...STUDY_SONGS,
  { id: 'prematch-1', title: 'Eye of the Tiger', artist: 'Survivor', category: '⚡ Pre-Match', youtube_url: 'https://www.youtube.com/embed/btPJPFnesV4', votes: 20, suggested_by_user: { full_name: 'TeamSynk' } },
  { id: 'prematch-2', title: 'Lose Yourself', artist: 'Eminem', category: '⚡ Pre-Match', youtube_url: 'https://www.youtube.com/embed/xFYQQPAOz7Y', votes: 22, suggested_by_user: { full_name: 'TeamSynk' } },
  { id: 'campus-1', title: 'Blinding Lights', artist: 'The Weeknd', category: '🏆 Campus Hits', youtube_url: 'https://www.youtube.com/embed/fHI8X4OXluQ', votes: 19, suggested_by_user: { full_name: 'TeamSynk' } },
  { id: 'campus-2', title: 'Counting Stars', artist: 'OneRepublic', category: '🏆 Campus Hits', youtube_url: 'https://www.youtube.com/embed/hT_nvWreIhg', votes: 14, suggested_by_user: { full_name: 'TeamSynk' } },
  { id: 'campus-3', title: 'Believer', artist: 'Imagine Dragons', category: '🏆 Campus Hits', youtube_url: 'https://www.youtube.com/embed/7wtfhZwyrcc', votes: 25, suggested_by_user: { full_name: 'TeamSynk' } },
  { id: 'campus-4', title: 'Shape of You', artist: 'Ed Sheeran', category: '🏆 Campus Hits', youtube_url: 'https://www.youtube.com/embed/JGwWNGJdvx8', votes: 18, suggested_by_user: { full_name: 'TeamSynk' } },
  { id: 'campus-5', title: 'Uptown Funk', artist: 'Mark Ronson ft. Bruno Mars', category: '🏆 Campus Hits', youtube_url: 'https://www.youtube.com/embed/OPf0YbXqDm0', votes: 15, suggested_by_user: { full_name: 'TeamSynk' } },
  { id: 'campus-6', title: 'Roar', artist: 'Katy Perry', category: '🏆 Campus Hits', youtube_url: 'https://www.youtube.com/embed/CevxZvSJLk8', votes: 16, suggested_by_user: { full_name: 'TeamSynk' } }
]

const isDefaultId = (id: string) =>
  ['cooldown-', 'party-', 'workout-', 'study-', 'prematch-', 'campus-'].some(p => id.startsWith(p))

// ─── EQUALIZER BARS ──────────────────────────────────────────────────────────
const EqBars: React.FC<{ color: string; active?: boolean }> = ({ color, active = true }) => (
  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '20px' }}>
    {[0.4, 0.7, 1, 0.6, 0.85, 0.5, 0.9].map((h, i) => (
      <div
        key={i}
        style={{
          width: '3px',
          borderRadius: '2px',
          background: color,
          opacity: 0.7,
          height: active ? `${h * 20}px` : '4px',
          transition: 'height 0.4s ease',
          animation: active ? `eqBeat${i % 3} ${0.6 + i * 0.1}s ease-in-out infinite alternate` : 'none'
        }}
      />
    ))}
  </div>
)

// ─── SKELETON CARD ────────────────────────────────────────────────────────────
const SkeletonCard: React.FC = () => (
  <div style={{
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.06)',
    overflow: 'hidden'
  }}>
    <div style={{
      width: '100%', paddingTop: '56.25%', position: 'relative',
      background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite'
    }} />
    <div style={{ padding: '16px' }}>
      {[80, 60, 40].map((w, i) => (
        <div key={i} style={{
          height: i === 0 ? '14px' : '10px',
          width: `${w}%`,
          borderRadius: '6px',
          marginBottom: '10px',
          background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite'
        }} />
      ))}
    </div>
  </div>
)

// ─── VOTE BUTTON ─────────────────────────────────────────────────────────────
const VoteBtn: React.FC<{
  type: 'up' | 'down'
  count?: number
  accent: string
  onClick: () => void
}> = ({ type, count, accent, onClick }) => {
  const [pop, setPop] = useState(false)
  const handle = () => {
    setPop(true)
    setTimeout(() => setPop(false), 300)
    onClick()
  }
  return (
    <button
      onClick={handle}
      style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '7px 14px',
        borderRadius: '99px',
        border: `1px solid ${type === 'up' ? `${accent}40` : 'rgba(255,100,100,0.3)'}`,
        background: type === 'up' ? `${accent}12` : 'rgba(255,100,100,0.08)',
        color: type === 'up' ? accent : '#f87171',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: 600,
        transform: pop ? 'scale(1.18)' : 'scale(1)',
        transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        fontFamily: 'inherit'
      }}
    >
      <span style={{ fontSize: '15px' }}>{type === 'up' ? '👍' : '👎'}</span>
      {count !== undefined && <span>{count}</span>}
    </button>
  )
}

interface Song {
  id: string; title: string; artist: string; category: string
  youtube_url: string; status?: string; votes: number
  suggested_by_user?: { full_name: string }
}

export const Music: React.FC = () => {
  const [songs, setSongs] = useState<Song[]>(DEFAULT_SONGS as any)
  const [filteredSongs, setFilteredSongs] = useState<Song[]>(DEFAULT_SONGS as any)
  const [selectedCategory, setSelectedCategory] = useState('🎧 All')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [showSuggestModal, setShowSuggestModal] = useState(false)
  const [suggestForm, setSuggestForm] = useState({
    title: '', artist: '', category: '💪 Workout', youtube_url: '', note: ''
  })
  const [themeKey, setThemeKey] = useState('🎧 All')
  const prevTheme = useRef('🎧 All')
  const [themeOpacity, setThemeOpacity] = useState(1)

  const theme = CATEGORY_THEMES[themeKey] || CATEGORY_THEMES['🎧 All']

  useEffect(() => {
    checkUser()
    loadSongs()
    // Inject keyframe styles
    if (!document.getElementById('music-keyframes')) {
      const style = document.createElement('style')
      style.id = 'music-keyframes'
      style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes eqBeat0 { 0%{height:4px} 100%{height:16px} }
        @keyframes eqBeat1 { 0%{height:8px} 100%{height:20px} }
        @keyframes eqBeat2 { 0%{height:6px} 100%{height:14px} }
        @keyframes floatY { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes particleDrift {
          0%{transform:translate(0,0);opacity:0.12}
          50%{opacity:0.22}
          100%{transform:translate(var(--dx),var(--dy));opacity:0.06}
        }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes cardIn { from{opacity:0;transform:translateY(20px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes spinSlow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulseGlow { 0%,100%{opacity:0.3} 50%{opacity:0.6} }
        @media (prefers-reduced-motion: reduce) {
          *{ animation: none !important; transition: none !important; }
        }
      `
      document.head.appendChild(style)
    }
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const loadSongs = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('*, suggested_by_user:users!suggested_by(full_name)')
        .eq('status', 'approved')
        .order('votes', { ascending: false })
      if (!error && data && data.length > 0) {
        setSongs(data); setFilteredSongs(data)
      } else {
        setSongs(DEFAULT_SONGS as any); setFilteredSongs(DEFAULT_SONGS as any)
      }
    } catch {
      setSongs(DEFAULT_SONGS as any); setFilteredSongs(DEFAULT_SONGS as any)
    }
    setLoading(false)
  }

  const filterByCategory = (category: string) => {
    // Crossfade theme
    setThemeOpacity(0)
    setTimeout(() => {
      setThemeKey(category)
      prevTheme.current = category
      setThemeOpacity(1)
    }, 220)
    setSelectedCategory(category)
    if (category === '🎧 All') {
      setFilteredSongs(songs)
    } else {
      setFilteredSongs(songs.filter(s => s.category === category))
    }
  }

  const handleVote = async (songId: string, voteType: 'up' | 'down') => {
    if (!user) { alert('Please login to vote'); return }
    if (isDefaultId(songId)) {
      alert('🔥 You liked this song! Suggest it to add to the official playlist!')
      return
    }
    try {
      const { data: existing } = await supabase.from('song_votes').select('*')
        .eq('song_id', songId).eq('user_id', user.id).single()
      if (existing) {
        if (existing.vote_type === voteType) { alert('You already voted this way!'); return }
        await supabase.from('song_votes').update({ vote_type: voteType }).eq('id', existing.id)
      } else {
        await supabase.from('song_votes').insert({ song_id: songId, user_id: user.id, vote_type: voteType })
      }
      const { data: votes } = await supabase.from('song_votes').select('vote_type').eq('song_id', songId)
      const total = votes?.reduce((acc, v) => acc + (v.vote_type === 'up' ? 1 : -1), 0) || 0
      await supabase.from('songs').update({ votes: total }).eq('id', songId)
      loadSongs()
    } catch { alert('Failed to vote. Please try again.') }
  }

  const handleSuggest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) { alert('Please login to suggest a song'); return }
    if (!suggestForm.title.trim() || !suggestForm.artist.trim()) {
      alert('Please enter both song title and artist name'); return
    }
    try {
      const { error } = await supabase.from('songs').insert({
        title: suggestForm.title.trim(), artist: suggestForm.artist.trim(),
        category: suggestForm.category,
        youtube_url: suggestForm.youtube_url.trim() || null,
        suggested_by: user.id, status: 'pending'
      })
      if (error) { alert('Failed to suggest song: ' + error.message) } else {
        alert('✅ Song suggested! Admin will review it.')
        setShowSuggestModal(false)
        setSuggestForm({ title: '', artist: '', category: '💪 Workout', youtube_url: '', note: '' })
        loadSongs()
      }
    } catch { alert('Failed to suggest song. Please try again.') }
  }

  const getYoutubeEmbed = (url: string) => {
    if (!url) return ''
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)
    return match ? `https://www.youtube.com/embed/${match[1]}` : url
  }

  // Particle positions (stable)
  const particles = [
    { x: '8%', y: '15%', size: 3, dx: '20px', dy: '-30px', delay: '0s' },
    { x: '85%', y: '10%', size: 4, dx: '-15px', dy: '25px', delay: '0.8s' },
    { x: '20%', y: '60%', size: 2, dx: '30px', dy: '-20px', delay: '1.2s' },
    { x: '90%', y: '55%', size: 3, dx: '-25px', dy: '15px', delay: '0.4s' },
    { x: '50%', y: '80%', size: 2, dx: '10px', dy: '-35px', delay: '1.6s' },
    { x: '5%', y: '80%', size: 4, dx: '20px', dy: '-10px', delay: '2s' },
    { x: '75%', y: '75%', size: 2, dx: '-20px', dy: '-20px', delay: '0.6s' },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080810',
      color: 'white',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      position: 'relative',
      overflowX: 'hidden'
    }}>

      {/* ─── Dynamic BG ─── */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: theme.bg,
        opacity: themeOpacity,
        transition: 'all 0.5s ease'
      }} />

      {/* ─── Floating Particles ─── */}
      {particles.map((p, i) => (
        <div key={i} style={{
          position: 'fixed',
          left: p.x, top: p.y,
          width: `${p.size}px`, height: `${p.size}px`,
          borderRadius: '50%',
          background: theme.particle,
          opacity: 0.15,
          pointerEvents: 'none', zIndex: 0,
          // @ts-ignore
          '--dx': p.dx, '--dy': p.dy,
          animation: `particleDrift ${4 + i * 0.7}s ${p.delay} ease-in-out infinite alternate`,
          transition: 'background 0.5s ease'
        }} />
      ))}

      {/* ─── Vinyl Decoration ─── */}
      <div style={{
        position: 'fixed', right: '-80px', top: '10%',
        width: '220px', height: '220px',
        borderRadius: '50%',
        border: `2px solid ${theme.accent}18`,
        opacity: 0.4, pointerEvents: 'none', zIndex: 0,
        animation: 'spinSlow 20s linear infinite',
        transition: 'border-color 0.5s ease'
      }}>
        <div style={{
          position: 'absolute', inset: '30%', borderRadius: '50%',
          background: theme.accent, opacity: 0.12
        }} />
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px 60px', position: 'relative', zIndex: 1 }}>

        {/* ─── HERO ─── */}
        <div style={{
          textAlign: 'center',
          padding: '52px 20px 40px',
          opacity: themeOpacity,
          transition: 'opacity 0.4s ease',
          animation: 'fadeInUp 0.6s ease both'
        }}>
          {/* Glow orb */}
          <div style={{
            position: 'absolute', left: '50%', transform: 'translateX(-50%)',
            width: '300px', height: '120px',
            background: theme.glow,
            borderRadius: '50%',
            filter: 'blur(60px)',
            pointerEvents: 'none',
            transition: 'background 0.5s ease',
            animation: 'pulseGlow 3s ease-in-out infinite'
          }} />

          <div style={{ position: 'relative' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '6px 16px',
              borderRadius: '99px',
              border: `1px solid ${theme.accent}35`,
              background: `${theme.accent}10`,
              marginBottom: '20px',
              fontSize: '12px', fontWeight: 700,
              color: theme.accent,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              transition: 'all 0.4s ease'
            }}>
              <EqBars color={theme.accent} />
              Campus Tunes · TeamSynk
            </div>

            <h1 style={{
              fontSize: 'clamp(32px, 5vw, 56px)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              color: '#fff',
              marginBottom: '14px',
              transition: 'color 0.4s ease'
            }}>
              {theme.hero}
            </h1>
            <p style={{
              fontSize: '15px', color: 'rgba(255,255,255,0.45)',
              maxWidth: '440px', margin: '0 auto 28px',
              lineHeight: 1.75, fontWeight: 400
            }}>
              {theme.subtitle}
            </p>

            <button
              onClick={() => setShowSuggestModal(true)}
              style={{
                padding: '12px 28px',
                background: `linear-gradient(135deg, ${theme.accent}dd, ${theme.accent})`,
                border: 'none',
                borderRadius: '99px',
                color: '#0a0a0a',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                letterSpacing: '0.02em',
                boxShadow: `0 0 36px ${theme.accent}35`,
                transition: 'all 0.3s ease',
                fontFamily: 'inherit'
              }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 0 52px ${theme.accent}55`)}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = `0 0 36px ${theme.accent}35`)}
            >
              🎵 Suggest a Song
            </button>
          </div>
        </div>

        {/* ─── CATEGORY PILLS ─── */}
        <div style={{
          display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center',
          marginBottom: '36px',
          padding: '16px 20px',
          background: 'rgba(255,255,255,0.025)',
          borderRadius: '20px',
          border: '0.5px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)'
        }}>
          {CATEGORIES.map(cat => {
            const t = CATEGORY_THEMES[cat] || CATEGORY_THEMES['🎧 All']
            const isActive = selectedCategory === cat
            return (
              <button
                key={cat}
                onClick={() => filterByCategory(cat)}
                style={{
                  padding: '9px 18px',
                  borderRadius: '99px',
                  border: `1px solid ${isActive ? `${t.accent}55` : 'rgba(255,255,255,0.07)'}`,
                  background: isActive ? `${t.accent}18` : 'transparent',
                  color: isActive ? t.accent : 'rgba(255,255,255,0.42)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: isActive ? 700 : 500,
                  transition: 'all 0.25s ease',
                  fontFamily: 'inherit',
                  boxShadow: isActive ? `0 0 20px ${t.accent}20` : 'none',
                  transform: isActive ? 'scale(1.04)' : 'scale(1)'
                }}
              >
                {cat}
              </button>
            )
          })}
        </div>

        {/* ─── SONGS GRID ─── */}
        {loading ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px'
          }}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filteredSongs.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 20px',
            animation: 'fadeInUp 0.5s ease both'
          }}>
            <div style={{
              fontSize: '60px', marginBottom: '16px',
              animation: 'floatY 3s ease-in-out infinite'
            }}>🎵</div>
            <h3 style={{ color: 'rgba(255,255,255,0.55)', fontSize: '18px', marginBottom: '8px', fontWeight: 600 }}>
              No songs in this category yet
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '14px', marginBottom: '24px' }}>
              Be the first to suggest a track for this vibe.
            </p>
            <button
              onClick={() => setShowSuggestModal(true)}
              style={{
                padding: '10px 24px',
                background: `${theme.accent}20`,
                border: `1px solid ${theme.accent}40`,
                borderRadius: '99px',
                color: theme.accent,
                fontWeight: 700, fontSize: '13px',
                cursor: 'pointer', fontFamily: 'inherit'
              }}
            >
              Suggest a song
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px'
          }}>
            {filteredSongs.map((song, idx) => (
              <SongCard
                key={song.id}
                song={song}
                accent={theme.accent}
                idx={idx}
                onVote={handleVote}
                getEmbed={getYoutubeEmbed}
              />
            ))}
          </div>
        )}
      </div>

      {/* ─── SUGGEST MODAL ─── */}
      {showSuggestModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.88)',
          backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
          animation: 'fadeInUp 0.25s ease both'
        }}>
          <div style={{
            background: 'rgba(10,10,20,0.98)',
            border: `1px solid ${theme.accent}30`,
            borderRadius: '24px',
            maxWidth: '480px', width: '100%',
            padding: '32px',
            boxShadow: `0 0 80px ${theme.accent}18`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ color: theme.accent, fontSize: '20px', fontWeight: 800, marginBottom: '4px' }}>
                  🎵 Suggest a Song
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
                  Approved songs appear on the platform.
                </p>
              </div>
              <button
                onClick={() => setShowSuggestModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '50%',
                  width: '36px', height: '36px',
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: '18px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'inherit'
                }}
              >✕</button>
            </div>

            <form onSubmit={handleSuggest}>
              {[
                { placeholder: 'Song Title *', field: 'title', type: 'text', req: true },
                { placeholder: 'Artist Name *', field: 'artist', type: 'text', req: true },
                { placeholder: 'YouTube URL (optional)', field: 'youtube_url', type: 'url', req: false },
              ].map(({ placeholder, field, type, req }) => (
                <input
                  key={field}
                  type={type}
                  placeholder={placeholder}
                  value={(suggestForm as any)[field]}
                  onChange={e => setSuggestForm({ ...suggestForm, [field]: e.target.value })}
                  required={req}
                  style={{
                    width: '100%', padding: '12px 14px', marginBottom: '12px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '10px', color: 'white',
                    fontSize: '14px', outline: 'none',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
              ))}

              <select
                value={suggestForm.category}
                onChange={e => setSuggestForm({ ...suggestForm, category: e.target.value })}
                style={{
                  width: '100%', padding: '12px 14px', marginBottom: '12px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px', color: 'white',
                  fontSize: '14px', outline: 'none',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
              >
                {CATEGORIES.filter(c => c !== '🎧 All').map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <textarea
                placeholder="Why this song? (optional)"
                value={suggestForm.note}
                onChange={e => setSuggestForm({ ...suggestForm, note: e.target.value })}
                rows={2}
                style={{
                  width: '100%', padding: '12px 14px', marginBottom: '20px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px', color: 'white',
                  fontSize: '14px', outline: 'none',
                  resize: 'vertical', fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
              />

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowSuggestModal(false)}
                  style={{
                    flex: 1, padding: '12px',
                    borderRadius: '10px',
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.4)',
                    cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px'
                  }}
                >Cancel</button>
                <button
                  type="submit"
                  style={{
                    flex: 2, padding: '12px',
                    borderRadius: '10px', border: 'none',
                    background: `linear-gradient(135deg, ${theme.accent}cc, ${theme.accent})`,
                    color: '#0a0a0a', fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px'
                  }}
                >🎵 Suggest</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── SONG CARD ────────────────────────────────────────────────────────────────
const SongCard: React.FC<{
  song: Song
  accent: string
  idx: number
  onVote: (id: string, type: 'up' | 'down') => void
  getEmbed: (url: string) => string
}> = ({ song, accent, idx, onVote, getEmbed }) => {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'rgba(255,255,255,0.045)' : 'rgba(255,255,255,0.025)',
        borderRadius: '20px',
        border: `1px solid ${hovered ? `${accent}40` : 'rgba(255,255,255,0.06)'}`,
        overflow: 'hidden',
        transform: hovered ? 'translateY(-4px) scale(1.01)' : 'translateY(0) scale(1)',
        transition: 'all 0.3s cubic-bezier(0.34,1.2,0.64,1)',
        boxShadow: hovered ? `0 16px 48px rgba(0,0,0,0.45), 0 0 24px ${accent}18` : '0 4px 20px rgba(0,0,0,0.25)',
        animation: `cardIn 0.5s ${idx * 0.06}s ease both`,
        backdropFilter: 'blur(20px)',
        cursor: 'default'
      }}
    >
      {/* Embed */}
      {song.youtube_url && (
        <div style={{
          borderRadius: '0',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
            background: `linear-gradient(to bottom, transparent 70%, rgba(8,8,16,0.6) 100%)`
          }} />
          <iframe
            src={getEmbed(song.youtube_url)}
            title={song.title}
            style={{ width: '100%', height: '180px', border: 'none', display: 'block' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {/* Body */}
      <div style={{ padding: '14px 16px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '10px' }}>
          <div style={{ minWidth: 0 }}>
            <h3 style={{
              color: '#fff', fontSize: '15px', fontWeight: 700,
              margin: '0 0 3px', lineHeight: 1.3,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>{song.title}</h3>
            <p style={{
              color: 'rgba(255,255,255,0.38)', fontSize: '12px', margin: '0 0 8px',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>{song.artist}</p>
            <span style={{
              fontSize: '10px', color: accent,
              background: `${accent}14`,
              padding: '3px 10px', borderRadius: '99px',
              border: `1px solid ${accent}28`,
              display: 'inline-block', fontWeight: 600, letterSpacing: '0.03em'
            }}>
              {song.category}
            </span>
          </div>
          {isDefaultId(song.id) && (
            <span style={{
              flexShrink: 0, fontSize: '9px', color: 'rgba(255,215,0,0.55)',
              background: 'rgba(255,215,0,0.08)',
              border: '1px solid rgba(255,215,0,0.15)',
              padding: '3px 8px', borderRadius: '99px',
              fontWeight: 600, letterSpacing: '0.05em'
            }}>Default</span>
          )}
        </div>

        {/* Votes row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          paddingTop: '10px',
          borderTop: '1px solid rgba(255,255,255,0.05)'
        }}>
          <VoteBtn type="up" count={song.votes || 0} accent={accent} onClick={() => onVote(song.id, 'up')} />
          <VoteBtn type="down" accent={accent} onClick={() => onVote(song.id, 'down')} />
          {song.suggested_by_user && (
            <span style={{
              marginLeft: 'auto', fontSize: '10px',
              color: 'rgba(255,255,255,0.2)', fontWeight: 500
            }}>
              by {song.suggested_by_user.full_name}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}