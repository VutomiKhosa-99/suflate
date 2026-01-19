import { generatePostVariations } from '@/lib/integrations/openrouter'

// Mock fetch
global.fetch = jest.fn()

describe('OpenRouter Integration - Story 1.5', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('generatePostVariations', () => {
    test('Given a transcription, When amplified, Then returns 5 post variations', async () => {
      const transcript = 'Today I learned about TypeScript. It helps catch errors early and makes code more maintainable.'

      const mockResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: `---VARIATION_START---
Professional Thought Leadership
Today, I discovered how TypeScript transforms JavaScript development. Early error detection and improved code maintainability are game-changers for any developer.

---VARIATION_START---
Personal Story
I just learned TypeScript, and wow, it catches errors early. My code is way more maintainable now!

---VARIATION_START---
Actionable Tips
Want better JavaScript? Try TypeScript. It catches errors early and makes your code more maintainable. Start with basic types and gradually add more.

---VARIATION_START---
Discussion Starter
What's your experience with TypeScript? I'm finding that early error detection and better maintainability are huge wins. Thoughts?

---VARIATION_START---
Bold Opinion
TypeScript isn't optional anymore. If you're not using it, you're leaving early error detection and code maintainability on the table.`,
            },
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 200,
          total_tokens: 300,
        },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await generatePostVariations(transcript)

      expect(result.variations).toHaveLength(5)
      expect(result.variations[0]).toContain('Professional')
      expect(result.variations[1]).toContain('Personal')
      expect(result.variations[2]).toContain('Actionable')
      expect(result.variations[3]).toContain('Discussion')
      expect(result.variations[4]).toContain('Bold')
      expect(result.usage).toBeDefined()
    })

    test('Given a transcription, When amplified, Then preserves original voice and vocabulary', async () => {
      const transcript = 'I love building products that solve real problems. It keeps me motivated.'

      const mockResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: `---VARIATION_START---
I love building products that solve real problems. It keeps me motivated.

---VARIATION_START---
Building products that solve real problems is what I love. That motivation keeps me going.

---VARIATION_START---
There's nothing like building products that solve real problems. The motivation is unmatched.

---VARIATION_START---
Products that solve real problems? That's what I love. The motivation is incredible.

---VARIATION_START---
When I build products that solve real problems, I'm most motivated.`,
            },
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 200,
          total_tokens: 300,
        },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await generatePostVariations(transcript)

      // Verify original vocabulary is preserved (allow word variations like motivated/motivation)
      result.variations.forEach((variation) => {
        expect(variation.toLowerCase()).toContain('products')
        expect(variation.toLowerCase()).toContain('solve')
        expect(variation.toLowerCase()).toContain('problems')
        // Allow word variations (motivated, motivation, motivates)
        expect(
          variation.toLowerCase().includes('motivat')
        ).toBe(true)
      })
    })

    test('Given a transcription, When amplified, Then each variation has different angle', async () => {
      const transcript = 'Team communication is critical for success.'

      const mockResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: `---VARIATION_START---
Professional: Team communication drives organizational success and ensures alignment across all levels.

---VARIATION_START---
Personal: I've learned that team communication is absolutely critical for success. It's changed how I work.

---VARIATION_START---
Actionable: Want better results? Focus on team communication. Clear, consistent communication is critical for success.

---VARIATION_START---
Discussion: What's your take on team communication? I believe it's critical for success, but I'd love to hear other perspectives.

---VARIATION_START---
Bold: Team communication isn't optional—it's critical for success. If you're not prioritizing it, you're failing.`,
            },
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 200,
          total_tokens: 300,
        },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await generatePostVariations(transcript)

      expect(result.variations).toHaveLength(5)
      // Verify variations are different
      const uniqueVariations = new Set(result.variations)
      expect(uniqueVariations.size).toBeGreaterThan(1) // At least some variation
    })

    test('Given OpenRouter API fails, When error occurs, Then throws an error', async () => {
      const transcript = 'Test transcript'

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: { message: 'API error' } }),
      })

      await expect(generatePostVariations(transcript)).rejects.toThrow()
    })

    test('Given custom options, When amplified, Then uses specified parameters', async () => {
      const transcript = 'Test transcript'

      const mockResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: '---VARIATION_START---\nVariation 1',
            },
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 200,
          total_tokens: 300,
        },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      await generatePostVariations(transcript, {
        variationCount: 1,
        temperature: 0.5,
        model: 'anthropic/claude-3-opus',
      })

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/chat/completions'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Bearer'),
            'Content-Type': 'application/json',
          }),
          body: expect.stringContaining('anthropic/claude-3-opus'),
        })
      )
    })
  })

  describe('Voice Preservation', () => {
    test('Given a transcription with specific vocabulary, When amplified, Then vocabulary is preserved', async () => {
      const transcript = 'I absolutely adore creating delightful user experiences. It brings me joy.'

      const mockResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: `---VARIATION_START---
I absolutely adore creating delightful user experiences. It brings me joy.

---VARIATION_START---
Creating delightful user experiences is what I absolutely adore. The joy is unmatched.

---VARIATION_START---
Want to create delightful user experiences? I absolutely adore the process. The joy is real.

---VARIATION_START---
What makes you happy? For me, it's creating delightful user experiences. I absolutely adore it.

---VARIATION_START---
I absolutely adore creating delightful user experiences. Period. The joy speaks for itself.`,
            },
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 200,
          total_tokens: 300,
        },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await generatePostVariations(transcript)

      // Verify unique vocabulary is preserved
      result.variations.forEach((variation) => {
        expect(variation.toLowerCase()).toContain('adore')
        expect(variation.toLowerCase()).toContain('delightful')
      })
    })
  })
})
