import { cn } from '@/lib/utils'

interface LoadingMessageProps {
  className?: string
}

export function LoadingMessage({ className }: LoadingMessageProps) {
  return (
    <div className={cn("group flex gap-4 message-enter justify-start", className)}>
      <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center flex-shrink-0 mt-1">
        <span className="text-primary-foreground text-sm font-bold">C</span>
      </div>
      
      <div className="max-w-3xl">
        <div className="rounded-lg p-4 bg-muted">
          <div className="flex items-center gap-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"></div>
            </div>
            <span className="text-sm text-muted-foreground">Claude is thinking...</span>
          </div>
        </div>
      </div>
    </div>
  )
}