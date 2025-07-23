import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Send, 
  Paperclip, 
  FileText,
  Image as ImageIcon,
  Code,
  X,
  Loader2
} from 'lucide-react'
import { useFileProcessing, ProcessedFile } from '@/hooks/useFileProcessing'

interface MessageInputProps {
  onSendMessage: (content: string, processedFiles?: ProcessedFile[]) => void
  isLoading: boolean
  placeholder?: string
}

export function MessageInput({ onSendMessage, isLoading, placeholder = "Message Claude..." }: MessageInputProps) {
  const [input, setInput] = useState('')
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { processFiles, isProcessing } = useFileProcessing()

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 128)}px`
    }
  }, [input])

  const handleSend = () => {
    if (!input.trim() && processedFiles.length === 0) return
    
    onSendMessage(input, processedFiles)
    setInput('')
    setProcessedFiles([])
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      const processed = await processFiles(files)
      setProcessedFiles(prev => [...prev, ...processed])
    }
  }

  const removeAttachment = (index: number) => {
    setProcessedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const getFileIcon = (processedFile: ProcessedFile) => {
    if (processedFile.type === 'image') return <ImageIcon className="h-3 w-3" />
    if (processedFile.type === 'code') return <Code className="h-3 w-3" />
    return <FileText className="h-3 w-3" />
  }

  return (
    <div className="border-t border-border bg-background">
      <div className="max-w-4xl mx-auto p-4">
        {/* Attachments */}
        {processedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {processedFiles.map((processedFile, index) => (
              <Badge
                key={index}
                variant={processedFile.error ? "destructive" : "secondary"}
                className="flex items-center gap-2 px-2 py-1 text-xs"
              >
                {processedFile.error ? (
                  <X className="h-3 w-3" />
                ) : (
                  getFileIcon(processedFile)
                )}
                <span className="max-w-32 truncate">
                  {processedFile.file.name}
                  {processedFile.error && ` (${processedFile.error})`}
                </span>
                <button
                  onClick={() => removeAttachment(index)}
                  className="ml-1 hover:text-destructive transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Processing indicator */}
        {isProcessing && (
          <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing files...
          </div>
        )}

        {/* Input */}
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="min-h-[44px] max-h-32 resize-none pr-12 border-2 focus:border-primary/50 transition-colors"
              disabled={isLoading || isProcessing}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="absolute right-2 bottom-2 p-1 h-auto hover:bg-muted"
              disabled={isLoading || isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Paperclip className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <Button
            onClick={handleSend}
            disabled={(!input.trim() && processedFiles.length === 0) || isLoading || isProcessing}
            size="sm"
            className="px-4 bg-primary hover:bg-primary/90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.txt,.pdf,.doc,.docx,.json,.csv,.js,.ts,.jsx,.tsx,.py,.html,.css,.md"
        />
      </div>
    </div>
  )
}