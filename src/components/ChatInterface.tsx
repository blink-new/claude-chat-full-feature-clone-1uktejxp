import { useRef, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Message } from '@/types'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'
import { ProcessedFile } from '@/hooks/useFileProcessing'
import { LoadingMessage } from './LoadingMessage'
import { WelcomeScreen } from './WelcomeScreen'

interface ChatInterfaceProps {
  messages: Message[]
  isLoading: boolean
  onSendMessage: (content: string, processedFiles?: ProcessedFile[]) => void
  onCreateArtifact: (title: string, type: any, content: string, conversationId: string, messageId: string, language?: string) => string
  currentConversation: string
}

export function ChatInterface({
  messages,
  isLoading,
  onSendMessage,
  onCreateArtifact,
  currentConversation
}: ChatInterfaceProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages, isLoading])

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Messages Area */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 custom-scrollbar">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <WelcomeScreen onStartChat={(prompt) => onSendMessage(prompt)} />
          ) : (
            <>
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  onCreateArtifact={onCreateArtifact}
                  conversationId={currentConversation}
                />
              ))}
              {isLoading && <LoadingMessage />}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <MessageInput
        onSendMessage={onSendMessage}
        isLoading={isLoading}
        placeholder="Message Claude..."
      />
    </div>
  )
}