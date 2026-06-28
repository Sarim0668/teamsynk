// src/components/community/CommunityHub.tsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

interface Community {
  id: string
  name: string
  description: string
  category: string
  created_by: string
  member_limit: number
  member_count: number
  created_at: string
  is_private: boolean
}

const CATEGORIES = [
  { value: 'sports', icon: '⚽', label: 'Sports' },
  { value: 'study', icon: '📚', label: 'Study' },
  { value: 'gaming', icon: '🎮', label: 'Gaming' },
  { value: 'fitness', icon: '💪', label: 'Fitness' },
  { value: 'music', icon: '🎵', label: 'Music' },
  { value: 'coding', icon: '💻', label: 'Coding' },
  { value: 'photography', icon: '📸', label: 'Photography' },
  { value: 'social', icon: '💬', label: 'Social' },
  { value: 'other', icon: '✨', label: 'Other' },
]

// ─── DEMO COMMUNITIES ──────────────────────────────────────────────────────────
const DEMO_COMMUNITIES: Community[] = [
  {
    id: 'demo-1',
    name: '🏏 Cricket Club',
    description: 'For all cricket enthusiasts! We play every weekend at University Ground.',
    category: 'sports',
    created_by: 'admin',
    member_limit: 20,
    member_count: 5,
    created_at: new Date().toISOString(),
    is_private: false
  },
  {
    id: 'demo-2',
    name: '📚 Study Group',
    description: 'Study together, ace exams together! Join for group study sessions.',
    category: 'study',
    created_by: 'admin',
    member_limit: 15,
    member_count: 8,
    created_at: new Date().toISOString(),
    is_private: false
  },
  {
    id: 'demo-3',
    name: '🎮 Gaming Squad',
    description: 'CS:GO, Valorant, PUBG, and more! Join for gaming sessions.',
    category: 'gaming',
    created_by: 'admin',
    member_limit: 20,
    member_count: 12,
    created_at: new Date().toISOString(),
    is_private: false
  },
  {
    id: 'demo-4',
    name: '💪 Fitness Club',
    description: 'Workout together, stay fit! Morning and evening sessions.',
    category: 'fitness',
    created_by: 'admin',
    member_limit: 15,
    member_count: 3,
    created_at: new Date().toISOString(),
    is_private: false
  },
  {
    id: 'demo-5',
    name: '🎵 Music Lovers',
    description: 'Share songs, discover new artists, and jam together!',
    category: 'music',
    created_by: 'admin',
    member_limit: 20,
    member_count: 6,
    created_at: new Date().toISOString(),
    is_private: false
  }
]

