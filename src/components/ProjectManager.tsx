import React, { useState } from 'react'
import { 
  Folder, 
  FolderPlus, 
  Tag, 
  Plus, 
  Search, 
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Move,
  Archive,
  Star,
  Clock,
  Users
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
import { useProjectFolders, useProjectTags } from '../hooks/useAdvancedProjects'
import { useProjects } from '../hooks/useProjects'
import type { ProjectFolder, ProjectTag } from '../types/advanced'

interface ProjectManagerProps {
  onSelectProject?: (projectId: string) => void
  selectedProjectId?: string
}

export function ProjectManager({ onSelectProject, selectedProjectId }: ProjectManagerProps) {
  const { folders, createFolder, updateFolder, deleteFolder } = useProjectFolders()
  const { tags, createTag, deleteTag } = useProjectTags()
  const { projects } = useProjects()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'name' | 'updated' | 'created'>('updated')
  
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [showCreateTag, setShowCreateTag] = useState(false)
  const [editingFolder, setEditingFolder] = useState<ProjectFolder | null>(null)
  
  const [newFolder, setNewFolder] = useState({
    name: '',
    description: '',
    color: '#6B7280',
    icon: 'folder',
    parentId: ''
  })
  
  const [newTag, setNewTag] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  })

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFolder = !selectedFolder || project.folderId === selectedFolder
    const matchesTags = selectedTags.length === 0 || 
                       (project.tags && selectedTags.some(tagId => 
                         JSON.parse(project.tags).includes(tagId)
                       ))
    
    return matchesSearch && matchesFolder && matchesTags
  })

  const handleCreateFolder = async () => {
    try {
      await createFolder(newFolder)
      setNewFolder({ name: '', description: '', color: '#6B7280', icon: 'folder', parentId: '' })
      setShowCreateFolder(false)
    } catch (error) {
      console.error('Failed to create folder:', error)
    }
  }

  const handleCreateTag = async () => {
    try {
      await createTag(newTag)
      setNewTag({ name: '', description: '', color: '#3B82F6' })
      setShowCreateTag(false)
    } catch (error) {
      console.error('Failed to create tag:', error)
    }
  }

  const handleUpdateFolder = async () => {
    if (!editingFolder) return
    
    try {
      await updateFolder(editingFolder.id, newFolder)
      setEditingFolder(null)
      setNewFolder({ name: '', description: '', color: '#6B7280', icon: 'folder', parentId: '' })
    } catch (error) {
      console.error('Failed to update folder:', error)
    }
  }

  const getFolderTree = (parentId: string | null = null): ProjectFolder[] => {
    return folders
      .filter(folder => folder.parentId === parentId)
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  const renderFolderTree = (parentId: string | null = null, level = 0) => {
    const folderList = getFolderTree(parentId)
    
    return folderList.map(folder => (
      <div key={folder.id} style={{ marginLeft: `${level * 20}px` }}>
        <div 
          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
            selectedFolder === folder.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
          }`}
          onClick={() => setSelectedFolder(selectedFolder === folder.id ? null : folder.id)}
        >
          <Folder 
            size={16} 
            style={{ color: folder.color }}
            className="flex-shrink-0"
          />
          <span className="text-sm font-medium truncate">{folder.name}</span>
          <span className="text-xs text-gray-500 ml-auto">
            {projects.filter(p => p.folderId === folder.id).length}
          </span>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal size={12} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
                setEditingFolder(folder)
                setNewFolder({
                  name: folder.name,
                  description: folder.description || '',
                  color: folder.color || '#6B7280',
                  icon: folder.icon || 'folder',
                  parentId: folder.parentId || ''
                })
              }}>
                <Edit size={14} className="mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => deleteFolder(folder.id)}
                className="text-red-600"
              >
                <Trash2 size={14} className="mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {renderFolderTree(folder.id, level + 1)}
      </div>
    ))
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Project Manager</h2>
          <div className="flex gap-2">
            <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <FolderPlus size={14} className="mr-2" />
                  New Folder
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingFolder ? 'Edit Folder' : 'Create New Folder'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="folder-name">Name</Label>
                    <Input
                      id="folder-name"
                      value={newFolder.name}
                      onChange={(e) => setNewFolder(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Folder name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="folder-description">Description</Label>
                    <Textarea
                      id="folder-description"
                      value={newFolder.description}
                      onChange={(e) => setNewFolder(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Optional description"
                    />
                  </div>
                  <div>
                    <Label htmlFor="folder-color">Color</Label>
                    <div className="flex gap-2 mt-2">
                      {['#6B7280', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'].map(color => (
                        <button
                          key={color}
                          className={`w-8 h-8 rounded-full border-2 ${
                            newFolder.color === color ? 'border-gray-900 dark:border-white' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setNewFolder(prev => ({ ...prev, color }))}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="parent-folder">Parent Folder</Label>
                    <Select 
                      value={newFolder.parentId} 
                      onValueChange={(value) => setNewFolder(prev => ({ ...prev, parentId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select parent folder (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No parent</SelectItem>
                        {folders.map(folder => (
                          <SelectItem key={folder.id} value={folder.id}>
                            {folder.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowCreateFolder(false)
                        setEditingFolder(null)
                        setNewFolder({ name: '', description: '', color: '#6B7280', icon: 'folder', parentId: '' })
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={editingFolder ? handleUpdateFolder : handleCreateFolder}>
                      {editingFolder ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showCreateTag} onOpenChange={setShowCreateTag}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Tag size={14} className="mr-2" />
                  New Tag
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Tag</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="tag-name">Name</Label>
                    <Input
                      id="tag-name"
                      value={newTag.name}
                      onChange={(e) => setNewTag(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Tag name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tag-description">Description</Label>
                    <Textarea
                      id="tag-description"
                      value={newTag.description}
                      onChange={(e) => setNewTag(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Optional description"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tag-color">Color</Label>
                    <div className="flex gap-2 mt-2">
                      {['#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6', '#EC4899', '#6B7280'].map(color => (
                        <button
                          key={color}
                          className={`w-8 h-8 rounded-full border-2 ${
                            newTag.color === color ? 'border-gray-900 dark:border-white' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setNewTag(prev => ({ ...prev, color }))}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowCreateTag(false)
                        setNewTag({ name: '', description: '', color: '#3B82F6' })
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleCreateTag}>
                      Create
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {tags.map(tag => (
              <Badge
                key={tag.id}
                variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                className="cursor-pointer"
                style={{ 
                  backgroundColor: selectedTags.includes(tag.id) ? tag.color : 'transparent',
                  borderColor: tag.color,
                  color: selectedTags.includes(tag.id) ? 'white' : tag.color
                }}
                onClick={() => {
                  setSelectedTags(prev => 
                    prev.includes(tag.id) 
                      ? prev.filter(id => id !== tag.id)
                      : [...prev, tag.id]
                  )
                }}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex">
        {/* Sidebar - Folders */}
        <div className="w-64 border-r border-gray-200 dark:border-gray-700 p-4">
          <div className="space-y-2">
            <div 
              className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
                !selectedFolder ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
              onClick={() => setSelectedFolder(null)}
            >
              <Folder size={16} className="text-gray-500" />
              <span className="text-sm font-medium">All Projects</span>
              <span className="text-xs text-gray-500 ml-auto">{projects.length}</span>
            </div>
            {renderFolderTree()}
          </div>
        </div>

        {/* Main Content - Projects */}
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updated">Last Updated</SelectItem>
                  <SelectItem value="created">Created</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map(project => (
              <Card 
                key={project.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedProjectId === project.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => onSelectProject?.(project.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base truncate">{project.name}</CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreHorizontal size={14} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit size={14} className="mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Move size={14} className="mr-2" />
                          Move
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Archive size={14} className="mr-2" />
                          Archive
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 size={14} className="mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {project.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users size={12} />
                      1
                    </div>
                  </div>
                  
                  {project.tags && JSON.parse(project.tags).length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {JSON.parse(project.tags).slice(0, 3).map((tagId: string) => {
                        const tag = tags.find(t => t.id === tagId)
                        return tag ? (
                          <Badge 
                            key={tag.id} 
                            variant="outline" 
                            className="text-xs"
                            style={{ borderColor: tag.color, color: tag.color }}
                          >
                            {tag.name}
                          </Badge>
                        ) : null
                      })}
                      {JSON.parse(project.tags).length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{JSON.parse(project.tags).length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredProjects.length === 0 && (
            <div className="text-center py-12">
              <Folder size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No projects found
              </h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || selectedFolder || selectedTags.length > 0
                  ? 'Try adjusting your search or filters'
                  : 'Create your first project to get started'
                }
              </p>
              <Button>
                <Plus size={16} className="mr-2" />
                Create Project
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}