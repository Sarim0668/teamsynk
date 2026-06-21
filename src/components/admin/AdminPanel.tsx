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

export const AdminPanel: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [listings, setListings] = useState<Listing[]>([])
  const [activeTab, setActiveTab] = useState<'users' | 'listings'>('users')
  const [searchQuery, setSearchQuery] = useState('')
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)

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

    // Check if user is admin
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
      loadListings()
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

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
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
            Users: {users.length} • Listings: {listings.length}
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
          position: 'relative'
        }}>
          <button
            onClick={() => setActiveTab('users')}
            style={{
              padding: '12px 24px',
              background: activeTab === 'users' ? 'rgba(200,162,0,0.1)' : 'transparent',
              border: 'none',
              color: activeTab === 'users' ? '#FFD700' : '#666',
              fontWeight: activeTab === 'users' ? 'bold' : 'normal',
              cursor: 'pointer',
              borderBottom: activeTab === 'users' ? '2px solid #c8a200' : '2px solid transparent',
              transition: 'all 0.3s',
              fontSize: '14px'
            }}
          >
            👥 Users
          </button>
          <button
            onClick={() => setActiveTab('listings')}
            style={{
              padding: '12px 24px',
              background: activeTab === 'listings' ? 'rgba(200,162,0,0.1)' : 'transparent',
              border: 'none',
              color: activeTab === 'listings' ? '#FFD700' : '#666',
              fontWeight: activeTab === 'listings' ? 'bold' : 'normal',
              cursor: 'pointer',
              borderBottom: activeTab === 'listings' ? '2px solid #c8a200' : '2px solid transparent',
              transition: 'all 0.3s',
              fontSize: '14px'
            }}
          >
            📦 Listings
          </button>
        </div>

        {/* Search */}
        <div style={{ marginBottom: '16px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTab === 'users' ? 'users...' : 'listings...'}`}
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

        {/* Footer */}
        <div style={{ marginTop: '40px', textAlign: 'center' }}>
          <span style={{ color: '#374151', fontSize: '11px', letterSpacing: '0.06em' }}>
            ⚡ Admin Panel v1.0 • UC10 & UC11
          </span>
        </div>
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