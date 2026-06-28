// src/components/tournaments/CreateTournament.tsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

interface Team {
  id: string
  name: string
}

export const CreateTournament: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState<any>(null)
  const [step, setStep] = useState(1)

  const [basicInfo, setBasicInfo] = useState({
    name: '',
    sport_type: 'Cricket',
    description: '',
    start_date: '',
    end_date: '',
    venue: '',
    max_teams: 8,
    teams_per_group: 4,
  })

  const [teams, setTeams] = useState<Team[]>([
    { id: '1', name: '' },
    { id: '2', name: '' }
  ])

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

  const addTeam = () => {
    if (teams.length < basicInfo.max_teams) {
      setTeams([...teams, { id: Date.now().toString(), name: '' }])
    }
  }

  const removeTeam = (id: string) => {
    if (teams.length > 2) {
      setTeams(teams.filter(t => t.id !== id))
    }
  }

  const updateTeamName = (id: string, name: string) => {
    setTeams(teams.map(t => t.id === id ? { ...t, name } : t))
  }

  // ─── Save Tournament ────────────────────────────────────────────────────
  const saveTournament = async () => {
    if (!user) return

    const validTeams = teams.filter(t => t.name.trim())
    if (validTeams.length < 2) {
      setError('Please add at least 2 teams')
      return
    }

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
          status: 'active'
        })
        .select()
        .single()

      if (tError) throw tError

      // ─── DISTRIBUTE TEAMS INTO GROUPS ──────────────────────────────────
      const teamNames = validTeams.map(t => t.name.trim())
      const totalTeams = teamNames.length
      const teamsPerGroup = Math.min(basicInfo.teams_per_group, Math.ceil(totalTeams / 2))
      const numGroups = Math.ceil(totalTeams / teamsPerGroup)

      // Shuffle teams randomly
      const shuffled = [...teamNames].sort(() => Math.random() - 0.5)
      
      // Distribute into groups
      const groups: string[][] = []
      for (let i = 0; i < numGroups; i++) {
        const start = i * teamsPerGroup
        const end = Math.min(start + teamsPerGroup, totalTeams)
        groups.push(shuffled.slice(start, end))
      }

      // Create teams with group assignments
      const teamData: any[] = []
      const teamIdMap: Record<string, string> = {}

      groups.forEach((group, groupIndex) => {
        const groupName = String.fromCharCode(65 + groupIndex) // A, B, C...
        
        group.forEach(teamName => {
          const tempId = `temp-${Date.now()}-${Math.random()}`
          teamData.push({
            tournament_id: tournament.id,
            name: teamName,
            group_name: `Group ${groupName}`,
            points: 0,
            matches_played: 0,
            wins: 0,
            draws: 0,
            losses: 0
          })
          teamIdMap[teamName] = tempId
        })
      })

      const { data: createdTeams, error: teamError } = await supabase
        .from('tournament_teams')
        .insert(teamData)
        .select()

      if (teamError) throw teamError

      // ─── GENERATE GROUP STAGE MATCHES ──────────────────────────────────
      const matchData: any[] = []
      let matchNumber = 1

      groups.forEach((group, groupIndex) => {
        const groupName = `Group ${String.fromCharCode(65 + groupIndex)}`
        
        // Get team IDs for this group
        const groupTeams = createdTeams?.filter(t => t.group_name === groupName) || []
        
        // Round robin: each team plays every other team in the group
        for (let i = 0; i < groupTeams.length; i++) {
          for (let j = i + 1; j < groupTeams.length; j++) {
            matchData.push({
              tournament_id: tournament.id,
              team1_id: groupTeams[i].id,
              team2_id: groupTeams[j].id,
              group_name: groupName,
              match_number: matchNumber++,
              round_type: 'group',
              round_number: 1,
              status: 'scheduled'
            })
          }
        }
      })

      const { error: matchError } = await supabase
        .from('tournament_matches')
        .insert(matchData)

      if (matchError) throw matchError

      alert(`✅ Tournament created successfully with ${createdTeams?.length || 0} teams in ${groups.length} groups!`)
      navigate(`/tournament/${tournament.id}`)

    } catch (err: any) {
      setError(err.message)
      console.error(err)
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
              Step {step} of 2: {step === 1 ? 'Basic Info & Teams' : 'Review & Create'}
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

        {/* ─── STEP 1: Basic Info & Teams ─── */}
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

            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: '#aaa', fontSize: '14px', display: 'block', marginBottom: '6px' }}>Description</label>
              <textarea
                value={basicInfo.description}
                onChange={(e) => setBasicInfo({ ...basicInfo, description: e.target.value })}
                rows={2}
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

            {/* ─── Teams ─── */}
            <div style={{
              borderTop: '1px solid rgba(255,255,255,0.05)',
              paddingTop: '16px',
              marginTop: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ color: '#c8a200', fontSize: '16px' }}>👥 Teams</h3>
                <span style={{ color: '#6b7280', fontSize: '12px' }}>
                  {teams.filter(t => t.name.trim()).length} / {basicInfo.max_teams}
                </span>
              </div>

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

              <div style={{
                marginTop: '12px',
                padding: '8px 12px',
                background: 'rgba(200,162,0,0.05)',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#6b7280'
              }}>
                💡 Teams will be randomly distributed into groups based on "Teams per Group" setting
              </div>
            </div>

            <button
              onClick={() => {
                const validTeams = teams.filter(t => t.name.trim())
                if (validTeams.length < 2) {
                  setError('Please add at least 2 teams')
                  return
                }
                if (!basicInfo.name.trim()) {
                  setError('Please enter a tournament name')
                  return
                }
                if (!basicInfo.start_date || !basicInfo.end_date) {
                  setError('Please select start and end dates')
                  return
                }
                setStep(2)
              }}
              style={{
                width: '100%',
                padding: '12px',
                marginTop: '16px',
                background: 'linear-gradient(135deg, #c8a200, #FFD700)',
                border: 'none',
                borderRadius: '8px',
                color: '#0a0a0a',
                fontWeight: 'bold',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              Next: Review & Create →
            </button>
          </div>
        )}

        {/* ─── STEP 2: Review ─── */}
        {step === 2 && (
          <div style={{
            background: 'rgba(16,16,22,0.95)',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.05)',
            padding: '24px'
          }}>
            <h3 style={{ color: '#FFD700', marginBottom: '16px' }}>📋 Review Tournament</h3>
            
            <div style={{
              padding: '12px',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ color: '#6b7280' }}>Name:</span>
                <span style={{ color: 'white', fontWeight: 'bold' }}>{basicInfo.name}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ color: '#6b7280' }}>Sport:</span>
                <span style={{ color: 'white' }}>{basicInfo.sport_type}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ color: '#6b7280' }}>Dates:</span>
                <span style={{ color: 'white' }}>{basicInfo.start_date} → {basicInfo.end_date}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ color: '#6b7280' }}>Teams:</span>
                <span style={{ color: 'white' }}>{teams.filter(t => t.name.trim()).length} teams</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ color: '#6b7280' }}>Teams per Group:</span>
                <span style={{ color: 'white' }}>{basicInfo.teams_per_group}</span>
              </div>
            </div>

            <div style={{
              padding: '12px',
              background: 'rgba(200,162,0,0.05)',
              borderRadius: '8px',
              border: '1px solid rgba(200,162,0,0.1)',
              marginBottom: '16px'
            }}>
              <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>
                📊 Teams will be randomly distributed into groups. Each team plays every other team in their group.
                <br />
                🏅 Top teams from each group will advance to knockout rounds.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
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