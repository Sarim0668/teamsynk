// src/components/admin/AdminPanel.tsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

interface User {
  id: string
  full_name: string
  email: string
  role: string
  status: string
  sport_interests: string
  location: string
  created_at: string
}

interface Listing {
  id: string
  seller_id: string
  item_name: string
  description: string
  price: number
  condition: string
  category: string
  status: string
  created_at: string
}

interface Song {
  id: string
  title: string
  artist: string
  category: string
  youtube_url: string
  suggested_by: string
  status: string
  votes: number
  created_at: string
  suggested_by_user?: { full_name: string }
}

interface Session {
  id: string
  sport_type: string
  session_date: string
  session_time: string
  location: string
  max_participants: number
  created_by: string
  status: string
  created_at: string
  creator?: { full_name: string }
  participant_count?: number
}

interface Tournament {
  id: string
  name: string
  sport_type: string
  description: string
  start_date: string
  end_date: string
  venue: string
  status: string
  created_by: string
  created_at: string
  creator?: { full_name: string }
  teams_count?: number
  matches_count?: number
}

export const AdminPanel: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [listings, setListings] = useState<Listing[]>([])
  const [songs, setSongs] = useState<Song[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [activeTab, setActiveTab] = useState<'users' | 'listings' | 'songs' | 'sessions' | 'tournaments'>('users')
  const [searchQuery, setSearchQuery] = useState('')
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState<{ type: string; id: string; name: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    checkAdminAndLoadData()
  }, [])

  const checkAdminAndLoadData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      navigate('/login')
      return
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'Admin') {
      navigate('/')
      return
    }

    setCurrentUser(user)
    setIsAdmin(true)
    await loadData()
    setLoading(false)
  }

  const loadData = async () => {
    await Promise.all([
      loadUsers(),
      loadListings(),
      loadSongs(),
      loadSessions(),
      loadTournaments()
    ])
  }

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setUsers(data)
    }
  }

  const loadListings = async () => {
    const { data, error } = await supabase
      .from('marketplace')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setListings(data)
    }
  }

  const loadSongs = async () => {
    const { data, error } = await supabase
      .from('songs')
      .select('*, suggested_by_user:users!suggested_by(full_name)')
      .neq('status', 'approved')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setSongs(data)
    }
  }

  const loadSessions = async () => {
    const { data, error } = await supabase
      .from('sports_sessions')
      .select(`
        *,
        creator:users!created_by(full_name)
      `)
      .order('created_at', { ascending: false })

    if (!error && data) {
      // Get participant counts for each session
      const sessionsWithCounts = await Promise.all(
        data.map(async (session: any) => {
          const { count } = await supabase
            .from('session_participants')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', session.id)
          
          return {
            ...session,
            participant_count: count || 0
          }
        })
      )
      setSessions(sessionsWithCounts)
    }
  }

  const loadTournaments = async () => {
    const { data, error } = await supabase
      .from('tournaments')
      .select(`
        *,
        creator:users!created_by(full_name)
      `)
      .order('created_at', { ascending: false })

    if (!error && data) {
      // Get team and match counts for each tournament
      const tournamentsWithCounts = await Promise.all(
        data.map(async (tournament: any) => {
          const { count: teamsCount } = await supabase
            .from('tournament_teams')
            .select('*', { count: 'exact', head: true })
            .eq('tournament_id', tournament.id)
          
          const { count: matchesCount } = await supabase
            .from('tournament_matches')
            .select('*', { count: 'exact', head: true })
            .eq('tournament_id', tournament.id)
          
          return {
            ...tournament,
            teams_count: teamsCount || 0,
            matches_count: matchesCount || 0
          }
        })
      )
      setTournaments(tournamentsWithCounts)
    }
  }

  // ─── User Actions ──────────────────────────────────────────────────────────
  const handleSuspendUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to suspend this user?')) return

    const { error } = await supabase
      .from('users')
      .update({ status: 'suspended' })
      .eq('id', userId)

    if (error) {
      setMessage({ text: 'Failed to suspend user: ' + error.message, type: 'error' })
    } else {
      setMessage({ text: '✅ User suspended successfully', type: 'success' })
      await loadUsers()
    }
  }

  const handleReactivateUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to reactivate this user?')) return

    const { error } = await supabase
      .from('users')
      .update({ status: 'active' })
      .eq('id', userId)

    if (error) {
      setMessage({ text: 'Failed to reactivate user: ' + error.message, type: 'error' })
    } else {
      setMessage({ text: '✅ User reactivated successfully', type: 'success' })
      await loadUsers()
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('⚠️ Are you sure you want to DELETE this user? This cannot be undone!')) return

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (error) {
      setMessage({ text: 'Failed to delete user: ' + error.message, type: 'error' })
    } else {
      setMessage({ text: '✅ User deleted successfully', type: 'success' })
      await loadUsers()
    }
  }

  // ─── Listing Actions ──────────────────────────────────────────────────────
  const handleRemoveListing = async (listingId: string) => {
    if (!window.confirm('Are you sure you want to remove this listing?')) return

    const { error } = await supabase
      .from('marketplace')
      .update({ status: 'REMOVED' })
      .eq('id', listingId)

    if (error) {
      setMessage({ text: 'Failed to remove listing: ' + error.message, type: 'error' })
    } else {
      setMessage({ text: '✅ Listing removed successfully', type: 'success' })
      await loadListings()
    }
  }

  const handleApproveListing = async (listingId: string) => {
    const { error } = await supabase
      .from('marketplace')
      .update({ status: 'AVAILABLE' })
      .eq('id', listingId)

    if (error) {
      setMessage({ text: 'Failed to approve listing: ' + error.message, type: 'error' })
    } else {
      setMessage({ text: '✅ Listing approved successfully', type: 'success' })
      await loadListings()
    }
  }

  // ─── Song Actions ──────────────────────────────────────────────────────────
  const handleApproveSong = async (songId: string) => {
    const { error } = await supabase
      .from('songs')
      .update({ 
        status: 'approved',
        approved_by: currentUser?.id,
        approved_at: new Date().toISOString()
      })
      .eq('id', songId)

    if (error) {
      setMessage({ text: 'Failed to approve song: ' + error.message, type: 'error' })
    } else {
      setMessage({ text: '✅ Song approved successfully!', type: 'success' })
      await loadSongs()
    }
  }

  const handleRejectSong = async (songId: string) => {
    if (!window.confirm('Are you sure you want to reject this song suggestion?')) return

    const { error } = await supabase
      .from('songs')
      .update({ status: 'rejected' })
      .eq('id', songId)

    if (error) {
      setMessage({ text: 'Failed to reject song: ' + error.message, type: 'error' })
    } else {
      setMessage({ text: '✅ Song rejected', type: 'success' })
      await loadSongs()
    }
  }

  const handleDeleteSong = async (songId: string) => {
    if (!window.confirm('⚠️ Are you sure you want to DELETE this song?')) return

    const { error } = await supabase
      .from('songs')
      .delete()
      .eq('id', songId)

    if (error) {
      setMessage({ text: 'Failed to delete song: ' + error.message, type: 'error' })
    } else {
      setMessage({ text: '✅ Song deleted', type: 'success' })
      await loadSongs()
    }
  }

  // ─── Session Actions ──────────────────────────────────────────────────────
