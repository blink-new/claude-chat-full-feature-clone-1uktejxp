import React, { useState } from 'react'
import { 
  FileText, 
  Plus, 
  Search, 
  Filter,
  Star,
  Clock,
  Users,
  Play,
  Edit,
  Trash2,
  Copy,
  Share,
  MoreHorizontal,
  Sparkles,
  Code,
  MessageSquare,
  Lightbulb,
  Briefcase,
  BookOpen
} from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Switch } from './ui/switch'
import { useConversationTemplates } from '../hooks/useAdvancedProjects'
import type { ConversationTemplate, TemplateVariable } from '../types/advanced'

interface TemplateManagerProps {
  onUseTemplate?: (template: ConversationTemplate) => void
}

const TEMPLATE_CATEGORIES = [
  { id: 'all', name: 'All Templates', icon: FileText },
  { id: 'creative', name: 'Creative Writing', icon: Sparkles },
  { id: 'code', name: 'Code & Development', icon: Code },
  { id: 'business', name: 'Business & Marketing', icon: Briefcase },
  { id: 'education', name: 'Education & Learning', icon: BookOpen },
  { id: 'general', name: 'General Chat', icon: MessageSquare },
  { id: 'analysis', name: 'Analysis & Research', icon: Lightbulb }
]

export function TemplateManager({ onUseTemplate }: TemplateManagerProps) {
  const { templates, createTemplate, useTemplate: applyTemplate, deleteTemplate } = useConversationTemplates()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showMyTemplates, setShowMyTemplates] = useState(false)
  const [sortBy, setSortBy] = useState<'usage' | 'created' | 'name'>('usage')
  
  const [showCreateTemplate, setShowCreateTemplate] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ConversationTemplate | null>(null)
  
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    prompt: '',
    category: 'general',
    isPublic: false,
    variables: [] as TemplateVariable[]
  })

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.prompt.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    const matchesOwnership = !showMyTemplates || !template.isPublic
    
    return matchesSearch && matchesCategory && matchesOwnership
  }).sort((a, b) => {
    switch (sortBy) {
      case 'usage':
        return b.usageCount - a.usageCount
      case 'created':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'name':
        return a.name.localeCompare(b.name)
      default:
        return 0
    }
  })

  const handleCreateTemplate = async () => {
    try {
      await createTemplate(newTemplate)
      setNewTemplate({
        name: '',
        description: '',
        prompt: '',
        category: 'general',
        isPublic: false,
        variables: []
      })
      setShowCreateTemplate(false)
    } catch (error) {
      console.error('Failed to create template:', error)
    }
  }

  const handleUseTemplate = async (template: ConversationTemplate) => {
    try {
      await applyTemplate(template.id)
      onUseTemplate?.(template)
    } catch (error) {
      console.error('Failed to use template:', error)
    }
  }

  const addVariable = () => {
    setNewTemplate(prev => ({
      ...prev,
      variables: [...prev.variables, {
        name: '',
        type: 'text',
        label: '',
        placeholder: '',
        required: false,
        options: [],
        defaultValue: ''
      }]
    }))
  }

  const updateVariable = (index: number, updates: Partial<TemplateVariable>) => {
    setNewTemplate(prev => ({
      ...prev,
      variables: prev.variables.map((variable, i) => 
        i === index ? { ...variable, ...updates } : variable
      )
    }))
  }

  const removeVariable = (index: number) => {
    setNewTemplate(prev => ({
      ...prev,
      variables: prev.variables.filter((_, i) => i !== index)
    }))
  }

  const getCategoryIcon = (categoryId: string) => {
    const category = TEMPLATE_CATEGORIES.find(c => c.id === categoryId)
    return category?.icon || FileText
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Template Library</h2>
          <Dialog open={showCreateTemplate} onOpenChange={setShowCreateTemplate}>
            <DialogTrigger asChild>
              <Button>
                <Plus size={16} className="mr-2" />
                Create Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingTemplate ? 'Edit Template' : 'Create New Template'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="template-name">Name</Label>
                    <Input
                      id="template-name"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Template name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="template-category">Category</Label>
                    <Select 
                      value={newTemplate.category} 
                      onValueChange={(value) => setNewTemplate(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TEMPLATE_CATEGORIES.slice(1).map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="template-description">Description</Label>
                  <Textarea
                    id="template-description"
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of what this template does"
                    rows={2}
                  />
                </div>
                
                <div>
                  <Label htmlFor="template-prompt">Prompt Template</Label>
                  <Textarea
                    id="template-prompt"
                    value={newTemplate.prompt}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, prompt: e.target.value }))}
                    placeholder="Enter your prompt template here. Use {{variable_name}} for dynamic content."
                    rows={6}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use double curly braces like {`{{variable_name}}`} for dynamic content
                  </p>
                </div>

                {/* Variables Section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Template Variables</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addVariable}>
                      <Plus size={14} className="mr-1" />
                      Add Variable
                    </Button>
                  </div>
                  
                  {newTemplate.variables.map((variable, index) => (
                    <div key={index} className="border rounded-lg p-3 mb-2">
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div>
                          <Label className="text-xs">Variable Name</Label>
                          <Input
                            value={variable.name}
                            onChange={(e) => updateVariable(index, { name: e.target.value })}
                            placeholder="variable_name"
                            className="text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Type</Label>
                          <Select 
                            value={variable.type} 
                            onValueChange={(value: any) => updateVariable(index, { type: value })}
                          >
                            <SelectTrigger className="text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="textarea">Textarea</SelectItem>
                              <SelectItem value="number">Number</SelectItem>
                              <SelectItem value="select">Select</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div>
                          <Label className="text-xs">Label</Label>
                          <Input
                            value={variable.label}
                            onChange={(e) => updateVariable(index, { label: e.target.value })}
                            placeholder="Display label"
                            className="text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Placeholder</Label>
                          <Input
                            value={variable.placeholder}
                            onChange={(e) => updateVariable(index, { placeholder: e.target.value })}
                            placeholder="Placeholder text"
                            className="text-xs"
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={variable.required}
                            onCheckedChange={(checked) => updateVariable(index, { required: checked })}
                          />
                          <Label className="text-xs">Required</Label>
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeVariable(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={newTemplate.isPublic}
                    onCheckedChange={(checked) => setNewTemplate(prev => ({ ...prev, isPublic: checked }))}
                  />
                  <Label>Make this template public</Label>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowCreateTemplate(false)
                      setEditingTemplate(null)
                      setNewTemplate({
                        name: '',
                        description: '',
                        prompt: '',
                        category: 'general',
                        isPublic: false,
                        variables: []
                      })
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTemplate}>
                    {editingTemplate ? 'Update' : 'Create'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                checked={showMyTemplates}
                onCheckedChange={setShowMyTemplates}
              />
              <Label className="text-sm">My templates only</Label>
            </div>
            
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="usage">Most Used</SelectItem>
                <SelectItem value="created">Newest</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex">
        {/* Sidebar - Categories */}
        <div className="w-64 border-r border-gray-200 dark:border-gray-700 p-4">
          <div className="space-y-1">
            {TEMPLATE_CATEGORIES.map(category => {
              const Icon = category.icon
              const count = category.id === 'all' 
                ? templates.length 
                : templates.filter(t => t.category === category.id).length
              
              return (
                <div
                  key={category.id}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
                    selectedCategory === category.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <Icon size={16} className="text-gray-500" />
                  <span className="text-sm font-medium">{category.name}</span>
                  <span className="text-xs text-gray-500 ml-auto">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Main Content - Templates */}
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500">
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map(template => {
              const CategoryIcon = getCategoryIcon(template.category)
              
              return (
                <Card key={template.id} className="hover:shadow-md transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <CategoryIcon size={16} className="text-gray-500" />
                        <CardTitle className="text-base truncate">{template.name}</CardTitle>
                        {template.isPublic && (
                          <Badge variant="secondary" className="text-xs">
                            Public
                          </Badge>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <MoreHorizontal size={14} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleUseTemplate(template)}>
                            <Play size={14} className="mr-2" />
                            Use Template
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy size={14} className="mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit size={14} className="mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Share size={14} className="mr-2" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => deleteTemplate(template.id)}
                            className="text-red-600"
                          >
                            <Trash2 size={14} className="mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {template.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {template.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-3">
                      <p className="text-xs font-mono text-gray-700 dark:text-gray-300 line-clamp-3">
                        {template.prompt}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(template.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users size={12} />
                        {template.usageCount} uses
                      </div>
                    </div>
                    
                    {template.variables && template.variables.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1">Variables:</p>
                        <div className="flex gap-1 flex-wrap">
                          {template.variables.slice(0, 3).map((variable, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {variable.name}
                            </Badge>
                          ))}
                          {template.variables.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{template.variables.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <Button 
                      className="w-full" 
                      size="sm"
                      onClick={() => handleUseTemplate(template)}
                    >
                      <Play size={14} className="mr-2" />
                      Use Template
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No templates found
              </h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || selectedCategory !== 'all' || showMyTemplates
                  ? 'Try adjusting your search or filters'
                  : 'Create your first template to get started'
                }
              </p>
              <Button onClick={() => setShowCreateTemplate(true)}>
                <Plus size={16} className="mr-2" />
                Create Template
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}