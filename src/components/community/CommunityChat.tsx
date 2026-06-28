// src/components/community/CommunityChat.tsx
import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

interface Message {
  id: string
  community_id: string
  sender_id: string
  message_text: string
  created_at: string
  sender?: {
    full_name: string
  }
}

interface Community {
  id: string
  name: string
  description: string
  category: string
  member_count: number
  created_by: string
}

export const CommunityChat: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [community, setCommunity] = useState<Community | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isMember, setIsMember] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    checkUser()
    if (id) {
      loadCommunity()
      loadMessages()
      checkMembership()
    }
  }, [id])

  // ─── Auto-scroll to bottom ──────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ─── Real-time subscription ──────────────────────────────────────────────
  useEffect(() => {
    if (!id) return

    const subscription = supabase
      .channel(`community-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_messages',
          filter: `community_id=eq.${id}`
        },
        (payload) => {
          const newMsg = payload.new as Message
          // Fetch sender name
          supabase
            .from('users')
            .select('full_name')
            .eq('id', newMsg.sender_id)
            .single()
            .then(({ data }) => {
              setMessages(prev => [...prev, { ...newMsg, sender: { full_name: data?.full_name || 'Unknown' } }])
            })
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [id])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const checkMembership = async () => {
    if (!user || !id) return

    const { data, error } = await supabase
      .from('community_members')
      .select('*')
      .eq('community_id', id)
      .eq('user_id', user.id)
      .single()

    setIsMember(!!data && !error)
  }

  const loadCommunity = async () => {
    const { data, error } = await supabase
      .from('communities')
      .select('*')
      .eq('id', id)
      .single()

    if (!error && data) {
      setCommunity(data)
    }
    setLoading(false)
  }

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from('community_messages')
      .select(`
        *,
        sender:users!sender_id(full_name)
      `)
      .eq('community_id', id)
      .order('created_at', { ascending: true })
      .limit(50)

    if (!error && data) {
      setMessages(data)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || sending || !user || !isMember) return

    setSending(true)

    const { error } = await supabase
      .from('community_messages')
      .insert({
        community_id: id,
        sender_id: user.id,
        message_text: newMessage.trim()
      })

    if (error) {
      alert('Failed to send message: ' + error.message)
    } else {
      setNewMessage('')
    }
    setSending(false)
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago'
    if (diff < 86400000) return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
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
          <p style={{ color: '#666' }}>Loading community...</p>
        </div>
      </div>
    )
  }

  if (!community) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0D0D0F',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ fontSize: '48px' }}>🔍</div>
        <h2 style={{ color: '#888' }}>Community not found</h2>
        <button
          onClick={() => navigate('/community')}
          style={{
            padding: '10px 24px',
            background: 'linear-gradient(135deg, #c8a200, #FFD700)',
            border: 'none',
            borderRadius: '8px',
            color: '#0a0a0a',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          ← Back to Communities
        </button>
      </div>
    )
  }

  if (!isMember) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0D0D0F',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px',
        padding: '20px'
      }}>
        <div style={{ fontSize: '48px' }}>🔒</div>
        <h2 style={{ color: '#888' }}>You're not a member</h2>
        <p style={{ color: '#666' }}>Join this community to start chatting!</p>
        <button
          onClick={() => navigate('/community')}
          style={{
            padding: '10px 24px',
            background: 'linear-gradient(135deg, #c8a200, #FFD700)',
            border: 'none',
            borderRadius: '8px',
            color: '#0a0a0a',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          ← Back to Communities
        </button>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0D0D0F',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: 'radial-gradient(ellipse 70% 45% at 50% -5%, rgba(200,162,0,0.05) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      {/* ─── Header ─── */}
      <div style={{
        padding: '16px 24px',
        background: 'rgba(10,10,16,0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        position: 'relative',
        zIndex: 1
      }}>
        <button
          onClick={() => navigate('/community')}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#6b7280',
            fontSize: '20px',
            cursor: 'pointer'
          }}
        >
          ←
        </button>
        <div>
          <h2 style={{ color: '#FFD700', margin: 0 }}>{community?.name}</h2>
          <p style={{ color: '#6b7280', fontSize: '12px', margin: 0 }}>
            {community?.member_count || 0} members • {community?.category}
          </p>
        </div>
      </div>

      {/* ─── Messages ─── */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        position: 'relative',
        zIndex: 1
      }}>
        {messages.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: '#4b5563',
            padding: '40px 20px'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>💬</div>
            <p>No messages yet</p>
            <p style={{ fontSize: '13px' }}>Be the first to say something!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === user?.id
            return (
              <div
                key={msg.id}
                style={{
                  alignSelf: isMine ? 'flex-end' : 'flex-start',
                  maxWidth: '75%',
                  padding: '10px 16px',
                  borderRadius: isMine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: isMine ? 'linear-gradient(135deg, #c8a200, #FFD700)' : 'rgba(30,30,40,0.8)',
                  color: isMine ? '#0a0a0a' : 'white',
                  border: isMine ? 'none' : '1px solid rgba(255,255,255,0.05)',
                  wordBreak: 'break-word'
                }}
              >
                {!isMine && (
                  <div style={{ fontSize: '11px', color: '#c8a200', marginBottom: '4px', fontWeight: 'bold' }}>
                    {msg.sender?.full_name || 'Unknown'}
                  </div>
                )}
                <div style={{ fontSize: '14px' }}>{msg.message_text}</div>
                <div style={{
                  fontSize: '9px',
                  opacity: 0.5,
                  marginTop: '4px',
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

      {/* ─── Input ─── */}
      <div style={{
        padding: '12px 20px',
        background: 'rgba(10,10,16,0.95)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        gap: '12px',
        position: 'relative',
        zIndex: 1
      }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              sendMessage()
            }
          }}
          placeholder={`Message ${community?.name || 'community'}...`}
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
          onClick={sendMessage}
          disabled={sending || !newMessage.trim()}
          style={{
            padding: '10px 24px',
            background: !newMessage.trim() || sending ? 'rgba(200,162,0,0.3)' : 'linear-gradient(135deg, #c8a200, #FFD700)',
            border: 'none',
            borderRadius: '12px',
            color: !newMessage.trim() || sending ? '#4b5563' : '#0a0a0a',
            fontWeight: 'bold',
            cursor: !newMessage.trim() || sending ? 'not-allowed' : 'pointer',
            fontSize: '14px'
          }}
        >
          {sending ? '...' : 'Send'}
        </button>
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