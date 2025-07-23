import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Search, 
  MessageSquare, 
  Folder, 
  MoreHorizontal,
  Trash2,
  Edit3,
  Download,
  SearchIcon
} from 'lucide-react'
import { Conversation, Project } from '@/types'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SearchDialog } from './SearchDialog'
import { ExportDialog } from './ExportDialog'

interface SidebarProps {
  open: boolean
  conversations: Conversation[]
  currentConversation: string
  projects: Project[]
  currentProject: string
  onNewChat: () => void
  onSelectConversation: (id: string) => void
  onDeleteConversation: (id: string) => void
  onCreateProject: (name: string, description?: string) => void
  onSelectProject: (id: string) => void
  onDeleteProject: (id: string) => void
}

export function Sidebar({
  open,
  conversations,
  currentConversation,
  projects,
  currentProject,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  onCreateProject,
  onSelectProject,
  onDeleteProject
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'chats' | 'projects'>('chats')
  const [searchDialogOpen, setSearchDialogOpen] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [selectedConversationForExport, setSelectedConversationForExport] = useState<Conversation | null>(null)

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleExportConversation = (conversation: Conversation) => {
    setSelectedConversationForExport(conversation)
    setExportDialogOpen(true)
  }

  if (!open) return null

  return (
    <>
      <div className="w-80 bg-muted/30 border-r border-border flex flex-col h-full">
        {/* Header */}
        <div className="p-4 space-y-4">
          <Button 
            onClick={onNewChat}
            className="w-full justify-start gap-2"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>

          {/* Search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchDialogOpen(true)}
              className="px-3"
              title="Advanced Search"
            >
              <SearchIcon className="h-4 w-4" />
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex bg-muted rounded-lg p-1">
            <Button
              variant={activeTab === 'chats' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('chats')}
              className="flex-1"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Chats
            </Button>
            <Button
              variant={activeTab === 'projects' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('projects')}
              className="flex-1"
            >
              <Folder className="h-4 w-4 mr-2" />
              Projects
            </Button>
          </div>
        </div>

        <Separator />

        {/* Content */}
        <ScrollArea className="flex-1 custom-scrollbar">
          {activeTab === 'chats' ? (
            <div className="p-2 space-y-1">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={cn(
                    "group flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors",
                    currentConversation === conversation.id && "bg-accent"
                  )}
                  onClick={() => onSelectConversation(conversation.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm font-medium truncate">
                        {conversation.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {conversation.messages?.length || 0} messages
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(conversation.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 p-1 h-auto"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        handleExportConversation(conversation)
                      }}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit3 className="h-4 w-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteConversation(conversation.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
              
              {filteredConversations.length === 0 && searchQuery && (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No conversations found</p>
                  <p className="text-xs">Try different keywords</p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className={cn(
                    "group flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors",
                    currentProject === project.id && "bg-accent"
                  )}
                  onClick={() => onSelectProject(project.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm font-medium truncate">
                        {project.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {project.conversations?.length || 0} chats
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(project.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  {project.id !== '1' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 p-1 h-auto"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit3 className="h-4 w-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeleteProject(project.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ))}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCreateProject('New Project')}
                className="w-full justify-start gap-2 mt-2"
              >
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Dialogs */}
      <SearchDialog
        open={searchDialogOpen}
        onOpenChange={setSearchDialogOpen}
        onSelectConversation={onSelectConversation}
      />
      
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        conversation={selectedConversationForExport}
      />
    </>
  )
}