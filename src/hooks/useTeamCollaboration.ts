import { useState, useEffect, useCallback } from 'react'
import { blink } from '../blink/client'
import type { TeamWorkspace, TeamMember, SharedConversation, ConversationComment } from '../types/advanced'

export function useTeamWorkspaces() {
  const [workspaces, setWorkspaces] = useState<TeamWorkspace[]>([])
  const [currentWorkspace, setCurrentWorkspace] = useState<TeamWorkspace | null>(null)
  const [loading, setLoading] = useState(true)

  const loadWorkspaces = useCallback(async () => {
    try {
      const user = await blink.auth.me()
      
      // Get workspaces where user is owner
      const ownedWorkspaces = await blink.db.teamWorkspaces.list({
        where: { ownerId: user.id },
        orderBy: { name: 'asc' }
      })

      // Get workspaces where user is a member
      const memberWorkspaces = await blink.db.teamMembers.list({
        where: { userId: user.id }
      })

      const memberWorkspaceIds = memberWorkspaces.map(m => m.workspaceId)
      const memberWorkspaceData = await Promise.all(
        memberWorkspaceIds.map(id => 
          blink.db.teamWorkspaces.list({ where: { id }, limit: 1 })
        )
      )

      const allWorkspaces = [
        ...ownedWorkspaces.map(w => ({
          ...w,
          settings: JSON.parse(w.settings),
          members: []
        })),
        ...memberWorkspaceData.flat().map(w => ({
          ...w,
          settings: JSON.parse(w.settings),
          members: []
        }))
      ]

      // Load members for each workspace
      for (const workspace of allWorkspaces) {
        const members = await blink.db.teamMembers.list({
          where: { workspaceId: workspace.id }
        })
        workspace.members = members.map(m => ({
          ...m,
          permissions: JSON.parse(m.permissions)
        }))
      }

      setWorkspaces(allWorkspaces)
      if (allWorkspaces.length > 0 && !currentWorkspace) {
        setCurrentWorkspace(allWorkspaces[0])
      }
    } catch (error) {
      console.error('Failed to load workspaces:', error)
    } finally {
      setLoading(false)
    }
  }, [currentWorkspace])

  const createWorkspace = async (data: Omit<TeamWorkspace, 'id' | 'ownerId' | 'members' | 'createdAt' | 'updatedAt'>) => {
    try {
      const user = await blink.auth.me()
      const now = new Date().toISOString()
      
      const workspace = await blink.db.teamWorkspaces.create({
        id: `workspace_${Date.now()}`,
        ...data,
        settings: JSON.stringify(data.settings),
        ownerId: user.id,
        createdAt: now,
        updatedAt: now
      })

      const formattedWorkspace = {
        ...workspace,
        settings: data.settings,
        members: []
      }

      setWorkspaces(prev => [...prev, formattedWorkspace])
      return formattedWorkspace
    } catch (error) {
      console.error('Failed to create workspace:', error)
      throw error
    }
  }

  const inviteMember = async (workspaceId: string, email: string, role: TeamMember['role'] = 'member') => {
    try {
      const user = await blink.auth.me()
      const now = new Date().toISOString()

      const member = await blink.db.teamMembers.create({
        id: `member_${Date.now()}`,
        workspaceId,
        userId: `invited_${Date.now()}`, // Placeholder until user accepts
        email,
        displayName: email.split('@')[0],
        role,
        permissions: JSON.stringify([
          { resource: 'conversations', actions: ['read'] },
          { resource: 'projects', actions: ['read'] }
        ]),
        joinedAt: now,
        lastActive: now
      })

      // Update workspace members
      setWorkspaces(prev => prev.map(w => 
        w.id === workspaceId 
          ? { 
              ...w, 
              members: [...w.members, {
                ...member,
                permissions: JSON.parse(member.permissions)
              }]
            }
          : w
      ))

      return member
    } catch (error) {
      console.error('Failed to invite member:', error)
      throw error
    }
  }

  useEffect(() => {
    loadWorkspaces()
  }, [loadWorkspaces])

  return {
    workspaces,
    currentWorkspace,
    loading,
    setCurrentWorkspace,
    createWorkspace,
    inviteMember,
    refetch: loadWorkspaces
  }
}

