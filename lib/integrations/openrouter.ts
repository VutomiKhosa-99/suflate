// OpenRouter API integration for LLM content generation
// Supports multiple models: Claude, GPT-4, Gemini, etc.

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OpenRouterRequest {
  model: string
  messages: OpenRouterMessage[]
  max_tokens?: number
  temperature?: number
}

export async function generatePostVariations(
  transcript: string,
  options?: {
    contentType?: 'story' | 'lesson' | 'opinion' | 'tactical'
    variationCount?: number
    model?: string
  }
) {
  const model = options?.model || 'anthropic/claude-3.5-sonnet'
  const variationCount = options?.variationCount || 5

  // TODO: Implement voice preservation prompts from prompt-system.md
  const systemPrompt = `You are an editor, not an author. Your job is to organize and polish the user's spoken thoughts into LinkedIn posts while preserving their authentic voice, vocabulary, and tone. Never invent new ideas or change the user's opinions.`

  const userPrompt = `Transform this transcript into ${variationCount} LinkedIn post variations with different angles:
${transcript}

Generate variations:
1. Professional thought leadership
2. Personal story
3. Actionable tips
4. Discussion starter
5. Bold opinion

Each variation must:
- Preserve the original vocabulary and phrasing
- Maintain the user's tone and voice
- Only reorganize and lightly polish, never rewrite
- Avoid generic LinkedIn clichés
- Sound like spoken language, not formal writing`

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'Suflate',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 4096,
      temperature: 0.7,
    } as OpenRouterRequest),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`OpenRouter API error: ${error.error?.message || 'Unknown error'}`)
  }

  const data = await response.json()
  const rawContent = data.choices[0]?.message?.content || ''
  
  // Parse variations from response (separated by ---VARIATION_START---)
  const variations = rawContent
    .split('---VARIATION_START---')
    .map((v) => v.trim())
    .filter((v) => v.length > 0)

  return {
    variations: variations.length > 0 ? variations : [rawContent], // Fallback to single content if parsing fails
    usage: data.usage,
  }
}

export async function generateCarouselContent(
  transcript: string,
  options?: {
    slideCount?: number
    model?: string
  }
) {
  const model = options?.model || 'anthropic/claude-3.5-sonnet'
  const slideCount = options?.slideCount || 5

  const systemPrompt = `You are an editor creating LinkedIn carousel content. Extract key points from the transcript and structure them into slides.`

  const userPrompt = `Create a ${slideCount}-slide LinkedIn carousel from this transcript:
${transcript}

Each slide should have:
- Title (short, impactful)
- Body text (2-3 sentences)
- Key point or insight

Format as JSON array:
[
  { "slide_number": 1, "title": "...", "body": "...", "key_point": "..." },
  ...
]`

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'Suflate',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 4096,
      temperature: 0.7,
    } as OpenRouterRequest),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`OpenRouter API error: ${error.error?.message || 'Unknown error'}`)
  }

  const data = await response.json()
  const content = data.choices[0]?.message?.content || ''
  
  // Parse JSON from response
  try {
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch (e) {
    // Fallback: return raw content if JSON parsing fails
  }

  return content
}

export default {
  generatePostVariations,
  generateCarouselContent,
}
