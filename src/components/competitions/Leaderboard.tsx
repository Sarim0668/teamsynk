import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'

export const Leaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCompetition, setSelectedCompetition] = useState<string>('')
  const [competitions, setCompetitions] = useState<any[]>([])

  useEffect(() => {
    loadCompetitions()
  }, [])

  useEffect(() => {
    if (selectedCompetition) {
      loadLeaderboard(selectedCompetition)
    }
  }, [selectedCompetition])

  const loadCompetitions = async () => {
    const { data } = await supabase
      .from('competitions')
      .select('id, title')
      .order('created_at', { ascending: false })
    setCompetitions(data || [])
    if (data && data.length > 0) {
      setSelectedCompetition(data[0].id)
    }
  }

  const loadLeaderboard = async (competitionId: string) => {
    setLoading(true)
    const { data } = await supabase
      .from('competition_leaderboard')
      .select('*')
      .eq('competition_id', competitionId)
      .order('rank', { ascending: true })
    setLeaderboard(data || [])
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0D0D0F',
      color: 'white',
      padding: '24px'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ color: '#FFD700', fontSize: '28px' }}>🏆 Leaderboard</h1>
        <p style={{ color: '#666', marginBottom: '20px' }}>Top performers across all competitions</p>

        <div style={{ marginBottom: '20px' }}>
          <select
            value={selectedCompetition}
            onChange={(e) => setSelectedCompetition(e.target.value)}
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '10px 14px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              outline: 'none'
            }}
          >
            {competitions.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: '#666', padding: '40px' }}>Loading...</div>
        ) : leaderboard.length === 0 ? (
          <div style={{
            background: 'rgba(13,13,13,0.95)',
            border: '1px solid #c8a20020',
            borderRadius: '16px',
            padding: '40px',
            textAlign: 'center',
            color: '#666'
          }}>
            No participants yet
          </div>
        ) : (
          <div style={{
            background: 'rgba(13,13,13,0.95)',
            border: '1px solid #c8a20020',
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '60px 1fr 100px 120px',
              padding: '12px 16px',
              background: 'rgba(200,162,0,0.05)',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              fontSize: '12px',
              color: '#666',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <span>#</span>
              <span>Player</span>
              <span>Score</span>
              <span>Registered</span>
            </div>

            {leaderboard.map((entry, index) => (
              <div
                key={entry.user_id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '60px 1fr 100px 120px',
                  padding: '10px 16px',
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                  alignItems: 'center',
                  background: index < 3 ? 'rgba(200,162,0,0.05)' : 'transparent'
                }}
              >
                <span style={{
                  fontWeight: 'bold',
                  color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#888'
                }}>
                  {entry.rank}
                  {index === 0 && ' 🥇'}
                  {index === 1 && ' 🥈'}
                  {index === 2 && ' 🥉'}
                </span>
                <span style={{ fontWeight: 'bold' }}>{entry.full_name}</span>
                <span style={{ color: '#FFD700' }}>{entry.total_score}</span>
                <span style={{ color: '#666', fontSize: '12px' }}>
                  {new Date(entry.registered_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}