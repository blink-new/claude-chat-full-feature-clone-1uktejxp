import { useState, useEffect, useCallback } from 'react'
import { blink } from '@/blink/client'
import { Project } from '@/types'

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [currentProject, setCurrentProject] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load projects from database
  const loadProjects = useCallback(async () => {
    try {
      const user = await blink.auth.me()
      if (!user) return

      const projectsData = await blink.db.projects.list({
        where: { userId: user.id },
        orderBy: { updatedAt: 'desc' }
      })

      const formattedProjects: Project[] = projectsData.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description || '',
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
        conversationIds: p.conversationIds ? JSON.parse(p.conversationIds) : [],
        settings: p.settings ? JSON.parse(p.settings) : {
          model: 'gpt-4o-mini',
          temperature: 0.7,
          systemPrompt: ''
        }
      }))

      setProjects(formattedProjects)
      
      // Set current project if none selected
      if (!currentProject && formattedProjects.length > 0) {
        setCurrentProject(formattedProjects[0].id)
      }
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      setIsLoading(false)
    }
  }, [currentProject])

  // Create new project
  const createProject = useCallback(async (name: string, description?: string): Promise<Project> => {
    try {
      const user = await blink.auth.me()
      if (!user) throw new Error('User not authenticated')

      const projectData = await blink.db.projects.create({
        id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        description: description || '',
        userId: user.id,
        conversationIds: JSON.stringify([]),
        settings: JSON.stringify({
          model: 'gpt-4o-mini',
          temperature: 0.7,
          systemPrompt: ''
        }),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      const newProject: Project = {
        id: projectData.id,
        name: projectData.name,
        description: projectData.description || '',
        createdAt: new Date(projectData.createdAt),
        updatedAt: new Date(projectData.updatedAt),
        conversationIds: [],
        settings: {
          model: 'gpt-4o-mini',
          temperature: 0.7,
          systemPrompt: ''
        }
      }

      setProjects(prev => [newProject, ...prev])
      setCurrentProject(newProject.id)
      
      return newProject
    } catch (error) {
      console.error('Failed to create project:', error)
      throw error
    }
  }, [])

  // Update project
  const updateProject = useCallback(async (id: string, updates: Partial<Project>): Promise<void> => {
    try {
      const updateData: any = {
        updatedAt: new Date().toISOString()
      }

      if (updates.name) updateData.name = updates.name
      if (updates.description !== undefined) updateData.description = updates.description
      if (updates.conversationIds) updateData.conversationIds = JSON.stringify(updates.conversationIds)
      if (updates.settings) updateData.settings = JSON.stringify(updates.settings)

      await blink.db.projects.update(id, updateData)

      setProjects(prev => prev.map(p => 
        p.id === id 
          ? { 
              ...p, 
              ...updates, 
              updatedAt: new Date() 
            }
          : p
      ))
    } catch (error) {
      console.error('Failed to update project:', error)
      throw error
    }
  }, [])

  // Delete project
  const deleteProject = useCallback(async (id: string): Promise<void> => {
    try {
      await blink.db.projects.delete(id)
      
      setProjects(prev => prev.filter(p => p.id !== id))
      
      if (currentProject === id) {
        const remainingProjects = projects.filter(p => p.id !== id)
        setCurrentProject(remainingProjects.length > 0 ? remainingProjects[0].id : null)
      }
    } catch (error) {
      console.error('Failed to delete project:', error)
      throw error
    }
  }, [currentProject, projects])

  // Add conversation to project
  const addConversationToProject = useCallback(async (projectId: string, conversationId: string): Promise<void> => {
    const project = projects.find(p => p.id === projectId)
    if (!project) return

    const updatedConversationIds = [...project.conversationIds, conversationId]
    await updateProject(projectId, { conversationIds: updatedConversationIds })
  }, [projects, updateProject])

  // Remove conversation from project
  const removeConversationFromProject = useCallback(async (projectId: string, conversationId: string): Promise<void> => {
    const project = projects.find(p => p.id === projectId)
    if (!project) return

    const updatedConversationIds = project.conversationIds.filter(id => id !== conversationId)
    await updateProject(projectId, { conversationIds: updatedConversationIds })
  }, [projects, updateProject])

  // Get current project
  const getCurrentProject = useCallback((): Project | null => {
    return projects.find(p => p.id === currentProject) || null
  }, [projects, currentProject])

  // Get project conversations
  const getProjectConversations = useCallback(async (projectId: string) => {
    try {
      const project = projects.find(p => p.id === projectId)
      if (!project || project.conversationIds.length === 0) return []

      const conversations = await blink.db.conversations.list({
        where: {
          AND: project.conversationIds.map(id => ({ id }))
        },
        orderBy: { updatedAt: 'desc' }
      })

      return conversations.map(c => ({
        id: c.id,
        title: c.title,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt),
        userId: c.userId,
        projectId: c.projectId
      }))
    } catch (error) {
      console.error('Failed to load project conversations:', error)
      return []
    }
  }, [projects])

  // Initialize projects on mount
  useEffect(() => {
    const initProjects = async () => {
      try {
        const user = await blink.auth.me()
        if (user) {
          await loadProjects()
        }
      } catch (error) {
        console.error('Failed to initialize projects:', error)
        setIsLoading(false)
      }
    }

    initProjects()
  }, [loadProjects])

  return {
    projects,
    currentProject,
    isLoading,
    createProject,
    updateProject,
    deleteProject,
    setCurrentProject,
    addConversationToProject,
    removeConversationFromProject,
    getCurrentProject,
    getProjectConversations,
    loadProjects
  }
}