export function useSharedConversations() {
  const [sharedConversations, setSharedConversations] = useState<SharedConversation[]>([])
  const [loading, setLoading] = useState(true)

  const loadSharedConversations = useCallback(async () => {
    try {
      const user = await blink.auth.me()
      const result = await blink.db.sharedConversations.list({
        where: { sharedBy: user.id },
        orderBy: { sharedAt: 'desc' }
      })
      
      setSharedConversations(result.map(s => ({
        ...s,
        permissions: s.permissions ? JSON.parse(s.permissions) : [],
        isPublic: Number(s.isPublic) > 0,
        allowComments: Number(s.allowComments) > 0,
        allowDownload: Number(s.allowDownload) > 0
      })))
    } catch (error) {
      console.error('Failed to load shared conversations:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const shareConversation = async (
    conversationId: string,
    options: {
      title: string
      description?: string
      isPublic?: boolean
      allowComments?: boolean
      allowDownload?: boolean
      expiresAt?: string
    }
  ) => {
    try {
      const user = await blink.auth.me()
      const now = new Date().toISOString()
      const shareId = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const shared = await blink.db.sharedConversations.create({
        id: `shared_${Date.now()}`,
        conversationId,
        shareId,
        title: options.title,
        description: options.description,
        sharedBy: user.id,
        sharedAt: now,
        expiresAt: options.expiresAt,
        isPublic: options.isPublic ? "1" : "0",
        allowComments: options.allowComments ? "1" : "0",
        allowDownload: options.allowDownload ? "1" : "0",
        viewCount: 0,
        permissions: JSON.stringify([])
      })

      const formattedShared = {
        ...shared,
        permissions: [],
        isPublic: options.isPublic || false,
        allowComments: options.allowComments || false,
        allowDownload: options.allowDownload || false
      }

      setSharedConversations(prev => [...prev, formattedShared])
      return { ...formattedShared, shareUrl: `${window.location.origin}/shared/${shareId}` }
    } catch (error) {
      console.error('Failed to share conversation:', error)
      throw error
    }
  }

  const unshareConversation = async (id: string) => {
    try {
      await blink.db.sharedConversations.delete(id)
      setSharedConversations(prev => prev.filter(s => s.id !== id))
    } catch (error) {
      console.error('Failed to unshare conversation:', error)
      throw error
    }
  }

  useEffect(() => {
    loadSharedConversations()
  }, [loadSharedConversations])

  return {
    sharedConversations,
    loading,
    shareConversation,
    unshareConversation,
    refetch: loadSharedConversations
  }
}

export function useConversationComments(conversationId: string) {
  const [comments, setComments] = useState<ConversationComment[]>([])
  const [loading, setLoading] = useState(true)

  const loadComments = useCallback(async () => {
    if (!conversationId) return
    
    try {
      const result = await blink.db.conversationComments.list({
        where: { conversationId },
        orderBy: { createdAt: 'asc' }
      })
      
      setComments(result.map(c => ({
        ...c,
        reactions: c.reactions ? JSON.parse(c.reactions) : []
      })))
    } catch (error) {
      console.error('Failed to load comments:', error)
    } finally {
      setLoading(false)
    }
  }, [conversationId])

  const addComment = async (content: string, messageId?: string, parentId?: string) => {
    try {
      const user = await blink.auth.me()
      const now = new Date().toISOString()

      const comment = await blink.db.conversationComments.create({
        id: `comment_${Date.now()}`,
        conversationId,
        messageId,
        userId: user.id,
        content,
        createdAt: now,
        parentId,
        reactions: JSON.stringify([])
      })

      const formattedComment = {
        ...comment,
        reactions: []
      }

      setComments(prev => [...prev, formattedComment])
      return formattedComment
    } catch (error) {
      console.error('Failed to add comment:', error)
      throw error
    }
  }

  const addReaction = async (commentId: string, emoji: string) => {
    try {
      const user = await blink.auth.me()
      const comment = comments.find(c => c.id === commentId)
      if (!comment) return

      const existingReaction = comment.reactions.find(r => r.userId === user.id && r.emoji === emoji)
      let newReactions

      if (existingReaction) {
        // Remove reaction
        newReactions = comment.reactions.filter(r => !(r.userId === user.id && r.emoji === emoji))
      } else {
        // Add reaction
        newReactions = [...comment.reactions, {
          userId: user.id,
          emoji,
          createdAt: new Date().toISOString()
        }]
      }

      await blink.db.conversationComments.update(commentId, {
        reactions: JSON.stringify(newReactions)
      })

      setComments(prev => prev.map(c => 
        c.id === commentId ? { ...c, reactions: newReactions } : c
      ))
    } catch (error) {
      console.error('Failed to add reaction:', error)
      throw error
    }
  }

  useEffect(() => {
    loadComments()
  }, [loadComments])

  return {
    comments,
    loading,
    addComment,
    addReaction,
    refetch: loadComments
  }
}