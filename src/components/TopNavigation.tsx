import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Menu, 
  Sun, 
  Moon, 
  Settings, 
  PanelLeftOpen, 
  PanelLeftClose,
  PanelRightOpen,
  PanelRightClose,
  Keyboard,
  HelpCircle,
  Zap,
  User,
  LogOut,
  Download,
  Search
} from 'lucide-react'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { KeyboardShortcuts } from './KeyboardShortcuts'

interface TopNavigationProps {
  darkMode: boolean
  setDarkMode: (dark: boolean) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  artifactsPanelOpen: boolean
  setArtifactsPanelOpen: (open: boolean) => void
  onSearch?: () => void
  onExport?: () => void
}

const models = [
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    badge: 'Latest',
    description: 'Most capable model for complex tasks'
  },
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    badge: 'Pro',
    description: 'Highest performance for demanding tasks'
  },
  {
    id: 'claude-3-haiku',
    name: 'Claude 3 Haiku',
    badge: 'Fast',
    description: 'Quick responses for simple tasks'
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    badge: 'OpenAI',
    description: 'Fast and efficient for most tasks'
  }
]

export function TopNavigation({
  darkMode,
  setDarkMode,
  sidebarOpen,
  setSidebarOpen,
  artifactsPanelOpen,
  setArtifactsPanelOpen,
  onSearch,
  onExport
}: TopNavigationProps) {
  const [selectedModel, setSelectedModel] = useState('claude-3-5-sonnet')
  const [shortcutsOpen, setShortcutsOpen] = useState(false)

  const currentModel = models.find(m => m.id === selectedModel)

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 h-14 bg-background border-b border-border flex items-center justify-between px-4">
        {/* Left Section */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2"
            title={`${sidebarOpen ? 'Hide' : 'Show'} sidebar (Ctrl+B)`}
          >
            {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </Button>
          
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">C</span>
            </div>
            <span className="font-semibold text-lg">Claude</span>
          </div>
        </div>

        {/* Center Section - Enhanced Model Selector */}
        <div className="flex items-center gap-3">
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-56">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-orange-500" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              {models.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex flex-col items-start">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{model.name}</span>
                        <Badge 
                          variant={model.badge === 'Latest' ? 'default' : 'secondary'} 
                          className="text-xs"
                        >
                          {model.badge}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">{model.description}</span>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Quick Actions */}
          {onSearch && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSearch}
              className="p-2"
              title="Search conversations (Ctrl+K)"
            >
              <Search className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setArtifactsPanelOpen(!artifactsPanelOpen)}
            className="p-2"
            title={`${artifactsPanelOpen ? 'Hide' : 'Show'} artifacts panel (Ctrl+Shift+B)`}
          >
            {artifactsPanelOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDarkMode(!darkMode)}
            className="p-2"
            title="Toggle theme"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          
          {/* Settings Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2" title="Settings">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => setShortcutsOpen(true)}>
                <Keyboard className="h-4 w-4 mr-2" />
                Keyboard shortcuts
                <Badge variant="outline" className="ml-auto text-xs">Ctrl+/</Badge>
              </DropdownMenuItem>
              
              {onExport && (
                <DropdownMenuItem onClick={onExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export conversation
                  <Badge variant="outline" className="ml-auto text-xs">Ctrl+E</Badge>
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem>
                <HelpCircle className="h-4 w-4 mr-2" />
                Help & Support
              </DropdownMenuItem>
              
              <DropdownMenuItem>
                <User className="h-4 w-4 mr-2" />
                Account Settings
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem className="text-red-600">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Main Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2" title="Menu">
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>
                <div className="flex flex-col items-start">
                  <span className="font-medium">Claude Chat</span>
                  <span className="text-xs text-muted-foreground">v2.1.0</span>
                </div>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem>
                About Claude
              </DropdownMenuItem>
              
              <DropdownMenuItem>
                Privacy Policy
              </DropdownMenuItem>
              
              <DropdownMenuItem>
                Terms of Service
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcuts
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
      />
    </>
  )
}