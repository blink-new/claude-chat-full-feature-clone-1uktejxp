import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Play, Square, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { Artifact } from '@/types'

interface CodeExecutorProps {
  artifact: Artifact
  onUpdateArtifact: (updates: Partial<Artifact>) => void
}

export function CodeExecutor({ artifact }: CodeExecutorProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [output, setOutput] = useState<string>('')
  const [error, setError] = useState<string>('')

  const executeJavaScript = async (code: string) => {
    return new Promise<void>((resolve, reject) => {
      try {
        // Create a safe execution environment
        const originalConsole = console.log
        const logs: string[] = []
        
        // Override console.log to capture output
        console.log = (...args) => {
          logs.push(args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' '))
        }

        // Execute the code
        const result = eval(code)
        
        // Restore console.log
        console.log = originalConsole
        
        // Set output
        if (logs.length > 0) {
          setOutput(logs.join('\\n'))
        } else if (result !== undefined) {
          setOutput(String(result))
        } else {
          setOutput('Code executed successfully (no output)')
        }
        
        resolve()
      } catch (error) {
        console.log = originalConsole // Restore console properly
        reject(error)
      }
    })
  }

  const executePython = async (code: string) => {
    // Mock Python execution - in a real implementation, you'd use a Python interpreter
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setOutput(`Mock Python execution:\\n${code}\\n\\n[This would execute in a real Python environment]`)
        resolve()
      }, 1000)
    })
  }

  const executeHTML = async (code: string) => {
    // For HTML, we can't really "execute" it, but we can validate it
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const hasScript = code.includes('<script>')
        const hasStyle = code.includes('<style>')
        const hasElements = code.includes('<')
        
        let analysis = 'HTML Analysis:\\n'
        analysis += `- Contains script tags: ${hasScript ? 'Yes' : 'No'}\\n`
        analysis += `- Contains style tags: ${hasStyle ? 'Yes' : 'No'}\\n`
        analysis += `- Contains HTML elements: ${hasElements ? 'Yes' : 'No'}\\n`
        analysis += '\\nHTML is ready for preview in the Preview tab.'
        
        setOutput(analysis)
        resolve()
      }, 500)
    })
  }

  const executeCode = async () => {
    if (isRunning) return

    setIsRunning(true)
    setOutput('')
    setError('')

    try {
      // For JavaScript/TypeScript code
      if (artifact.language === 'javascript' || artifact.language === 'typescript') {
        await executeJavaScript(artifact.content)
      }
      // For Python code (mock execution)
      else if (artifact.language === 'python') {
        await executePython(artifact.content)
      }
      // For HTML with JavaScript
      else if (artifact.type === 'html') {
        await executeHTML(artifact.content)
      }
      else {
        setError('Code execution not supported for this language')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Execution failed')
    } finally {
      setIsRunning(false)
    }
  }

  const stopExecution = () => {
    setIsRunning(false)
    setOutput('Execution stopped')
  }

  const canExecute = () => {
    return ['javascript', 'typescript', 'python'].includes(artifact.language || '') || 
           artifact.type === 'html'
  }

  if (!canExecute()) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
        <p>Code execution not available for this artifact type</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex items-center gap-2 p-3 border-b border-border">
        <Button
          onClick={executeCode}
          disabled={isRunning}
          size="sm"
          className="flex items-center gap-2"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="h-3 w-3" />
              Run Code
            </>
          )}
        </Button>
        
        {isRunning && (
          <Button
            onClick={stopExecution}
            size="sm"
            variant="outline"
            className="flex items-center gap-2"
          >
            <Square className="h-3 w-3" />
            Stop
          </Button>
        )}

        <div className="flex-1" />
        
        <Badge variant="outline" className="text-xs">
          {artifact.language || artifact.type}
        </Badge>
      </div>

      {/* Output */}
      <div className="flex-1 flex flex-col">
        {error && (
          <div className="p-3 bg-destructive/10 border-b border-destructive/20">
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Execution Error</span>
            </div>
            <pre className="mt-2 text-xs whitespace-pre-wrap">{error}</pre>
          </div>
        )}

        {output && (
          <div className="p-3 bg-muted/50 border-b border-border">
            <div className="flex items-center gap-2 text-sm mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="font-medium">Output</span>
            </div>
          </div>
        )}

        <ScrollArea className="flex-1">
          <div className="p-4">
            {output ? (
              <pre className="text-sm whitespace-pre-wrap font-mono bg-muted/30 p-3 rounded">
                {output}
              </pre>
            ) : !error && !isRunning ? (
              <div className="text-center text-muted-foreground py-8">
                <Play className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Click "Run Code" to execute this artifact</p>
              </div>
            ) : null}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}