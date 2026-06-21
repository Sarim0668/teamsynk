export interface User {
  id: string
  full_name: string
  email: string
  sport_interests: string
  location: string
  role: string
  bio: string
  skill_level: string
  status: string
  avatar_url: string
  created_at: string
}

export interface SportsSession {
  id: string
  created_by: string
  sport_type: string
  session_date: string
  session_time: string
  location: string
  max_participants: number
  description: string
  whatsapp_link: string
  status: string
  created_at: string
}

export interface MarketplaceListing {
  id: string
  seller_id: string
  item_name: string
  description: string
  price: number
  condition: 'New' | 'Like New' | 'Good' | 'Fair' | 'Poor'
  category: string
  status: 'AVAILABLE' | 'SOLD' | 'REMOVED'
  image_url: string
  created_at: string
}

export interface Post {
  id: string
  user_id: string
  title: string
  sport_type: string
  location: string
  time_slot: string
  players_needed: number
  description: string
  created_at: string
}