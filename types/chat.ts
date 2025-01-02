export interface ChatMessage {
  id: string
  content: string
  user_id: string
  group_id: string
  image_url?: string
  created_at: string
  reply_to?: string | null
}

export interface ChatGroup {
  id: string
  name: string
  description?: string
  created_at: string
}

export interface UserProfile {
  id: string
  username: string
  avatar_url?: string
  status?: string
  settings?: UserSettings
}

export interface UserSettings {
  theme?: 'light' | 'dark'
  notifications?: boolean
  language?: string
} 