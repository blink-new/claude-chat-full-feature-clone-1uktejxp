import { useState, useCallback } from 'react'
import { Artifact } from '@/types'

export function useArtifacts() {
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [currentArtifact, setCurrentArtifact] = useState<string | null>(null)

  const createArtifact = useCallback((
    title: string,
    type: Artifact['type'],
    content: string,
    conversationId: string,
    messageId: string,
    language?: string
  ) => {
    const newArtifact: Artifact = {
      id: Date.now().toString(),
      title,
      type,
      content,
      language,
      conversationId,
      messageId,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    setArtifacts(prev => [...prev, newArtifact])
    setCurrentArtifact(newArtifact.id)
    return newArtifact.id
  }, [])

  const selectArtifact = useCallback((id: string) => {
    setCurrentArtifact(id)
  }, [])

  const updateArtifact = useCallback((id: string, updates: Partial<Artifact>) => {
    setArtifacts(prev => prev.map(artifact => 
      artifact.id === id 
        ? { ...artifact, ...updates, updatedAt: new Date() }
        : artifact
    ))
  }, [])

  const deleteArtifact = useCallback((id: string) => {
    setArtifacts(prev => prev.filter(artifact => artifact.id !== id))
    if (currentArtifact === id) {
      setCurrentArtifact(null)
    }
  }, [currentArtifact])

  return {
    artifacts,
    currentArtifact,
    createArtifact,
    selectArtifact,
    updateArtifact,
    deleteArtifact
  }
}