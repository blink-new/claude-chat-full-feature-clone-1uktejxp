import React, { useState, useCallback } from 'react'
import { Download, FileText, Code, Image, Copy, Check } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Checkbox } from './ui/checkbox'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
import { blink } from '../blink/client'
import type { Conversation, Message } from '../types'

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conversation: Conversation | null
}

type ExportFormat = 'markdown' | 'json' | 'txt' | 'html'

export function ExportDialog({ open, onOpenChange, conversation }: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('markdown')
  const [includeTimestamps, setIncludeTimestamps] = useState(true)
  const [includeMetadata, setIncludeMetadata] = useState(true)
  const [exportContent, setExportContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const generateMarkdown = useCallback((conv: Conversation, messages: Message[]) => {
    let content = `# ${conv.title}\n\n`
    
    if (includeMetadata) {
      content += `**Created:** ${new Date(conv.createdAt).toLocaleString()}\n`
      content += `**Updated:** ${new Date(conv.updatedAt).toLocaleString()}\n`
      content += `**Messages:** ${messages.length}\n\n`
      content += '---\n\n'
    }

    messages.forEach((message, index) => {
      const role = message.role === 'user' ? '**You**' : '**Claude**'
      const timestamp = includeTimestamps ? ` *(${new Date(message.createdAt).toLocaleString()})*` : ''
      
      content += `## ${role}${timestamp}\n\n`
      content += `${message.content}\n\n`
      
      if (index < messages.length - 1) {
        content += '---\n\n'
      }
    })

    return content
  }, [includeTimestamps, includeMetadata])

  const generateJSON = useCallback((conv: Conversation, messages: Message[]) => {
    const exportData = {
      conversation: {
        id: conv.id,
        title: conv.title,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        ...(includeMetadata && {
          metadata: {
            messageCount: messages.length,
            exportedAt: new Date().toISOString()
          }
        })
      },
      messages: messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        ...(includeTimestamps && { createdAt: msg.createdAt })
      }))
    }

    return JSON.stringify(exportData, null, 2)
  }, [includeTimestamps, includeMetadata])

  const generateText = useCallback((conv: Conversation, messages: Message[]) => {
    let content = `${conv.title}\n${'='.repeat(conv.title.length)}\n\n`
    
    if (includeMetadata) {
      content += `Created: ${new Date(conv.createdAt).toLocaleString()}\n`
      content += `Updated: ${new Date(conv.updatedAt).toLocaleString()}\n`
      content += `Messages: ${messages.length}\n\n`
      content += '-'.repeat(50) + '\n\n'
    }

    messages.forEach((message, index) => {
      const role = message.role === 'user' ? 'You' : 'Claude'
      const timestamp = includeTimestamps ? ` (${new Date(message.createdAt).toLocaleString()})` : ''
      
      content += `${role}${timestamp}:\n`
      content += `${message.content}\n\n`
      
      if (index < messages.length - 1) {
        content += '-'.repeat(30) + '\n\n'
      }
    })

    return content
  }, [includeTimestamps, includeMetadata])

  const generateHTML = useCallback((conv: Conversation, messages: Message[]) => {
    let content = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${conv.title}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        .header { border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
        .message { margin-bottom: 30px; padding: 20px; border-radius: 8px; }
        .user { background-color: #f0f9ff; border-left: 4px solid #0ea5e9; }
        .assistant { background-color: #fef3e2; border-left: 4px solid #f59e0b; }
        .role { font-weight: bold; margin-bottom: 10px; }
        .timestamp { color: #666; font-size: 0.9em; }
        .content { white-space: pre-wrap; }
        pre { background: #f5f5f5; padding: 15px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${conv.title}</h1>`

    if (includeMetadata) {
      content += `
        <p><strong>Created:</strong> ${new Date(conv.createdAt).toLocaleString()}</p>
        <p><strong>Updated:</strong> ${new Date(conv.updatedAt).toLocaleString()}</p>
        <p><strong>Messages:</strong> ${messages.length}</p>`
    }

    content += `
    </div>
    <div class="messages">`

    messages.forEach(message => {
      const roleClass = message.role === 'user' ? 'user' : 'assistant'
      const roleName = message.role === 'user' ? 'You' : 'Claude'
      const timestamp = includeTimestamps ? `<span class="timestamp"> - ${new Date(message.createdAt).toLocaleString()}</span>` : ''
      
      content += `
        <div class="message ${roleClass}">
            <div class="role">${roleName}${timestamp}</div>
            <div class="content">${message.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        </div>`
    })

    content += `
    </div>
</body>
</html>`

    return content
  }, [includeTimestamps, includeMetadata])

  const generateExport = useCallback(async () => {
    if (!conversation) return

    setLoading(true)
    try {
      const user = await blink.auth.me()
      const messages = await blink.db.messages.list({
        where: {
          AND: [
            { userId: user.id },
            { conversationId: conversation.id }
          ]
        },
        orderBy: { createdAt: 'asc' }
      })

      let content = ''

      switch (format) {
        case 'markdown':
          content = generateMarkdown(conversation, messages)
          break
        case 'json':
          content = generateJSON(conversation, messages)
          break
        case 'txt':
          content = generateText(conversation, messages)
          break
        case 'html':
          content = generateHTML(conversation, messages)
          break
      }

      setExportContent(content)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setLoading(false)
    }
  }, [conversation, format, generateMarkdown, generateJSON, generateText, generateHTML])

  const downloadFile = () => {
    if (!exportContent || !conversation) return

    const extensions = {
      markdown: 'md',
      json: 'json',
      txt: 'txt',
      html: 'html'
    }

    const mimeTypes = {
      markdown: 'text/markdown',
      json: 'application/json',
      txt: 'text/plain',
      html: 'text/html'
    }

    const filename = `${conversation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${extensions[format]}`
    const blob = new Blob([exportContent], { type: mimeTypes[format] })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const copyToClipboard = async () => {
    if (!exportContent) return

    try {
      await navigator.clipboard.writeText(exportContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  React.useEffect(() => {
    if (open && conversation) {
      generateExport()
    }
  }, [open, conversation, generateExport])

  if (!conversation) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Conversation
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Export Options */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="format">Export Format</Label>
              <Select value={format} onValueChange={(value: ExportFormat) => setFormat(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="markdown">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Markdown (.md)
                    </div>
                  </SelectItem>
                  <SelectItem value="json">
                    <div className="flex items-center gap-2">
                      <Code className="w-4 h-4" />
                      JSON (.json)
                    </div>
                  </SelectItem>
                  <SelectItem value="txt">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Plain Text (.txt)
                    </div>
                  </SelectItem>
                  <SelectItem value="html">
                    <div className="flex items-center gap-2">
                      <Image className="w-4 h-4" />
                      HTML (.html)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="timestamps"
                  checked={includeTimestamps}
                  onCheckedChange={setIncludeTimestamps}
                />
                <Label htmlFor="timestamps">Include timestamps</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="metadata"
                  checked={includeMetadata}
                  onCheckedChange={setIncludeMetadata}
                />
                <Label htmlFor="metadata">Include metadata</Label>
              </div>
            </div>

            <div className="pt-4 space-y-2">
              <Button onClick={downloadFile} disabled={!exportContent} className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Download File
              </Button>
              
              <Button 
                variant="outline" 
                onClick={copyToClipboard} 
                disabled={!exportContent}
                className="w-full"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy to Clipboard
                  </>
                )}
              </Button>
            </div>

            <div className="pt-2">
              <Badge variant="secondary" className="text-xs">
                {conversation.title}
              </Badge>
            </div>
          </div>

          {/* Preview */}
          <div className="lg:col-span-2">
            <Label>Preview</Label>
            <div className="mt-2 border rounded-lg">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                  <span className="ml-2 text-sm">Generating export...</span>
                </div>
              ) : (
                <Textarea
                  value={exportContent}
                  readOnly
                  className="min-h-[400px] font-mono text-sm resize-none border-0"
                  placeholder="Export preview will appear here..."
                />
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}