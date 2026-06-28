// src/components/tournaments/CreateTournament.tsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

interface Team {
  id: string
  name: string
  captain?: string
  players?: string[]
}

interface Match {
  team1: string
  team2: string
  group?: string
  round?: string
  matchNumber: number
}

export const CreateTournament: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState<any>(null)
  const [step, setStep] = useState(1) // 1: Basic Info, 2: Teams, 3: Schedule

  // ─── Basic Info ──────────────────────────────────────────────────────────
  const [basicInfo, setBasicInfo] = useState({
    name: '',
    sport_type: 'Cricket',
    description: '',
    start_date: '',
    end_date: '',
    venue: '',
    max_teams: 8,
    teams_per_group: 4,
    total_groups: 2,
    group_stage: true,
    qualifier_rounds: 0,
    semifinals: true,
    finals: true
  })

  // ─── Teams ──────────────────────────────────────────────────────────────
  const [teams, setTeams] = useState<Team[]>([
    { id: '1', name: '' },
    { id: '2', name: '' }
  ])

  // ─── Generated Schedule ────────────────────────────────────────────────
  const [generatedSchedule, setGeneratedSchedule] = useState<Match[]>([])
  const [showSchedule, setShowSchedule] = useState(false)

  const sportTypes = ['Football', 'Basketball', 'Cricket', 'Tennis', 'Badminton', 'Volleyball', 'Table Tennis']

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      navigate('/login')
      return
    }
    setUser(user)
  }

  // ─── Add/Remove Teams ──────────────────────────────────────────────────
  const addTeam = () => {
    setTeams([...teams, { id: Date.now().toString(), name: '' }])
  }

  const removeTeam = (id: string) => {
    if (teams.length > 2) {
      setTeams(teams.filter(t => t.id !== id))
    }
  }

  const updateTeamName = (id: string, name: string) => {
    setTeams(teams.map(t => t.id === id ? { ...t, name } : t))
  }

  // ─── AI Schedule Generator ──────────────────────────────────────────────
  const generateSchedule = () => {
    setError('')
    const teamNames = teams.filter(t => t.name.trim()).map(t => t.name.trim())
    
    if (teamNames.length < 2) {
      setError('Please add at least 2 teams')
      return
    }

    if (teamNames.length < basicInfo.max_teams) {
      setError(`Need ${basicInfo.max_teams} teams but only ${teamNames.length} added`)
      return
    }

    // ─── Generate Schedule using Round Robin algorithm ────────────────────
    const schedule: Match[] = []
    const n = teamNames.length
    const isEven = n % 2 === 0
    const teamsList = [...teamNames]
    
    if (!isEven) {
      teamsList.push('BYE')
    }

    const totalTeams = teamsList.length
    const rounds = totalTeams - 1
    const matchesPerRound = totalTeams / 2

    // ─── Round Robin Algorithm ────────────────────────────────────────────
    const fixtures: { team1: string; team2: string }[][] = []
    const teamsCopy = [...teamsList]
    
    for (let round = 0; round < rounds; round++) {
      const roundMatches: { team1: string; team2: string }[] = []
      
      for (let match = 0; match < matchesPerRound; match++) {
        const home = teamsCopy[match]
        const away = teamsCopy[totalTeams - 1 - match]
        
        if (home !== 'BYE' && away !== 'BYE') {
          roundMatches.push({ team1: home, team2: away })
        }
      }
      
      fixtures.push(roundMatches)
      
      // Rotate teams (keeping first team fixed)
      const last = teamsCopy.pop()!
      teamsCopy.splice(1, 0, last)
    }

    // ─── Assign match numbers ─────────────────────────────────────────────
    let matchNumber = 1
    
    // Group Stage
    if (basicInfo.group_stage && basicInfo.total_groups > 1) {
      const teamsPerGroup = Math.ceil(teamNames.length / basicInfo.total_groups)
      const groups: string[][] = []
      
      for (let i = 0; i < basicInfo.total_groups; i++) {
        const start = i * teamsPerGroup
        const end = Math.min(start + teamsPerGroup, teamNames.length)
        groups.push(teamNames.slice(start, end))
      }
      
      groups.forEach((group, groupIndex) => {
        const groupName = String.fromCharCode(65 + groupIndex) // A, B, C...
        for (let i = 0; i < group.length; i++) {
          for (let j = i + 1; j < group.length; j++) {
            schedule.push({
              team1: group[i],
              team2: group[j],
              group: `Group ${groupName}`,
              round: 'Group',
              matchNumber: matchNumber++
            })
          }
        }
      })
    }

    // ─── Knockout Stage ────────────────────────────────────────────────────
    const allTeams = teamNames.slice()
    let remainingTeams = [...allTeams]
    
    // Qualifiers
    if (basicInfo.qualifier_rounds > 0) {
      const qualifierMatches = Math.floor(remainingTeams.length / 2)
      for (let i = 0; i < qualifierMatches && i < basicInfo.qualifier_rounds; i++) {
        if (remainingTeams.length >= 2) {
          schedule.push({
            team1: remainingTeams[i],
            team2: remainingTeams[remainingTeams.length - 1 - i],
            round: 'Qualifier',
            matchNumber: matchNumber++
          })
        }
      }
      // Winners advance (simplified - take first half)
      remainingTeams = remainingTeams.slice(0, Math.ceil(remainingTeams.length / 2))
    }

    // Semifinals
    if (basicInfo.semifinals && remainingTeams.length >= 4) {
      const semiPairs = [
        [remainingTeams[0], remainingTeams[remainingTeams.length - 1]],
        [remainingTeams[1], remainingTeams[remainingTeams.length - 2]]
      ]
      semiPairs.forEach(pair => {
        if (pair[0] && pair[1]) {
          schedule.push({
            team1: pair[0],
            team2: pair[1],
            round: 'Semifinal',
            matchNumber: matchNumber++
          })
        }
      })
    }

    // Final
    if (basicInfo.finals && remainingTeams.length >= 2) {
      const finalists = remainingTeams.slice(0, 2)
      schedule.push({
        team1: finalists[0],
        team2: finalists[1],
        round: 'Final',
        matchNumber: matchNumber++
      })
    }

    // ─── If no matches generated, fallback to simple round robin ────────
    if (schedule.length === 0) {
      for (const fixture of fixtures) {
        for (const match of fixture) {
          if (match.team1 !== 'BYE' && match.team2 !== 'BYE') {
            schedule.push({
              team1: match.team1,
              team2: match.team2,
              round: 'League',
              matchNumber: matchNumber++
            })
          }
        }
      }
    }

    setGeneratedSchedule(schedule)
    setShowSchedule(true)
  }

  // ─── Save Tournament ────────────────────────────────────────────────────
  const saveTournament = async () => {
    if (!user) return

    setLoading(true)
    setError('')

    try {
      // Create tournament
      const { data: tournament, error: tError } = await supabase
        .from('tournaments')
        .insert({
          name: basicInfo.name,
          sport_type: basicInfo.sport_type,
          description: basicInfo.description,
          created_by: user.id,
          start_date: basicInfo.start_date,
          end_date: basicInfo.end_date,
          venue: basicInfo.venue,
          max_teams: basicInfo.max_teams,
          teams_per_group: basicInfo.teams_per_group,
          total_groups: basicInfo.total_groups,
          group_stage: basicInfo.group_stage,
          qualifier_rounds: basicInfo.qualifier_rounds,
          semifinals: basicInfo.semifinals,
          finals: basicInfo.finals,
          status: 'active',
          schedule: generatedSchedule
        })
        .select()
        .single()

      if (tError) throw tError

      // Create teams
      const teamData = teams
        .filter(t => t.name.trim())
        .map(t => ({
          tournament_id: tournament.id,
          name: t.name.trim()
        }))

      const { data: createdTeams, error: teamError } = await supabase
        .from('tournament_teams')
        .insert(teamData)
        .select()

      if (teamError) throw teamError

      // Create matches
      const matchData = generatedSchedule.map((match, index) => {
        const team1 = createdTeams?.find(t => t.name === match.team1)
        const team2 = createdTeams?.find(t => t.name === match.team2)
        
        return {
          tournament_id: tournament.id,
          team1_id: team1?.id,
          team2_id: team2?.id,
          group_name: match.group || null,
          round_type: match.round || 'Group',
          match_number: match.matchNumber,
          status: 'scheduled'
        }
      })

      const { error: matchError } = await supabase
        .from('tournament_matches')
        .insert(matchData)

      if (matchError) throw matchError

      alert('✅ Tournament created successfully!')
      navigate(`/tournament/${tournament.id}`)

    } catch (err: any) {
      setError(err.message)
    }
    setLoading(false)
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

      <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <span style={{ fontSize: '32px' }}>🏆</span>
          <div>
            <h1 style={{ color: '#FFD700', fontSize: '28px', margin: 0 }}>Create Tournament</h1>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              Step {step} of 3: {step === 1 ? 'Basic Info' : step === 2 ? 'Add Teams' : 'Schedule'}
            </p>
          </div>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            background: 'rgba(255,68,68,0.1)',
            border: '1px solid rgba(255,68,68,0.2)',
            color: '#f87171'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* ─── STEP 1: Basic Info ─── */}
        {step === 1 && (
          <div style={{
            background: 'rgba(16,16,22,0.95)',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.05)',
            padding: '24px'
          }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: '#aaa', fontSize: '14px', display: 'block', marginBottom: '6px' }}>Tournament Name *</label>
              <input
                type="text"
                value={basicInfo.name}
                onChange={(e) => setBasicInfo({ ...basicInfo, name: e.target.value })}
                placeholder="e.g. FAST Cricket Cup 2024"
                style={{
                  width: '100%',
                  padding: '12px',
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
              <label style={{ color: '#aaa', fontSize: '14px', display: 'block', marginBottom: '6px' }}>Sport *</label>
              <select
                value={basicInfo.sport_type}
                onChange={(e) => setBasicInfo({ ...basicInfo, sport_type: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none'
                }}
              >
                {sportTypes.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ color: '#aaa', fontSize: '14px', display: 'block', marginBottom: '6px' }}>Start Date *</label>
                <input
                  type="date"
                  value={basicInfo.start_date}
                  onChange={(e) => setBasicInfo({ ...basicInfo, start_date: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
              <div>
                <label style={{ color: '#aaa', fontSize: '14px', display: 'block', marginBottom: '6px' }}>End Date *</label>
                <input
                  type="date"
                  value={basicInfo.end_date}
                  onChange={(e) => setBasicInfo({ ...basicInfo, end_date: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: '#aaa', fontSize: '14px', display: 'block', marginBottom: '6px' }}>Venue</label>
              <input
                type="text"
                value={basicInfo.venue}
                onChange={(e) => setBasicInfo({ ...basicInfo, venue: e.target.value })}
                placeholder="e.g. University Ground"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ color: '#aaa', fontSize: '14px', display: 'block', marginBottom: '6px' }}>Max Teams</label>
                <input
                  type="number"
                  value={basicInfo.max_teams}
                  onChange={(e) => setBasicInfo({ ...basicInfo, max_teams: parseInt(e.target.value) || 8 })}
                  min="2"
                  max="32"
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
              <div>
                <label style={{ color: '#aaa', fontSize: '14px', display: 'block', marginBottom: '6px' }}>Teams per Group</label>
                <input
                  type="number"
                  value={basicInfo.teams_per_group}
                  onChange={(e) => setBasicInfo({ ...basicInfo, teams_per_group: parseInt(e.target.value) || 4 })}
                  min="2"
                  max="8"
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ color: '#aaa', fontSize: '14px', display: 'block', marginBottom: '6px' }}>Total Groups</label>
                <input
                  type="number"
                  value={basicInfo.total_groups}
                  onChange={(e) => setBasicInfo({ ...basicInfo, total_groups: parseInt(e.target.value) || 2 })}
                  min="1"
                  max="8"
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
              <div>
                <label style={{ color: '#aaa', fontSize: '14px', display: 'block', marginBottom: '6px' }}>Qualifier Rounds</label>
                <input
                  type="number"
                  value={basicInfo.qualifier_rounds}
                  onChange={(e) => setBasicInfo({ ...basicInfo, qualifier_rounds: parseInt(e.target.value) || 0 })}
                  min="0"
                  max="4"
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#aaa', fontSize: '14px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={basicInfo.group_stage}
                  onChange={(e) => setBasicInfo({ ...basicInfo, group_stage: e.target.checked })}
                />
                Group Stage
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#aaa', fontSize: '14px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={basicInfo.semifinals}
                  onChange={(e) => setBasicInfo({ ...basicInfo, semifinals: e.target.checked })}
                />
                Semifinals
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#aaa', fontSize: '14px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={basicInfo.finals}
                  onChange={(e) => setBasicInfo({ ...basicInfo, finals: e.target.checked })}
                />
                Finals
              </label>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: '#aaa', fontSize: '14px', display: 'block', marginBottom: '6px' }}>Description</label>
              <textarea
                value={basicInfo.description}
                onChange={(e) => setBasicInfo({ ...basicInfo, description: e.target.value })}
                rows={3}
                placeholder="Describe your tournament..."
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>

            <button
              onClick={() => setStep(2)}
              style={{
                width: '100%',
                padding: '12px',
                background: 'linear-gradient(135deg, #c8a200, #FFD700)',
                border: 'none',
                borderRadius: '8px',
                color: '#0a0a0a',
                fontWeight: 'bold',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              Next: Add Teams →
            </button>
          </div>
        )}

        {/* ─── STEP 2: Teams ─── */}
        {step === 2 && (
          <div style={{
            background: 'rgba(16,16,22,0.95)',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.05)',
            padding: '24px'
          }}>
            <p style={{ color: '#6b7280', marginBottom: '16px' }}>
              Add {basicInfo.max_teams} teams for the tournament
            </p>

            {teams.map((team, index) => (
              <div key={team.id} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                <span style={{ color: '#4b5563', fontSize: '13px', minWidth: '30px' }}>#{index + 1}</span>
                <input
                  type="text"
                  value={team.name}
                  onChange={(e) => updateTeamName(team.id, e.target.value)}
                  placeholder={`Team ${index + 1} name...`}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                {teams.length > 2 && (
                  <button
                    onClick={() => removeTeam(team.id)}
                    style={{
                      padding: '8px 12px',
                      background: 'rgba(239,68,68,0.1)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      borderRadius: '6px',
                      color: '#f87171',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}

            {teams.length < basicInfo.max_teams && (
              <button
                onClick={addTeam}
                style={{
                  width: '100%',
                  padding: '10px',
                  marginTop: '8px',
                  background: 'rgba(200,162,0,0.08)',
                  border: '1px dashed rgba(200,162,0,0.3)',
                  borderRadius: '8px',
                  color: '#c8a200',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                + Add Team
              </button>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'transparent',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  color: '#666',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ← Back
              </button>
              <button
                onClick={() => {
                  const validTeams = teams.filter(t => t.name.trim())
                  if (validTeams.length < 2) {
                    setError('Please add at least 2 teams')
                    return
                  }
                  generateSchedule()
                  setStep(3)
                }}
                style={{
                  flex: 2,
                  padding: '12px',
                  background: 'linear-gradient(135deg, #c8a200, #FFD700)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#0a0a0a',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                Generate Schedule →
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 3: Schedule ─── */}
        {step === 3 && (
          <div style={{
            background: 'rgba(16,16,22,0.95)',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.05)',
            padding: '24px'
          }}>
            <h3 style={{ color: '#FFD700', marginBottom: '8px' }}>📋 Generated Schedule</h3>
            <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '16px' }}>
              {generatedSchedule.length} matches generated using AI scheduling algorithm
            </p>

            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {generatedSchedule.map((match, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 12px',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    fontSize: '14px'
                  }}
                >
                  <span style={{ color: '#4b5563', minWidth: '70px' }}>
                    #{match.matchNumber}
                  </span>
                  {match.group && (
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'rgba(200,162,0,0.1)',
                      color: '#c8a200',
                      fontSize: '11px',
                      minWidth: '70px'
                    }}>
                      {match.group}
                    </span>
                  )}
                  <span style={{ color: 'white', flex: 1 }}>
                    {match.team1} vs {match.team2}
                  </span>
                  {match.round && (
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'rgba(255,255,255,0.05)',
                      color: '#6b7280',
                      fontSize: '11px'
                    }}>
                      {match.round}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button
                onClick={() => setStep(2)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'transparent',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  color: '#666',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ← Back
              </button>
              <button
                onClick={saveTournament}
                disabled={loading}
                style={{
                  flex: 2,
                  padding: '12px',
                  background: loading ? 'rgba(200,162,0,0.3)' : 'linear-gradient(135deg, #c8a200, #FFD700)',
                  border: 'none',
                  borderRadius: '8px',
                  color: loading ? '#4b5563' : '#0a0a0a',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Creating...' : '🏆 Create Tournament'}
              </button>
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