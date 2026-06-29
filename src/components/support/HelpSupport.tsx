// src/components/support/HelpSupport.tsx
import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  message_text: string
  is_read: boolean
  created_at: string
  sender?: {
    full_name: string
  }
}

export const HelpSupport: React.FC = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const ADMIN_EMAIL = 'i240668@isb.nu.edu.pk'
  const ADMIN_ID = 'admin' // This will be replaced with actual admin ID from database

  useEffect(() => {
    checkUserAndLoad()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const checkUserAndLoad = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    
    if (!currentUser) {
      navigate('/login')
      return
    }

    setUser(currentUser)
    
    // Get admin user ID
    const { data: adminData } = await supabase
      .from('users')
      .select('id')
      .eq('email', ADMIN_EMAIL)
      .single()

    if (adminData) {
      await loadMessages(currentUser.id, adminData.id)
    } else {
      // If admin not found, still allow messaging
      await loadMessages(currentUser.id, 'admin')
    }
    
    setLoading(false)
  }

  const loadMessages = async (userId: string, adminId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users!sender_id(full_name)
      `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .or(`sender_id.eq.${adminId},receiver_id.eq.${adminId}`)
      .order('created_at', { ascending: true })

    if (!error && data) {
      setMessages(data)
      
      // Mark unread messages as read
      const unreadMessages = data.filter(m => m.receiver_id === userId && !m.is_read)
      for (const msg of unreadMessages) {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('id', msg.id)
      }
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || sending || !user) return

    setSending(true)

    // Get admin ID
    const { data: adminData } = await supabase
      .from('users')
      .select('id')
      .eq('email', ADMIN_EMAIL)
      .single()

    const receiverId = adminData?.id || 'admin'

    const { error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        message_text: newMessage.trim(),
        is_read: false
      })

    if (error) {
      alert('Failed to send message: ' + error.message)
    } else {
      setNewMessage('')
      // Reload messages
      await loadMessages(user.id, receiverId)
    }
    setSending(false)
  }

  const handleSendEmail = async () => {
    if (!emailSubject.trim() || !emailBody.trim()) {
      alert('Please fill in both subject and message fields.')
      return
    }

    setSendingEmail(true)

    try {
      // Open default email client
      const mailtoLink = `mailto:${ADMIN_EMAIL}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(
        `From: ${user?.email || 'Anonymous'}\n\n${emailBody}\n\n---\nSent from TeamSynk Support`
      )}`
      window.open(mailtoLink, '_blank')
      
      setShowEmailModal(false)
      setEmailSubject('')
      setEmailBody('')
      alert('📧 Email client opened. Please send your message.')
    } catch (error) {
      alert('Failed to open email client. Please try again.')
    }
    setSendingEmail(false)
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
          <p style={{ color: '#666' }}>Loading support...</p>
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

      <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{
              padding: '10px',
              background: 'rgba(200,162,0,0.1)',
              borderRadius: '12px',
              border: '1px solid rgba(200,162,0,0.2)'
            }}>
              <span style={{ fontSize: '24px' }}>🆘</span>
            </div>
            <div>
              <h1 style={{ color: '#FFD700', fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
                Help & Support
              </h1>
              <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                We're here to help you with any issues or questions
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginBottom: '24px'
        }}>
          <button
            onClick={() => setShowEmailModal(true)}
            style={{
              padding: '16px',
              background: 'rgba(16,16,22,0.95)',
              border: '1px solid rgba(200,162,0,0.2)',
              borderRadius: '12px',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textAlign: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(200,162,0,0.5)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(200,162,0,0.2)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📧</div>
            <div style={{ fontWeight: 'bold', color: '#c8a200' }}>Email Support</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Send us an email</div>
          </button>

          <div style={{
            padding: '16px',
            background: 'rgba(16,16,22,0.95)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>💬</div>
            <div style={{ fontWeight: 'bold', color: '#c8a200' }}>Live Chat</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Chat with admin below</div>
          </div>

          <div style={{
            padding: '16px',
            background: 'rgba(16,16,22,0.95)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏰</div>
            <div style={{ fontWeight: 'bold', color: '#c8a200' }}>Response Time</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Within 24 hours</div>
          </div>
        </div>

        {/* Info Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '12px',
          marginBottom: '24px'
        }}>
          <div style={{
            padding: '16px',
            background: 'rgba(16,16,22,0.95)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '12px',
            borderLeft: '3px solid #c8a200'
          }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#c8a200', marginBottom: '4px' }}>
              📌 Quick Tips
            </div>
            <ul style={{ color: '#9ca3af', fontSize: '13px', paddingLeft: '20px', margin: 0 }}>
              <li>Be specific about your issue</li>
              <li>Include screenshots if possible</li>
              <li>Check our FAQ section</li>
            </ul>
          </div>

          <div style={{
            padding: '16px',
            background: 'rgba(16,16,22,0.95)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '12px',
            borderLeft: '3px solid #4ade80'
          }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#4ade80', marginBottom: '4px' }}>
              ✅ Before You Contact
            </div>
            <ul style={{ color: '#9ca3af', fontSize: '13px', paddingLeft: '20px', margin: 0 }}>
              <li>Refresh the page</li>
              <li>Check your internet connection</li>
              <li>Try logging out and back in</li>
            </ul>
          </div>

          <div style={{
            padding: '16px',
            background: 'rgba(16,16,22,0.95)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '12px',
            borderLeft: '3px solid #60a5fa'
          }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#60a5fa', marginBottom: '4px' }}>
              📞 Emergency Contact
            </div>
            <div style={{ color: '#9ca3af', fontSize: '13px' }}>
              <div>Email: <span style={{ color: '#c8a200' }}>{ADMIN_EMAIL}</span></div>
              <div style={{ marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>
                Response within 24 hours
              </div>
            </div>
          </div>
        </div>

        {/* Chat Section */}
        <div style={{
          background: 'rgba(16,16,22,0.95)',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.05)',
          overflow: 'hidden'
        }}>
          {/* Chat Header */}
          <div style={{
            padding: '16px 20px',
            background: 'rgba(200,162,0,0.05)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#4ade80',
              boxShadow: '0 0 10px rgba(74,222,128,0.5)'
            }} />
            <div>
              <div style={{ fontWeight: 'bold', color: 'white' }}>Support Chat</div>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>Online - Usually responds within minutes</div>
            </div>
            <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#6b7280' }}>
              {messages.length} messages
            </div>
          </div>

          {/* Messages */}
          <div style={{
            height: '350px',
            overflowY: 'auto',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            {messages.length === 0 ? (
              <div style={{
                textAlign: 'center',
                color: '#4b5563',
                padding: '40px 20px'
              }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>💬</div>
                <p style={{ fontWeight: 'bold', color: '#6b7280' }}>No messages yet</p>
                <p style={{ fontSize: '13px' }}>Send a message to get support</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMine = msg.sender_id === user?.id
                const isAdmin = msg.sender?.full_name === 'Admin' || msg.sender_id === 'admin'
                
                return (
                  <div
                    key={msg.id}
                    style={{
                      alignSelf: isMine ? 'flex-end' : 'flex-start',
                      maxWidth: '75%',
                      padding: '10px 16px',
                      borderRadius: isMine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      background: isMine 
                        ? 'linear-gradient(135deg, #c8a200, #FFD700)' 
                        : isAdmin 
                          ? 'rgba(74,222,128,0.1)' 
                          : 'rgba(30,30,40,0.8)',
                      color: isMine ? '#0a0a0a' : 'white',
                      border: isMine 
                        ? 'none' 
                        : isAdmin 
                          ? '1px solid rgba(74,222,128,0.2)' 
                          : '1px solid rgba(255,255,255,0.05)',
                      wordBreak: 'break-word'
                    }}
                  >
                    {!isMine && (
                      <div style={{ 
                        fontSize: '11px', 
                        color: isAdmin ? '#4ade80' : '#c8a200', 
                        marginBottom: '4px', 
                        fontWeight: 'bold' 
                      }}>
                        {isAdmin ? '🛡️ Admin' : (msg.sender?.full_name || 'User')}
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
                      {isMine && ' ✓'}
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '12px 20px',
            background: 'rgba(0,0,0,0.2)',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            gap: '12px'
          }}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              placeholder="Type your message..."
              style={{
                flex: 1,
                padding: '10px 16px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '10px',
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
                background: !newMessage.trim() || sending 
                  ? 'rgba(200,162,0,0.3)' 
                  : 'linear-gradient(135deg, #c8a200, #FFD700)',
                border: 'none',
                borderRadius: '10px',
                color: !newMessage.trim() || sending ? '#4b5563' : '#0a0a0a',
                fontWeight: 'bold',
                cursor: !newMessage.trim() || sending ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              {sending ? '...' : 'Send'}
            </button>
          </div>
        </div>

        {/* Email Modal */}
        {showEmailModal && (
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
          }} onClick={() => setShowEmailModal(false)}>
            <div style={{
              background: 'rgba(10,10,16,0.98)',
              borderRadius: '24px',
              border: '1px solid rgba(200,162,0,0.2)',
              maxWidth: '500px',
              width: '100%',
              padding: '32px'
            }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ color: '#FFD700', fontSize: '22px' }}>📧 Email Support</h2>
                <button
                  onClick={() => setShowEmailModal(false)}
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

              <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>
                Send an email to our support team. We'll get back to you within 24 hours.
              </p>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ color: '#aaa', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                  To:
                </label>
                <div style={{
                  padding: '10px 14px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  color: '#c8a200',
                  fontSize: '14px'
                }}>
                  {ADMIN_EMAIL}
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ color: '#aaa', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                  Subject *
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Brief summary of your issue"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: '#aaa', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                  Message *
                </label>
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Describe your issue in detail..."
                  rows={5}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setShowEmailModal(false)}
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
                  onClick={handleSendEmail}
                  disabled={sendingEmail}
                  style={{
                    flex: 2,
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: sendingEmail ? 'rgba(200,162,0,0.3)' : 'linear-gradient(135deg, #c8a200, #FFD700)',
                    color: sendingEmail ? '#4b5563' : '#0a0a0a',
                    fontWeight: 'bold',
                    cursor: sendingEmail ? 'not-allowed' : 'pointer'
                  }}
                >
                  {sendingEmail ? 'Opening...' : '📧 Send Email'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.02);
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(200,162,0,0.3);
          border-radius: 3px;
        }
      `}</style>
    </div>
  )
}