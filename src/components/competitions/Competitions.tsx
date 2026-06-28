// src/components/tournaments/TournamentDetail.tsx
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

interface Team {
  id: string
  name: string
  points: number
  matches_played: number
  wins: number
  draws: number
  losses: number
  group_name: string
}

interface Match {
  id: string
  team1_id: string
  team2_id: string
  team1_score: number
  team2_score: number
  group_name: string
  match_number: number
  status: string
  team1?: { name: string }
  team2?: { name: string }
  winner_id?: string
}

export const TournamentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tournament, setTournament] = useState<any>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [standings, setStandings] = useState<any[]>([])
  const [showScoreModal, setShowScoreModal] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [score1, setScore1] = useState('')
  const [score2, setScore2] = useState('')
  const [user, setUser] = useState<any>(null)
  const [isCreator, setIsCreator] = useState(false)

  useEffect(() => {
    checkUser()
    loadData()
  }, [id])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const loadData = async () => {
    if (!id) return

    // Load tournament
    const { data: tournData } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', id)
      .single()
    setTournament(tournData)
    setIsCreator(tournData?.created_by === user?.id)

    // Load teams
    const { data: teamData } = await supabase
      .from('tournament_teams')
      .select('*')
      .eq('tournament_id', id)
    setTeams(teamData || [])

    // Load matches with team names
    const { data: matchData } = await supabase
      .from('tournament_matches')
      .select('*, team1:team1_id(name), team2:team2_id(name)')
      .eq('tournament_id', id)
      .order('match_number', { ascending: true })
    setMatches(matchData || [])

    // Calculate standings
    calculateStandings(teamData || [], matchData || [])

    setLoading(false)
  }

  const calculateStandings = (teamsList: Team[], matchesList: Match[]) => {
    const standingsMap: Record<string, any> = {}
    
    teamsList.forEach(team => {
      standingsMap[team.id] = {
        ...team,
        points: 0,
        matches_played: 0,
        wins: 0,
        draws: 0,
        losses: 0
      }
    })

    matchesList.forEach(match => {
      if (match.status === 'completed' && match.team1_score !== undefined) {
        const team1 = standingsMap[match.team1_id]
        const team2 = standingsMap[match.team2_id]
        
        if (team1 && team2) {
          team1.matches_played++
          team2.matches_played++
          
          if (match.team1_score > match.team2_score) {
            team1.wins++
            team1.points += 2
            team2.losses++
          } else if (match.team2_score > match.team1_score) {
            team2.wins++
            team2.points += 2
            team1.losses++
          } else {
            team1.draws++
            team1.points += 1
            team2.draws++
            team2.points += 1
          }
        }
      }
    })

    const sortedStandings = Object.values(standingsMap).sort((a, b) => {
      if (a.points !== b.points) return b.points - a.points
      return (b.wins - b.losses) - (a.wins - a.losses)
    })

    setStandings(sortedStandings)
  }

  const updateMatchScore = async () => {
    if (!selectedMatch || !score1 || !score2) return

    const s1 = parseInt(score1)
    const s2 = parseInt(score2)

    await supabase
      .from('tournament_matches')
      .update({
        team1_score: s1,
        team2_score: s2,
        status: 'completed',
        winner_id: s1 > s2 ? selectedMatch.team1_id : s2 > s1 ? selectedMatch.team2_id : null
      })
      .eq('id', selectedMatch.id)

    setShowScoreModal(false)
    setSelectedMatch(null)
    setScore1('')
    setScore2('')
    loadData()
  }

  const openScoreModal = (match: Match) => {
    setSelectedMatch(match)
    setShowScoreModal(true)
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
          <p style={{ color: '#666' }}>Loading tournament...</p>
        </div>
      </div>
    )
  }

  if (!tournament) {
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
        <h2 style={{ color: '#888' }}>Tournament not found</h2>
        <button
          onClick={() => navigate('/competitions')}
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
          ← Back to Tournaments
        </button>
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
        <button
          onClick={() => navigate('/competitions')}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#6b7280',
            fontSize: '14px',
            cursor: 'pointer',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          ← Back to Tournaments
        </button>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1 style={{ color: '#FFD700', fontSize: '32px' }}>{tournament.name}</h1>
              <p style={{ color: '#6b7280' }}>
                {tournament.sport_type} • {tournament.venue || 'TBD'} • {tournament.start_date} to {tournament.end_date}
              </p>
            </div>
            {isCreator && (
              <span style={{
                padding: '4px 16px',
                borderRadius: '99px',
                background: 'rgba(200,162,0,0.1)',
                border: '1px solid rgba(200,162,0,0.2)',
                color: '#c8a200',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                👑 Tournament Creator
              </span>
            )}
          </div>
        </div>

        {/* ─── Standings ─── */}
        <div style={{
          background: 'rgba(16,16,22,0.95)',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.05)',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <h3 style={{ color: '#FFD700', marginBottom: '16px' }}>📊 Standings</h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '40px 1fr 60px 50px 50px 50px 50px',
            padding: '10px 12px',
            background: 'rgba(200,162,0,0.05)',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#6b7280',
            fontWeight: 'bold',
            gap: '8px',
            marginBottom: '8px'
          }}>
            <span>#</span>
            <span>Team</span>
            <span>P</span>
            <span>W</span>
            <span>D</span>
            <span>L</span>
            <span style={{ color: '#FFD700' }}>Pts</span>
          </div>

          {standings.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#4b5563', padding: '20px' }}>
              No teams added yet
            </div>
          ) : (
            standings.map((team, index) => (
              <div
                key={team.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 1fr 60px 50px 50px 50px 50px',
                  padding: '8px 12px',
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  color: '#ddd',
                  background: index < 2 ? 'rgba(200,162,0,0.05)' : 'transparent'
                }}
              >
                <span style={{ color: index < 2 ? '#FFD700' : '#4b5563' }}>{index + 1}</span>
                <span style={{ fontWeight: index < 2 ? 'bold' : 'normal' }}>{team.name}</span>
                <span>{team.matches_played}</span>
                <span style={{ color: '#4ade80' }}>{team.wins}</span>
                <span style={{ color: '#eab308' }}>{team.draws}</span>
                <span style={{ color: '#f87171' }}>{team.losses}</span>
                <span style={{ color: '#FFD700', fontWeight: 'bold' }}>{team.points}</span>
              </div>
            ))
          )}

          <div style={{
            marginTop: '12px',
            padding: '8px 12px',
            background: 'rgba(200,162,0,0.05)',
            borderRadius: '6px',
            fontSize: '11px',
            color: '#6b7280'
          }}>
            ⭐ Top teams qualify for semifinals • Points: Win=2, Draw=1, Loss=0
          </div>
        </div>

        {/* ─── Matches ─── */}
        <div style={{
          background: 'rgba(16,16,22,0.95)',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.05)',
          padding: '20px'
        }}>
          <h3 style={{ color: '#FFD700', marginBottom: '16px' }}>📋 Matches</h3>
          
          {matches.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#4b5563', padding: '20px' }}>
              No matches scheduled yet
            </div>
          ) : (
            matches.map((match) => (
              <div
                key={match.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                  cursor: match.status !== 'completed' && isCreator ? 'pointer' : 'default'
                }}
                onClick={() => {
                  if (match.status !== 'completed' && isCreator) {
                    openScoreModal(match)
                  }
                }}
              >
                <span style={{ color: '#4b5563', minWidth: '40px' }}>#{match.match_number}</span>
                {match.group_name && (
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'rgba(200,162,0,0.1)',
                    color: '#c8a200',
                    fontSize: '11px',
                    minWidth: '70px'
                  }}>
                    {match.group_name}
                  </span>
                )}
                <span style={{ flex: 1 }}>
                  {match.team1?.name} vs {match.team2?.name}
                </span>
                {match.status === 'completed' ? (
                  <span style={{ color: '#FFD700' }}>
                    {match.team1_score} - {match.team2_score}
                  </span>
                ) : (
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '4px',
                    background: isCreator ? 'rgba(200,162,0,0.1)' : 'rgba(255,255,255,0.03)',
                    color: isCreator ? '#c8a200' : '#4b5563',
                    fontSize: '12px',
                    cursor: isCreator ? 'pointer' : 'default'
                  }}>
                    {isCreator ? '✏️ Add Score' : '⏳ Pending'}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ─── Score Modal ─── */}
      {showScoreModal && selectedMatch && (
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
            border: '1px solid rgba(200,162,0,0.2)',
            maxWidth: '450px',
            width: '100%',
            padding: '32px'
          }}>
            <h3 style={{ color: '#FFD700', marginBottom: '16px' }}>Enter Match Score</h3>
            <p style={{ color: '#6b7280', marginBottom: '16px' }}>
              {selectedMatch.team1?.name} vs {selectedMatch.team2?.name}
            </p>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ color: '#aaa', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                  {selectedMatch.team1?.name}
                </label>
                <input
                  type="number"
                  value={score1}
                  onChange={(e) => setScore1(e.target.value)}
                  min="0"
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '20px',
                    textAlign: 'center',
                    outline: 'none'
                  }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', color: '#6b7280', fontSize: '24px' }}>vs</div>
              <div style={{ flex: 1 }}>
                <label style={{ color: '#aaa', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                  {selectedMatch.team2?.name}
                </label>
                <input
                  type="number"
                  value={score2}
                  onChange={(e) => setScore2(e.target.value)}
                  min="0"
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '20px',
                    textAlign: 'center',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowScoreModal(false)}
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
                onClick={updateMatchScore}
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
                ✅ Update Score
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