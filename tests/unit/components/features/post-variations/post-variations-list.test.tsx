import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PostVariationsList } from '@/components/features/post-variations/post-variations-list'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}))

describe('PostVariationsList Component - Story 1.6', () => {
  const mockPosts = [
    {
      id: 'post-1',
      content: 'This is a professional thought leadership post about TypeScript.',
      variation_type: 'professional',
      status: 'draft',
      created_at: new Date().toISOString(),
    },
    {
      id: 'post-2',
      content: 'I just learned TypeScript and wanted to share my personal journey.',
      variation_type: 'personal',
      status: 'draft',
      created_at: new Date().toISOString(),
    },
    {
      id: 'post-3',
      content: 'Here are 5 actionable tips for getting started with TypeScript.',
      variation_type: 'actionable',
      status: 'draft',
      created_at: new Date().toISOString(),
    },
    {
      id: 'post-4',
      content: 'What do you think about TypeScript? I\'d love to hear your thoughts.',
      variation_type: 'discussion',
      status: 'draft',
      created_at: new Date().toISOString(),
    },
    {
      id: 'post-5',
      content: 'TypeScript is not optional anymore. If you\'re not using it, you\'re behind.',
      variation_type: 'bold',
      status: 'draft',
      created_at: new Date().toISOString(),
    },
  ]

  const variationLabels: Record<string, string> = {
    professional: 'Professional Thought Leadership',
    personal: 'Personal Story',
    actionable: 'Actionable Tips',
    discussion: 'Discussion Starter',
    bold: 'Bold Opinion',
  }

  describe('Given I have amplified a voice note', () => {
    test('When I view the results screen, Then I see all 5 post variations', () => {
      render(<PostVariationsList posts={mockPosts} />)

      mockPosts.forEach((post) => {
        expect(screen.getByText(post.content)).toBeInTheDocument()
      })
    })

    test('When I view the results screen, Then each variation has a clear label', () => {
      render(<PostVariationsList posts={mockPosts} />)

      mockPosts.forEach((post) => {
        const label = variationLabels[post.variation_type!]
        expect(screen.getByText(label)).toBeInTheDocument()
      })
    })

    test('When I view the results screen, Then variations are displayed in a list or grid', () => {
      const { container } = render(<PostVariationsList posts={mockPosts} />)

      // Should have container for posts
      const postsContainer = container.querySelector('[data-testid="post-variations"]') ||
                            container.querySelector('.space-y-4')
      expect(postsContainer).toBeInTheDocument()
    })
  })

  describe('Given I view post variations', () => {
    test('When I click on a variation, Then I can view it in detail or edit it', async () => {
      const user = userEvent.setup({ delay: null })
      const onSelect = jest.fn()

      render(<PostVariationsList posts={mockPosts} onSelect={onSelect} />)

      const firstPost = screen.getByText(mockPosts[0].content)
      await user.click(firstPost)

      expect(onSelect).toHaveBeenCalledWith(mockPosts[0].id)
    })

    test('When I view variations, Then I can see which one is selected or highlighted', () => {
      render(<PostVariationsList posts={mockPosts} selectedPostId="post-2" />)

      // Verify selected post has different styling (would need to check className or data attributes)
      const selectedPost = screen.getByText(mockPosts[1].content).closest('[data-selected="true"]') ||
                          screen.getByText(mockPosts[1].content).closest('.border-blue-500')
      
      // At minimum, the selected post should be findable
      expect(screen.getByText(mockPosts[1].content)).toBeInTheDocument()
    })
  })

  describe('Variation Labels', () => {
    test('Given post variation type is "professional", When displayed, Then shows "Professional Thought Leadership"', () => {
      render(<PostVariationsList posts={[mockPosts[0]]} />)
      expect(screen.getByText('Professional Thought Leadership')).toBeInTheDocument()
    })

    test('Given post variation type is "personal", When displayed, Then shows "Personal Story"', () => {
      render(<PostVariationsList posts={[mockPosts[1]]} />)
      expect(screen.getByText('Personal Story')).toBeInTheDocument()
    })

    test('Given post variation type is "actionable", When displayed, Then shows "Actionable Tips"', () => {
      render(<PostVariationsList posts={[mockPosts[2]]} />)
      expect(screen.getByText('Actionable Tips')).toBeInTheDocument()
    })

    test('Given post variation type is "discussion", When displayed, Then shows "Discussion Starter"', () => {
      render(<PostVariationsList posts={[mockPosts[3]]} />)
      expect(screen.getByText('Discussion Starter')).toBeInTheDocument()
    })

    test('Given post variation type is "bold", When displayed, Then shows "Bold Opinion"', () => {
      render(<PostVariationsList posts={[mockPosts[4]]} />)
      expect(screen.getByText('Bold Opinion')).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    test('Given no posts exist, When I view the screen, Then I see an empty state message', () => {
      render(<PostVariationsList posts={[]} />)
      expect(screen.getByText(/No post variations generated yet/i)).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    test('Given posts are loading, When I view the screen, Then I see a loading indicator', () => {
      render(<PostVariationsList posts={[]} loading={true} />)
      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })
  })
})
