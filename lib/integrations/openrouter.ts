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

export type VariationType = 'professional' | 'personal' | 'actionable' | 'discussion' | 'bold'

const VARIATION_PROMPTS: Record<VariationType, { name: string; description: string; instructions: string }> = {
  professional: {
    name: 'Professional Thought Leadership',
    description: 'Executive tone, industry insights',
    instructions: `Write in an authoritative, executive tone. Focus on industry trends, strategic insights, and thought leadership. Use data-driven language and position the speaker as an expert. Include phrases like "Here's what I've observed...", "The key insight is...", "From my experience..."`
  },
  personal: {
    name: 'Personal Story',
    description: 'Narrative format, emotional connection',
    instructions: `Write as a personal story or journey. Use first-person narrative, include emotions and reflections. Start with "I remember when...", "Let me tell you about...", or a specific moment. Make it relatable and vulnerable.`
  },
  actionable: {
    name: 'Actionable Tips',
    description: 'List-based, practical value',
    instructions: `Structure as a list of practical tips or steps. Use clear numbering or bullet points. Focus on "How to..." or "X things I learned...". Make each point specific and immediately actionable.`
  },
  discussion: {
    name: 'Discussion Starter',
    description: 'Question-driven, engagement-focused',
    instructions: `Frame the content as questions or debates. Start with a provocative question. Include "What do you think about...", "I'm curious...", "Hot take:". End with a question to drive comments.`
  },
  bold: {
    name: 'Bold Opinion',
    description: 'Controversial stance, conversation-driving',
    instructions: `Take a strong, potentially controversial stance. Use phrases like "Unpopular opinion:", "I'm going to say it:", "Most people get this wrong:". Be direct and confident.`
  }
}

