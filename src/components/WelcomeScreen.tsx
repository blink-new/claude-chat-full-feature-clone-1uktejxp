import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
  MessageSquare, 
  Code, 
  FileText, 
  Lightbulb,
  Zap,
  Brain
} from 'lucide-react'

interface WelcomeScreenProps {
  onStartChat: (prompt: string) => void
}

export function WelcomeScreen({ onStartChat }: WelcomeScreenProps) {
  const suggestions = [
    {
      icon: <Code className="h-5 w-5" />,
      title: "Write code",
      description: "Help me build a React component",
      prompt: "Help me create a React component for a user profile card with avatar, name, and bio"
    },
    {
      icon: <FileText className="h-5 w-5" />,
      title: "Analyze text",
      description: "Summarize this document",
      prompt: "Can you help me analyze and summarize a document? I'll share the content with you."
    },
    {
      icon: <Lightbulb className="h-5 w-5" />,
      title: "Creative writing",
      description: "Write a story or poem",
      prompt: "Write a short story about an AI assistant who discovers creativity"
    },
    {
      icon: <Brain className="h-5 w-5" />,
      title: "Problem solving",
      description: "Help with math or logic",
      prompt: "I need help solving a complex problem. Can you walk me through your problem-solving approach?"
    }
  ]

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 mx-auto">
          <div className="w-12 h-12 bg-primary rounded-md flex items-center justify-center">
            <span className="text-primary-foreground text-xl font-bold">C</span>
          </div>
        </div>
        <h1 className="text-4xl font-bold mb-4">Hello! I'm Claude</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          I'm an AI assistant created by Anthropic. I can help you with analysis, math, coding, 
          creative writing, and much more. How can I assist you today?
        </p>
      </div>

      {/* Suggestions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl mb-8">
        {suggestions.map((suggestion, index) => (
          <Card 
            key={index}
            className="p-6 cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/20 group"
            onClick={() => onStartChat(suggestion.prompt)}
          >
            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                {suggestion.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                  {suggestion.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {suggestion.description}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Features */}
      <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4" />
          <span>Real-time responses</span>
        </div>
        <div className="flex items-center gap-2">
          <Code className="h-4 w-4" />
          <span>Code generation</span>
        </div>
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <span>Document analysis</span>
        </div>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          <span>Natural conversation</span>
        </div>
      </div>
    </div>
  )
}