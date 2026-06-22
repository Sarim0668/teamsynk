export interface Competition {
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
  created_by: string
  created_at: string
}

export interface CompetitionQuestion {
  id: string
  competition_id: string
  question_number: number
  title: string
  description: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  sample_input: string
  sample_output: string
  test_cases: any
  points: number
}

export interface CompetitionRegistration {
  id: string
  competition_id: string
  user_id: string
  registered_at: string
  status: 'registered' | 'started' | 'completed'
  score: number
}

export interface CompetitionSubmission {
  id: string
  competition_id: string
  question_id: string
  user_id: string
  code: string
  language: string
  status: 'pending' | 'passed' | 'failed' | 'error'
  output: string
  error: string
  test_results: any
  submitted_at: string
}