export async function generatePostVariations(
  transcript: string,
  options?: {
    contentType?: 'story' | 'lesson' | 'opinion' | 'tactical'
    variationCount?: number
    variationType?: VariationType  // NEW: Generate specific type only
    model?: string
  }
) {
  const model = options?.model || 'anthropic/claude-3.5-sonnet'
  const specificType = options?.variationType
  const variationCount = specificType ? 3 : (options?.variationCount || 5)

  const systemPrompt = `You are an editor, not an author. Your job is to organize and polish the user's spoken thoughts into LinkedIn posts while preserving their authentic voice, vocabulary, and tone. Never invent new ideas or change the user's opinions.`

  let userPrompt: string

  if (specificType) {
    // Generate 3 variations of ONE specific type
    const typeConfig = VARIATION_PROMPTS[specificType]
    userPrompt = `Transform this transcript into 3 LinkedIn post variations, ALL in the "${typeConfig.name}" style.

Transcript:
${transcript}

Style: ${typeConfig.name}
Description: ${typeConfig.description}
Instructions: ${typeConfig.instructions}

Generate EXACTLY 3 different variations, all in this same style but with different angles/hooks.

Each variation must:
- Follow the "${typeConfig.name}" style strictly
- Preserve the original vocabulary and phrasing
- Maintain the user's tone and voice
- Only reorganize and lightly polish, never rewrite
- Avoid generic LinkedIn clichés
- Sound like spoken language, not formal writing
- Be between 150-300 words

Format: Start each variation with ---VARIATION_START--- on its own line, then the post content.`
  } else {
    // Generate all 5 types (original behavior)
    userPrompt = `Transform this transcript into ${variationCount} LinkedIn post variations with different angles:
${transcript}

Generate variations:
1. Professional thought leadership - ${VARIATION_PROMPTS.professional.instructions}
2. Personal story - ${VARIATION_PROMPTS.personal.instructions}
3. Actionable tips - ${VARIATION_PROMPTS.actionable.instructions}
4. Discussion starter - ${VARIATION_PROMPTS.discussion.instructions}
5. Bold opinion - ${VARIATION_PROMPTS.bold.instructions}

Each variation must:
- Preserve the original vocabulary and phrasing
- Maintain the user's tone and voice
- Only reorganize and lightly polish, never rewrite
- Avoid generic LinkedIn clichés
- Sound like spoken language, not formal writing

Format: Start each variation with ---VARIATION_START--- on its own line, then the post content.`
  }

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
  
  // Parse variations from response
  let variations: string[] = []
  
  // Try parsing with ---VARIATION_START--- separator first
  if (rawContent.includes('---VARIATION_START---')) {
    variations = rawContent
      .split('---VARIATION_START---')
      .map((v: string) => v.trim())
      .filter((v: string) => v.length > 0)
  }
  // Try parsing with numbered format (1. 2. 3. etc) or headers
  else {
    // Remove common headers and clean up
    const cleanContent = rawContent
      .replace(/Here are \d+ variations.*?:/gi, '')
      .replace(/Here's.*?:/gi, '')
      .replace(/maintaining.*?voice:/gi, '')
      .trim()
    
    // Split by numbered patterns like "1." "2." etc at start of line
    const numberedPattern = /(?:^|\n)(?:\d+\.\s*(?:\*\*)?(?:Professional|Personal|Actionable|Discussion|Bold)[^:]*(?:\*\*)?:\s*\n?)/gi
    
    if (numberedPattern.test(cleanContent)) {
      // Reset regex
      const parts = cleanContent.split(/(?:^|\n)\d+\.\s*(?:\*\*)?(?:Professional|Personal|Actionable|Discussion|Bold)[^:]*(?:\*\*)?:\s*\n?/gi)
      variations = parts
        .map((v: string) => v.trim())
        .filter((v: string) => v.length > 50) // Filter out short fragments
    }
    
    // If still no variations, try splitting by double newlines and quotation marks
    if (variations.length === 0) {
      // Try to find quoted content
      const quotedPattern = /"([^"]{100,})"/g
      const matches = [...rawContent.matchAll(quotedPattern)]
      if (matches.length >= 3) {
        variations = matches.map(m => m[1].trim())
      }
    }
    
    // If still no variations, try splitting by "---" or "***"
    if (variations.length === 0 && (rawContent.includes('---') || rawContent.includes('***'))) {
      variations = rawContent
        .split(/(?:---|\*\*\*)/)
        .map((v: string) => v.trim())
        .filter((v: string) => v.length > 100)
    }
  }

  // Clean up each variation - remove leading numbers, headers, quotes
  variations = variations.map((v: string) => {
    return v
      .replace(/^\d+\.\s*/, '') // Remove leading "1. "
      .replace(/^(?:\*\*)?(?:Professional|Personal|Actionable|Discussion|Bold)[^:]*(?:\*\*)?:\s*/i, '') // Remove type header
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .trim()
  }).filter((v: string) => v.length > 50)

  // Fallback: if parsing failed, use the whole content
  if (variations.length === 0) {
    variations = [rawContent]
  }

  return {
    variations,
    variationType: specificType,
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

/**
 * Epic 6: Content Repurposing
 * Generate LinkedIn posts from repurposed content (blog, tweet, video, PDF)
 */
export async function repurposeContent(
  content: string,
  options: {
    sourceType: 'blog' | 'tweet' | 'youtube' | 'pdf'
    title?: string
    sourceUrl?: string
    model?: string
  }
) {
  const model = options.model || 'anthropic/claude-3.5-sonnet'
  const variationCount = 3 // Repurposed content gets 3 variations

  const sourceTypePrompts: Record<string, string> = {
    blog: `You are transforming a blog post into LinkedIn content. Extract the key insights and create engaging posts that capture the blog's core message while adapting it for LinkedIn's professional audience.`,
    tweet: `You are expanding a tweet/short thought into LinkedIn content. Take the core idea and expand it with more context, examples, and depth suitable for LinkedIn's longer format.`,
    youtube: `You are transforming video content into LinkedIn posts. Extract the key insights, main takeaways, and most valuable points from this video transcript/description.`,
    pdf: `You are extracting key insights from a document and transforming them into LinkedIn posts. Focus on the most actionable and valuable information.`,
  }

  const systemPrompt = sourceTypePrompts[options.sourceType]

  const titleContext = options.title ? `\n\nOriginal Title: "${options.title}"` : ''
  const sourceContext = options.sourceUrl ? `\n\nSource: ${options.sourceUrl}` : ''

  const userPrompt = `Transform this ${options.sourceType} content into ${variationCount} LinkedIn post variations:
${titleContext}${sourceContext}

Content:
${content}

Generate ${variationCount} distinct LinkedIn post variations:
1. Insight-focused: Lead with the most valuable insight
2. Story/Hook: Start with an engaging hook or story angle
3. Actionable: Focus on takeaways and what readers can do

Requirements for each variation:
- 150-300 words (LinkedIn optimal length)
- Include a strong opening line (hook)
- Break into readable paragraphs
- End with a question or call to engagement
- Use line breaks for readability
- No hashtags in the main content (add 3-5 relevant hashtags at the end)
${options.sourceUrl ? `- Reference the original source naturally` : ''}

Format each variation starting with ---VARIATION--- on its own line.`

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
  
  // Parse variations from response
  const variations = rawContent
    .split('---VARIATION---')
    .map((v: string) => v.trim())
    .filter((v: string) => v.length > 50) // Filter out empty or too-short sections

  return {
    variations: variations.length > 0 ? variations : [rawContent],
    usage: data.usage,
  }
}

export default {
  generatePostVariations,
  generateCarouselContent,
  repurposeContent,
}
