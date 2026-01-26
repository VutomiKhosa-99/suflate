import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAuthUser } from '@/utils/supabase/auth-helper'

// OpenRouter API configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

const SYSTEM_PROMPT = `You are an AI assistant for LinkedIn content creation. You help users:
- Summarize YouTube videos and generate LinkedIn post ideas
- Summarize blog posts and create LinkedIn content
- Analyze LinkedIn profiles and generate content ideas
- Find trending topics and viral post ideas
- Generate engaging LinkedIn posts

Be helpful, creative, and focused on LinkedIn content strategy. When given a URL, explain what you would do if you could access it, then provide helpful content ideas based on the topic.

Keep responses concise and actionable. Format your responses clearly with bullet points or numbered lists where appropriate.`

/**
 * POST /api/suflate/ai-assist/chat
 * AI Assistant chat endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prompt } = await request.json()

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json({ 
        error: 'AI service not configured',
        response: 'AI Assistant is not configured. Please add your OpenRouter API key to use this feature.'
      }, { status: 200 })
    }

    // Call OpenRouter API
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Suflate AI Assistant',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        max_tokens: 1024,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('OpenRouter API error:', errorData)
      return NextResponse.json({ 
        response: 'Sorry, I encountered an error. Please try again in a moment.'
      }, { status: 200 })
    }

    const data = await response.json()
    const aiResponse = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.'

    return NextResponse.json({ response: aiResponse })
  } catch (error) {
    console.error('AI Assistant chat error:', error)
    return NextResponse.json({ 
      response: 'Sorry, I encountered an error. Please try again.'
    }, { status: 200 })
  }
}
