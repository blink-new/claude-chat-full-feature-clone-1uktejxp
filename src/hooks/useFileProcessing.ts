import { useState, useCallback } from 'react'
import { blink } from '@/blink/client'

export interface ProcessedFile {
  file: File
  content?: string
  type: 'text' | 'image' | 'code' | 'document' | 'unknown'
  preview?: string
  error?: string
  url?: string
}

export function useFileProcessing() {
  const [isProcessing, setIsProcessing] = useState(false)

  const processFiles = useCallback(async (files: File[]): Promise<ProcessedFile[]> => {
    setIsProcessing(true)
    const processedFiles: ProcessedFile[] = []

    for (const file of files) {
      try {
        const processedFile: ProcessedFile = {
          file,
          type: getFileType(file)
        }

        // Upload file to storage first for URL access
        try {
          const { publicUrl } = await blink.storage.upload(
            file,
            `uploads/${Date.now()}-${file.name}`,
            { upsert: true }
          )
          processedFile.url = publicUrl
        } catch (error) {
          console.warn('Failed to upload file:', error)
        }

        // Process based on file type
        if (file.type.startsWith('image/')) {
          // Create image preview
          processedFile.preview = URL.createObjectURL(file)
          processedFile.type = 'image'
        } else if (isTextFile(file)) {
          // Extract text content
          const content = await readFileAsText(file)
          processedFile.content = content
          processedFile.type = getTextFileType(file)
        } else if (file.type === 'application/pdf' || 
                   file.type.includes('document') || 
                   file.type.includes('sheet') ||
                   file.type.includes('presentation')) {
          // Use Blink's document extraction
          try {
            const content = await blink.data.extractFromBlob(file, {
              chunking: false
            })
            processedFile.content = typeof content === 'string' ? content : content.join('\n')
            processedFile.type = 'document'
          } catch (error) {
            processedFile.error = 'Failed to extract document content'
          }
        }

        processedFiles.push(processedFile)
      } catch (error) {
        processedFiles.push({
          file,
          type: 'unknown',
          error: error instanceof Error ? error.message : 'Failed to process file'
        })
      }
    }

    setIsProcessing(false)
    return processedFiles
  }, [])

  const analyzeImage = useCallback(async (imageUrl: string, prompt?: string): Promise<string> => {
    try {
      const { text } = await blink.ai.generateText({
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt || "Describe this image in detail." },
              { type: "image", image: imageUrl }
            ]
          }
        ]
      })
      return text
    } catch (error) {
      throw new Error('Failed to analyze image')
    }
  }, [])

  const extractTextFromDocument = useCallback(async (file: File): Promise<string> => {
    try {
      const content = await blink.data.extractFromBlob(file)
      return typeof content === 'string' ? content : content.join('\n')
    } catch (error) {
      throw new Error('Failed to extract text from document')
    }
  }, [])

  return {
    processFiles,
    analyzeImage,
    extractTextFromDocument,
    isProcessing
  }
}

function getFileType(file: File): ProcessedFile['type'] {
  if (file.type.startsWith('image/')) return 'image'
  if (isTextFile(file)) return getTextFileType(file)
  if (file.type === 'application/pdf' || 
      file.type.includes('document') || 
      file.type.includes('sheet') ||
      file.type.includes('presentation')) return 'document'
  return 'unknown'
}

function isTextFile(file: File): boolean {
  const textTypes = [
    'text/',
    'application/json',
    'application/javascript',
    'application/typescript'
  ]
  
  const textExtensions = [
    '.txt', '.md', '.js', '.ts', '.jsx', '.tsx', '.py', '.html', 
    '.css', '.scss', '.json', '.xml', '.yaml', '.yml', '.csv',
    '.java', '.cpp', '.c', '.php', '.rb', '.go', '.rs', '.swift'
  ]

  return textTypes.some(type => file.type.startsWith(type)) ||
         textExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
}

function getTextFileType(file: File): 'text' | 'code' {
  const codeExtensions = [
    '.js', '.ts', '.jsx', '.tsx', '.py', '.html', '.css', '.scss',
    '.java', '.cpp', '.c', '.php', '.rb', '.go', '.rs', '.swift',
    '.json', '.xml', '.yaml', '.yml'
  ]
  
  return codeExtensions.some(ext => file.name.toLowerCase().endsWith(ext)) ? 'code' : 'text'
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}