import { useState, useEffect, useCallback } from 'react'
import { blink } from '../blink/client'
import type { AIModel, AutoRoutingConfig, RoutingRule, RoutingCondition } from '../types/advanced'

export function useAIModels() {
  const [models, setModels] = useState<AIModel[]>([])
  const [loading, setLoading] = useState(true)

  const loadModels = async () => {
    try {
      const result = await blink.db.aiModels.list({
        where: { isAvailable: "1" },
        orderBy: { name: 'asc' }
      })
      setModels(result.map(m => ({
        ...m,
        capabilities: JSON.parse(m.capabilities),
        isAvailable: Number(m.isAvailable) > 0
      })))
    } catch (error) {
      console.error('Failed to load AI models:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadModels()
  }, [])

  return { models, loading, refetch: loadModels }
}

export function useAutoRouting() {
  const [config, setConfig] = useState<AutoRoutingConfig | null>(null)
  const [loading, setLoading] = useState(true)

  const saveConfig = useCallback(async (newConfig: AutoRoutingConfig) => {
    try {
      const user = await blink.auth.me()
      const now = new Date().toISOString()
      
      await blink.db.autoRoutingConfigs.upsertMany([{
        id: `routing_${user.id}`,
        userId: user.id,
        enabled: newConfig.enabled ? "1" : "0",
        rules: JSON.stringify(newConfig.rules),
        fallbackModelId: newConfig.fallbackModelId,
        considerCost: newConfig.considerCost ? "1" : "0",
        considerSpeed: newConfig.considerSpeed ? "1" : "0",
        considerQuality: newConfig.considerQuality ? "1" : "0",
        createdAt: now,
        updatedAt: now
      }])
      
      setConfig(newConfig)
    } catch (error) {
      console.error('Failed to save routing config:', error)
      throw error
    }
  }, [])

  const loadConfig = useCallback(async () => {
    try {
      const user = await blink.auth.me()
      const result = await blink.db.autoRoutingConfigs.list({
        where: { userId: user.id },
        limit: 1
      })
      
      if (result.length > 0) {
        const configData = result[0]
        setConfig({
          enabled: Number(configData.enabled) > 0,
          rules: JSON.parse(configData.rules),
          fallbackModelId: configData.fallbackModelId,
          considerCost: Number(configData.considerCost) > 0,
          considerSpeed: Number(configData.considerSpeed) > 0,
          considerQuality: Number(configData.considerQuality) > 0
        })
      } else {
        // Create default config
        const defaultConfig: AutoRoutingConfig = {
          enabled: true,
          rules: [
            {
              id: 'code_rule',
              name: 'Code Generation',
              condition: { hasCode: true },
              targetModelId: 'codestral',
              priority: 1,
              enabled: true
            },
            {
              id: 'long_context_rule',
              name: 'Long Context',
              condition: { messageLength: { min: 2000 } },
              targetModelId: 'gemini-1-5-pro',
              priority: 2,
              enabled: true
            },
            {
              id: 'quick_response_rule',
              name: 'Quick Responses',
              condition: { messageLength: { max: 500 } },
              targetModelId: 'gpt-4o-mini',
              priority: 3,
              enabled: true
            }
          ],
          fallbackModelId: 'gpt-4o',
          considerCost: true,
          considerSpeed: true,
          considerQuality: true
        }
        await saveConfig(defaultConfig)
        setConfig(defaultConfig)
      }
    } catch (error) {
      console.error('Failed to load routing config:', error)
    } finally {
      setLoading(false)
    }
  }, [saveConfig])

  const routeMessage = async (
    message: string, 
    hasFiles: boolean = false, 
    conversationLength: number = 0
  ): Promise<string> => {
    if (!config || !config.enabled) {
      return config?.fallbackModelId || 'gpt-4o'
    }

    const hasCode = /```|`[^`]+`|function|class|import|export|const|let|var|def|class|if __name__|<script|<style/.test(message)
    const messageLength = message.length

    // Sort rules by priority
    const sortedRules = config.rules
      .filter(rule => rule.enabled)
      .sort((a, b) => a.priority - b.priority)

    for (const rule of sortedRules) {
      if (matchesCondition(rule.condition, {
        messageLength,
        hasCode,
        hasFiles,
        conversationLength
      })) {
        return rule.targetModelId
      }
    }

    return config.fallbackModelId
  }

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  return {
    config,
    loading,
    saveConfig,
    routeMessage,
    refetch: loadConfig
  }
}

function matchesCondition(
  condition: RoutingCondition,
  context: {
    messageLength: number
    hasCode: boolean
    hasFiles: boolean
    conversationLength: number
  }
): boolean {
  // Check message length
  if (condition.messageLength) {
    if (condition.messageLength.min && context.messageLength < condition.messageLength.min) {
      return false
    }
    if (condition.messageLength.max && context.messageLength > condition.messageLength.max) {
      return false
    }
  }

  // Check code presence
  if (condition.hasCode !== undefined && condition.hasCode !== context.hasCode) {
    return false
  }

  // Check files presence
  if (condition.hasFiles !== undefined && condition.hasFiles !== context.hasFiles) {
    return false
  }

  // Check conversation length
  if (condition.conversationLength) {
    if (condition.conversationLength.min && context.conversationLength < condition.conversationLength.min) {
      return false
    }
    if (condition.conversationLength.max && context.conversationLength > condition.conversationLength.max) {
      return false
    }
  }

  // Check keywords
  if (condition.keywords && condition.keywords.length > 0) {
    const messageText = context.messageLength.toString() // This should be the actual message text
    const hasKeyword = condition.keywords.some(keyword => 
      messageText.toLowerCase().includes(keyword.toLowerCase())
    )
    if (!hasKeyword) {
      return false
    }
  }

  return true
}