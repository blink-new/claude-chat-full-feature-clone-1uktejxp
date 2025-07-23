import React, { useState, useEffect } from 'react'
import { Search, X, MessageSquare, Calendar, User } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { ScrollArea } from './ui/scroll-area'
import { blink } from '../blink/client'
import type { Message, Conversation } from '../types'

interface SearchResult {
  id: string
  conversationId: string
  conversationTitle: string
  content: string
  role: 'user' | 'assistant'
  timestamp: string
  snippet: string
}

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectConversation: (conversationId: string) => void
}

export function SearchDialog({ open, onOpenChange, onSelectConversation }: SearchDialogProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem('claude-recent-searches')
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  const saveRecentSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return
    
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('claude-recent-searches', JSON.stringify(updated))
  }

  const searchMessages = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const user = await blink.auth.me()
      
      // Search in messages
      const messages = await blink.db.messages.list({
        where: {
          AND: [
            { userId: user.id },
            { 
              OR: [
                { content: { contains: searchQuery } },
                { role: { contains: searchQuery } }
              ]
            }
          ]
        },
        orderBy: { createdAt: 'desc' },
        limit: 50
      })

      // Get conversation titles
      const conversationIds = [...new Set(messages.map(m => m.conversationId))]
      const conversations = await blink.db.conversations.list({
        where: {
          AND: [
            { userId: user.id },
            { id: { in: conversationIds } }
          ]
        }
      })

      const conversationMap = new Map(conversations.map(c => [c.id, c]))

      const searchResults: SearchResult[] = messages.map(message => {
        const conversation = conversationMap.get(message.conversationId)
        const snippet = message.content.length > 150 
          ? message.content.substring(0, 150) + '...'
          : message.content

        return {
          id: message.id,
          conversationId: message.conversationId,
          conversationTitle: conversation?.title || 'Untitled Conversation',
          content: message.content,
          role: message.role as 'user' | 'assistant',
          timestamp: message.createdAt,
          snippet
        }
      })

      setResults(searchResults)
      saveRecentSearch(searchQuery)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery)
    searchMessages(searchQuery)
  }

  const handleSelectResult = (result: SearchResult) => {
    onSelectConversation(result.conversationId)
    onOpenChange(false)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return 'Today'
    if (diffDays === 2) return 'Yesterday'
    if (diffDays <= 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search Conversations
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search messages, conversations..."
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-10"
              autoFocus
            />
            {query && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => {
                  setQuery('')
                  setResults([])
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Recent Searches */}
          {!query && recentSearches.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Recent Searches</h3>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((search, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                    onClick={() => handleSearch(search)}
                  >
                    {search}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          <ScrollArea className="h-96">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                <span className="ml-2 text-sm text-gray-600">Searching...</span>
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-3">
                {results.map((result) => (
                  <div
                    key={result.id}
                    className="p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                    onClick={() => handleSelectResult(result)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-sm">{result.conversationTitle}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {formatDate(result.timestamp)}
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2 mb-2">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3 text-gray-400" />
                        <Badge variant={result.role === 'user' ? 'default' : 'secondary'} className="text-xs">
                          {result.role === 'user' ? 'You' : 'Claude'}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                      {result.snippet}
                    </p>
                  </div>
                ))}
              </div>
            ) : query && !loading ? (
              <div className="text-center py-8 text-gray-500">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No messages found for "{query}"</p>
                <p className="text-sm mt-1">Try different keywords or check your spelling</p>
              </div>
            ) : null}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}