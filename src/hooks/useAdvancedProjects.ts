import { useState, useEffect } from 'react'
import { blink } from '../blink/client'
import type { ProjectFolder, ProjectTag, ConversationTemplate } from '../types/advanced'

export function useProjectFolders() {
  const [folders, setFolders] = useState<ProjectFolder[]>([])
  const [loading, setLoading] = useState(true)

  const loadFolders = async () => {
    try {
      const user = await blink.auth.me()
      const result = await blink.db.projectFolders.list({
        where: { userId: user.id },
        orderBy: { name: 'asc' }
      })
      setFolders(result)
    } catch (error) {
      console.error('Failed to load folders:', error)
    } finally {
      setLoading(false)
    }
  }

  const createFolder = async (data: Omit<ProjectFolder, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    try {
      const user = await blink.auth.me()
      const now = new Date().toISOString()
      const folder = await blink.db.projectFolders.create({
        id: `folder_${Date.now()}`,
        ...data,
        createdAt: now,
        updatedAt: now,
        userId: user.id
      })
      setFolders(prev => [...prev, folder])
      return folder
    } catch (error) {
      console.error('Failed to create folder:', error)
      throw error
    }
  }

  const updateFolder = async (id: string, updates: Partial<ProjectFolder>) => {
    try {
      const updatedFolder = await blink.db.projectFolders.update(id, {
        ...updates,
        updatedAt: new Date().toISOString()
      })
      setFolders(prev => prev.map(f => f.id === id ? { ...f, ...updatedFolder } : f))
      return updatedFolder
    } catch (error) {
      console.error('Failed to update folder:', error)
      throw error
    }
  }

  const deleteFolder = async (id: string) => {
    try {
      await blink.db.projectFolders.delete(id)
      setFolders(prev => prev.filter(f => f.id !== id))
    } catch (error) {
      console.error('Failed to delete folder:', error)
      throw error
    }
  }

  useEffect(() => {
    loadFolders()
  }, [])

  return {
    folders,
    loading,
    createFolder,
    updateFolder,
    deleteFolder,
    refetch: loadFolders
  }
}

export function useProjectTags() {
  const [tags, setTags] = useState<ProjectTag[]>([])
  const [loading, setLoading] = useState(true)

  const loadTags = async () => {
    try {
      const user = await blink.auth.me()
      const result = await blink.db.projectTags.list({
        where: { userId: user.id },
        orderBy: { name: 'asc' }
      })
      setTags(result)
    } catch (error) {
      console.error('Failed to load tags:', error)
    } finally {
      setLoading(false)
    }
  }

  const createTag = async (data: Omit<ProjectTag, 'id' | 'createdAt' | 'userId'>) => {
    try {
      const user = await blink.auth.me()
      const tag = await blink.db.projectTags.create({
        id: `tag_${Date.now()}`,
        ...data,
        createdAt: new Date().toISOString(),
        userId: user.id
      })
      setTags(prev => [...prev, tag])
      return tag
    } catch (error) {
      console.error('Failed to create tag:', error)
      throw error
    }
  }

  const deleteTag = async (id: string) => {
    try {
      await blink.db.projectTags.delete(id)
      setTags(prev => prev.filter(t => t.id !== id))
    } catch (error) {
      console.error('Failed to delete tag:', error)
      throw error
    }
  }

  useEffect(() => {
    loadTags()
  }, [])

  return {
    tags,
    loading,
    createTag,
    deleteTag,
    refetch: loadTags
  }
}

export function useConversationTemplates() {
  const [templates, setTemplates] = useState<ConversationTemplate[]>([])
  const [loading, setLoading] = useState(true)

  const loadTemplates = async () => {
    try {
      const user = await blink.auth.me()
      const result = await blink.db.conversationTemplates.list({
        where: { 
          OR: [
            { userId: user.id },
            { isPublic: "1" }
          ]
        },
        orderBy: { usageCount: 'desc' }
      })
      setTemplates(result.map(t => ({
        ...t,
        tags: t.tags ? JSON.parse(t.tags) : [],
        variables: t.variables ? JSON.parse(t.variables) : [],
        isPublic: Number(t.isPublic) > 0
      })))
    } catch (error) {
      console.error('Failed to load templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const createTemplate = async (data: Omit<ConversationTemplate, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'usageCount'>) => {
    try {
      const user = await blink.auth.me()
      const now = new Date().toISOString()
      const template = await blink.db.conversationTemplates.create({
        id: `template_${Date.now()}`,
        ...data,
        tags: JSON.stringify(data.tags),
        variables: JSON.stringify(data.variables || []),
        isPublic: data.isPublic ? "1" : "0",
        createdAt: now,
        updatedAt: now,
        userId: user.id,
        usageCount: 0
      })
      
      const formattedTemplate = {
        ...template,
        tags: data.tags,
        variables: data.variables || [],
        isPublic: data.isPublic
      }
      
      setTemplates(prev => [...prev, formattedTemplate])
      return formattedTemplate
    } catch (error) {
      console.error('Failed to create template:', error)
      throw error
    }
  }

  const useTemplate = async (id: string) => {
    try {
      const template = templates.find(t => t.id === id)
      if (!template) return null

      // Increment usage count
      await blink.db.conversationTemplates.update(id, {
        usageCount: template.usageCount + 1
      })

      setTemplates(prev => prev.map(t => 
        t.id === id ? { ...t, usageCount: t.usageCount + 1 } : t
      ))

      return template
    } catch (error) {
      console.error('Failed to use template:', error)
      throw error
    }
  }

  const deleteTemplate = async (id: string) => {
    try {
      await blink.db.conversationTemplates.delete(id)
      setTemplates(prev => prev.filter(t => t.id !== id))
    } catch (error) {
      console.error('Failed to delete template:', error)
      throw error
    }
  }

  useEffect(() => {
    loadTemplates()
  }, [])

  return {
    templates,
    loading,
    createTemplate,
    useTemplate,
    deleteTemplate,
    refetch: loadTemplates
  }
}