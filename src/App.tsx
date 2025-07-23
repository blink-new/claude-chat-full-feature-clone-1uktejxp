import { useState, useEffect, useCallback } from 'react'
import { Toaster } from '@/components/ui/toaster'
import { ChatInterface } from '@/components/ChatInterface'
import { Sidebar } from '@/components/Sidebar'
import { ArtifactsPanel } from '@/components/ArtifactsPanel'
import { TopNavigation } from '@/components/TopNavigation'
import { SearchDialog } from '@/components/SearchDialog'
import { ExportDialog } from '@/components/ExportDialog'
import { KeyboardShortcuts } from '@/components/KeyboardShortcuts'
import { ProjectManager } from '@/components/ProjectManager'
import { TemplateManager } from '@/components/TemplateManager'
import { useChat } from '@/hooks/useChat'
import { useProjects } from '@/hooks/useProjects'
import { useArtifacts } from '@/hooks/useArtifacts'
import { useAdvancedProjects } from '@/hooks/useAdvancedProjects'
import { useTeamCollaboration } from '@/hooks/useTeamCollaboration'
import type { Conversation } from '@/types'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [artifactsPanelOpen, setArtifactsPanelOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [searchDialogOpen, setSearchDialogOpen] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [shortcutsDialogOpen, setShortcutsDialogOpen] = useState(false)
  const [projectManagerOpen, setProjectManagerOpen] = useState(false)
  const [templateManagerOpen, setTemplateManagerOpen] = useState(false)
  const [selectedConversationForExport, setSelectedConversationForExport] = useState<Conversation | null>(null)
  
  const { 
    conversations, 
    currentConversation, 
    messages, 
    isLoading,
    sendMessage,
    createNewChat,
    selectConversation,
    deleteConversation
  } = useChat()
  
  const {
    projects,
    currentProject,
    createProject,
    selectProject,
    deleteProject
  } = useProjects()
  
  const {
    artifacts,
    currentArtifact,
    createArtifact,
    selectArtifact,
    updateArtifact
  } = useArtifacts()

  // Advanced features hooks
  const advancedProjects = useAdvancedProjects()
  const teamCollaboration = useTeamCollaboration()

  // Keyboard shortcuts handler
  const handleKeyboardShortcuts = useCallback((event: KeyboardEvent) => {
    const { ctrlKey, metaKey, shiftKey, key } = event
    const isModifier = ctrlKey || metaKey

    // Prevent shortcuts when typing in inputs
    const target = event.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
      // Only allow specific shortcuts in inputs
      if (isModifier && key === '/') {
        event.preventDefault()
        setShortcutsDialogOpen(true)
      }
      return
    }

    if (isModifier) {
      switch (key) {
        case 'n':
          event.preventDefault()
          createNewChat()
          break
        case 'k':
          event.preventDefault()
          setSearchDialogOpen(true)
          break
        case 'b':
          event.preventDefault()
          if (shiftKey) {
            setArtifactsPanelOpen(!artifactsPanelOpen)
          } else {
            setSidebarOpen(!sidebarOpen)
          }
          break
        case 'e':
          event.preventDefault()
          if (currentConversation) {
            const conversation = conversations.find(c => c.id === currentConversation)
            if (conversation) {
              setSelectedConversationForExport(conversation)
              setExportDialogOpen(true)
            }
          }
          break
        case 'd':
          event.preventDefault()
          if (currentConversation) {
            deleteConversation(currentConversation)
          }
          break
        case '1':
          event.preventDefault()
          // Switch to chats tab - would need to pass this to sidebar
          break
        case '2':
          event.preventDefault()
          // Switch to projects tab - would need to pass this to sidebar
          break
        case 'p':
          event.preventDefault()
          if (shiftKey) {
            setProjectManagerOpen(true)
          }
          break
        case 't':
          event.preventDefault()
          if (shiftKey) {
            setTemplateManagerOpen(true)
          }
          break
        case '/':
          event.preventDefault()
          setShortcutsDialogOpen(true)
          break
      }
    }

    // Escape key to close dialogs
    if (key === 'Escape') {
      setSearchDialogOpen(false)
      setExportDialogOpen(false)
      setShortcutsDialogOpen(false)
      setProjectManagerOpen(false)
      setTemplateManagerOpen(false)
    }
  }, [
    currentConversation,
    conversations,
    artifactsPanelOpen,
    sidebarOpen,
    createNewChat,
    deleteConversation
  ])

  // Set up keyboard shortcuts
  useEffect(() => {
    document.addEventListener('keydown', handleKeyboardShortcuts)
    return () => document.removeEventListener('keydown', handleKeyboardShortcuts)
  }, [handleKeyboardShortcuts])

  // Handle search from top navigation
  const handleSearch = useCallback(() => {
    setSearchDialogOpen(true)
  }, [])

  // Handle export from top navigation
  const handleExport = useCallback(() => {
    if (currentConversation) {
      const conversation = conversations.find(c => c.id === currentConversation)
      if (conversation) {
        setSelectedConversationForExport(conversation)
        setExportDialogOpen(true)
      }
    }
  }, [currentConversation, conversations])

  return (
    <div className={`h-screen flex flex-col ${darkMode ? 'dark' : ''}`}>
      <div className="flex-1 flex bg-background text-foreground">
        {/* Top Navigation */}
        <TopNavigation 
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          artifactsPanelOpen={artifactsPanelOpen}
          setArtifactsPanelOpen={setArtifactsPanelOpen}
          onSearch={handleSearch}
          onExport={currentConversation ? handleExport : undefined}
          onOpenProjectManager={() => setProjectManagerOpen(true)}
          onOpenTemplateManager={() => setTemplateManagerOpen(true)}
        />
        
        {/* Main Layout */}
        <div className="flex-1 flex pt-14">
          {/* Left Sidebar */}
          <Sidebar
            open={sidebarOpen}
            conversations={conversations}
            currentConversation={currentConversation}
            projects={projects}
            currentProject={currentProject}
            onNewChat={createNewChat}
            onSelectConversation={selectConversation}
            onDeleteConversation={deleteConversation}
            onCreateProject={createProject}
            onSelectProject={selectProject}
            onDeleteProject={deleteProject}
          />
          
          {/* Main Chat Area */}
          <div className="flex-1 flex">
            <ChatInterface
              messages={messages}
              isLoading={isLoading}
              onSendMessage={sendMessage}
              onCreateArtifact={createArtifact}
              currentConversation={currentConversation}
            />
            
            {/* Right Artifacts Panel */}
            {artifactsPanelOpen && (
              <ArtifactsPanel
                artifacts={artifacts}
                currentArtifact={currentArtifact}
                onSelectArtifact={selectArtifact}
                onUpdateArtifact={updateArtifact}
                onClose={() => setArtifactsPanelOpen(false)}
              />
            )}
          </div>
        </div>
      </div>
      
      {/* Dialogs */}
      <SearchDialog
        open={searchDialogOpen}
        onOpenChange={setSearchDialogOpen}
        onSelectConversation={selectConversation}
      />
      
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        conversation={selectedConversationForExport}
      />
      
      <KeyboardShortcuts
        open={shortcutsDialogOpen}
        onOpenChange={setShortcutsDialogOpen}
      />

      <ProjectManager
        open={projectManagerOpen}
        onOpenChange={setProjectManagerOpen}
        {...advancedProjects}
      />

      <TemplateManager
        open={templateManagerOpen}
        onOpenChange={setTemplateManagerOpen}
      />
      
      <Toaster />
    </div>
  )
}

export default App