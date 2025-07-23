import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Copy, 
  Check, 
  Play, 
  Download,
  ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CodeBlockProps {
  code: string
  language?: string
  filename?: string
  onCreateArtifact?: (title: string, type: any, content: string, language?: string) => void
  className?: string
}

export function CodeBlock({ 
  code, 
  language = 'text', 
  filename,
  onCreateArtifact,
  className 
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCreateArtifact = () => {
    if (onCreateArtifact) {
      const title = filename || `${language} code`
      onCreateArtifact(title, 'code', code, language)
    }
  }

  const getFileExtension = (lang: string) => {
    const extensions: Record<string, string> = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      html: 'html',
      css: 'css',
      json: 'json',
      markdown: 'md',
      jsx: 'jsx',
      tsx: 'tsx',
      sql: 'sql',
      bash: 'sh',
      shell: 'sh'
    }
    return extensions[lang] || 'txt'
  }

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename || `code.${getFileExtension(language)}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const isExecutable = ['html', 'svg', 'javascript', 'typescript', 'jsx', 'tsx'].includes(language)

  return (
    <div className={cn("relative group", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border border-border rounded-t-lg">
        <div className="flex items-center gap-2">
          {language && (
            <Badge variant="outline" className="text-xs">
              {language}
            </Badge>
          )}
          {filename && (
            <span className="text-sm text-muted-foreground font-mono">
              {filename}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-8 px-2"
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
            onClick={handleDownload}
            className="h-8 px-2"
          >
            <Download className="h-3 w-3" />
          </Button>
          
          {isExecutable && onCreateArtifact && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCreateArtifact}
              className="h-8 px-2"
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Code Content */}
      <div className="relative">
        <pre className="bg-muted/30 border-x border-b border-border rounded-b-lg p-4 overflow-x-auto text-sm">
          <code className={`language-${language}`}>
            {code}
          </code>
        </pre>
      </div>
    </div>
  )
}