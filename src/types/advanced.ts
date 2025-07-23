export interface ProjectFolder {
  id: string
  name: string
  description?: string
  parentId?: string
  color?: string
  icon?: string
  createdAt: string
  updatedAt: string
  userId: string
}

export interface ProjectTag {
  id: string
  name: string
  color: string
  description?: string
  createdAt: string
  userId: string
}

export interface ConversationTemplate {
  id: string
  name: string
  description?: string
  prompt: string
  tags: string[]
  isPublic: boolean
  category: string
  variables?: TemplateVariable[]
  createdAt: string
  updatedAt: string
  userId: string
  usageCount: number
}

export interface TemplateVariable {
  name: string
  type: 'text' | 'number' | 'select' | 'textarea'
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
  defaultValue?: string
}

export interface TeamMember {
  id: string
  email: string
  displayName: string
  avatar?: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  joinedAt: string
  lastActive: string
  permissions: TeamPermission[]
}

export interface TeamPermission {
  resource: 'conversations' | 'projects' | 'templates' | 'settings'
  actions: ('read' | 'write' | 'delete' | 'share')[]
}

export interface TeamWorkspace {
  id: string
  name: string
  description?: string
  ownerId: string
  members: TeamMember[]
  settings: WorkspaceSettings
  createdAt: string
  updatedAt: string
}

export interface WorkspaceSettings {
  allowPublicSharing: boolean
  defaultModelId: string
  maxTokensPerRequest: number
  allowFileUploads: boolean
  allowedFileTypes: string[]
  maxFileSize: number
  retentionDays: number
  requireApprovalForSharing: boolean
}

export interface AIModel {
  id: string
  name: string
  provider: 'openai' | 'anthropic' | 'google' | 'meta' | 'mistral'
  description: string
  maxTokens: number
  costPer1kTokens: number
  capabilities: ModelCapability[]
  isAvailable: boolean
  category: 'chat' | 'code' | 'creative' | 'analysis' | 'reasoning'
  speed: 'fast' | 'medium' | 'slow'
  quality: 'high' | 'medium' | 'low'
}

export interface ModelCapability {
  type: 'text' | 'code' | 'image' | 'file' | 'web_search' | 'function_calling'
  supported: boolean
}

export interface AutoRoutingConfig {
  enabled: boolean
  rules: RoutingRule[]
  fallbackModelId: string
  considerCost: boolean
  considerSpeed: boolean
  considerQuality: boolean
}

export interface RoutingRule {
  id: string
  name: string
  condition: RoutingCondition
  targetModelId: string
  priority: number
  enabled: boolean
}

export interface RoutingCondition {
  messageLength?: { min?: number; max?: number }
  hasCode?: boolean
  hasFiles?: boolean
  keywords?: string[]
  conversationLength?: { min?: number; max?: number }
  userTier?: string[]
  timeOfDay?: { start: string; end: string }
}

export interface SharedConversation {
  id: string
  conversationId: string
  shareId: string
  title: string
  description?: string
  sharedBy: string
  sharedAt: string
  expiresAt?: string
  isPublic: boolean
  allowComments: boolean
  allowDownload: boolean
  viewCount: number
  permissions: SharePermission[]
}

export interface SharePermission {
  userId?: string
  email?: string
  role: 'viewer' | 'commenter' | 'editor'
  grantedAt: string
}

export interface ConversationComment {
  id: string
  conversationId: string
  messageId?: string
  userId: string
  content: string
  createdAt: string
  updatedAt?: string
  parentId?: string
  reactions: CommentReaction[]
}

export interface CommentReaction {
  userId: string
  emoji: string
  createdAt: string
}