export function TypingIndicator() {
  return (
    <div className="flex gap-4 message-enter">
      <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center flex-shrink-0 mt-1">
        <span className="text-primary-foreground text-sm font-bold">C</span>
      </div>
      
      <div className="max-w-3xl">
        <div className="bg-muted rounded-lg p-4">
          <div className="typing-dots">
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground mt-2">
          Claude is typing...
        </div>
      </div>
    </div>
  )
}