import { useState } from 'react'
import { Message } from '@/types'
import { cn } from '@/lib/utils'
import { CodeBlock } from './CodeBlock'
import { MessageActions } from './MessageActions'
import { Badge } from '@/components/ui/badge'
import { 
  Code,
  FileText,
  Image as ImageIcon
} from 'lucide-react'

interface MessageBubbleProps {
  message: Message
  onCreateArtifact: (title: string, type: any, content: string, conversationId: string, messageId: string, language?: string) => string
  conversationId: string
}

export function MessageBubble({ message, onCreateArtifact, conversationId }: MessageBubbleProps) {
  const renderInlineFormatting = (text: string) => {
    // Handle inline code, bold, italic, and lists
    const elements = []
    let lastIndex = 0

    // Process inline code first
    const inlineCodeRegex = /`([^`]+)`/g
    let match
    while ((match = inlineCodeRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        elements.push(text.slice(lastIndex, match.index))
      }
      elements.push(
        <code key={match.index} className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
          {match[1]}
        </code>
      )
      lastIndex = match.index + match[0].length
    }

    if (lastIndex < text.length) {
      elements.push(text.slice(lastIndex))
    }

    if (elements.length > 1) {
      return elements
    }

    // If no inline code, process other formatting
    const result = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^[•\-*]\s+(.+)$/gm, '• $1')

    if (result !== text) {
      return <span dangerouslySetInnerHTML={{ __html: result }} />
    }

    return text
  }

  const renderContent = (content: string) => {
    // Enhanced markdown-like rendering for code blocks, lists, and formatting
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g
    
    const parts = []
    let lastIndex = 0
    let match

    // Process code blocks first
    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block (with inline formatting)
      if (match.index > lastIndex) {
        const textBefore = content.slice(lastIndex, match.index)
        parts.push(
          <span key={lastIndex} className="whitespace-pre-wrap">
            {renderInlineFormatting(textBefore)}
          </span>
        )
      }

      // Add code block
      const language = match[1] || 'text'
      const code = match[2].trim()
      parts.push(
        <div key={match.index} className="my-4">
          <CodeBlock
            code={code}
            language={language}
            onCreateArtifact={(title, type, content, lang) => 
              onCreateArtifact(title, type, content, conversationId, message.id, lang)
            }
          />
        </div>
      )

      lastIndex = match.index + match[0].length
    }

    // Add remaining text with inline formatting
    if (lastIndex < content.length) {
      const remainingText = content.slice(lastIndex)
      parts.push(
        <span key={lastIndex} className="whitespace-pre-wrap">
          {renderInlineFormatting(remainingText)}
        </span>
      )
    }

    return parts.length > 0 ? parts : (
      <span className="whitespace-pre-wrap">
        {renderInlineFormatting(content)}
      </span>
    )
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />
    if (type.includes('text') || type.includes('json')) return <FileText className="h-4 w-4" />
    if (type.includes('code')) return <Code className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  return (
    <div className={cn(
      "group flex gap-4 message-enter",
      message.role === 'user' ? 'justify-end' : 'justify-start'
    )}>
      {message.role === 'assistant' && (
        <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center flex-shrink-0 mt-1">
          <span className="text-primary-foreground text-sm font-bold">C</span>
        </div>
      )}
      
      <div className={cn(
        "max-w-3xl",
        message.role === 'user' ? 'order-first' : ''
      )}>
        {/* Message Content */}
        <div className={cn(
          "rounded-lg p-4",
          message.role === 'user' 
            ? 'bg-primary text-primary-foreground ml-auto' 
            : 'bg-muted'
        )}>
          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mb-3 space-y-2">
              {message.attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center gap-2 p-2 bg-background/10 rounded">
                  {getFileIcon(attachment.type)}
                  <span className="text-sm">{attachment.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {(attachment.size / 1024).toFixed(1)}KB
                  </Badge>
                </div>
              ))}
            </div>
          )}
          
          {/* Text Content */}
          <div className="text-sm leading-relaxed">
            {renderContent(message.content)}
          </div>
        </div>

        {/* Message Actions */}
        {message.role === 'assistant' && (
          <div className="mt-2">
            <MessageActions
              content={message.content}
              messageId={message.id}
              onFeedback={(type) => console.log(`Feedback: ${type} for message ${message.id}`)}
            />
          </div>
        )}

        {/* Timestamp */}
        <div className="text-xs text-muted-foreground mt-2">
          {message.timestamp.toLocaleTimeString()}
        </div>
      </div>

      {message.role === 'user' && (
        <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
          <span className="text-secondary-foreground text-sm font-medium">U</span>
        </div>
      )}
    </div>
  )
}