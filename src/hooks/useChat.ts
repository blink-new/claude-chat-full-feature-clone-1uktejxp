import { useState, useCallback, useEffect } from 'react'
import { Message, Conversation } from '@/types'
import { ProcessedFile } from './useFileProcessing'
import { useAutoRouting } from './useAutoRouting'
import { blink } from '@/blink/client'

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState(null)
  const { routeMessage } = useAutoRouting()

  const createNewChat = useCallback(async () => {
    if (!user) return null

    try {
      const newConversation = {
        id: Date.now().toString(),
        title: 'New Conversation',
        userId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await blink.db.conversations.create(newConversation)
      
      const localConv: Conversation = {
        ...newConversation,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      setConversations(prev => [localConv, ...prev])
      setCurrentConversation(localConv.id)
      return localConv
    } catch (error) {
      console.error('Failed to create conversation:', error)
      // Fallback to local state
      const localConv: Conversation = {
        id: Date.now().toString(),
        title: 'New Conversation',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
      setConversations(prev => [localConv, ...prev])
      setCurrentConversation(localConv.id)
      return localConv
    }
  }, [user])

  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      const messages = await blink.db.messages.list({
        where: { conversationId },
        orderBy: { timestamp: 'asc' }
      })
      
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId 
          ? { 
              ...conv, 
              messages: messages.map(msg => ({
                ...msg,
                timestamp: new Date(msg.timestamp)
              }))
            }
          : conv
      ))
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }, [])

  const loadConversations = useCallback(async () => {
    if (!user) return

    try {
      const savedConversations = await blink.db.conversations.list({
        where: { userId: user.id },
        orderBy: { updatedAt: 'desc' }
      })
      
      if (savedConversations.length === 0) {
        // Create initial conversation
        const newConv = await createNewChat()
        if (newConv) {
          setCurrentConversation(newConv.id)
        }
      } else {
        setConversations(savedConversations.map(conv => ({
          ...conv,
          createdAt: new Date(conv.createdAt),
          updatedAt: new Date(conv.updatedAt),
          messages: []
        })))
        setCurrentConversation(savedConversations[0].id)
        loadMessages(savedConversations[0].id)
      }
    } catch (error) {
      console.error('Failed to load conversations:', error)
      // Fallback to local state
      const newConv = await createNewChat()
      if (newConv) {
        setCurrentConversation(newConv.id)
      }
    }
  }, [user, createNewChat, loadMessages])

  // Initialize auth and load conversations
  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      if (state.user && conversations.length === 0) {
        loadConversations()
      }
    })
    return unsubscribe
  }, [conversations.length, loadConversations])

  const messages = conversations.find(c => c.id === currentConversation)?.messages || []

  const sendMessage = useCallback(async (content: string, processedFiles?: ProcessedFile[]) => {
    if (!content.trim() || !user) return

    // Prepare enhanced content with file information
    let enhancedContent = content
    if (processedFiles && processedFiles.length > 0) {
      const fileInfo = processedFiles.map(pf => {
        if (pf.error) return `[File: ${pf.file.name} - Error: ${pf.error}]`
        if (pf.content) return `[File: ${pf.file.name} (${pf.type})]\n${pf.content}\n[End of file]`
        if (pf.type === 'image') return `[Image: ${pf.file.name}]`
        return `[File: ${pf.file.name} - ${pf.type}]`
      }).join('\n\n')
      
      enhancedContent = `${content}\n\n${fileInfo}`
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
      attachments: processedFiles?.map(pf => ({
        id: Date.now().toString(),
        name: pf.file.name,
        type: pf.file.type,
        size: pf.file.size,
        url: pf.preview || URL.createObjectURL(pf.file)
      }))
    }

    // Add user message to UI immediately
    setConversations(prev => prev.map(conv => 
      conv.id === currentConversation 
        ? { ...conv, messages: [...conv.messages, userMessage], updatedAt: new Date() }
        : conv
    ))

    setIsLoading(true)

    try {
      // Save user message to database
      await blink.db.messages.create({
        id: userMessage.id,
        conversationId: currentConversation,
        role: 'user',
        content,
        timestamp: userMessage.timestamp.toISOString(),
        userId: user.id
      })

      // Create assistant message placeholder
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }

      // Add empty assistant message to UI for streaming
      setConversations(prev => prev.map(conv => 
        conv.id === currentConversation 
          ? { ...conv, messages: [...conv.messages, assistantMessage], updatedAt: new Date() }
          : conv
      ))

      let fullResponse = ''

      // Determine the best model using auto-routing
      const hasFiles = processedFiles && processedFiles.length > 0
      const conversationLength = messages.length
      const selectedModel = await routeMessage(enhancedContent, hasFiles, conversationLength)

      // Generate AI response using Blink AI with streaming
      await blink.ai.streamText(
        {
          prompt: enhancedContent,
          model: selectedModel,
          maxTokens: 2000
        },
        (chunk) => {
          fullResponse += chunk
          // Update the assistant message in real-time
          setConversations(prev => prev.map(conv => 
            conv.id === currentConversation 
              ? { 
                  ...conv, 
                  messages: conv.messages.map(msg => 
                    msg.id === assistantMessage.id 
                      ? { ...msg, content: fullResponse }
                      : msg
                  ),
                  updatedAt: new Date() 
                }
              : conv
          ))
        }
      )

      // Save assistant message to database
      await blink.db.messages.create({
        id: assistantMessage.id,
        conversationId: currentConversation,
        role: 'assistant',
        content: fullResponse,
        timestamp: assistantMessage.timestamp.toISOString(),
        userId: user.id
      })

      // Update conversation title if it's the first message
      const currentConv = conversations.find(c => c.id === currentConversation)
      if (currentConv && currentConv.messages.length <= 1) {
        const title = content.slice(0, 50) + (content.length > 50 ? '...' : '')
        await blink.db.conversations.update(currentConversation, { title })
        setConversations(prev => prev.map(conv => 
          conv.id === currentConversation ? { ...conv, title } : conv
        ))
      }

    } catch (error) {
      console.error('Failed to send message:', error)
      // Fallback to mock response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, but I'm having trouble connecting to the AI service right now. This is a fallback response to show the chat interface is working.",
        timestamp: new Date()
      }

      setConversations(prev => prev.map(conv => 
        conv.id === currentConversation 
          ? { ...conv, messages: [...conv.messages, assistantMessage], updatedAt: new Date() }
          : conv
      ))
    } finally {
      setIsLoading(false)
    }
  }, [currentConversation, user, conversations, messages.length, routeMessage])

  const selectConversation = useCallback((id: string) => {
    setCurrentConversation(id)
    loadMessages(id)
  }, [loadMessages])

  const deleteConversation = useCallback(async (id: string) => {
    try {
      await blink.db.conversations.delete(id)
      await blink.db.messages.list({ where: { conversationId: id } }).then(messages => {
        messages.forEach(msg => blink.db.messages.delete(msg.id))
      })
    } catch (error) {
      console.error('Failed to delete conversation:', error)
    }

    setConversations(prev => prev.filter(conv => conv.id !== id))
    if (currentConversation === id) {
      const remaining = conversations.filter(conv => conv.id !== id)
      if (remaining.length > 0) {
        setCurrentConversation(remaining[0].id)
        loadMessages(remaining[0].id)
      } else {
        createNewChat()
      }
    }
  }, [currentConversation, conversations, createNewChat, loadMessages])

  return {
    conversations,
    currentConversation,
    messages,
    isLoading,
    sendMessage,
    createNewChat,
    selectConversation,
    deleteConversation
  }
}