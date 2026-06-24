import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabaseClient'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  is_read: boolean
  data: any
  created_at: string
}

export const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadNotifications()
    
    // Subscribe to new notifications
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications' 
        },
        (payload: any) => {
          const newNotification = payload.new as Notification
          setNotifications(prev => [newNotification, ...prev])
          setUnreadCount(prev => prev + 1)
        }
      )
      .subscribe()

    // Click outside to close
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      subscription.unsubscribe()
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const loadNotifications = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Error loading notifications:', error)
      setLoading(false)
      return
    }

    if (data) {
      setNotifications(data)
      // ─── FIX: Explicitly type the parameter in filter ──────────────
      const unread = data.filter((notification: Notification) => !notification.is_read)
      setUnreadCount(unread.length)
    }
    setLoading(false)
  }

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
    
    if (error) {
      console.error('Error marking as read:', error)
      return
    }

    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = async () => {
    const unreadIds = notifications
      .filter((n: Notification) => !n.is_read)
      .map((n: Notification) => n.id)
    
    if (unreadIds.length === 0) return

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', unreadIds)
    
    if (error) {
      console.error('Error marking all as read:', error)
      return
    }

    setNotifications(prev => 
      prev.map(n => ({ ...n, is_read: true }))
    )
    setUnreadCount(0)
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago'
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago'
    if (diff < 604800000) return Math.floor(diff / 86400000) + 'd ago'
    return date.toLocaleDateString()
  }

  const getIcon = (type: string) => {
    switch(type) {
      case 'order': return '🛒'
      case 'payment': return '💰'
      case 'sold': return '✅'
      case 'cancelled': return '❌'
      case 'warning': return '⚠️'
      default: return '📬'
    }
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          padding: '8px',
          background: 'transparent',
          border: 'none',
          color: '#888',
          cursor: 'pointer',
          fontSize: '20px',
          transition: 'color 0.3s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = '#FFD700'}
        onMouseLeave={(e) => e.currentTarget.style.color = '#888'}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '0',
            right: '0',
            minWidth: '16px',
            height: '16px',
            borderRadius: '50%',
            background: '#ef4444',
            color: 'white',
            fontSize: '9px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: '0',
          width: '380px',
          maxHeight: '420px',
          background: 'rgba(13,13,13,0.98)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(200,162,0,0.15)',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
          overflow: 'hidden',
          zIndex: 100
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.05)'
          }}>
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: '14px' }}>
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  padding: '4px 12px',
                  background: 'rgba(200,162,0,0.1)',
                  border: '1px solid rgba(200,162,0,0.2)',
                  borderRadius: '6px',
                  color: '#c8a200',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          <div style={{
            maxHeight: '350px',
            overflow: 'auto',
            padding: '4px 0'
          }}>
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#444' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  style={{
                    padding: '10px 14px',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    background: n.is_read ? 'transparent' : 'rgba(200,162,0,0.04)',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = n.is_read ? 'transparent' : 'rgba(200,162,0,0.04)'}
                >
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '20px' }}>{getIcon(n.type)}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{
                          color: 'white',
                          fontWeight: n.is_read ? 'normal' : 'bold',
                          fontSize: '13px'
                        }}>
                          {n.title}
                        </span>
                        <span style={{
                          color: '#4b5563',
                          fontSize: '10px'
                        }}>
                          {formatTime(n.created_at)}
                        </span>
                      </div>
                      <p style={{
                        color: '#888',
                        fontSize: '12px',
                        margin: '2px 0 0'
                      }}>
                        {n.message}
                      </p>
                      {!n.is_read && (
                        <span style={{
                          display: 'inline-block',
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: '#c8a200',
                          marginTop: '4px'
                        }} />
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}