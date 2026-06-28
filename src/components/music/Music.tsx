// src/components/music/Music.tsx
import React, { useState, useEffect } from 'react'
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

// ─── ALL YOUR SONGS ──────────────────────────────────────────────────────────

// ─── COOL DOWN SONGS ──────────────────────────────────────────────────────
const COOLDOWN_SONGS = [
  {
    id: 'cooldown-1',
    title: 'Calm Down',
    artist: 'Rema ft. Selena Gomez',
    category: '😌 Cool Down',
    youtube_url: 'https://www.youtube.com/embed/MLjhE6EHgkk',
    votes: 12,
    suggested_by_user: { full_name: 'TeamSynk' }
  },
  {
    id: 'cooldown-2',
    title: 'Perfect',
    artist: 'Ed Sheeran',
    category: '😌 Cool Down',
    youtube_url: 'https://www.youtube.com/embed/heK-1nbZMCE',
    votes: 11,
    suggested_by_user: { full_name: 'TeamSynk' }
  },
  {
    id: 'cooldown-3',
    title: 'Latthay Di Chaadar',
    artist: 'Farhan Saeed',
    category: '😌 Cool Down',
    youtube_url: 'https://www.youtube.com/embed/m1wKgdQ8bCw',
    votes: 10,
    suggested_by_user: { full_name: 'TeamSynk' }
  },
  {
    id: 'cooldown-4',
    title: 'Tu Na Samjhe',
    artist: 'Hellow Raja & MaxxTurnn',
    category: '😌 Cool Down',
    youtube_url: 'https://www.youtube.com/embed/VNPlb2d3LFE',
    votes: 9,
    suggested_by_user: { full_name: 'TeamSynk' }
  },
  {
    id: 'cooldown-5',
    title: 'High School',
    artist: 'Sammy Rash',
    category: '😌 Cool Down',
    youtube_url: 'https://www.youtube.com/embed/S8Rq5H-PLXY',
    votes: 8,
    suggested_by_user: { full_name: 'TeamSynk' }
  }
]

// ─── PARTY SONGS ──────────────────────────────────────────────────────────
const PARTY_SONGS = [
  {
    id: 'party-1',
    title: 'Sapphire',
    artist: 'Ed Sheeran',
    category: '🎉 Party',
    youtube_url: 'https://www.youtube.com/embed/PZZRr04Q7zM',
    votes: 25,
    suggested_by_user: { full_name: 'TeamSynk' }
  },
  {
    id: 'party-2',
    title: 'For A Reason',
    artist: 'Karan Aujla, Ikky',
    category: '🎉 Party',
    youtube_url: 'https://www.youtube.com/embed/wfVwF1E5WJk',
    votes: 22,
    suggested_by_user: { full_name: 'TeamSynk' }
  },
  {
    id: 'party-3',
    title: 'Nach Punjaban',
    artist: 'Abrar ul haq',
    category: '🎉 Party',
    youtube_url: 'https://www.youtube.com/embed/G2m37J03hg0',
    votes: 20,
    suggested_by_user: { full_name: 'TeamSynk' }
  }
]