export const CommunityHub: React.FC = () => {
  const navigate = useNavigate()
  const [communities, setCommunities] = useState<Community[]>(DEMO_COMMUNITIES)
  const [filteredCommunities, setFilteredCommunities] = useState<Community[]>(DEMO_COMMUNITIES)
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [tableExists, setTableExists] = useState(false)
  const [joinedCommunities, setJoinedCommunities] = useState<Set<string>>(new Set())

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'sports',
    member_limit: 20,
    is_private: false,
  })

  useEffect(() => {
    checkUser()
    checkTableAndLoad()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    if (user) {
      loadUserJoinedCommunities(user.id)
    }
  }

  const loadUserJoinedCommunities = async (userId: string) => {
    const { data, error } = await supabase
      .from('community_members')
      .select('community_id')
      .eq('user_id', userId)

    if (!error && data) {
      const joined = new Set(data.map((item: any) => item.community_id))
      setJoinedCommunities(joined)
    }
  }

  const checkTableAndLoad = async () => {
    setLoading(true)
    
    try {
      const { error: checkError } = await supabase
        .from('communities')
        .select('id')
        .limit(1)

      if (checkError) {
        console.log('⚠️ Communities table not found, using demo data')
        setTableExists(false)
        setCommunities(DEMO_COMMUNITIES)
        setFilteredCommunities(DEMO_COMMUNITIES)
        setLoading(false)
        return
      }

      setTableExists(true)

      const { data, error } = await supabase
        .from('communities')
        .select(`
          *,
          community_members(count)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (!error && data && data.length > 0) {
        const communitiesWithCount = data.map((c: any) => ({
          ...c,
          member_count: c.community_members?.[0]?.count || 0
        }))
        setCommunities(communitiesWithCount)
        setFilteredCommunities(communitiesWithCount)
      } else {
        setCommunities(DEMO_COMMUNITIES)
        setFilteredCommunities(DEMO_COMMUNITIES)
      }
    } catch (error) {
      console.error('Error loading communities:', error)
      setCommunities(DEMO_COMMUNITIES)
      setFilteredCommunities(DEMO_COMMUNITIES)
    }
    setLoading(false)
  }

  const filterCommunities = (category: string, search: string) => {
    let filtered = communities
    if (category !== 'all') {
      filtered = filtered.filter(c => c.category === category)
    }
    if (search) {
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.description?.toLowerCase().includes(search.toLowerCase())
      )
    }
    setFilteredCommunities(filtered)
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    filterCommunities(selectedCategory, value)
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    filterCommunities(category, searchTerm)
  }

  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      alert('Please login first')
      return
    }

    if (!tableExists) {
      const newCommunity: Community = {
        id: 'demo-' + Date.now(),
        name: formData.name,
        description: formData.description,
        category: formData.category,
        created_by: user.id,
        member_limit: formData.member_limit,
        member_count: 1,
        created_at: new Date().toISOString(),
        is_private: formData.is_private
      }
      setCommunities(prev => [newCommunity, ...prev])
      setFilteredCommunities(prev => [newCommunity, ...prev])
      setShowCreateModal(false)
      setFormData({ name: '', description: '', category: 'sports', member_limit: 20, is_private: false })
      alert('✅ Community created in demo mode!')
      return
    }

    try {
      const { error } = await supabase
        .from('communities')
        .insert({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          created_by: user.id,
          member_limit: formData.member_limit,
          is_private: formData.is_private,
          status: 'active'
        })

      if (error) {
        alert('Failed to create community: ' + error.message)
      } else {
        alert('✅ Community created successfully!')
        setShowCreateModal(false)
        setFormData({ name: '', description: '', category: 'sports', member_limit: 20, is_private: false })
        checkTableAndLoad()
      }
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

const handleJoinCommunity = async (communityId: string) => {
  if (!user) {
    alert('Please login first')
    return
  }

  if (communityId.startsWith('demo-')) {
    alert('🔥 Demo community! Join real communities by creating the table.')
    return
  }

  try {
    const { error } = await supabase
      .from('community_members')
      .insert({
        community_id: communityId,
        user_id: user.id,
        role: 'member'
      })

    if (error) {
      alert('Failed to join: ' + error.message)
    } else {
      alert('✅ You joined the community!')
      // Add to joined set
      setJoinedCommunities(prev => new Set(prev).add(communityId))
      checkTableAndLoad()
    }
  } catch (error: any) {
    alert('Error: ' + error.message)
  }
}

  const handleOpenChat = (communityId: string) => {
    navigate(`/community/${communityId}`)
  }

  const getCategoryIcon = (category: string) => {
    return CATEGORIES.find(c => c.value === category)?.icon || '📌'
  }

  const getCategoryLabel = (category: string) => {
    return CATEGORIES.find(c => c.value === category)?.label || 'Other'
  }

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
          <p style={{ color: '#666' }}>Loading communities...</p>
        </div>
      </div>
    )
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
            <h1 style={{ color: '#FFD700', fontSize: '32px' }}>🏠 Community Hub</h1>
            <p style={{ color: '#6b7280' }}>Connect with people who share your interests</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
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
            ➕ Create Community
          </button>
        </div>

        {/* ─── Database Status ─── */}
        {!tableExists && (
          <div style={{
            padding: '12px 20px',
            marginBottom: '16px',
            background: 'rgba(234,179,8,0.1)',
            border: '1px solid rgba(234,179,8,0.3)',
            borderRadius: '10px',
            color: '#eab308',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span>⚠️</span>
            <span>Showing demo communities. Run the SQL script to create the communities table in Supabase.</span>
          </div>
        )}

        {/* ─── Search & Filter ─── */}
        <div style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          marginBottom: '24px'
        }}>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search communities..."
            style={{
              flex: 1,
              padding: '10px 16px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              color: 'white',
              fontSize: '14px',
              outline: 'none',
              minWidth: '200px'
            }}
          />
          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            style={{
              padding: '10px 16px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              color: 'white',
              fontSize: '14px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>
            ))}
          </select>
        </div>

        {/* ─── Communities Grid ─── */}
        {filteredCommunities.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'rgba(16,16,22,0.9)',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏠</div>
            <h3 style={{ color: '#6b7280' }}>No communities found</h3>
            <p style={{ color: '#4b5563' }}>Be the first to create a community!</p>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                marginTop: '16px',
                padding: '10px 24px',
                background: 'linear-gradient(135deg, #c8a200, #FFD700)',
                border: 'none',
                borderRadius: '12px',
                color: '#0a0a0a',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              ➕ Create Community
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px'
          }}>
            {filteredCommunities.map(community => {
              const isFull = community.member_count >= community.member_limit
              const isMember = joinedCommunities.has(community.id) || community.id.startsWith('demo-')
              
              return (
                <div
                  key={community.id}
                  style={{
                    background: 'rgba(16,16,22,0.9)',
                    backdropFilter: 'blur(24px)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    padding: '20px',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.borderColor = 'rgba(200,162,0,0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'
                  }}
                  onClick={() => handleOpenChat(community.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'rgba(200,162,0,0.1)',
                      border: '1px solid rgba(200,162,0,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px'
                    }}>
                      {getCategoryIcon(community.category)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ color: 'white', fontSize: '16px', margin: 0 }}>{community.name}</h3>
                      <p style={{ color: '#6b7280', fontSize: '12px', margin: 0 }}>
                        {community.member_count || 0} members
                      </p>
                    </div>
                    {community.is_private && (
                      <span style={{
                        fontSize: '11px',
                        color: '#c8a200',
                        background: 'rgba(200,162,0,0.1)',
                        padding: '2px 8px',
                        borderRadius: '99px'
                      }}>
                        🔒
                      </span>
                    )}
                    {community.id.startsWith('demo-') && (
                      <span style={{
                        fontSize: '9px',
                        color: '#6b7280',
                        background: 'rgba(255,255,255,0.05)',
                        padding: '2px 8px',
                        borderRadius: '99px'
                      }}>
                        Demo
                      </span>
                    )}
                    {isMember && (
                      <span style={{
                        fontSize: '9px',
                        color: '#4ade80',
                        background: 'rgba(34,197,94,0.1)',
                        padding: '2px 8px',
                        borderRadius: '99px',
                        border: '1px solid rgba(34,197,94,0.2)'
                      }}>
                        ✅ Member
                      </span>
                    )}
                  </div>
                  <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {community.description || 'No description yet'}
                  </p>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '12px',
                    borderTop: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    <span style={{
                      fontSize: '11px',
                      color: '#c8a200',
                      background: 'rgba(200,162,0,0.1)',
                      padding: '2px 10px',
                      borderRadius: '99px',
                      border: '1px solid rgba(200,162,0,0.2)'
                    }}>
                      {getCategoryLabel(community.category)}
                    </span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ color: '#4b5563', fontSize: '11px' }}>
                        {community.member_count || 0}/{community.member_limit || 20}
                      </span>
                      {!isMember && !isFull && !community.id.startsWith('demo-') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleJoinCommunity(community.id)
                          }}
                          style={{
                            padding: '4px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #c8a200, #FFD700)',
                            color: '#0a0a0a',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}
                        >
                          Join
                        </button>
                      )}
                      {isFull && !isMember && (
                        <span style={{ color: '#f87171', fontSize: '11px' }}>Full</span>
                      )}
                      {isMember && (
                        <span style={{ 
                          fontSize: '11px',
                          color: '#c8a200',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          💬 Chat
                        </span>
                      )}
                      {community.id.startsWith('demo-') && !isMember && (
                        <span style={{ color: '#6b7280', fontSize: '10px' }}>Demo</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ─── Create Community Modal ─── */}
        {showCreateModal && (
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
                <h2 style={{ color: '#FFD700' }}>🏠 Create Community</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
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

              <form onSubmit={handleCreateCommunity}>
                <input
                  type="text"
                  placeholder="Community Name *"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                <textarea
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    marginBottom: '12px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Member Limit (max 50)"
                  value={formData.member_limit}
                  onChange={(e) => setFormData({ ...formData, member_limit: parseInt(e.target.value) })}
                  min="2"
                  max="50"
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
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    id="is_private"
                    checked={formData.is_private}
                    onChange={(e) => setFormData({ ...formData, is_private: e.target.checked })}
                    style={{
                      width: '18px',
                      height: '18px',
                      accentColor: '#c8a200'
                    }}
                  />
                  <label htmlFor="is_private" style={{ color: '#9ca3af', fontSize: '14px' }}>
                    🔒 Private Community (invite only)
                  </label>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
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
                    🚀 Create Community
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}