import React, { useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { Keyboard, Command } from 'lucide-react'

interface KeyboardShortcutsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Shortcut {
  keys: string[]
  description: string
  category: string
}

const shortcuts: Shortcut[] = [
  // Navigation
  { keys: ['Ctrl', 'N'], description: 'New chat', category: 'Navigation' },
  { keys: ['Ctrl', 'K'], description: 'Search conversations', category: 'Navigation' },
  { keys: ['Ctrl', 'B'], description: 'Toggle sidebar', category: 'Navigation' },
  { keys: ['Ctrl', 'Shift', 'B'], description: 'Toggle artifacts panel', category: 'Navigation' },
  { keys: ['Ctrl', '1'], description: 'Switch to Chats tab', category: 'Navigation' },
  { keys: ['Ctrl', '2'], description: 'Switch to Projects tab', category: 'Navigation' },
  
  // Chat
  { keys: ['Enter'], description: 'Send message', category: 'Chat' },
  { keys: ['Shift', 'Enter'], description: 'New line in message', category: 'Chat' },
  { keys: ['Ctrl', 'Enter'], description: 'Send message (alternative)', category: 'Chat' },
  { keys: ['Ctrl', 'R'], description: 'Regenerate last response', category: 'Chat' },
  { keys: ['Ctrl', 'D'], description: 'Delete current conversation', category: 'Chat' },
  
  // Editing
  { keys: ['Ctrl', 'C'], description: 'Copy message', category: 'Editing' },
  { keys: ['Ctrl', 'A'], description: 'Select all text', category: 'Editing' },
  { keys: ['Ctrl', 'Z'], description: 'Undo', category: 'Editing' },
  { keys: ['Ctrl', 'Y'], description: 'Redo', category: 'Editing' },
  
  // Export & Settings
  { keys: ['Ctrl', 'E'], description: 'Export conversation', category: 'Export' },
  { keys: ['Ctrl', ','], description: 'Open settings', category: 'Settings' },
  { keys: ['Ctrl', '/'], description: 'Show keyboard shortcuts', category: 'Settings' },
  { keys: ['Escape'], description: 'Close dialogs', category: 'Settings' },
]

export function KeyboardShortcuts({ open, onOpenChange }: KeyboardShortcutsProps) {
  const categories = [...new Set(shortcuts.map(s => s.category))]

  const formatKey = (key: string) => {
    const keyMap: Record<string, string> = {
      'Ctrl': '⌘',
      'Shift': '⇧',
      'Alt': '⌥',
      'Enter': '↵',
      'Escape': 'Esc',
      'Backspace': '⌫',
      'Delete': '⌦',
      'Tab': '⇥',
      'Space': '␣'
    }
    
    return keyMap[key] || key
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {categories.map((category) => (
            <div key={category}>
              <h3 className="font-semibold text-sm text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wide">
                {category}
              </h3>
              
              <div className="space-y-2">
                {shortcuts
                  .filter(shortcut => shortcut.category === category)
                  .map((shortcut, index) => (
                    <div key={index} className="flex items-center justify-between py-2">
                      <span className="text-sm">{shortcut.description}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <React.Fragment key={keyIndex}>
                            <Badge variant="outline" className="px-2 py-1 text-xs font-mono">
                              {formatKey(key)}
                            </Badge>
                            {keyIndex < shortcut.keys.length - 1 && (
                              <span className="text-xs text-gray-400 mx-1">+</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
              
              {category !== categories[categories.length - 1] && (
                <Separator className="mt-4" />
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Command className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Pro Tip</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Most shortcuts work globally throughout the app. Press <Badge variant="outline" className="mx-1 px-1 py-0 text-xs">Ctrl + /</Badge> anytime to view this help.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}