// src/components/admin/AdminPanel.tsx - FIXED DELETE FUNCTIONS

  // ─── Session Actions ──────────────────────────────────────────────────────
  const handleDeleteSession = async (sessionId: string) => {
    setIsDeleting(true)
    try {
      console.log('🗑️ Attempting to delete session:', sessionId)
      
      // First, verify the session exists
      const { data: sessionExists, error: checkError } = await supabase
        .from('sports_sessions')
        .select('id')
        .eq('id', sessionId)
        .single()

      if (checkError || !sessionExists) {
        throw new Error('Session not found or already deleted')
      }

      // Delete participants first
      const { error: participantsError } = await supabase
        .from('session_participants')
        .delete()
        .eq('session_id', sessionId)

      if (participantsError) {
        console.error('Error deleting participants:', participantsError)
        // Continue anyway - maybe there are no participants
      }

      // Then delete the session
      const { error: sessionError } = await supabase
        .from('sports_sessions')
        .delete()
        .eq('id', sessionId)

      if (sessionError) {
        throw new Error('Failed to delete session: ' + sessionError.message)
      }

      console.log('✅ Session deleted successfully:', sessionId)
      setMessage({ text: '✅ Session deleted successfully', type: 'success' })
      
      // Update local state immediately
      setSessions(prev => prev.filter(s => s.id !== sessionId))
      
      // Also reload from database to be safe
      await loadSessions()
      
      // Close the modal
      setShowDeleteModal(null)
      
      // Show success notification
      setTimeout(() => {
        setMessage(null)
      }, 5000)
      
    } catch (error: any) {
      console.error('Delete session error:', error)
      setMessage({ text: '❌ ' + error.message, type: 'error' })
    } finally {
      setIsDeleting(false)
    }
  }

  // ─── Tournament Actions ──────────────────────────────────────────────────
  const handleDeleteTournament = async (tournamentId: string) => {
    setIsDeleting(true)
    try {
      console.log('🗑️ Attempting to delete tournament:', tournamentId)
      
      // First, verify the tournament exists
      const { data: tournamentExists, error: checkError } = await supabase
        .from('tournaments')
        .select('id')
        .eq('id', tournamentId)
        .single()

      if (checkError || !tournamentExists) {
        throw new Error('Tournament not found or already deleted')
      }

      // Delete all related data in correct order
      const { error: matchesError } = await supabase
        .from('tournament_matches')
        .delete()
        .eq('tournament_id', tournamentId)

      if (matchesError) {
        console.error('Error deleting matches:', matchesError)
      }

      const { error: teamsError } = await supabase
        .from('tournament_teams')
        .delete()
        .eq('tournament_id', tournamentId)

      if (teamsError) {
        console.error('Error deleting teams:', teamsError)
      }

      const { error: participantsError } = await supabase
        .from('tournament_participants')
        .delete()
        .eq('tournament_id', tournamentId)

      if (participantsError) {
        console.error('Error deleting participants:', participantsError)
      }

      // Finally delete the tournament
      const { error: tournamentError } = await supabase
        .from('tournaments')
        .delete()
        .eq('id', tournamentId)

      if (tournamentError) {
        throw new Error('Failed to delete tournament: ' + tournamentError.message)
      }

      console.log('✅ Tournament deleted successfully:', tournamentId)
      setMessage({ text: '✅ Tournament deleted successfully', type: 'success' })
      
      // Update local state immediately
      setTournaments(prev => prev.filter(t => t.id !== tournamentId))
      
      // Also reload from database to be safe
      await loadTournaments()
      
      // Close the modal
      setShowDeleteModal(null)
      
      // Show success notification
      setTimeout(() => {
        setMessage(null)
      }, 5000)
      
    } catch (error: any) {
      console.error('Delete tournament error:', error)
      setMessage({ text: '❌ ' + error.message, type: 'error' })
    } finally {
      setIsDeleting(false)
    }
  }
  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredSongs = songs.filter(s =>
    s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.artist?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredSessions = sessions.filter(s =>
    s.sport_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.location?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredTournaments = tournaments.filter(t =>
    t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.sport_type?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0D0D0F',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #c8a200',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            margin: '0 auto 16px',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ color: '#666' }}>Loading admin panel...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  const tabs = [
    { key: 'users', label: '👥 Users', count: users.length },
    { key: 'listings', label: '📦 Listings', count: listings.length },
    { key: 'songs', label: '🎵 Songs', count: songs.length },
    { key: 'sessions', label: '🏟️ Sessions', count: sessions.length },
    { key: 'tournaments', label: '🏆 Tournaments', count: tournaments.length },
  ]

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

      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{
              padding: '8px',
              background: 'rgba(200,162,0,0.1)',
              borderRadius: '12px',
              border: '1px solid rgba(200,162,0,0.2)'
            }}>
              <span style={{ fontSize: '18px' }}>🛡️</span>
            </div>
            <span style={{ color: '#c8a200', fontSize: '12px', fontWeight: '600', letterSpacing: '2px', textTransform: 'uppercase' }}>
              Admin Panel
            </span>
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: 'white' }}>
            Manage Your Platform
          </h1>
          <p style={{ color: '#888', fontSize: '14px' }}>
            Users: {users.length} • Listings: {listings.length} • Pending Songs: {songs.length} • Sessions: {sessions.length} • Tournaments: {tournaments.length}
          </p>
        </div>

        {/* Message */}
        {message && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            background: message.type === 'success' ? 'rgba(82,192,122,0.15)' :
                       message.type === 'error' ? 'rgba(255,68,68,0.15)' :
                       'rgba(200,162,0,0.15)',
            border: `1px solid ${
              message.type === 'success' ? '#52c07a' :
              message.type === 'error' ? '#ff4444' :
              '#c8a200'
            }`,
            color: message.type === 'success' ? '#52c07a' :
                   message.type === 'error' ? '#ff4444' :
                   '#c8a200'
          }}>
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '0',
          marginBottom: '24px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          flexWrap: 'wrap',
          overflowX: 'auto'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                padding: '12px 20px',
                background: activeTab === tab.key ? 'rgba(200,162,0,0.1)' : 'transparent',
                border: 'none',
                color: activeTab === tab.key ? '#FFD700' : '#666',
                fontWeight: activeTab === tab.key ? 'bold' : 'normal',
                cursor: 'pointer',
                borderBottom: activeTab === tab.key ? '2px solid #c8a200' : '2px solid transparent',
                transition: 'all 0.3s',
                fontSize: '13px',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ marginBottom: '16px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTab === 'users' ? 'users...' : 
                         activeTab === 'listings' ? 'listings...' : 
                         activeTab === 'songs' ? 'songs...' :
                         activeTab === 'sessions' ? 'sessions...' :
                         'tournaments...'}`}
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '10px 16px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              color: 'white',
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div style={{
            background: 'rgba(13,13,13,0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid #c8a20020',
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '50px 1fr 1fr 100px 100px 120px 160px',
              padding: '12px 16px',
              background: 'rgba(200,162,0,0.05)',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              fontSize: '12px',
              color: '#666',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              gap: '8px'
            }}>
              <span>ID</span>
              <span>Name</span>
              <span>Email</span>
              <span>Role</span>
              <span>Status</span>
              <span>Sport</span>
              <span>Actions</span>
            </div>

            {filteredUsers.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                No users found
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '50px 1fr 1fr 100px 100px 120px 160px',
                    padding: '10px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    color: '#ddd'
                  }}
                >
                  <span style={{ color: '#666' }}>#{user.id.slice(0, 4)}</span>
                  <span style={{ fontWeight: 'bold' }}>{user.full_name}</span>
                  <span style={{ color: '#888' }}>{user.email}</span>
                  <span>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: user.role === 'Admin' ? 'rgba(200,162,0,0.2)' : 'rgba(255,255,255,0.05)',
                      color: user.role === 'Admin' ? '#FFD700' : '#888',
                      fontSize: '11px'
                    }}>
                      {user.role || 'Player'}
                    </span>
                  </span>
                  <span>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: user.status === 'active' ? 'rgba(82,192,122,0.15)' : 'rgba(255,68,68,0.15)',
                      color: user.status === 'active' ? '#52c07a' : '#ff4444',
                      fontSize: '11px'
                    }}>
                      {user.status || 'active'}
                    </span>
                  </span>
                  <span style={{ color: '#666', fontSize: '12px' }}>
                    {user.sport_interests || '—'}
                  </span>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {user.status === 'active' ? (
                      <button
                        onClick={() => handleSuspendUser(user.id)}
                        style={{
                          padding: '4px 10px',
                          background: 'rgba(255,68,68,0.1)',
                          border: '1px solid rgba(255,68,68,0.2)',
                          borderRadius: '6px',
                          color: '#f87171',
                          fontSize: '10px',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        Suspend
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReactivateUser(user.id)}
                        style={{
                          padding: '4px 10px',
                          background: 'rgba(82,192,122,0.1)',
                          border: '1px solid rgba(82,192,122,0.2)',
                          borderRadius: '6px',
                          color: '#52c07a',
                          fontSize: '10px',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        Reactivate
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      style={{
                        padding: '4px 10px',
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.2)',
                        borderRadius: '6px',
                        color: '#ef4444',
                        fontSize: '10px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Listings Tab */}
        {activeTab === 'listings' && (
          <div style={{
            background: 'rgba(13,13,13,0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid #c8a20020',
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '50px 1fr 100px 120px 100px 100px 120px 140px',
              padding: '12px 16px',
              background: 'rgba(200,162,0,0.05)',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              fontSize: '12px',
              color: '#666',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              gap: '8px'
            }}>
              <span>ID</span>
              <span>Item</span>
              <span>Price</span>
              <span>Condition</span>
              <span>Category</span>
              <span>Status</span>
              <span>Seller</span>
              <span>Actions</span>
            </div>

            {listings.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                No listings found
              </div>
            ) : (
              listings.map((listing) => (
                <div
                  key={listing.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '50px 1fr 100px 120px 100px 100px 120px 140px',
                    padding: '10px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    color: '#ddd'
                  }}
                >
                  <span style={{ color: '#666' }}>#{listing.id.slice(0, 4)}</span>
                  <span style={{ fontWeight: 'bold' }}>{listing.item_name}</span>
                  <span style={{ color: '#FFD700' }}>${listing.price.toFixed(2)}</span>
                  <span style={{ color: '#888', fontSize: '12px' }}>{listing.condition}</span>
                  <span style={{ color: '#888', fontSize: '12px' }}>{listing.category || '—'}</span>
                  <span>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: listing.status === 'AVAILABLE' ? 'rgba(82,192,122,0.15)' :
                                 listing.status === 'SOLD' ? 'rgba(255,68,68,0.15)' :
                                 'rgba(200,162,0,0.15)',
                      color: listing.status === 'AVAILABLE' ? '#52c07a' :
                             listing.status === 'SOLD' ? '#ff4444' :
                             '#c8a200',
                      fontSize: '11px'
                    }}>
                      {listing.status || 'AVAILABLE'}
                    </span>
                  </span>
                  <span style={{ color: '#888', fontSize: '12px' }}>
                    {listing.seller_id.slice(0, 6)}...
                  </span>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {listing.status !== 'REMOVED' && listing.status !== 'SOLD' && (
                      <button
                        onClick={() => handleRemoveListing(listing.id)}
                        style={{
                          padding: '4px 10px',
                          background: 'rgba(255,68,68,0.1)',
                          border: '1px solid rgba(255,68,68,0.2)',
                          borderRadius: '6px',
                          color: '#f87171',
                          fontSize: '10px',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        Remove
                      </button>
                    )}
                    {listing.status === 'REMOVED' && (
                      <button
                        onClick={() => handleApproveListing(listing.id)}
                        style={{
                          padding: '4px 10px',
                          background: 'rgba(82,192,122,0.1)',
                          border: '1px solid rgba(82,192,122,0.2)',
                          borderRadius: '6px',
                          color: '#52c07a',
                          fontSize: '10px',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        Approve
                      </button>
                    )}
                    {listing.status === 'SOLD' && (
                      <span style={{ color: '#666', fontSize: '11px', fontStyle: 'italic' }}>
                        Sold
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Songs Tab */}
        {activeTab === 'songs' && (
          <div style={{
            background: 'rgba(13,13,13,0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid #c8a20020',
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '60px 1fr 1fr 120px 80px 80px 140px 160px',
              padding: '12px 16px',
              background: 'rgba(200,162,0,0.05)',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              fontSize: '12px',
              color: '#666',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              gap: '8px'
            }}>
              <span>#</span>
              <span>Title</span>
              <span>Artist</span>
              <span>Category</span>
              <span>Votes</span>
              <span>Status</span>
              <span>Suggested By</span>
              <span>Actions</span>
            </div>

            {filteredSongs.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                No pending song suggestions
              </div>
            ) : (
              filteredSongs.map((song, index) => (
                <div
                  key={song.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '60px 1fr 1fr 120px 80px 80px 140px 160px',
                    padding: '10px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    color: '#ddd'
                  }}
                >
                  <span style={{ color: '#666' }}>#{index + 1}</span>
                  <span style={{ fontWeight: 'bold', color: 'white' }}>{song.title}</span>
                  <span style={{ color: '#aaa' }}>{song.artist}</span>
                  <span style={{
                    fontSize: '11px',
                    color: '#c8a200',
                    background: 'rgba(200,162,0,0.1)',
                    padding: '2px 8px',
                    borderRadius: '99px',
                    border: '1px solid rgba(200,162,0,0.2)',
                    display: 'inline-block',
                    textAlign: 'center',
                    width: 'fit-content'
                  }}>
                    {song.category}
                  </span>
                  <span style={{ color: '#FFD700' }}>{song.votes || 0}</span>
                  <span>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: song.status === 'pending' ? 'rgba(234,179,8,0.15)' : 'rgba(255,68,68,0.15)',
                      color: song.status === 'pending' ? '#eab308' : '#f87171',
                      fontSize: '11px'
                    }}>
                      {song.status}
                    </span>
                  </span>
                  <span style={{ color: '#888', fontSize: '12px' }}>
                    {song.suggested_by_user?.full_name || 'Unknown'}
                  </span>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {song.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApproveSong(song.id)}
                          style={{
                            padding: '4px 10px',
                            background: 'rgba(82,192,122,0.1)',
                            border: '1px solid rgba(82,192,122,0.2)',
                            borderRadius: '6px',
                            color: '#52c07a',
                            fontSize: '10px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                          }}
                        >
                          ✅ Approve
                        </button>
                        <button
                          onClick={() => handleRejectSong(song.id)}
                          style={{
                            padding: '4px 10px',
                            background: 'rgba(255,68,68,0.1)',
                            border: '1px solid rgba(255,68,68,0.2)',
                            borderRadius: '6px',
                            color: '#f87171',
                            fontSize: '10px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                          }}
                        >
                          ❌ Reject
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDeleteSong(song.id)}
                      style={{
                        padding: '4px 10px',
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.2)',
                        borderRadius: '6px',
                        color: '#ef4444',
                        fontSize: '10px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Sessions Tab */}
        {activeTab === 'sessions' && (
          <div style={{
            background: 'rgba(13,13,13,0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid #c8a20020',
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '50px 1fr 120px 100px 100px 80px 100px 140px',
              padding: '12px 16px',
              background: 'rgba(200,162,0,0.05)',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              fontSize: '12px',
              color: '#666',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              gap: '8px'
            }}>
              <span>ID</span>
              <span>Sport</span>
              <span>Date</span>
              <span>Time</span>
              <span>Location</span>
              <span>Players</span>
              <span>Creator</span>
              <span>Actions</span>
            </div>

            {filteredSessions.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                No sessions found
              </div>
            ) : (
              filteredSessions.map((session) => (
                <div
                  key={session.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '50px 1fr 120px 100px 100px 80px 100px 140px',
                    padding: '10px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    color: '#ddd'
                  }}
                >
                  <span style={{ color: '#666' }}>#{session.id.slice(0, 4)}</span>
                  <span style={{ fontWeight: 'bold' }}>{session.sport_type}</span>
                  <span style={{ color: '#888' }}>{session.session_date}</span>
                  <span style={{ color: '#888' }}>{session.session_time.slice(0, 5)}</span>
                  <span style={{ color: '#888' }}>{session.location}</span>
                  <span style={{ color: '#FFD700' }}>{session.participant_count || 0}/{session.max_participants}</span>
                  <span style={{ color: '#888', fontSize: '12px' }}>
                    {session.creator?.full_name || 'Unknown'}
                  </span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => {
                        setShowDeleteModal({
                          type: 'session',
                          id: session.id,
                          name: `${session.sport_type} - ${session.location}`
                        })
                      }}
                      style={{
                        padding: '4px 10px',
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.2)',
                        borderRadius: '6px',
                        color: '#ef4444',
                        fontSize: '10px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tournaments Tab */}
        {activeTab === 'tournaments' && (
          <div style={{
            background: 'rgba(13,13,13,0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid #c8a20020',
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '50px 1fr 120px 100px 80px 80px 120px 140px',
              padding: '12px 16px',
              background: 'rgba(200,162,0,0.05)',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              fontSize: '12px',
              color: '#666',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              gap: '8px'
            }}>
              <span>ID</span>
              <span>Name</span>
              <span>Sport</span>
              <span>Dates</span>
              <span>Teams</span>
              <span>Matches</span>
              <span>Creator</span>
              <span>Actions</span>
            </div>

            {filteredTournaments.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                No tournaments found
              </div>
            ) : (
              filteredTournaments.map((tournament) => (
                <div
                  key={tournament.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '50px 1fr 120px 100px 80px 80px 120px 140px',
                    padding: '10px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    color: '#ddd'
                  }}
                >
                  <span style={{ color: '#666' }}>#{tournament.id.slice(0, 4)}</span>
                  <span style={{ fontWeight: 'bold' }}>{tournament.name}</span>
                  <span style={{ color: '#888' }}>{tournament.sport_type}</span>
                  <span style={{ color: '#888', fontSize: '11px' }}>
                    {tournament.start_date} → {tournament.end_date}
                  </span>
                  <span style={{ color: '#FFD700' }}>{tournament.teams_count || 0}</span>
                  <span style={{ color: '#60a5fa' }}>{tournament.matches_count || 0}</span>
                  <span style={{ color: '#888', fontSize: '12px' }}>
                    {tournament.creator?.full_name || 'Unknown'}
                  </span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => {
                        setShowDeleteModal({
                          type: 'tournament',
                          id: tournament.id,
                          name: tournament.name
                        })
                      }}
                      style={{
                        padding: '4px 10px',
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.2)',
                        borderRadius: '6px',
                        color: '#ef4444',
                        fontSize: '10px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: '40px', textAlign: 'center' }}>
          <span style={{ color: '#374151', fontSize: '11px', letterSpacing: '0.06em' }}>
            ⚡ Admin Panel v2.0 • Users • Listings • Songs • Sessions • Tournaments
          </span>
        </div>
      </div>

      {/* ─── Delete Confirmation Modal ─── */}
      {showDeleteModal && (
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
            borderRadius: '24px',
            border: '1px solid rgba(239,68,68,0.3)',
            maxWidth: '450px',
            width: '100%',
            padding: '32px'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '48px' }}>⚠️</div>
              <h3 style={{ color: '#FFD700', marginTop: '8px' }}>Confirm Delete</h3>
            </div>
            
            <p style={{ color: '#aaa', textAlign: 'center', marginBottom: '16px' }}>
              Are you sure you want to delete <strong style={{ color: '#FFD700' }}>{showDeleteModal.name}</strong>?
              <br />
              <span style={{ color: '#6b7280', fontSize: '13px' }}>
                {showDeleteModal.type === 'session' && 'This will remove the session and all participants.'}
                {showDeleteModal.type === 'tournament' && 'This will remove the tournament, all teams, and all matches.'}
              </span>
              <br />
              <span style={{ color: '#ef4444', fontSize: '13px' }}>
                This action cannot be undone!
              </span>
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowDeleteModal(null)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'transparent',
                  border: '1px solid #333',
                  color: '#666',
                  cursor: 'pointer'
                }}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (showDeleteModal.type === 'session') {
                    await handleDeleteSession(showDeleteModal.id)
                  } else if (showDeleteModal.type === 'tournament') {
                    await handleDeleteTournament(showDeleteModal.id)
                  }
                }}
                disabled={isDeleting}
                style={{
                  flex: 2,
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isDeleting ? '#666' : '#ef4444',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: isDeleting ? 'not-allowed' : 'pointer'
                }}
              >
                {isDeleting ? 'Deleting...' : '🗑️ Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}