import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

interface Competition {
  id: string
  title: string
  description: string
  subject: string
  date: string
  start_time: string
  end_time: string
  duration_minutes: number
  max_participants: number
  status: 'upcoming' | 'active' | 'completed'
}

export const Competitions: React.FC = () => {
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string>('')
  const [registrations, setRegistrations] = useState<Record<string, boolean>>({})

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    setUser(currentUser)

    if (currentUser) {
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', currentUser.id)
        .single()
      setUserRole(profile?.role || '')
    }

    const { data, error } = await supabase
      .from('competitions')
      .select('*')
      .order('date', { ascending: true })

    if (!error && data) {
      setCompetitions(data)
      
      if (currentUser) {
        const { data: regData } = await supabase
          .from('competition_registrations')
          .select('competition_id')
          .eq('user_id', currentUser.id)
        
        const regMap: Record<string, boolean> = {}
        regData?.forEach(r => { regMap[r.competition_id] = true })
        setRegistrations(regMap)
      }
    }
    setLoading(false)
  }

  const handleRegister = async (competitionId: string) => {
    if (!user) {
      alert('Please login first')
      return
    }

    const { error } = await supabase
      .from('competition_registrations')
      .insert({
        competition_id: competitionId,
        user_id: user.id
      })

    if (error) {
      alert('Registration failed: ' + error.message)
    } else {
      alert('✅ Registered successfully!')
      await loadData()
    }
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
          <p style={{ color: '#666' }}>Loading competitions...</p>
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

      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ color: '#FFD700', fontSize: '28px' }}>🏆 Coding Competitions</h1>
            <p style={{ color: '#666' }}>Test your skills against others</p>
          </div>
          {userRole === 'Admin' && (
            <Link
              to="/create-competition"
              style={{
                padding: '10px 20px',
                background: '#c8a200',
                color: '#0a0a0a',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 'bold'
              }}
            >
              + Create Competition
            </Link>
          )}
        </div>

        {competitions.length === 0 ? (
          <div style={{
            background: 'rgba(13,13,13,0.95)',
            border: '1px solid #c8a20020',
            borderRadius: '16px',
            padding: '60px',
            textAlign: 'center',
            color: '#666'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏟️</div>
            <h3 style={{ color: '#888' }}>No competitions yet</h3>
            <p>Check back later for upcoming events!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {competitions.map((comp) => {
              const isRegistered = registrations[comp.id]
              const isPast = comp.date < new Date().toISOString().split('T')[0]
              const isActive = comp.status === 'active'

              return (
                <div
                  key={comp.id}
                  style={{
                    background: 'rgba(13,13,13,0.95)',
                    border: `1px solid ${
                      isActive ? '#c8a20040' : isPast ? '#444' : '#c8a20020'
                    }`,
                    borderRadius: '16px',
                    padding: '20px',
                    transition: 'all 0.3s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>
                        {comp.title}
                      </h3>
                      <p style={{ color: '#666', fontSize: '13px' }}>{comp.subject}</p>
                    </div>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      background: isActive ? 'rgba(200,162,0,0.15)' :
                                 isPast ? 'rgba(255,68,68,0.15)' :
                                 'rgba(82,192,122,0.15)',
                      color: isActive ? '#c8a200' :
                             isPast ? '#ff4444' :
                             '#52c07a'
                    }}>
                      {isActive ? '🔴 Active' : isPast ? '📅 Past' : '🟢 Upcoming'}
                    </span>
                  </div>

                  <div style={{ margin: '12px 0', color: '#888', fontSize: '13px' }}>
                    <p>📅 {comp.date}</p>
                    <p>⏰ {comp.start_time.substring(0, 5)} - {comp.end_time.substring(0, 5)}</p>
                    <p>⏱️ {comp.duration_minutes} minutes</p>
                    <p>👥 {comp.max_participants} max participants</p>
                  </div>

                  {comp.description && (
                    <p style={{ color: '#666', fontSize: '13px', marginBottom: '12px' }}>
                      {comp.description}
                    </p>
                  )}

                  {!isPast ? (
                    isRegistered ? (
                      <Link
                        to={`/competition/${comp.id}`}
                        style={{
                          display: 'block',
                          textAlign: 'center',
                          padding: '10px',
                          background: '#c8a200',
                          color: '#0a0a0a',
                          borderRadius: '8px',
                          textDecoration: 'none',
                          fontWeight: 'bold'
                        }}
                      >
                        {isActive ? 'Continue' : 'View'}
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleRegister(comp.id)}
                        style={{
                          width: '100%',
                          padding: '10px',
                          background: 'rgba(200,162,0,0.1)',
                          border: '1px solid #c8a200',
                          borderRadius: '8px',
                          color: '#c8a200',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        Register
                      </button>
                    )
                  ) : (
                    <div style={{
                      textAlign: 'center',
                      padding: '10px',
                      color: '#666',
                      fontSize: '13px'
                    }}>
                      📅 Completed
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}