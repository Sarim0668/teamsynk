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
  winner?: { name: string }
}

type ResultType = 'team1_win' | 'team2_win' | 'draw'

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
  const [selectedResult, setSelectedResult] = useState<ResultType>('draw')
  const [user, setUser] = useState<any>(null)
  const [isCreator, setIsCreator] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  useEffect(() => {
    if (id) {
      loadData()
    }
  }, [id])

  const loadData = async () => {
    if (!id) return

    const { data: { user: currentUser } } = await supabase.auth.getUser()
    setUser(currentUser)

    // Load tournament
    const { data: tournData } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', id)
      .single()
    setTournament(tournData)
    setIsCreator(tournData?.created_by === currentUser?.id)
    setIsCompleted(tournData?.status === 'completed')

    // Load teams
    const { data: teamData } = await supabase
      .from('tournament_teams')
      .select('*')
      .eq('tournament_id', id)
    setTeams(teamData || [])

    // Load matches with team names
    const { data: matchData } = await supabase
      .from('tournament_matches')
      .select('*, team1:team1_id(name), team2:team2_id(name), winner:winner_id(name)')
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
      if (match.status === 'completed' && match.winner_id) {
        const team1 = standingsMap[match.team1_id]
        const team2 = standingsMap[match.team2_id]
        
        if (team1 && team2) {
          team1.matches_played++
          team2.matches_played++
          
          if (match.winner_id === match.team1_id) {
            team1.wins++
            team1.points += 2
            team2.losses++
          } else if (match.winner_id === match.team2_id) {
            team2.wins++
            team2.points += 2
            team1.losses++
          } else {
            // Draw
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

  const updateMatchResult = async () => {
    if (!selectedMatch || !id) return

    let winnerId = null
    let team1Score = 0
    let team2Score = 0

    if (selectedResult === 'team1_win') {
      winnerId = selectedMatch.team1_id
      team1Score = 1
      team2Score = 0
    } else if (selectedResult === 'team2_win') {
      winnerId = selectedMatch.team2_id
      team1Score = 0
      team2Score = 1
    } else {
      // Draw
      winnerId = null
      team1Score = 0
      team2Score = 0
    }

    const { error } = await supabase
      .from('tournament_matches')
      .update({
        team1_score: team1Score,
        team2_score: team2Score,
        status: 'completed',
        winner_id: winnerId
      })
      .eq('id', selectedMatch.id)

    if (error) {
      alert('Failed to update result: ' + error.message)
    } else {
      setShowScoreModal(false)
      setSelectedMatch(null)
      setSelectedResult('draw')
      await loadData()
      
      // Check if all matches are completed
      await checkAndCompleteTournament()
    }
  }

  const checkAndCompleteTournament = async () => {
    if (!id) return

    // Get all matches for this tournament
    const { data: allMatches } = await supabase
      .from('tournament_matches')
      .select('status')
      .eq('tournament_id', id)

    if (allMatches && allMatches.every(m => m.status === 'completed')) {
      // All matches completed - mark tournament as completed
      const { error } = await supabase
        .from('tournaments')
        .update({ status: 'completed' })
        .eq('id', id)

      if (!error) {
        setIsCompleted(true)
        alert('🏆 Tournament completed! All matches have been played.')
        // Clean up - delete tournament data after 30 days
        scheduleTournamentCleanup(id)
      }
    }
  }

  const scheduleTournamentCleanup = (tournamentId: string) => {
    // Delete tournament after 30 days
    const cleanupDate = new Date()
    cleanupDate.setDate(cleanupDate.getDate() + 30)
    
    // Store cleanup schedule in localStorage (or you can use a cron job)
    const cleanupJobs = JSON.parse(localStorage.getItem('tournament_cleanup') || '{}')
    cleanupJobs[tournamentId] = cleanupDate.toISOString()
    localStorage.setItem('tournament_cleanup', JSON.stringify(cleanupJobs))
    
    console.log(`🧹 Tournament ${tournamentId} scheduled for cleanup on ${cleanupDate}`)
  }

  // Run cleanup check on mount
  useEffect(() => {
    const cleanupJobs = JSON.parse(localStorage.getItem('tournament_cleanup') || '{}')
    const now = new Date()
    
    Object.entries(cleanupJobs).forEach(async ([tournamentId, cleanupDate]) => {
      if (new Date(cleanupDate as string) < now) {
        // Delete tournament
        await supabase.from('tournaments').delete().eq('id', tournamentId)
        delete cleanupJobs[tournamentId]
        localStorage.setItem('tournament_cleanup', JSON.stringify(cleanupJobs))
        console.log(`🗑️ Tournament ${tournamentId} cleaned up`)
      }
    })
  }, [])

  const openScoreModal = (match: Match) => {
    setSelectedMatch(match)
    setSelectedResult('draw')
    setShowScoreModal(true)
  }

  const getMatchResult = (match: Match) => {
    if (match.status !== 'completed' || !match.winner_id) {
      return <span style={{ color: '#4b5563' }}>⏳ Pending</span>
    }
    
    if (match.winner_id === match.team1_id) {
      return <span style={{ color: '#4ade80', fontWeight: 'bold' }}>🏆 {match.team1?.name} wins</span>
    } else if (match.winner_id === match.team2_id) {
      return <span style={{ color: '#4ade80', fontWeight: 'bold' }}>🏆 {match.team2?.name} wins</span>
    } else {
      return <span style={{ color: '#eab308', fontWeight: 'bold' }}>🤝 Draw</span>
    }
  }

  const getGroupStandings = (groupName: string) => {
    return standings.filter(t => t.group_name === groupName)
  }

  // Get unique groups
  const groups = [...new Set(teams.map(t => t.group_name).filter(Boolean))]

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
          onClick={() => navigate('/tournaments')}
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
        {/* ─── Back Button ─── */}
        <button
          onClick={() => navigate('/tournaments')}
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

        {/* ─── Header ─── */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1 style={{ color: isCompleted ? '#6b7280' : '#FFD700', fontSize: '32px' }}>
                {tournament.name}
                {isCompleted && <span style={{ fontSize: '16px', marginLeft: '12px', color: '#6b7280' }}>✅ Completed</span>}
              </h1>
              <p style={{ color: '#6b7280' }}>
                {tournament.sport_type} • {tournament.venue || 'TBD'} • {tournament.start_date} to {tournament.end_date}
              </p>
            </div>
            {isCreator && !isCompleted && (
              <span style={{
                padding: '6px 16px',
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
          
          {standings.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#4b5563', padding: '20px' }}>
              No teams added yet
            </div>
          ) : (
            <>
              {groups.length > 0 ? (
                // Group-wise standings
                groups.map(group => (
                  <div key={group} style={{ marginBottom: '16px' }}>
                    <h4 style={{ color: '#c8a200', fontSize: '14px', marginBottom: '8px' }}>🏷️ {group}</h4>
                    <StandingsTable standings={getGroupStandings(group)} />
                  </div>
                ))
              ) : (
                <StandingsTable standings={standings} />
              )}
            </>
          )}

          <div style={{
            marginTop: '12px',
            padding: '8px 12px',
            background: 'rgba(200,162,0,0.05)',
            borderRadius: '6px',
            fontSize: '11px',
            color: '#6b7280'
          }}>
            ⭐ Points: Win=2, Draw=1, Loss=0 • Top teams qualify for next round
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
                  cursor: match.status !== 'completed' && isCreator && !isCompleted ? 'pointer' : 'default',
                  opacity: match.status === 'completed' ? 0.8 : 1
                }}
                onClick={() => {
                  if (match.status !== 'completed' && isCreator && !isCompleted) {
                    openScoreModal(match)
                  }
                }}
              >
                <span style={{ color: '#4b5563', minWidth: '40px', fontSize: '13px' }}>
                  #{match.match_number}
                </span>
                {match.group_name && (
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'rgba(200,162,0,0.1)',
                    color: '#c8a200',
                    fontSize: '11px',
                    minWidth: '70px',
                    textAlign: 'center'
                  }}>
                    {match.group_name}
                  </span>
                )}
                <span style={{ flex: 1, fontSize: '14px' }}>
                  {match.team1?.name} vs {match.team2?.name}
                </span>
                {match.status === 'completed' ? (
                  getMatchResult(match)
                ) : (
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '6px',
                    background: isCreator && !isCompleted ? 'rgba(200,162,0,0.1)' : 'rgba(255,255,255,0.03)',
                    color: isCreator && !isCompleted ? '#c8a200' : '#4b5563',
                    fontSize: '12px',
                    cursor: isCreator && !isCompleted ? 'pointer' : 'default'
                  }}>
                    {isCreator && !isCompleted ? '✏️ Add Result' : '⏳ Pending'}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ─── Result Modal ─── */}
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
            <h3 style={{ color: '#FFD700', marginBottom: '16px' }}>Match Result</h3>
            <p style={{ color: '#6b7280', marginBottom: '16px' }}>
              {selectedMatch.team1?.name} vs {selectedMatch.team2?.name}
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <button
                onClick={() => setSelectedResult('team1_win')}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  background: selectedResult === 'team1_win' ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${selectedResult === 'team1_win' ? 'rgba(74,222,128,0.4)' : 'rgba(255,255,255,0.05)'}`,
                  color: selectedResult === 'team1_win' ? '#4ade80' : 'white',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: selectedResult === 'team1_win' ? 'bold' : 'normal'
                }}
              >
                🏆 {selectedMatch.team1?.name} Wins
              </button>
              
              <button
                onClick={() => setSelectedResult('team2_win')}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  background: selectedResult === 'team2_win' ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${selectedResult === 'team2_win' ? 'rgba(74,222,128,0.4)' : 'rgba(255,255,255,0.05)'}`,
                  color: selectedResult === 'team2_win' ? '#4ade80' : 'white',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: selectedResult === 'team2_win' ? 'bold' : 'normal'
                }}
              >
                🏆 {selectedMatch.team2?.name} Wins
              </button>
              
              <button
                onClick={() => setSelectedResult('draw')}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  background: selectedResult === 'draw' ? 'rgba(234,179,8,0.15)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${selectedResult === 'draw' ? 'rgba(234,179,8,0.4)' : 'rgba(255,255,255,0.05)'}`,
                  color: selectedResult === 'draw' ? '#eab308' : 'white',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: selectedResult === 'draw' ? 'bold' : 'normal'
                }}
              >
                🤝 Draw
              </button>
            </div>

            <div style={{
              padding: '8px 12px',
              background: 'rgba(200,162,0,0.05)',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#6b7280',
              marginBottom: '16px'
            }}>
              {selectedResult === 'team1_win' && `✅ ${selectedMatch.team1?.name} gets 2 points`}
              {selectedResult === 'team2_win' && `✅ ${selectedMatch.team2?.name} gets 2 points`}
              {selectedResult === 'draw' && `🤝 Both teams get 1 point each`}
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
                onClick={updateMatchResult}
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
                ✅ Update Result
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

// ─── Standings Table Component ──────────────────────────────────────────────
const StandingsTable: React.FC<{ standings: any[] }> = ({ standings }) => {
  if (standings.length === 0) {
    return <div style={{ textAlign: 'center', color: '#4b5563', padding: '10px' }}>No teams in this group</div>
  }

  return (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '30px 1fr 35px 35px 35px 35px 45px',
        padding: '8px 12px',
        background: 'rgba(200,162,0,0.05)',
        borderRadius: '8px',
        fontSize: '11px',
        color: '#6b7280',
        fontWeight: 'bold',
        gap: '6px',
        marginBottom: '4px'
      }}>
        <span>#</span>
        <span>Team</span>
        <span>P</span>
        <span>W</span>
        <span>D</span>
        <span>L</span>
        <span style={{ color: '#FFD700' }}>Pts</span>
      </div>

      {standings.map((team, index) => (
        <div
          key={team.id}
          style={{
            display: 'grid',
            gridTemplateColumns: '30px 1fr 35px 35px 35px 35px 45px',
            padding: '6px 12px',
            borderBottom: '1px solid rgba(255,255,255,0.03)',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
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
      ))}
    </>
  )
}