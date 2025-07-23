export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  attachments?: Attachment[]
  artifacts?: string[]
}

export interface Attachment {
  id: string
  name: string
  type: string
  size: number
  url: string
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
  projectId?: string
}

export interface Project {
  id: string
  name: string
  description?: string
  conversations: string[]
  createdAt: Date
  updatedAt: Date
}

export interface Artifact {
  id: string
  title: string
  type: 'code' | 'text' | 'html' | 'svg' | 'mermaid'
  content: string
  language?: string
  conversationId: string
  messageId: string
  createdAt: Date
  updatedAt: Date
}

export interface ModelConfig {
  id: string
  name: string
  description: string
  maxTokens: number
  available: boolean
}

export interface ChatSettings {
  model: string
  temperature: number
  maxTokens: number
  systemPrompt?: string
}