import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  Code, 
  FileText, 
  Image as ImageIcon,
  Download,
  Copy,
  Play,
  Eye,
  Edit3,
  ExternalLink,
  Maximize2
} from 'lucide-react'
import { Artifact } from '@/types'
import { cn } from '@/lib/utils'
import { CodeExecutor } from './CodeExecutor'

interface ArtifactsPanelProps {
  artifacts: Artifact[]
  currentArtifact: string | null
  onSelectArtifact: (id: string) => void
  onUpdateArtifact: (id: string, updates: Partial<Artifact>) => void
  onClose: () => void
}

export function ArtifactsPanel({
  artifacts,
  currentArtifact,
  onSelectArtifact,
  onUpdateArtifact,
  onClose
}: ArtifactsPanelProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'execute'>('preview')
  const [copied, setCopied] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const selectedArtifact = artifacts.find(a => a.id === currentArtifact)

  const getContentType = (type: Artifact['type']) => {
    switch (type) {
      case 'html': return 'text/html'
      case 'svg': return 'image/svg+xml'
      case 'code': return 'text/plain'
      case 'text': return 'text/plain'
      default: return 'text/plain'
    }
  }

  const getFileExtension = (type: Artifact['type']) => {
    switch (type) {
      case 'html': return 'html'
      case 'svg': return 'svg'
      case 'code': return 'txt'
      case 'text': return 'txt'
      default: return 'txt'
    }
  }

  const getArtifactIcon = (type: Artifact['type']) => {
    switch (type) {
      case 'code': return <Code className="h-4 w-4" />
      case 'html': return <Code className="h-4 w-4" />
      case 'svg': return <ImageIcon className="h-4 w-4" />
      case 'text': return <FileText className="h-4 w-4" />
      case 'mermaid': return <FileText className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const handleCopy = async () => {
    if (selectedArtifact) {
      await navigator.clipboard.writeText(selectedArtifact.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownload = () => {
    if (!selectedArtifact) return

    const blob = new Blob([selectedArtifact.content], { 
      type: getContentType(selectedArtifact.type) 
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedArtifact.title}.${getFileExtension(selectedArtifact.type)}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const openInNewTab = () => {
    if (!selectedArtifact || selectedArtifact.type !== 'html') return

    const blob = new Blob([selectedArtifact.content], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }

  const renderPreview = (artifact: Artifact) => {
    switch (artifact.type) {
      case 'html':
        return (
          <iframe
            srcDoc={artifact.content}
            className="w-full h-full border-0 bg-white"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            title={artifact.title}
          />
        )
      case 'svg':
        return (
          <div className="w-full h-full flex items-center justify-center bg-white p-4">
            <div 
              className="max-w-full max-h-full"
              dangerouslySetInnerHTML={{ __html: artifact.content }}
            />
          </div>
        )
      case 'code':
        return (
          <ScrollArea className="h-full">
            <pre className="p-4 text-sm overflow-auto bg-muted/30 font-mono">
              <code className={`language-${artifact.language || 'text'}`}>
                {artifact.content}
              </code>
            </pre>
          </ScrollArea>
        )
      case 'text':
      case 'mermaid':
        return (
          <ScrollArea className="h-full">
            <div className="p-4 text-sm whitespace-pre-wrap">
              {artifact.content}
            </div>
          </ScrollArea>
        )
      default:
        return (
          <ScrollArea className="h-full">
            <div className="p-4 text-sm whitespace-pre-wrap font-mono bg-muted/30">
              {artifact.content}
            </div>
          </ScrollArea>
        )
    }
  }

  const canExecute = (artifact: Artifact) => {
    return ['javascript', 'typescript', 'python'].includes(artifact.language || '') || 
           artifact.type === 'html'
  }

  return (
    <div className={cn(
      "bg-background border-l border-border flex flex-col h-full artifact-panel-enter",
      isFullscreen ? "fixed inset-0 z-50 w-full" : "w-96"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Code className="h-5 w-5" />
          <span className="font-semibold">Artifacts</span>
          <Badge variant="secondary" className="text-xs">
            {artifacts.length}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          {selectedArtifact && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onClose} className="p-1">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {artifacts.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-center p-6">
          <div>
            <Code className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">No artifacts yet</h3>
            <p className="text-sm text-muted-foreground">
              Artifacts will appear here when Claude creates code, documents, or other content.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Artifacts List */}
          {!isFullscreen && (
            <div className="border-b border-border">
              <ScrollArea className="h-48 custom-scrollbar">
                <div className="p-2 space-y-1">
                  {artifacts.map((artifact) => (
                    <div
                      key={artifact.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors",
                        currentArtifact === artifact.id && "bg-accent"
                      )}
                      onClick={() => onSelectArtifact(artifact.id)}
                    >
                      {getArtifactIcon(artifact.type)}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {artifact.title}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {artifact.type}
                          </Badge>
                          {artifact.language && (
                            <Badge variant="outline" className="text-xs">
                              {artifact.language}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Artifact Viewer */}
          {selectedArtifact && (
            <div className="flex-1 flex flex-col">
              {/* Artifact Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-2 mb-2">
                  {getArtifactIcon(selectedArtifact.type)}
                  <span className="font-medium text-sm truncate">
                    {selectedArtifact.title}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {selectedArtifact.type}
                  </Badge>
                  {selectedArtifact.language && (
                    <Badge variant="outline" className="text-xs">
                      {selectedArtifact.language}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">
                    {selectedArtifact.updatedAt.toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 p-2 border-b border-border">
                <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 px-2">
                  <Copy className="h-3 w-3" />
                  {copied && <span className="ml-1 text-xs">Copied!</span>}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleDownload} className="h-7 px-2">
                  <Download className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 px-2">
                  <Edit3 className="h-3 w-3" />
                </Button>
                {selectedArtifact.type === 'html' && (
                  <Button variant="ghost" size="sm" onClick={openInNewTab} className="h-7 px-2">
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Content Tabs */}
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
                <TabsList className={cn(
                  "grid mx-4 mt-2",
                  canExecute(selectedArtifact) ? "grid-cols-3" : "grid-cols-2"
                )}>
                  <TabsTrigger value="preview" className="flex items-center gap-2">
                    <Eye className="h-3 w-3" />
                    Preview
                  </TabsTrigger>
                  <TabsTrigger value="code" className="flex items-center gap-2">
                    <Code className="h-3 w-3" />
                    Code
                  </TabsTrigger>
                  {canExecute(selectedArtifact) && (
                    <TabsTrigger value="execute" className="flex items-center gap-2">
                      <Play className="h-3 w-3" />
                      Execute
                    </TabsTrigger>
                  )}
                </TabsList>
                
                <TabsContent value="preview" className="flex-1 m-4 mt-2">
                  <div className="h-full border border-border rounded-lg overflow-hidden">
                    {renderPreview(selectedArtifact)}
                  </div>
                </TabsContent>
                
                <TabsContent value="code" className="flex-1 m-4 mt-2">
                  <div className="h-full border border-border rounded-lg overflow-hidden">
                    <ScrollArea className="h-full">
                      <pre className="p-4 text-sm bg-muted/30 font-mono">
                        <code className={`language-${selectedArtifact.language || 'text'}`}>
                          {selectedArtifact.content}
                        </code>
                      </pre>
                    </ScrollArea>
                  </div>
                </TabsContent>
                
                {canExecute(selectedArtifact) && (
                  <TabsContent value="execute" className="flex-1 m-4 mt-2">
                    <div className="h-full border border-border rounded-lg overflow-hidden">
                      <CodeExecutor 
                        artifact={selectedArtifact}
                        onUpdateArtifact={(updates) => onUpdateArtifact(selectedArtifact.id, updates)}
                      />
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </div>
          )}
        </>
      )}
    </div>
  )
}