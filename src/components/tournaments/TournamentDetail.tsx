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
  round_type: string
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
  const [showScoreModal, setShowScoreModal] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [selectedResult, setSelectedResult] = useState<ResultType>('draw')
  const [user, setUser] = useState<any>(null)
  const [isCreator, setIsCreator] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [champion, setChampion] = useState<string | null>(null)
  const [groupStandings, setGroupStandings] = useState<Record<string, any[]>>({})
  const [advanceOptions, setAdvanceOptions] = useState<number[]>([1, 2, 3, 4])
  const [showAdvanceModal, setShowAdvanceModal] = useState(false)
  const [selectedAdvanceCount, setSelectedAdvanceCount] = useState<number>(2)
  const [showChampionCelebration, setShowChampionCelebration] = useState(false)

  useEffect(() => {
    if (id) {
      loadData()
    }
  }, [id])

  const loadData = async () => {
    if (!id) return

    const { data: { user: currentUser } } = await supabase.auth.getUser()
    setUser(currentUser)

    const { data: tournData } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', id)
      .single()
    setTournament(tournData)
    setIsCreator(tournData?.created_by === currentUser?.id)
    setIsCompleted(tournData?.status === 'completed')

    const { data: teamData } = await supabase
      .from('tournament_teams')
      .select('*')
      .eq('tournament_id', id)
    setTeams(teamData || [])

    const { data: matchData } = await supabase
      .from('tournament_matches')
      .select('*, team1:team1_id(name), team2:team2_id(name), winner:winner_id(name)')
      .eq('tournament_id', id)
      .order('match_number', { ascending: true })
    setMatches(matchData || [])

    calculateStandings(teamData || [], matchData || [])
    await checkAndAdvanceRound(matchData || [], teamData || [])
    findChampion(matchData || [])

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

    const groupMatches = matchesList.filter(m => m.round_type === 'group')

    groupMatches.forEach(match => {
      if (match.status === 'completed') {
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
            team1.draws++
            team1.points += 1
            team2.draws++
            team2.points += 1
          }
        }
      }
    })

    const grouped: Record<string, any[]> = {}
    Object.values(standingsMap).forEach(team => {
      const group = team.group_name || 'Group A'
      if (!grouped[group]) grouped[group] = []
      grouped[group].push(team)
    })

    Object.keys(grouped).forEach(group => {
      grouped[group].sort((a, b) => {
        if (a.points !== b.points) return b.points - a.points
        return (b.wins - b.losses) - (a.wins - a.losses)
      })
    })

    setGroupStandings(grouped)
  }

  // ─── UPDATED: Check and advance round ──────────────────────────────────────
  const checkAndAdvanceRound = async (matchesList: Match[], teamsList: Team[]) => {
    if (!id) return

    const groupMatches = matchesList.filter(m => m.round_type === 'group')
    const allGroupCompleted = groupMatches.every(m => m.status === 'completed')
    
    const knockoutMatches = matchesList.filter(m => m.round_type === 'knockout')
    const semifinalMatches = matchesList.filter(m => m.round_type === 'semifinal')
    const finalMatches = matchesList.filter(m => m.round_type === 'final')

    if (groupMatches.length === 0) return

    // ─── STEP 1: Group stage complete - ask how many advance ────────────────
    if (allGroupCompleted && knockoutMatches.length === 0 && semifinalMatches.length === 0 && finalMatches.length === 0) {
      let maxTeams = 0
      Object.keys(groupStandings).forEach(group => {
        if (groupStandings[group].length > maxTeams) {
          maxTeams = groupStandings[group].length
        }
      })
      
      const options = []
      for (let i = 1; i <= Math.min(maxTeams, 4); i++) {
        options.push(i)
      }
      setAdvanceOptions(options)
      setSelectedAdvanceCount(options[0] || 2)
      setShowAdvanceModal(true)
      return
    }

    // ─── STEP 2: Check knockout rounds ──────────────────────────────────────
    if (knockoutMatches.length > 0) {
      const allKnockoutComplete = knockoutMatches.every(m => m.status === 'completed')
      if (allKnockoutComplete && semifinalMatches.length === 0) {
        const winners = knockoutMatches
          .filter(m => m.status === 'completed' && m.winner_id)
          .map(m => teams.find(t => t.id === m.winner_id))
          .filter((t): t is Team => t !== undefined)
        
        if (winners.length === 4) {
          await generateSemiFinals(winners)
        } else if (winners.length === 2) {
          await generateFinal(winners)
        } else if (winners.length > 4) {
          await generateKnockoutRoundsFromWinners(winners)
        }
      }
    }

    // ─── STEP 3: Check semi-finals ──────────────────────────────────────────
    if (semifinalMatches.length > 0) {
      const allSemisComplete = semifinalMatches.every(m => m.status === 'completed')
      if (allSemisComplete && finalMatches.length === 0) {
        const winners = semifinalMatches
          .filter(m => m.status === 'completed' && m.winner_id)
          .map(m => teams.find(t => t.id === m.winner_id))
          .filter((t): t is Team => t !== undefined)
        
        if (winners.length >= 2) {
          await generateFinal(winners)
        }
      }
    }
  }

  // ─── Generate Semi-Finals directly ────────────────────────────────────────
  const generateSemiFinals = async (qualifiedTeams: any[]) => {
    if (!id) return

    if (qualifiedTeams.length < 4) {
      alert('Not enough teams for semi-finals!')
      return
    }

    const shuffled = [...qualifiedTeams].sort(() => Math.random() - 0.5)
    const matchesToCreate: any[] = []
    let matchNumber = matches.length + 1

    matchesToCreate.push({
      team1: shuffled[0],
      team2: shuffled[3],
      round_type: 'semifinal',
      match_number: matchNumber++,
      group_name: 'Semi-Final 1'
    })

    matchesToCreate.push({
      team1: shuffled[1],
      team2: shuffled[2],
      round_type: 'semifinal',
      match_number: matchNumber++,
      group_name: 'Semi-Final 2'
    })

    for (const match of matchesToCreate) {
      await supabase
        .from('tournament_matches')
        .insert({
          tournament_id: id,
          team1_id: match.team1.id,
          team2_id: match.team2.id,
          group_name: match.group_name,
          match_number: match.match_number,
          round_type: match.round_type,
          status: 'scheduled'
        })
    }

    await loadData()
  }

  // ─── Generate Final directly ──────────────────────────────────────────────
  const generateFinal = async (qualifiedTeams: any[]) => {
    if (!id) return

    if (qualifiedTeams.length < 2) {
      alert('Not enough teams for final!')
      return
    }

    const shuffled = [...qualifiedTeams].sort(() => Math.random() - 0.5)
    const matchNumber = matches.length + 1

    await supabase
      .from('tournament_matches')
      .insert({
        tournament_id: id,
        team1_id: shuffled[0].id,
        team2_id: shuffled[1].id,
        group_name: 'Final',
        match_number: matchNumber,
        round_type: 'final',
        status: 'scheduled'
      })

    await loadData()
  }

  // ─── Generate Knockout Rounds ─────────────────────────────────────────────
  const generateKnockoutRounds = async (advanceCount: number) => {
    if (!id) return

    const qualifiedTeams: any[] = []
    Object.keys(groupStandings).forEach(group => {
      const topTeams = groupStandings[group].slice(0, advanceCount)
      qualifiedTeams.push(...topTeams)
    })

    if (qualifiedTeams.length === 4) {
      await generateSemiFinals(qualifiedTeams)
      return
    }

    if (qualifiedTeams.length === 2) {
      await generateFinal(qualifiedTeams)
      return
    }

    if (qualifiedTeams.length < 2) {
      alert('Not enough teams to continue!')
      return
    }

    const shuffled = [...qualifiedTeams].sort(() => Math.random() - 0.5)
    const matchesToCreate: any[] = []
    let matchNumber = matches.length + 1
    let remainingTeams = [...shuffled]

    while (remainingTeams.length >= 2) {
      const team1 = remainingTeams[0]
      let team2 = null
      let found = false

      for (let i = 1; i < remainingTeams.length; i++) {
        if (remainingTeams[i].group_name !== team1.group_name) {
          team2 = remainingTeams[i]
          found = true
          break
        }
      }

      if (!found && remainingTeams.length >= 2) {
        team2 = remainingTeams[1]
      }

      if (team2) {
        matchesToCreate.push({
          team1: team1,
          team2: team2,
          round_type: 'knockout',
          match_number: matchNumber++
        })
        remainingTeams = remainingTeams.filter(t => t.id !== team1.id && t.id !== team2.id)
      } else {
        break
      }
    }

    for (const match of matchesToCreate) {
      await supabase
        .from('tournament_matches')
        .insert({
          tournament_id: id,
          team1_id: match.team1.id,
          team2_id: match.team2.id,
          group_name: `Knockout Round`,
          match_number: match.match_number,
          round_type: match.round_type,
          status: 'scheduled'
        })
    }

    await loadData()
  }

  // ─── Generate Knockout from winners ──────────────────────────────────────
  const generateKnockoutRoundsFromWinners = async (winners: any[]) => {
    if (!id) return

    if (winners.length === 4) {
      await generateSemiFinals(winners)
      return
    }

    if (winners.length === 2) {
      await generateFinal(winners)
      return
    }

    const shuffled = [...winners].sort(() => Math.random() - 0.5)
    const matchesToCreate: any[] = []
    let matchNumber = matches.length + 1
    let remainingTeams = [...shuffled]

    while (remainingTeams.length >= 2) {
      const team1 = remainingTeams[0]
      let team2 = null
      let found = false

      for (let i = 1; i < remainingTeams.length; i++) {
        if (remainingTeams[i].group_name !== team1.group_name) {
          team2 = remainingTeams[i]
          found = true
          break
        }
      }

      if (!found && remainingTeams.length >= 2) {
        team2 = remainingTeams[1]
      }

      if (team2) {
        matchesToCreate.push({
          team1: team1,
          team2: team2,
          round_type: 'knockout',
          match_number: matchNumber++
        })
        remainingTeams = remainingTeams.filter(t => t.id !== team1.id && t.id !== team2.id)
      } else {
        break
      }
    }

    for (const match of matchesToCreate) {
      await supabase
        .from('tournament_matches')
        .insert({
          tournament_id: id,
          team1_id: match.team1.id,
          team2_id: match.team2.id,
          group_name: `Knockout Round`,
          match_number: match.match_number,
          round_type: match.round_type,
          status: 'scheduled'
        })
    }

    await loadData()
  }

  // ─── handleAdvanceTeams ──────────────────────────────────────────────────
  const handleAdvanceTeams = async () => {
    setShowAdvanceModal(false)
    
    const qualifiedTeams: any[] = []
    Object.keys(groupStandings).forEach(group => {
      const topTeams = groupStandings[group].slice(0, selectedAdvanceCount)
      qualifiedTeams.push(...topTeams)
    })

    if (qualifiedTeams.length === 4) {
      await generateSemiFinals(qualifiedTeams)
    } else if (qualifiedTeams.length === 2) {
      await generateFinal(qualifiedTeams)
    } else if (qualifiedTeams.length > 4) {
      await generateKnockoutRounds(selectedAdvanceCount)
    } else {
      alert('Not enough teams to continue!')
    }
  }

  const findChampion = (matchesList: Match[]) => {
    const finalMatch = matchesList.find(m => m.round_type === 'final' && m.status === 'completed')
    
    if (finalMatch && finalMatch.winner_id) {
      const winner = matchesList.find(m => m.id === finalMatch.id)?.winner
      if (winner?.name) {
        setChampion(winner.name)
        setShowChampionCelebration(true)
        
        if (!isCompleted && id) {
          setIsCompleted(true)
          supabase
            .from('tournaments')
            .update({ status: 'completed' })
            .eq('id', id)
            .then(() => {
              console.log('🏆 Tournament marked as completed!')
            })
        }
        return
      }
    }
    
    const hasFinalMatch = matchesList.some(m => m.round_type === 'final')
    if (hasFinalMatch) {
      const finalMatchExists = matchesList.find(m => m.round_type === 'final')
      if (finalMatchExists && finalMatchExists.status !== 'completed') {
        setShowChampionCelebration(false)
      }
    } else {
      setShowChampionCelebration(false)
    }
  }

  const updateMatchResult = async () => {
    if (!selectedMatch || !id) return

    let winnerId = null

    if (selectedResult === 'team1_win') {
      winnerId = selectedMatch.team1_id
    } else if (selectedResult === 'team2_win') {
      winnerId = selectedMatch.team2_id
    } else {
      if (selectedMatch.round_type !== 'group') {
        alert('⚠️ Knockout matches cannot end in a draw! Please select a winner.')
        return
      }
      winnerId = null
    }

    const { error } = await supabase
      .from('tournament_matches')
      .update({
        team1_score: selectedResult === 'team1_win' ? 1 : selectedResult === 'draw' ? 0 : 0,
        team2_score: selectedResult === 'team2_win' ? 1 : selectedResult === 'draw' ? 0 : 0,
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
      await checkAndCompleteTournament()
    }
  }

  const checkAndCompleteTournament = async () => {
    if (!id) return

    const { data: allMatches } = await supabase
      .from('tournament_matches')
      .select('*')
      .eq('tournament_id', id)

    if (!allMatches) return

    const hasFinal = allMatches.some((m: any) => m.round_type === 'final')
    const finalMatch = allMatches.find((m: any) => m.round_type === 'final')
    const allCompleted = allMatches.every((m: any) => m.status === 'completed')

    if (allCompleted && hasFinal && finalMatch) {
      const { data: matchWithWinner } = await supabase
        .from('tournament_matches')
        .select('*, winner:winner_id(name)')
        .eq('id', finalMatch.id)
        .single()
      
      if (matchWithWinner?.winner) {
        setChampion(matchWithWinner.winner.name)
        setShowChampionCelebration(true)
        setIsCompleted(true)
        
        await supabase
          .from('tournaments')
          .update({ status: 'completed' })
          .eq('id', id)
        
        alert(`🏆🏆🏆 Tournament Complete! Champion: ${matchWithWinner.winner.name} 🏆🏆🏆`)
        scheduleTournamentCleanup(id)
      }
    }
  }

  const scheduleTournamentCleanup = (tournamentId: string) => {
    const cleanupDate = new Date()
    cleanupDate.setDate(cleanupDate.getDate() + 30)
    
    const cleanupJobs = JSON.parse(localStorage.getItem('tournament_cleanup') || '{}')
    cleanupJobs[tournamentId] = cleanupDate.toISOString()
    localStorage.setItem('tournament_cleanup', JSON.stringify(cleanupJobs))
  }

  useEffect(() => {
    const cleanupJobs = JSON.parse(localStorage.getItem('tournament_cleanup') || '{}')
    const now = new Date()
    
    Object.entries(cleanupJobs).forEach(async ([tournamentId, cleanupDate]) => {
      if (new Date(cleanupDate as string) < now) {
        await supabase.from('tournaments').delete().eq('id', tournamentId)
        delete cleanupJobs[tournamentId]
        localStorage.setItem('tournament_cleanup', JSON.stringify(cleanupJobs))
      }
    })
  }, [])

  const openScoreModal = (match: Match) => {
    setSelectedMatch(match)
    setSelectedResult('draw')
    setShowScoreModal(true)
  }

  const getMatchResult = (match: Match): React.ReactNode => {
    if (match.status !== 'completed' || !match.winner_id) {
      return <span style={{ color: '#4b5563' }}>⏳ Pending</span>
    }
    
    if (match.winner_id === match.team1_id) {
      return <span style={{ color: '#4ade80', fontWeight: 'bold' }}>🏆 {match.team1?.name || 'Team 1'} wins</span>
    } else if (match.winner_id === match.team2_id) {
      return <span style={{ color: '#4ade80', fontWeight: 'bold' }}>🏆 {match.team2?.name || 'Team 2'} wins</span>
    } else {
      return <span style={{ color: '#eab308', fontWeight: 'bold' }}>🤝 Draw</span>
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

  const groupMatches = matches.filter(m => m.round_type === 'group')
  const knockoutMatches = matches.filter(m => m.round_type === 'knockout')
  const semifinalMatches = matches.filter(m => m.round_type === 'semifinal')
  const finalMatches = matches.filter(m => m.round_type === 'final')

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

        {/* ─── Champion Celebration Banner ─── */}
        {showChampionCelebration && champion && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(200,162,0,0.2), rgba(255,215,0,0.1))',
            border: '2px solid #FFD700',
            borderRadius: '16px',
            padding: '24px',
            textAlign: 'center',
            marginBottom: '24px',
            animation: 'championGlow 2s ease-in-out infinite',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 30% 30%, rgba(255,215,0,0.1), transparent 50%)',
              pointerEvents: 'none'
            }} />
            
            <div style={{ fontSize: '64px', marginBottom: '8px', position: 'relative' }}>🏆</div>
            <h2 style={{ 
              color: '#FFD700', 
              fontSize: '32px', 
              fontWeight: 'bold',
              position: 'relative',
              textShadow: '0 0 30px rgba(255,215,0,0.3)'
            }}>
              🎉 Champion: {champion} 🎉
            </h2>
            <p style={{ 
              color: '#6b7280', 
              fontSize: '14px',
              position: 'relative'
            }}>
              Congratulations to the tournament winner! 👏
            </p>
            <div style={{
              marginTop: '8px',
              display: 'flex',
              justifyContent: 'center',
              gap: '8px',
              position: 'relative'
            }}>
              {['⭐', '✨', '🌟', '✨', '⭐'].map((emoji, i) => (
                <span key={i} style={{ fontSize: '20px', animation: `sparkle ${1.5 + i * 0.3}s ease-in-out infinite` }}>
                  {emoji}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ─── Group Standings ─── */}
        <div style={{
          background: 'rgba(16,16,22,0.95)',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.05)',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <h3 style={{ color: '#FFD700', marginBottom: '16px' }}>📊 Group Standings</h3>
          
          {Object.keys(groupStandings).length === 0 ? (
            <div style={{ textAlign: 'center', color: '#4b5563', padding: '20px' }}>
              No teams added yet
            </div>
          ) : (
            Object.keys(groupStandings).map(group => (
              <div key={group} style={{ marginBottom: '16px' }}>
                <h4 style={{ color: '#c8a200', fontSize: '14px', marginBottom: '8px' }}>
                  🏷️ {group}
                </h4>
                <StandingsTable standings={groupStandings[group]} />
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
            ⭐ Points: Win=2, Draw=1, Loss=0
          </div>
        </div>

        {/* ─── Matches ─── */}
        <div style={{
          background: 'rgba(16,16,22,0.95)',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.05)',
          padding: '20px'
        }}>
          <h3 style={{ color: '#FFD700', marginBottom: '16px' }}>📋 All Matches</h3>
          
          {groupMatches.length > 0 && (
            <>
              <h4 style={{ color: '#6b7280', fontSize: '13px', marginBottom: '8px' }}>📋 Group Stage</h4>
              <MatchList 
                matches={groupMatches} 
                isCreator={isCreator}
                isCompleted={isCompleted}
                onMatchClick={openScoreModal}
                getMatchResult={getMatchResult}
              />
            </>
          )}

          {knockoutMatches.length > 0 && (
            <>
              <h4 style={{ color: '#c8a200', fontSize: '13px', marginBottom: '8px', marginTop: '16px' }}>🏅 Knockout Rounds</h4>
              <MatchList 
                matches={knockoutMatches} 
                isCreator={isCreator}
                isCompleted={isCompleted}
                onMatchClick={openScoreModal}
                getMatchResult={getMatchResult}
              />
            </>
          )}

          {semifinalMatches.length > 0 && (
            <>
              <h4 style={{ color: '#c8a200', fontSize: '13px', marginBottom: '8px', marginTop: '16px' }}>🏅 Semi-Finals</h4>
              <MatchList 
                matches={semifinalMatches} 
                isCreator={isCreator}
                isCompleted={isCompleted}
                onMatchClick={openScoreModal}
                getMatchResult={getMatchResult}
              />
            </>
          )}

          {finalMatches.length > 0 && (
            <>
              <h4 style={{ color: '#FFD700', fontSize: '13px', marginBottom: '8px', marginTop: '16px' }}>🏆 Final</h4>
              <MatchList 
                matches={finalMatches} 
                isCreator={isCreator}
                isCompleted={isCompleted}
                onMatchClick={openScoreModal}
                getMatchResult={getMatchResult}
              />
            </>
          )}

          {matches.length === 0 && (
            <div style={{ textAlign: 'center', color: '#4b5563', padding: '20px' }}>
              No matches scheduled yet
            </div>
          )}
        </div>
      </div>

      {/* ─── Advance Modal ─── */}
      {showAdvanceModal && (
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
            <h3 style={{ color: '#FFD700', marginBottom: '16px' }}>🏅 Advance to Knockout</h3>
            <p style={{ color: '#6b7280', marginBottom: '16px' }}>
              How many teams from each group should advance to the knockout stage?
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {advanceOptions.map(option => (
                <button
                  key={option}
                  onClick={() => setSelectedAdvanceCount(option)}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    background: selectedAdvanceCount === option ? 'rgba(200,162,0,0.2)' : 'rgba(200,162,0,0.08)',
                    border: `1px solid ${selectedAdvanceCount === option ? 'rgba(200,162,0,0.4)' : 'rgba(200,162,0,0.2)'}`,
                    color: selectedAdvanceCount === option ? '#FFD700' : 'white',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: selectedAdvanceCount === option ? 'bold' : 'normal'
                  }}
                >
                  Top {option} from each group
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowAdvanceModal(false)}
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
                onClick={handleAdvanceTeams}
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
                ✅ Generate Knockout
              </button>
            </div>

            <div style={{
              marginTop: '12px',
              padding: '8px 12px',
              background: 'rgba(200,162,0,0.05)',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#6b7280'
            }}>
              💡 Teams will be randomly paired, avoiding same-group matchups
            </div>
          </div>
        </div>
      )}

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
            <h3 style={{ color: '#FFD700', marginBottom: '16px' }}>
              {selectedMatch.round_type === 'final' ? '🏆 Final Result' : 
               selectedMatch.round_type === 'semifinal' ? '🏅 Semi-Final Result' : 
               selectedMatch.round_type === 'knockout' ? '🏅 Knockout Result' :
               'Match Result'}
            </h3>
            <p style={{ color: '#6b7280', marginBottom: '16px' }}>
              {selectedMatch.team1?.name || 'Team 1'} vs {selectedMatch.team2?.name || 'Team 2'}
            </p>
            
            {selectedMatch.round_type !== 'group' && (
              <div style={{
                padding: '8px 12px',
                background: 'rgba(239,68,68,0.1)',
                borderRadius: '6px',
                color: '#f87171',
                fontSize: '12px',
                marginBottom: '12px',
                border: '1px solid rgba(239,68,68,0.2)'
              }}>
                ⚠️ Knockout matches must have a winner (no draws allowed!)
              </div>
            )}
            
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
                🏆 {selectedMatch.team1?.name || 'Team 1'} Wins
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
                🏆 {selectedMatch.team2?.name || 'Team 2'} Wins
              </button>
              
              {selectedMatch.round_type === 'group' && (
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
                  🤝 Draw (1 point each)
                </button>
              )}
            </div>

            <div style={{
              padding: '8px 12px',
              background: 'rgba(200,162,0,0.05)',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#6b7280',
              marginBottom: '16px'
            }}>
              {selectedResult === 'team1_win' && `✅ ${selectedMatch.team1?.name || 'Team 1'} gets 2 points`}
              {selectedResult === 'team2_win' && `✅ ${selectedMatch.team2?.name || 'Team 2'} gets 2 points`}
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
        
        @keyframes championGlow {
          0%, 100% { 
            box-shadow: 0 0 30px rgba(255,215,0,0.1), inset 0 0 30px rgba(255,215,0,0.05);
          }
          50% { 
            box-shadow: 0 0 60px rgba(255,215,0,0.2), inset 0 0 60px rgba(255,215,0,0.1);
          }
        }
        
        @keyframes sparkle {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 1; }
          50% { transform: scale(1.3) rotate(20deg); opacity: 0.7; }
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
            background: index < 2 ? 'rgba(200,162,0,0.08)' : 'transparent',
            borderLeft: index < 2 ? '2px solid #c8a200' : '2px solid transparent'
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
      <div style={{
        padding: '4px 12px',
        fontSize: '10px',
        color: '#4b5563',
        textAlign: 'right',
        borderTop: '1px solid rgba(255,255,255,0.03)'
      }}>
        🟡 Highlighted teams advance to next round
      </div>
    </>
  )
}

// ─── Match List Component ───────────────────────────────────────────────────
interface MatchListProps {
  matches: Match[]
  isCreator: boolean
  isCompleted: boolean
  onMatchClick: (match: Match) => void
  getMatchResult: (match: Match) => React.ReactNode
}

const MatchList: React.FC<MatchListProps> = ({ 
  matches, 
  isCreator, 
  isCompleted, 
  onMatchClick, 
  getMatchResult
}) => {
  return (
    <>
      {matches.map((match) => {
        const team1Name = match.team1?.name || 'Team 1'
        const team2Name = match.team2?.name || 'Team 2'
        
        const roundLabel = match.round_type === 'final' ? '🏆 FINAL' : 
                          match.round_type === 'semifinal' ? '🏅 SEMI' : 
                          match.round_type === 'knockout' ? '🏅 KO' :
                          '📋 GROUP'
        
        const labelColor = match.round_type === 'final' ? '#FFD700' : 
                          match.round_type === 'semifinal' ? '#c8a200' :
                          match.round_type === 'knockout' ? '#60a5fa' :
                          '#4b5563'
        
        const bgColor = match.round_type === 'final' ? 'rgba(200,162,0,0.2)' : 
                       match.round_type === 'semifinal' ? 'rgba(200,162,0,0.1)' : 
                       match.round_type === 'knockout' ? 'rgba(96,165,250,0.1)' :
                       'rgba(255,255,255,0.03)'
        
        return (
          <div
            key={match.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              borderBottom: '1px solid rgba(255,255,255,0.03)',
              cursor: match.status !== 'completed' && isCreator && !isCompleted ? 'pointer' : 'default',
              opacity: match.status === 'completed' ? 0.8 : 1,
              background: match.round_type === 'final' ? 'rgba(200,162,0,0.05)' : 'transparent'
            }}
            onClick={() => {
              if (match.status !== 'completed' && isCreator && !isCompleted) {
                onMatchClick(match)
              }
            }}
          >
            <span style={{ color: '#4b5563', minWidth: '40px', fontSize: '13px' }}>
              #{match.match_number}
            </span>
            <span style={{
              padding: '2px 8px',
              borderRadius: '4px',
              background: bgColor,
              color: labelColor,
              fontSize: '10px',
              minWidth: '70px',
              textAlign: 'center',
              fontWeight: match.round_type === 'final' ? 'bold' : 'normal'
            }}>
              {roundLabel}
            </span>
            <span style={{ flex: 1, fontSize: '14px' }}>
              {team1Name} vs {team2Name}
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
        )
      })}
    </>
  )
}