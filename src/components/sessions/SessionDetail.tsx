import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

export const SessionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [session, setSession] = useState<any>(null)
  const [participants, setParticipants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [user, setUser] = useState<any>(null)
  const [hasJoined, setHasJoined] = useState(false)
  const [isCreator, setIsCreator] = useState(false)
  const [isFull, setIsFull] = useState(false)
  const [isPast, setIsPast] = useState(false)
  const [joining, setJoining] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null)

  useEffect(() => {
    if (id) {
      loadData()
    }
  }, [id])

  const loadData = async () => {
    setLoading(true)
    setError('')
    setMessage(null)

    try {
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)

      // Get session details
      const { data: sessionData, error: sessionError } = await supabase
        .from('sports_sessions')
        .select('*')
        .eq('id', id)
        .single()

      if (sessionError) throw sessionError
      if (!sessionData) {
        setError('Session not found')
        setLoading(false)
        return
      }

      setSession(sessionData)

      // Check if session is in the past
      const today = new Date().toISOString().split('T')[0]
      setIsPast(sessionData.session_date < today)

      // Check if user is creator
      if (currentUser) {
        setIsCreator(sessionData.created_by === currentUser.id)
      }

      // Get participants with user details
      const { data: participantsData, error: participantsError } = await supabase
        .from('session_participants')
        .select('*, users(full_name, id)')
        .eq('session_id', id)

      if (participantsError) throw participantsError
      setParticipants(participantsData || [])

      // Check if current user has joined
      if (currentUser && participantsData) {
        const joined = participantsData.some((p: any) => p.user_id === currentUser.id)
        setHasJoined(joined)
      }

      // Check if session is full
      const participantCount = participantsData?.length || 0
      setIsFull(participantCount >= sessionData.max_participants)

    } catch (err: any) {
      setError(err.message || 'Failed to load session')
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!user) {
      setMessage({ text: '⚠️ Please login first', type: 'error' })
      return
    }

    if (isCreator) {
      setMessage({ text: '👑 You cannot join your own session', type: 'error' })
      return
    }

    if (isFull) {
      setMessage({ text: '🔴 This session is full!', type: 'error' })
      return
    }

    if (hasJoined) {
      setMessage({ text: '✅ You already joined this session', type: 'info' })
      return
    }

    if (isPast) {
      setMessage({ text: '⚠️ This session has already passed', type: 'error' })
      return
    }

    setJoining(true)
    setMessage(null)

    const { error } = await supabase
      .from('session_participants')
      .insert({
        session_id: id,
        user_id: user.id
      })

    if (error) {
      setMessage({ text: '❌ Failed to join: ' + error.message, type: 'error' })
    } else {
      setMessage({ text: '✅ You have joined the session!', type: 'success' })
      await loadData()
    }

    setJoining(false)
  }

  const handleLeave = async () => {
    if (!user) return

    if (!window.confirm('Are you sure you want to leave this session?')) {
      return
    }

    setLeaving(true)
    setMessage(null)

    const { error } = await supabase
      .from('session_participants')
      .delete()
      .eq('session_id', id)
      .eq('user_id', user.id)

    if (error) {
      setMessage({ text: '❌ Failed to leave: ' + error.message, type: 'error' })
    } else {
      setMessage({ text: '✅ You have left the session', type: 'success' })
      await loadData()
    }

    setLeaving(false)
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a0a0a',
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
          <p style={{ color: '#666' }}>Loading session...</p>
        </div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ fontSize: '48px' }}>🔍</div>
        <h2 style={{ color: '#888' }}>Session Not Found</h2>
        <p style={{ color: '#555' }}>{error || 'The session you are looking for does not exist.'}</p>
        <Link
          to="/browse-sessions"
          style={{
            padding: '10px 24px',
            background: '#c8a200',
            color: '#0a0a0a',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 'bold'
          }}
        >
          ← Back to Sessions
        </Link>
      </div>
    )
  }

  const participantCount = participants.length
  const availableSpots = session.max_participants - participantCount

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0D0D0F',
      color: 'white',
      padding: '24px',
      position: 'relative'
    }}>
      {/* Ambient Background */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: 'radial-gradient(ellipse 70% 45% at 50% -5%, rgba(200,162,0,0.05) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Back Button */}
        <Link
          to="/browse-sessions"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: '#c8a200',
            textDecoration: 'none',
            marginBottom: '24px',
            fontWeight: '500',
            transition: 'color 0.3s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#FFD700'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#c8a200'}
        >
          ← Back to Sessions
        </Link>

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

        {/* Main Card */}
        <div style={{
          background: 'rgba(13,13,13,0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid #c8a20020',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '24px'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '16px'
          }}>
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap',
                marginBottom: '8px'
              }}>
                <h1 style={{
                  fontSize: 'clamp(24px, 4vw, 32px)',
                  fontWeight: 'bold',
                  color: '#FFD700'
                }}>
                  {session.sport_type}
                </h1>
                {isCreator && (
                  <span style={{
                    background: '#c8a20020',
                    color: '#c8a200',
                    padding: '2px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    👑 Creator
                  </span>
                )}
                {isPast && (
                  <span style={{
                    background: '#ff444420',
                    color: '#ff4444',
                    padding: '2px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    📅 Past
                  </span>
                )}
                {isFull && !isPast && (
                  <span style={{
                    background: '#ff444420',
                    color: '#ff4444',
                    padding: '2px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    🔴 Full
                  </span>
                )}
                {hasJoined && !isPast && (
                  <span style={{
                    background: '#52c07a20',
                    color: '#52c07a',
                    padding: '2px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    ✅ Joined
                  </span>
                )}
              </div>
              <div style={{ color: '#666', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <p>📅 {session.session_date}</p>
                <p>⏰ {session.session_time.substring(0, 5)}</p>
                <p>📍 {session.location}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '140px' }}>
              {!isPast && !isCreator && !hasJoined && !isFull && (
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  style={{
                    padding: '12px 24px',
                    background: joining ? '#666' : '#c8a200',
                    color: joining ? '#444' : '#0a0a0a',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    cursor: joining ? 'default' : 'pointer',
                    transition: 'all 0.3s',
                    width: '100%'
                  }}
                >
                  {joining ? '⏳ Joining...' : 'Join Session'}
                </button>
              )}

              {!isPast && hasJoined && (
                <button
                  onClick={handleLeave}
                  disabled={leaving}
                  style={{
                    padding: '12px 24px',
                    background: 'transparent',
                    color: '#ff4444',
                    border: '1px solid #ff4444',
                    borderRadius: '10px',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    cursor: leaving ? 'default' : 'pointer',
                    transition: 'all 0.3s',
                    width: '100%'
                  }}
                >
                  {leaving ? '⏳ Leaving...' : 'Leave Session'}
                </button>
              )}

              {isPast && (
                <span style={{
                  color: '#666',
                  fontSize: '14px',
                  textAlign: 'center'
                }}>
                  ⏳ Session Ended
                </span>
              )}

              {isFull && !hasJoined && !isPast && !isCreator && (
                <span style={{
                  color: '#ff4444',
                  fontSize: '14px',
                  textAlign: 'center',
                  fontWeight: 'bold'
                }}>
                  🔴 Session Full
                </span>
              )}

              {isCreator && !isPast && (
                <span style={{
                  color: '#c8a200',
                  fontSize: '14px',
                  textAlign: 'center',
                  fontWeight: 'bold'
                }}>
                  👑 You are the creator
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          {session.description && (
            <div style={{
              borderTop: '1px solid rgba(255,255,255,0.05)',
              paddingTop: '16px',
              marginTop: '16px'
            }}>
              <h3 style={{ color: '#c8a200', fontSize: '14px', marginBottom: '8px' }}>📝 Description</h3>
              <p style={{ color: '#aaa', lineHeight: '1.6' }}>{session.description}</p>
            </div>
          )}

          {/* WhatsApp Link */}
          {session.whatsapp_link && (
            <div style={{
              borderTop: '1px solid rgba(255,255,255,0.05)',
              paddingTop: '16px',
              marginTop: '16px'
            }}>
              <h3 style={{ color: '#c8a200', fontSize: '14px', marginBottom: '8px' }}>💬 WhatsApp Group</h3>
              <a
                href={session.whatsapp_link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#25D366',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  background: 'rgba(37,211,102,0.1)',
                  borderRadius: '8px',
                  border: '1px solid rgba(37,211,102,0.2)',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(37,211,102,0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(37,211,102,0.1)'
                }}
              >
                💬 Join WhatsApp Group
              </a>
            </div>
          )}
        </div>

        {/* Participants Section */}
        <div style={{
          background: 'rgba(13,13,13,0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid #c8a20020',
          borderRadius: '16px',
          padding: '24px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <h2 style={{ color: '#FFD700', fontSize: '18px' }}>
              👥 Participants
            </h2>
            <span style={{
              color: '#888',
              fontSize: '13px'
            }}>
              {participantCount} / {session.max_participants} players
            </span>
          </div>

          {/* Progress bar */}
          <div style={{
            width: '100%',
            height: '6px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '3px',
            marginBottom: '16px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${(participantCount / session.max_participants) * 100}%`,
              height: '100%',
              background: isFull
                ? 'linear-gradient(to right, #ef4444, #dc2626)'
                : 'linear-gradient(to right, #c8a200, #FFD700)',
              borderRadius: '3px',
              transition: 'width 0.5s ease'
            }} />
          </div>

          {/* Participant list */}
          {participants.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: '#666',
              padding: '20px'
            }}>
              No participants yet. Be the first to join!
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '8px'
            }}>
              {participants.map((p: any) => {
                const isCurrentUser = p.user_id === user?.id
                const isCreatorOfSession = p.user_id === session.created_by

                return (
                  <div
                    key={p.user_id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      background: isCurrentUser
                        ? 'rgba(200,162,0,0.1)'
                        : 'rgba(255,255,255,0.03)',
                      borderRadius: '8px',
                      border: isCurrentUser
                        ? '1px solid rgba(200,162,0,0.3)'
                        : '1px solid rgba(255,255,255,0.05)'
                    }}
                  >
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: isCreatorOfSession
                        ? 'linear-gradient(135deg, #c8a200, #FFD700)'
                        : 'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: isCreatorOfSession ? '#0a0a0a' : '#888',
                      flexShrink: 0
                    }}>
                      {p.users?.full_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: isCurrentUser ? 'bold' : 'normal',
                        color: isCurrentUser ? '#FFD700' : '#ddd'
                      }}>
                        {p.users?.full_name || 'Unknown User'}
                        {isCurrentUser && ' (You)'}
                      </div>
                      <div style={{
                        fontSize: '10px',
                        color: isCreatorOfSession ? '#c8a200' : '#555'
                      }}>
                        {isCreatorOfSession ? '👑 Creator' : 'Player'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Available spots */}
          {!isPast && !isFull && (
            <div style={{
              marginTop: '16px',
              padding: '10px 16px',
              background: 'rgba(34,197,94,0.08)',
              border: '1px solid rgba(34,197,94,0.2)',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <span style={{ color: '#4ade80', fontSize: '13px' }}>
                🟢 {availableSpots} spot{availableSpots > 1 ? 's' : ''} available
              </span>
            </div>
          )}

          {isFull && !isPast && (
            <div style={{
              marginTop: '16px',
              padding: '10px 16px',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <span style={{ color: '#f87171', fontSize: '13px' }}>
                🔴 This session is full
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}