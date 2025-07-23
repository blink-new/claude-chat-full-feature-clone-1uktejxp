import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Copy, 
  Check, 
  ThumbsUp, 
  ThumbsDown, 
  RotateCcw,
  Share,
  MoreHorizontal
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface MessageActionsProps {
  content: string
  messageId: string
  onRegenerate?: () => void
  onFeedback?: (type: 'positive' | 'negative') => void
  className?: string
}

export function MessageActions({ 
  content, 
  messageId, 
  onRegenerate, 
  onFeedback,
  className 
}: MessageActionsProps) {
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFeedback = (type: 'positive' | 'negative') => {
    setFeedback(type)
    onFeedback?.(type)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Claude Conversation',
          text: content,
        })
      } catch (error) {
        // Fallback to copy
        handleCopy()
      }
    } else {
      handleCopy()
    }
  }

  return (
    <div className={cn("flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="h-8 px-2 hover:bg-muted"
      >
        {copied ? (
          <Check className="h-3 w-3 text-green-500" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleFeedback('positive')}
        className={cn(
          "h-8 px-2 hover:bg-muted",
          feedback === 'positive' && "bg-green-100 text-green-600 hover:bg-green-100"
        )}
      >
        <ThumbsUp className="h-3 w-3" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleFeedback('negative')}
        className={cn(
          "h-8 px-2 hover:bg-muted",
          feedback === 'negative' && "bg-red-100 text-red-600 hover:bg-red-100"
        )}
      >
        <ThumbsDown className="h-3 w-3" />
      </Button>

      {onRegenerate && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRegenerate}
          className="h-8 px-2 hover:bg-muted"
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 hover:bg-muted"
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleShare}>
            <Share className="h-4 w-4 mr-2" />
            Share
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}