// ─── WORKOUT SONGS ────────────────────────────────────────────────────────
const WORKOUT_SONGS = [
  {
    id: 'workout-1',
    title: 'You Got This',
    artist: 'Fotty Seven',
    category: '💪 Workout',
    youtube_url: 'https://www.youtube.com/embed/_PXCqGLJuVc',
    votes: 30,
    suggested_by_user: { full_name: 'TeamSynk' }
  },
  {
    id: 'workout-2',
    title: 'Winning Speech',
    artist: 'Karan Aujla',
    category: '💪 Workout',
    youtube_url: 'https://www.youtube.com/embed/iCGdF4YMvFY',
    votes: 28,
    suggested_by_user: { full_name: 'TeamSynk' }
  },
  {
    id: 'workout-3',
    title: 'Born To Shin',
    artist: 'Diljit Dosanjh',
    category: '💪 Workout',
    youtube_url: 'https://www.youtube.com/embed/iLHEGrNVf5Y',
    votes: 26,
    suggested_by_user: { full_name: 'TeamSynk' }
  },
  {
    id: 'workout-4',
    title: 'Hall Of Fame',
    artist: 'The Script',
    category: '💪 Workout',
    youtube_url: 'https://www.youtube.com/embed/3Kxf2dHlDpQ',
    votes: 24,
    suggested_by_user: { full_name: 'TeamSynk' }
  },
  {
    id: 'workout-5',
    title: 'Superstar',
    artist: 'Parmish Verma & Paradox',
    category: '💪 Workout',
    youtube_url: 'https://www.youtube.com/embed/XKBol-3Eliw',
    votes: 23,
    suggested_by_user: { full_name: 'TeamSynk' }
  },
  {
    id: 'workout-6',
    title: 'Dhakk Champion',
    artist: 'PARMISH VERMA',
    category: '💪 Workout',
    youtube_url: 'https://www.youtube.com/embed/oeyqrg-gL24',
    votes: 21,
    suggested_by_user: { full_name: 'TeamSynk' }
  }
]

// ─── STUDY FOCUS SONGS ────────────────────────────────────────────────────
const STUDY_SONGS = [
  {
    id: 'study-1',
    title: 'GAME',
    artist: 'Shooter Kahlon | Sidhu Moose Wala',
    category: '📚 Study Focus',
    youtube_url: 'https://www.youtube.com/embed/2L6gsn7rGqI',
    votes: 15,
    suggested_by_user: { full_name: 'TeamSynk' }
  },
  {
    id: 'study-2',
    title: 'Bandeya Rey Bandeya',
    artist: 'Arijit Singh | Asees Kaur',
    category: '📚 Study Focus',
    youtube_url: 'https://www.youtube.com/embed/Wj8C_bpnkTY',
    votes: 14,
    suggested_by_user: { full_name: 'TeamSynk' }
  },
  {
    id: 'study-3',
    title: 'Train',
    artist: 'Raghu Dixit & Karsh Kale',
    category: '📚 Study Focus',
    youtube_url: 'https://www.youtube.com/embed/nmK3dXXE_Vg',
    votes: 13,
    suggested_by_user: { full_name: 'TeamSynk' }
  },
  {
    id: 'study-4',
    title: 'Meri Kahani',
    artist: 'Atif Aslam',
    category: '📚 Study Focus',
    youtube_url: 'https://www.youtube.com/embed/Wamoy4hoMZI',
    votes: 12,
    suggested_by_user: { full_name: 'TeamSynk' }
  },
  {
    id: 'study-5',
    title: 'laree Choote',
    artist: 'Lofi Music',
    category: '📚 Study Focus',
    youtube_url: 'https://www.youtube.com/embed/OTYtQKm8O9E',
    votes: 11,
    suggested_by_user: { full_name: 'TeamSynk' }
  }
]

