import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

export const Messages: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // ─── Check for selected user from navigation ──────────────────────────────
  useEffect(() => {
    const state = location.state as any
    console.log('📍 Location state:', state)
    
    if (state?.selectedUser) {
      console.log('✅ SELECTED USER FOUND:', state.selectedUser)
      setSelectedUser(state.selectedUser)
    }
  }, [location])

  // ─── Load user and conversations ───────────────────────────────────────────
  useEffect(() => {
    loadUserAndConversations()
  }, [])

  // ─── Load messages when selectedUser changes ──────────────────────────────
  useEffect(() => {
    if (selectedUser && selectedUser.id && user) {
      console.log('🔄 Loading messages for:', selectedUser.full_name)
      loadMessages(selectedUser.id)
      markMessagesAsRead(selectedUser.id)
      // 🔥 Refresh unread count in navbar after marking as read
      refreshUnreadCount()
      // 🔥 Refresh unread counts for all conversations
      loadUnreadCounts()
    }
  }, [selectedUser, user])

  // ─── Scroll to bottom when messages change ────────────────────────────────
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom()
    }
  }, [messages])

  // ─── Refresh unread counts periodically ────────────────────────────────────
  useEffect(() => {
    if (user) {
      loadUnreadCounts()
      const interval = setInterval(() => {
        loadUnreadCounts()
      }, 10000) // Refresh every 10 seconds
      return () => clearInterval(interval)
    }
  }, [user])

  // ─── Refresh unread count (notify navbar) ─────────────────────────────────
  const refreshUnreadCount = async () => {
    window.dispatchEvent(new CustomEvent('refreshUnreadCount'))
  }

  // ─── Load unread counts for all conversations ─────────────────────────────
  const loadUnreadCounts = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('messages')
      .select('sender_id, count')
      .eq('receiver_id', user.id)
      .eq('is_read', false)
      .group('sender_id')

    if (!error && data) {
      const counts: Record<string, number> = {}
      data.forEach((item: any) => {
        counts[item.sender_id] = item.count || 0
      })
      setUnreadCounts(counts)
      
      // Also update navbar unread count
      const totalUnread = Object.values(counts).reduce((a, b) => a + b, 0)
      // Store total unread for navbar
      window.dispatchEvent(new CustomEvent('refreshUnreadCount'))
    }
  }

  const loadUserAndConversations = async () => {
    setLoading(true)
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) {
      navigate('/login')
      return
    }
    setUser(currentUser)

    const { data: conversationsData, error } = await supabase
      .from('messages')
      .select('sender_id, receiver_id, created_at')
      .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
      .order('created_at', { ascending: false })

    if (!error && conversationsData) {
      const uniqueUserIds = new Set()
      const latestMessages: Record<string, any> = {}
      
      conversationsData.forEach((msg: any) => {
        const otherId = msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id
        if (otherId) {
          uniqueUserIds.add(otherId)
          // Keep the latest message for each conversation
          if (!latestMessages[otherId] || msg.created_at > latestMessages[otherId].created_at) {
            latestMessages[otherId] = msg
          }
        }
      })

      const userPromises = Array.from(uniqueUserIds).map(async (userId) => {
        const { data } = await supabase
          .from('users')
          .select('id, full_name, sport_interests, location, role, avatar_url')
          .eq('id', userId)
          .single()
        return data
      })

      const users = (await Promise.all(userPromises)).filter(Boolean)
      
      // Add latest message timestamp to each user for sorting
      const usersWithLatest = users.map((u: any) => ({
        ...u,
        lastMessageAt: latestMessages[u.id]?.created_at || null
      }))
      
      // Sort by latest message
      usersWithLatest.sort((a: any, b: any) => {
        if (!a.lastMessageAt) return 1
        if (!b.lastMessageAt) return -1
        return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      })
      
      setConversations(usersWithLatest)
      
      // Load unread counts
      await loadUnreadCounts()
    }

    setLoading(false)
  }

  const loadMessages = async (otherUserId: string) => {
    if (!user) return
    
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .or(`sender_id.eq.${otherUserId},receiver_id.eq.${otherUserId}`)
      .order('created_at', { ascending: true })

    if (!error && data) {
      setMessages(data)
    }
  }

  const markMessagesAsRead = async (otherUserId: string) => {
    if (!user || !user.id) return
    
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('receiver_id', user.id)
      .eq('sender_id', otherUserId)
      .eq('is_read', false)

    if (!error) {
      // Update unread counts
      setUnreadCounts(prev => ({
        ...prev,
        [otherUserId]: 0
      }))
      refreshUnreadCount()
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !selectedUser.id || sending) return
    if (!user || !user.id) {
      alert('Please login first')
      return
    }

    setSending(true)

    const { error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        receiver_id: selectedUser.id,
        message_text: newMessage.trim()
      })

    if (error) {
      alert('❌ Failed to send message: ' + error.message)
    } else {
      setNewMessage('')
      await loadMessages(selectedUser.id)
      scrollToBottom()
      refreshUnreadCount()
    }
    setSending(false)
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, sport_interests, location, role')
      .ilike('full_name', `%${searchQuery}%`)
      .neq('id', user.id)
      .limit(10)

    if (!error && data) {
      setSearchResults(data)
      setShowSearch(true)
    }
  }

  const startNewConversation = (userData: any) => {
    setSelectedUser(userData)
    setShowSearch(false)
    setSearchQuery('')
    setSearchResults([])
    if (!conversations.find((c: any) => c?.id === userData.id)) {
      setConversations(prev => [userData, ...prev])
    }
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    if (diff < 86400000) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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
          <p style={{ color: '#666' }}>Loading messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0D0D0F',
      color: 'white',
      display: 'flex',
      position: 'relative'
    }}>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: 'radial-gradient(ellipse 70% 45% at 50% -5%, rgba(200,162,0,0.05) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      {/* ─── LEFT PANEL: Conversations ─── */}
      <div style={{
        width: '340px',
        minWidth: '340px',
        background: 'rgba(10,10,16,0.95)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 style={{ color: '#FFD700', fontSize: '20px', margin: 0 }}>💬 Messages</h2>
        </div>

        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                if (!e.target.value) {
                  setShowSearch(false)
                  setSearchResults([])
                }
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search for a player..."
              style={{
                flex: 1,
                padding: '8px 12px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '10px',
                color: 'white',
                fontSize: '13px',
                outline: 'none'
              }}
            />
            <button
              onClick={handleSearch}
              style={{
                padding: '8px 16px',
                background: '#c8a200',
                border: 'none',
                borderRadius: '10px',
                color: '#0a0a0a',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              🔍
            </button>
          </div>

          {showSearch && searchResults.length > 0 && (
            <div style={{
              marginTop: '8px',
              background: 'rgba(20,20,30,0.95)',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.05)',
              maxHeight: '200px',
              overflow: 'auto'
            }}>
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  onClick={() => startNewConversation(result)}
                  style={{
                    padding: '10px 12px',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #c8a200, #FFD700)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#0a0a0a'
                  }}>
                    {result.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ color: 'white', fontWeight: '600', fontSize: '13px' }}>
                      {result.full_name}
                    </div>
                    <div style={{ color: '#666', fontSize: '11px' }}>
                      {result.sport_interests || 'Player'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
          {conversations.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#444', padding: '40px 20px' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>💬</div>
              <p style={{ fontSize: '14px' }}>No conversations yet</p>
            </div>
          ) : (
            conversations.map((conv: any) => {
              const unreadCount = unreadCounts[conv.id] || 0
              return (
                <div
                  key={conv?.id || Math.random().toString()}
                  onClick={() => conv?.id && setSelectedUser(conv)}
                  style={{
                    padding: '12px',
                    borderRadius: '12px',
                    background: selectedUser?.id === conv?.id ? 'rgba(200,162,0,0.08)' : 'transparent',
                    border: selectedUser?.id === conv?.id ? '1px solid rgba(200,162,0,0.2)' : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    position: 'relative'
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #c8a200, #FFD700)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#0a0a0a',
                    position: 'relative'
                  }}>
                    {conv?.full_name?.charAt(0)?.toUpperCase() || '?'}
                    {unreadCount > 0 && (
                      <span style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: '#ef4444',
                        color: 'white',
                        fontSize: '9px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid #0D0D0F'
                      }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      color: 'white', 
                      fontWeight: unreadCount > 0 ? 'bold' : '500',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      {conv?.full_name || 'Unknown'}
                      {unreadCount > 0 && (
                        <span style={{
                          background: '#ef4444',
                          color: 'white',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          padding: '1px 8px',
                          borderRadius: '99px',
                          minWidth: '20px',
                          textAlign: 'center'
                        }}>
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    <div style={{ 
                      color: unreadCount > 0 ? '#FFD700' : '#666', 
                      fontSize: '12px',
                      fontWeight: unreadCount > 0 ? '600' : '400'
                    }}>
                      {conv?.sport_interests || conv?.role || 'Player'}
                      {unreadCount > 0 && (
                        <span style={{ marginLeft: '6px', color: '#ef4444' }}>●</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ─── RIGHT PANEL: Chat ─── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        zIndex: 1,
        background: 'rgba(0,0,0,0.3)'
      }}>
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'rgba(10,10,16,0.8)',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #c8a200, #FFD700)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#0a0a0a'
              }}>
                {selectedUser?.full_name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div>
                <div style={{ color: 'white', fontWeight: 'bold' }}>
                  {selectedUser?.full_name || 'Unknown'}
                </div>
                <div style={{ color: '#666', fontSize: '12px' }}>
                  {selectedUser?.sport_interests || selectedUser?.role || 'Player'}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {messages.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  color: '#444',
                  padding: '40px'
                }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>👋</div>
                  <p style={{ fontSize: '16px', color: '#666' }}>No messages yet</p>
                  <p style={{ fontSize: '13px', color: '#444' }}>Say hello to start the conversation!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.sender_id === user?.id
                  return (
                    <div
                      key={msg.id}
                      style={{
                        alignSelf: isMine ? 'flex-end' : 'flex-start',
                        maxWidth: '70%',
                        padding: '10px 16px',
                        borderRadius: isMine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                        background: isMine ? 'linear-gradient(135deg, #c8a200, #FFD700)' : 'rgba(30,30,40,0.8)',
                        color: isMine ? '#0a0a0a' : 'white',
                        wordBreak: 'break-word'
                      }}
                    >
                      <div style={{ fontSize: '14px' }}>{msg.message_text}</div>
                      <div style={{
                        fontSize: '9px',
                        marginTop: '4px',
                        opacity: 0.6,
                        textAlign: isMine ? 'right' : 'left'
                      }}>
                        {formatTime(msg.created_at)}
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* ─── INPUT ─── */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              gap: '12px',
              background: 'rgba(10,10,16,0.8)',
              backdropFilter: 'blur(10px)'
            }}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSendMessage()
                  }
                }}
                placeholder={`Message ${selectedUser?.full_name || 'user'}...`}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              <button
                onClick={handleSendMessage}
                disabled={sending || !newMessage.trim()}
                style={{
                  padding: '12px 28px',
                  background: '#c8a200',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#0a0a0a',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  cursor: sending ? 'not-allowed' : 'pointer',
                  opacity: sending || !newMessage.trim() ? 0.5 : 1
                }}
              >
                {sending ? '...' : 'Send'}
              </button>
            </div>
          </>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            color: '#444'
          }}>
            <div style={{ fontSize: '60px', marginBottom: '16px' }}>💬</div>
            <h2 style={{ color: '#666' }}>Select a conversation</h2>
            <p style={{ fontSize: '14px' }}>Choose a player from the left to start messaging</p>
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