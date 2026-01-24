import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getAuthUser } from '@/utils/supabase/auth-helper'

// OpenRouter API configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

// Prompts for different AI assist actions
const AI_ASSIST_PROMPTS = {
  'fix-grammar': {
    systemPrompt: `You are a professional editor specializing in LinkedIn content. Fix any grammar, spelling, and punctuation errors while preserving the original voice and style. Only make necessary corrections, don't rewrite unnecessarily.`,
    userPrompt: (content: string) => `Fix any grammar, spelling, and punctuation errors in this LinkedIn post. Preserve the author's voice and style:\n\n${content}`,
  },
  'make-clearer': {
    systemPrompt: `You are a professional editor specializing in LinkedIn content. Improve clarity and readability while preserving the original message and voice. Make the content easier to understand without changing the core meaning.`,
    userPrompt: (content: string) => `Make this LinkedIn post clearer and easier to read. Preserve the author's voice and core message:\n\n${content}`,
  },
  'shorten': {
    systemPrompt: `You are a professional editor specializing in LinkedIn content. Shorten the content while preserving the key message and impact. Remove filler words and redundant phrases. Aim for concise, punchy content.`,
    userPrompt: (content: string) => `Shorten this LinkedIn post while keeping the key message and impact. Make it more concise:\n\n${content}`,
  },
  'expand': {
    systemPrompt: `You are a professional editor specializing in LinkedIn content. Expand the content with relevant details, examples, or context while maintaining the original voice and message.`,
    userPrompt: (content: string) => `Expand this LinkedIn post with more details or examples while keeping the original voice:\n\n${content}`,
  },
  'add-hook': {
    systemPrompt: `You are a LinkedIn content expert. Create an engaging opening hook that grabs attention immediately. The hook should be authentic and not use clichéd phrases.`,
    userPrompt: (content: string) => `Add an engaging opening hook to this LinkedIn post that will grab readers' attention:\n\n${content}`,
  },
  'add-cta': {
    systemPrompt: `You are a LinkedIn content expert. Add a natural, engaging call-to-action at the end that encourages interaction (comments, shares, or meaningful engagement).`,
    userPrompt: (content: string) => `Add an engaging call-to-action at the end of this LinkedIn post:\n\n${content}`,
  },
}

type AIAssistAction = keyof typeof AI_ASSIST_PROMPTS

/**
 * POST /api/suflate/ai-assist
 * Story 3.3: Edit Draft Content - AI assist buttons
 * 
 * Applies AI-powered improvements to post content
 * Actions: fix-grammar, make-clearer, shorten, expand, add-hook, add-cta
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, content } = body

    // Validate action
    if (!action || !AI_ASSIST_PROMPTS[action as AIAssistAction]) {
      return NextResponse.json(
        { error: 'Invalid action. Supported: fix-grammar, make-clearer, shorten, expand, add-hook, add-cta' },
        { status: 400 }
      )
    }

    // Validate content
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    // Check for API key
    if (!OPENROUTER_API_KEY) {
      console.error('OpenRouter API key not configured')
      // Return mock response for development
      return NextResponse.json({
        content: `[AI ${action} would be applied here - API key not configured]\n\n${content}`,
        action,
        mock: true,
      })
    }

    const prompts = AI_ASSIST_PROMPTS[action as AIAssistAction]

    // Call OpenRouter API
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://suflate.app',
        'X-Title': 'Suflate AI Assist',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku',
        messages: [
          {
            role: 'system',
            content: prompts.systemPrompt,
          },
          {
            role: 'user',
            content: prompts.userPrompt(content),
          },
        ],
        max_tokens: 2000,
        temperature: 0.3, // Lower temperature for consistent editing
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('OpenRouter API error:', errorData)
      return NextResponse.json(
        { error: 'AI service temporarily unavailable' },
        { status: 503 }
      )
    }

    const data = await response.json()
    const improvedContent = data.choices?.[0]?.message?.content?.trim()

    if (!improvedContent) {
      return NextResponse.json(
        { error: 'Failed to generate improved content' },
        { status: 500 }
      )
    }

    // TODO: Track credit usage for AI assist (0.5 credits per call)

    return NextResponse.json({
      content: improvedContent,
      action,
      usage: data.usage,
    })
  } catch (error) {
    console.error('AI assist error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