// ─── ALL SONGS ──────────────────────────────────────────────────────────────
const DEFAULT_SONGS = [
  ...WORKOUT_SONGS,
  ...PARTY_SONGS,
  ...COOLDOWN_SONGS,
  ...STUDY_SONGS,
  // ─── PRE-MATCH SONGS ──────────────────────────────────────────────────
  {
    id: 'prematch-1',
    title: 'Eye of the Tiger',
    artist: 'Survivor',
    category: '⚡ Pre-Match',
    youtube_url: 'https://www.youtube.com/embed/btPJPFnesV4',
    votes: 20,
    suggested_by_user: { full_name: 'TeamSynk' }
  },
  {
    id: 'prematch-2',
    title: 'Lose Yourself',
    artist: 'Eminem',
    category: '⚡ Pre-Match',
    youtube_url: 'https://www.youtube.com/embed/xFYQQPAOz7Y',
    votes: 22,
    suggested_by_user: { full_name: 'TeamSynk' }
  },
  // ─── CAMPUS HITS ──────────────────────────────────────────────────────
  {
    id: 'campus-1',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    category: '🏆 Campus Hits',
    youtube_url: 'https://www.youtube.com/embed/fHI8X4OXluQ',
    votes: 19,
    suggested_by_user: { full_name: 'TeamSynk' }
  },
  {
    id: 'campus-2',
    title: 'Counting Stars',
    artist: 'OneRepublic',
    category: '🏆 Campus Hits',
    youtube_url: 'https://www.youtube.com/embed/hT_nvWreIhg',
    votes: 14,
    suggested_by_user: { full_name: 'TeamSynk' }
  },
  {
    id: 'campus-3',
    title: 'Believer',
    artist: 'Imagine Dragons',
    category: '🏆 Campus Hits',
    youtube_url: 'https://www.youtube.com/embed/7wtfhZwyrcc',
    votes: 25,
    suggested_by_user: { full_name: 'TeamSynk' }
  },
  {
    id: 'campus-4',
    title: 'Shape of You',
    artist: 'Ed Sheeran',
    category: '🏆 Campus Hits',
    youtube_url: 'https://www.youtube.com/embed/JGwWNGJdvx8',
    votes: 18,
    suggested_by_user: { full_name: 'TeamSynk' }
  },
  {
    id: 'campus-5',
    title: 'Uptown Funk',
    artist: 'Mark Ronson ft. Bruno Mars',
    category: '🏆 Campus Hits',
    youtube_url: 'https://www.youtube.com/embed/OPf0YbXqDm0',
    votes: 15,
    suggested_by_user: { full_name: 'TeamSynk' }
  },
  {
    id: 'campus-6',
    title: 'Roar',
    artist: 'Katy Perry',
    category: '🏆 Campus Hits',
    youtube_url: 'https://www.youtube.com/embed/CevxZvSJLk8',
    votes: 16,
    suggested_by_user: { full_name: 'TeamSynk' }
  }
]

interface Song {
  id: string
  title: string
  artist: string
  category: string
  youtube_url: string
  status: string
  votes: number
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
    title: '',
    artist: '',
    category: '💪 Workout',
    youtube_url: '',
    note: ''
  })

  useEffect(() => {
    checkUser()
    loadSongs()
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
        setSongs(data)
        setFilteredSongs(data)
      } else {
        setSongs(DEFAULT_SONGS as any)
        setFilteredSongs(DEFAULT_SONGS as any)
      }
    } catch (error) {
      console.error('Error loading songs:', error)
      setSongs(DEFAULT_SONGS as any)
      setFilteredSongs(DEFAULT_SONGS as any)
    }
    
    setLoading(false)
  }

  const filterByCategory = (category: string) => {
    setSelectedCategory(category)
    if (category === '🎧 All') {
      setFilteredSongs(songs)
    } else {
      setFilteredSongs(songs.filter(s => s.category === category))
    }
  }

  const handleVote = async (songId: string, voteType: 'up' | 'down') => {
    if (!user) {
      alert('Please login to vote')
      return
    }

    if (songId.startsWith('cooldown-') || songId.startsWith('party-') || 
        songId.startsWith('workout-') || songId.startsWith('study-') ||
        songId.startsWith('prematch-') || songId.startsWith('campus-')) {
      alert('🔥 You liked this song! Suggest it to add to the official playlist!')
      return
    }

    try {
      const { data: existing } = await supabase
        .from('song_votes')
        .select('*')
        .eq('song_id', songId)
        .eq('user_id', user.id)
        .single()

      if (existing) {
        if (existing.vote_type === voteType) {
          alert('You already voted this way!')
          return
        }
        await supabase
          .from('song_votes')
          .update({ vote_type: voteType })
          .eq('id', existing.id)
      } else {
        await supabase
          .from('song_votes')
          .insert({ song_id: songId, user_id: user.id, vote_type: voteType })
      }

      const { data: votes } = await supabase
        .from('song_votes')
        .select('vote_type')
        .eq('song_id', songId)

      const total = votes?.reduce((acc, v) => acc + (v.vote_type === 'up' ? 1 : -1), 0) || 0
      await supabase
        .from('songs')
        .update({ votes: total })
        .eq('id', songId)

      loadSongs()
    } catch (error) {
      console.error('Vote error:', error)
      alert('Failed to vote. Please try again.')
    }
  }

  const handleSuggest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      alert('Please login to suggest a song')
      return
    }

    if (!suggestForm.title.trim() || !suggestForm.artist.trim()) {
      alert('Please enter both song title and artist name')
      return
    }

    try {
      const { error } = await supabase
        .from('songs')
        .insert({
          title: suggestForm.title.trim(),
          artist: suggestForm.artist.trim(),
          category: suggestForm.category,
          youtube_url: suggestForm.youtube_url.trim() || null,
          suggested_by: user.id,
          status: 'pending'
        })

      if (error) {
        alert('Failed to suggest song: ' + error.message)
      } else {
        alert('✅ Song suggested! Admin will review it.')
        setShowSuggestModal(false)
        setSuggestForm({ title: '', artist: '', category: '💪 Workout', youtube_url: '', note: '' })
        loadSongs()
      }
    } catch (error) {
      console.error('Suggest error:', error)
      alert('Failed to suggest song. Please try again.')
    }
  }

  const getYoutubeEmbed = (url: string) => {
    if (!url) return ''
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)
    return match ? `https://www.youtube.com/embed/${match[1]}` : url
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0D0D0F',
      color: 'white',
      padding: '24px',
      position: 'relative'
    }}>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: 'radial-gradient(ellipse 70% 45% at 50% -5%, rgba(200,162,0,0.05) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* ─── Header ─── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ color: '#FFD700', fontSize: '32px' }}>🎵 Campus Tunes</h1>
            <p style={{ color: '#6b7280' }}>Music to keep you motivated, focused, and energized!</p>
          </div>
          <button
            onClick={() => setShowSuggestModal(true)}
            style={{
              padding: '10px 24px',
              background: 'linear-gradient(135deg, #c8a200, #FFD700)',
              border: 'none',
              borderRadius: '12px',
              color: '#0a0a0a',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            🎵 Suggest a Song
          </button>
        </div>

        {/* ─── Categories ─── */}
        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '24px',
          padding: '16px',
          background: 'rgba(16,16,22,0.9)',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => filterByCategory(cat)}
              style={{
                padding: '8px 16px',
                borderRadius: '99px',
                border: `1px solid ${selectedCategory === cat ? 'rgba(200,162,0,0.5)' : 'rgba(255,255,255,0.08)'}`,
                background: selectedCategory === cat ? 'rgba(200,162,0,0.15)' : 'transparent',
                color: selectedCategory === cat ? '#FFD700' : '#9ca3af',
                cursor: 'pointer',
                fontSize: '13px',
                transition: 'all 0.2s ease'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* ─── Songs Grid ─── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px'
        }}>
          {filteredSongs.length === 0 ? (
            <div style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '60px 20px',
              color: '#4b5563'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎵</div>
              <h3>No songs in this category yet</h3>
              <p>Be the first to suggest a song!</p>
            </div>
          ) : (
            filteredSongs.map(song => (
              <div
                key={song.id}
                style={{
                  background: 'rgba(16,16,22,0.9)',
                  backdropFilter: 'blur(24px)',
                  borderRadius: '16px',
                  border: '1px solid rgba(255,255,255,0.05)',
                  padding: '16px',
                  transition: 'all 0.3s ease',
                  position: 'relative'
                }}
              >
                {/* YouTube Embed */}
                {song.youtube_url && (
                  <div style={{ borderRadius: '8px', overflow: 'hidden', marginBottom: '12px' }}>
                    <iframe
                      src={getYoutubeEmbed(song.youtube_url)}
                      title={song.title}
                      style={{
                        width: '100%',
                        height: '180px',
                        border: 'none'
                      }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ color: 'white', fontSize: '16px', margin: '0 0 2px' }}>{song.title}</h3>
                    <p style={{ color: '#6b7280', fontSize: '13px', margin: '0 0 4px' }}>{song.artist}</p>
                    <span style={{
                      fontSize: '11px',
                      color: '#c8a200',
                      background: 'rgba(200,162,0,0.1)',
                      padding: '2px 10px',
                      borderRadius: '99px',
                      border: '1px solid rgba(200,162,0,0.2)'
                    }}>
                      {song.category}
                    </span>
                  </div>
                </div>

                {/* ─── Votes ─── */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid rgba(255,255,255,0.05)'
                }}>
                  <button
                    onClick={() => handleVote(song.id, 'up')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#4ade80',
                      cursor: 'pointer',
                      fontSize: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    👍 <span style={{ fontSize: '13px' }}>{song.votes || 0}</span>
                  </button>
                  <button
                    onClick={() => handleVote(song.id, 'down')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#f87171',
                      cursor: 'pointer',
                      fontSize: '18px'
                    }}
                  >
                    👎
                  </button>
                  {song.suggested_by_user && (
                    <span style={{
                      color: '#4b5563',
                      fontSize: '10px',
                      marginLeft: 'auto'
                    }}>
                      Suggested by {song.suggested_by_user.full_name}
                    </span>
                  )}
                  {song.id.startsWith('cooldown-') || song.id.startsWith('party-') || 
                   song.id.startsWith('workout-') || song.id.startsWith('study-') ||
                   song.id.startsWith('prematch-') || song.id.startsWith('campus-') ? (
                    <span style={{
                      color: '#c8a200',
                      fontSize: '9px',
                      marginLeft: 'auto',
                      background: 'rgba(200,162,0,0.1)',
                      padding: '2px 8px',
                      borderRadius: '99px'
                    }}>
                      Default
                    </span>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>

        {/* ─── Suggest Song Modal ─── */}
        {showSuggestModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}>
            <div style={{
              background: 'rgba(10,10,16,0.98)',
              backdropFilter: 'blur(40px)',
              border: '1px solid rgba(200,162,0,0.2)',
              borderRadius: '24px',
              maxWidth: '500px',
              width: '100%',
              padding: '32px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ color: '#FFD700' }}>🎵 Suggest a Song</h2>
                <button
                  onClick={() => setShowSuggestModal(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#666',
                    fontSize: '24px',
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSuggest}>
                <input
                  type="text"
                  placeholder="Song Title *"
                  value={suggestForm.title}
                  onChange={(e) => setSuggestForm({ ...suggestForm, title: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    marginBottom: '12px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                <input
                  type="text"
                  placeholder="Artist Name *"
                  value={suggestForm.artist}
                  onChange={(e) => setSuggestForm({ ...suggestForm, artist: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    marginBottom: '12px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                <select
                  value={suggestForm.category}
                  onChange={(e) => setSuggestForm({ ...suggestForm, category: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    marginBottom: '12px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                >
                  {CATEGORIES.filter(c => c !== '🎧 All').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <input
                  type="url"
                  placeholder="YouTube URL (optional)"
                  value={suggestForm.youtube_url}
                  onChange={(e) => setSuggestForm({ ...suggestForm, youtube_url: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    marginBottom: '12px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                <textarea
                  placeholder="Why this song? (optional)"
                  value={suggestForm.note}
                  onChange={(e) => setSuggestForm({ ...suggestForm, note: e.target.value })}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '12px',
                    marginBottom: '16px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setShowSuggestModal(false)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '8px',
                      background: 'transparent',
                      border: '1px solid #333',
                      color: '#666',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      flex: 2,
                      padding: '12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #c8a200, #FFD700)',
                      color: '#0a0a0a',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    🎵 Suggest
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}