'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Mic,
  Type,
  Bookmark,
  Sparkles,
  ArrowRight,
  ChevronRight
} from 'lucide-react'
import { useAuth } from '@/lib/auth/auth-context'

type TabType = 'templates' | 'saved' | 'text-to-carousel' | 'voice-to-carousel'

interface Template {
  id: string
  name: string
  title: string
  subtitle?: string
  author?: string
  handle?: string
  category: string
  isNew?: boolean
  bgColor: string
  accentColor?: string
  textColor: string
  layout: 'hook' | 'visual' | 'article' | 'tweet' | 'tips' | 'question' | 'minimal' | 'numbered'
  hasImage?: boolean
  hasSwipe?: boolean
}

const TEMPLATES: Template[] = [
  // Basic Templates - Row 1
  { 
    id: 'hook-teal', 
    name: 'Hook Template', 
    title: 'HOW TO WRITE HOOK THAT DON\'T SUCK',
    author: 'Jon Snow',
    handle: '@jon-snow',
    category: 'Basic',
    isNew: true,
    bgColor: '#2A5A5A',
    textColor: 'white',
    layout: 'hook',
    hasImage: true,
    hasSwipe: true
  },
  { 
    id: 'visual-emerald', 
    name: 'Visual Post', 
    title: 'The Title of Your Visual Post Here',
    subtitle: 'Lorem ipsum: Lorem ipsum dolor sit amet, consetetur sadipscing.',
    author: '@jon-snow',
    category: 'Basic',
    isNew: true,
    bgColor: '#10B981',
    textColor: 'white',
    layout: 'visual',
    hasImage: true
  },
  { 
    id: 'data-driven', 
    name: 'Data-Driven', 
    title: 'The Power of Data-Driven Marketing in B2B',
    subtitle: 'The Power of Data-Driven Marketing in B2B',
    author: 'Gerald Smith',
    handle: '@amgeraldsmith',
    category: 'Basic',
    isNew: true,
    bgColor: '#F8FAFC',
    accentColor: '#0D9488',
    textColor: 'dark',
    layout: 'article'
  },
  { 
    id: 'tweet-thread', 
    name: 'Tweet Thread', 
    title: 'Podcasts are one of the best ways to generate many different types of content.',
    author: 'Justin Jackson',
    handle: '@mijustin',
    category: 'Basic',
    isNew: true,
    bgColor: '#1E293B',
    textColor: 'white',
    layout: 'tweet'
  },
  // Basic Templates - Row 2
  { 
    id: 'master-skill', 
    name: 'Master Skill', 
    title: 'Master Any Skill Quickly',
    subtitle: 'LEARN FROM BRAIN COACH, JIM KWIK',
    author: 'Jon Snow',
    handle: '@jon-snow',
    category: 'Basic',
    bgColor: '#134E4A',
    textColor: 'white',
    layout: 'hook',
    hasImage: true,
    hasSwipe: true
  },
  { 
    id: 'question-purple', 
    name: 'Question Purple', 
    title: 'Ask any questions in the comments.',
    subtitle: 'Like, share and save for later.',
    category: 'Basic',
    bgColor: '#7C3AED',
    textColor: 'white',
    layout: 'question',
    hasImage: true
  },
  { 
    id: 'email-tips', 
    name: 'Email Tips', 
    title: 'Email is THE best way to grow your business.',
    subtitle: '• More sales\n• Better relationships\n• No algorithm problems',
    author: 'Jon Snow',
    handle: '@jon-snow',
    category: 'Basic',
    bgColor: '#FFFFFF',
    accentColor: '#0D9488',
    textColor: 'dark',
    layout: 'tips',
    hasSwipe: true
  },
  { 
    id: 'ways-green', 
    name: '6 Ways Template', 
    title: '6 WAYS TO GAIN CUSTOMER TRUST',
    author: 'Jon Snow',
    category: 'Basic',
    bgColor: '#22C55E',
    textColor: 'white',
    layout: 'numbered'
  },
  // Professional Templates
  { 
    id: 'business-mindset', 
    name: 'Business Mindset', 
    title: 'BUSINESS MINDSET & PERSONAL GROWTH',
    author: 'Jon Snow',
    handle: '@jon-snow',
    category: 'Professional',
    bgColor: '#FFFFFF',
    textColor: 'dark',
    layout: 'minimal',
    hasSwipe: true
  },
  { 
    id: 'hook-purple', 
    name: 'Hook Purple', 
    title: 'HOW TO WRITE HOOK THAT DON\'T SUCK',
    author: 'Jon Snow',
    category: 'Professional',
    bgColor: '#8B5CF6',
    textColor: 'white',
    layout: 'hook'
  },
  { 
    id: 'leads-lavender', 
    name: 'Lead Generation', 
    title: 'How to generate leads on LinkedIn for your business',
    subtitle: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem.',
    author: 'Jon Snow',
    category: 'Professional',
    bgColor: '#DDD6FE',
    textColor: 'dark',
    layout: 'article',
    hasImage: true
  },
  { 
    id: 'product-desc', 
    name: 'Product Description', 
    title: 'HOW TO WRITE PRODUCT DESCRIPTION BETTER.',
    subtitle: 'Excepteur sint occaecat cupidatat non proident',
    author: 'Jon Snow',
    category: 'Professional',
    bgColor: '#1E1B4B',
    accentColor: '#F59E0B',
    textColor: 'white',
    layout: 'visual'
  },
  // Creative Templates
  { 
    id: 'orlando-hooks', 
    name: 'Orlando Hooks', 
    title: 'How to write hooks that don\'t suck',
    subtitle: 'Based on tips from 20+ top LinkedIn creators',
    author: 'Orlando Diggs',
    handle: '@ordiggs',
    category: 'Creative',
    bgColor: '#064E3B',
    textColor: 'white',
    layout: 'hook',
    hasImage: true,
    hasSwipe: true
  },
  { 
    id: 'attention-cyan', 
    name: 'Attention Grabber', 
    title: 'WANT TO GET SOMEONE\'S ATTENTION ONLINE?',
    author: 'Kari Rasmussen',
    handle: '@kariras',
    category: 'Creative',
    bgColor: '#06B6D4',
    textColor: 'white',
    layout: 'question',
    hasSwipe: true
  },
  { 
    id: 'linkedin-post', 
    name: 'Perfect Post', 
    title: '18 PRINCIPLES FOR THE \'PERFECT\' LINKEDIN POST',
    author: 'Kari Rasmussen',
    handle: '@kariras',
    category: 'Creative',
    bgColor: '#FFFFFF',
    textColor: 'dark',
    layout: 'numbered',
    hasSwipe: true
  },
  { 
    id: 'personal-brand', 
    name: 'Personal Brand', 
    title: 'How to build your personal brand on social media',
    author: 'Aliah Lane',
    handle: '@alane',
    category: 'Creative',
    bgColor: '#0EA5E9',
    textColor: 'white',
    layout: 'visual'
  },
  // Advanced Templates
  { 
    id: 'content-plan', 
    name: 'Content Plan', 
    title: 'CONTENT PLAN STRATEGY',
    author: 'LOKI BRIGHT',
    category: 'Advanced',
    bgColor: '#7C3AED',
    textColor: 'white',
    layout: 'minimal',
    hasSwipe: true
  },
  { 
    id: 'paste-article', 
    name: 'Paste Article', 
    title: 'Paste your article',
    subtitle: 'Read an interesting article that you want to share with your LinkedIn audience?',
    category: 'Advanced',
    bgColor: '#FFFFFF',
    textColor: 'dark',
    layout: 'article',
    hasSwipe: true
  },
  { 
    id: 'web-article', 
    name: 'Web to LinkedIn', 
    title: 'Let\'s Turn Your Web Article To A LinkedIn Post',
    author: 'Supergrow',
    handle: '@supergrow',
    category: 'Advanced',
    bgColor: '#0EA5E9',
    accentColor: '#F97316',
    textColor: 'white',
    layout: 'numbered',
    hasSwipe: true
  },
  { 
    id: 'agency-finder', 
    name: 'Agency Finder', 
    title: 'Find the best web design & dev agency',
    subtitle: 'Here are 5 tips to get you going. (Phase 1)',
    author: 'Supergrow',
    handle: '@supergrowai',
    category: 'Advanced',
    bgColor: '#F97316',
    textColor: 'white',
    layout: 'visual',
    hasImage: true,
    hasSwipe: true
  },
]

const CATEGORIES = ['Basic', 'Professional', 'Creative', 'Advanced']

/**
 * Carousels Page - Supergrow Style
 * Templates, Saved, Text to Carousel, Voice to Carousel tabs
 */
export default function CarouselsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [activeTab, setActiveTab] = useState<TabType>('templates')
  const [savedCount, setSavedCount] = useState(0)
  const [textContent, setTextContent] = useState('')
  const [generating, setGenerating] = useState(false)

  // Fetch saved carousels count
  useEffect(() => {
    async function fetchSavedCount() {
      try {
        const response = await fetch('/api/suflate/amplify/carousel')
        if (response.ok) {
          const data = await response.json()
          setSavedCount(data.carousels?.length || 0)
        }
      } catch (err) {
        console.error('Failed to fetch saved count:', err)
      }
    }
    if (!authLoading) {
      fetchSavedCount()
    }
  }, [authLoading])

  const handleTemplateSelect = (template: Template) => {
    // Generate a unique ID for the new carousel
    const newCarouselId = `new-${Date.now()}`
    router.push(`/carousels/editor/${newCarouselId}?template=${template.id}`)
  }

  const handleTextToCarousel = async () => {
    if (!textContent.trim()) return
    setGenerating(true)
    try {
      const res = await fetch('/api/suflate/amplify/carousel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: textContent,
          templateType: 'visual-post',
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.carousel?.id) {
          router.push(`/carousel/${data.carousel.id}`)
        }
      }
    } catch (e) {
      console.error('Failed to generate carousel:', e)
    } finally {
      setGenerating(false)
    }
  }

  const renderTemplateCard = (template: Template) => {
    const isDarkText = template.textColor === 'dark'
    
    return (
      <button
        key={template.id}
        onClick={() => handleTemplateSelect(template)}
        className="group relative aspect-[4/5] rounded-xl overflow-hidden border border-gray-200 hover:shadow-xl transition-all hover:scale-[1.02] bg-white"
      >
        {/* Template Preview */}
        <div 
          className="absolute inset-0"
          style={{ backgroundColor: template.bgColor }}
        >
          {/* New Badge */}
          {template.isNew && (
            <div className="absolute top-3 right-3 px-2 py-1 bg-emerald-500 text-white text-xs font-medium rounded z-10">
              New
            </div>
          )}
          
          {/* Content Preview based on layout */}
          <div className="absolute inset-0 p-4 flex flex-col">
            
            {/* Hook Layout - Big title with author at bottom */}
            {template.layout === 'hook' && (
              <>
                {template.hasImage && (
                  <div className="absolute top-0 right-0 w-1/2 h-2/3 bg-gradient-to-bl from-black/20 to-transparent" />
                )}
                <div className="flex-1 flex flex-col justify-center">
                  <h3 
                    className="text-lg font-bold leading-tight"
                    style={{ color: isDarkText ? '#1F2937' : '#FFFFFF' }}
                  >
                    {template.title}
                  </h3>
                  {template.subtitle && (
                    <p 
                      className="text-xs mt-2 opacity-80"
                      style={{ color: isDarkText ? '#6B7280' : '#FFFFFF' }}
                    >
                      {template.subtitle}
                    </p>
                  )}
                </div>
                {template.author && (
                  <div className="flex items-center gap-2 mt-auto">
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ 
                        backgroundColor: isDarkText ? '#E5E7EB' : 'rgba(255,255,255,0.2)',
                        color: isDarkText ? '#374151' : '#FFFFFF'
                      }}
                    >
                      {template.author.charAt(0)}
                    </div>
                    <span 
                      className="text-xs"
                      style={{ color: isDarkText ? '#374151' : '#FFFFFF' }}
                    >
                      {template.author}
                    </span>
                    {template.hasSwipe && (
                      <div className="ml-auto flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                        style={{ backgroundColor: isDarkText ? '#E5E7EB' : 'rgba(255,255,255,0.2)' }}
                      >
                        <span style={{ color: isDarkText ? '#374151' : '#FFFFFF' }}>Swipe</span>
                        <ArrowRight className="w-3 h-3" style={{ color: isDarkText ? '#374151' : '#FFFFFF' }} />
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
            
            {/* Visual Layout - Title with subtitle and dots */}
            {template.layout === 'visual' && (
              <>
                {template.author && (
                  <p 
                    className="text-[10px] mb-1 opacity-70"
                    style={{ color: isDarkText ? '#6B7280' : '#FFFFFF' }}
                  >
                    {template.handle || template.author}
                  </p>
                )}
                <div className="flex-1 flex flex-col justify-center">
                  <h3 
                    className="text-sm font-bold leading-tight mb-2"
                    style={{ color: isDarkText ? '#1F2937' : '#FFFFFF' }}
                  >
                    {template.title}
                  </h3>
                  {template.subtitle && (
                    <p 
                      className="text-[10px] opacity-80"
                      style={{ color: isDarkText ? '#6B7280' : '#FFFFFF' }}
                    >
                      {template.subtitle}
                    </p>
                  )}
                </div>
                {template.hasImage && (
                  <div className="absolute bottom-16 right-4 w-12 h-12 rounded-lg bg-black/10" />
                )}
                <div className="flex justify-center gap-1 mt-auto">
                  {[...Array(4)].map((_, i) => (
                    <div 
                      key={i} 
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: isDarkText ? '#9CA3AF' : 'rgba(255,255,255,0.5)' }}
                    />
                  ))}
                </div>
              </>
            )}
            
            {/* Article Layout - Accent bar with title */}
            {template.layout === 'article' && (
              <>
                <div 
                  className="w-10 h-1 mb-3 rounded"
                  style={{ backgroundColor: template.accentColor || '#0D9488' }}
                />
                <h3 
                  className="text-sm font-bold leading-tight mb-2"
                  style={{ color: isDarkText ? '#1F2937' : '#FFFFFF' }}
                >
                  {template.title}
                </h3>
                {template.subtitle && (
                  <p 
                    className="text-[10px] opacity-70"
                    style={{ color: isDarkText ? '#6B7280' : '#FFFFFF' }}
                  >
                    {template.subtitle}
                  </p>
                )}
                {template.author && (
                  <div className="flex items-center gap-2 mt-auto">
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ 
                        backgroundColor: isDarkText ? '#E5E7EB' : 'rgba(255,255,255,0.2)',
                        color: isDarkText ? '#374151' : '#FFFFFF'
                      }}
                    >
                      {template.author.charAt(0)}
                    </div>
                    <div>
                      <span 
                        className="text-xs block"
                        style={{ color: isDarkText ? '#374151' : '#FFFFFF' }}
                      >
                        {template.author}
                      </span>
                      {template.handle && (
                        <span 
                          className="text-[10px] opacity-60"
                          style={{ color: isDarkText ? '#6B7280' : '#FFFFFF' }}
                        >
                          {template.handle}
                        </span>
                      )}
                    </div>
                    {template.hasSwipe && (
                      <div 
                        className="ml-auto w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: isDarkText ? '#E5E7EB' : 'rgba(255,255,255,0.2)' }}
                      >
                        <ArrowRight className="w-3 h-3" style={{ color: isDarkText ? '#374151' : '#FFFFFF' }} />
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
            
            {/* Tweet Layout - Twitter/X style */}
            {template.layout === 'tweet' && (
              <div className="flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-full bg-gray-600" />
                  <div className="flex-1">
                    <p className="text-[10px] font-medium text-white flex items-center gap-1">
                      {template.author} 
                      <span className="text-blue-400">✓</span>
                    </p>
                    <p className="text-[8px] text-white/60">{template.handle}</p>
                  </div>
                  <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
                <p className="text-[10px] text-white/90 leading-relaxed flex-1">
                  {template.title}
                </p>
                <p className="text-[8px] text-white/50 mt-2">
                  1:45 PM · Jun 16, 2023
                </p>
              </div>
            )}
            
            {/* Question Layout - Centered with image */}
            {template.layout === 'question' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                {template.hasImage && (
                  <div 
                    className="w-16 h-16 rounded-lg mb-3 flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                  >
                    <div className="w-10 h-10 rounded-full bg-white/30" />
                  </div>
                )}
                <h3 
                  className="text-sm font-bold leading-tight mb-2"
                  style={{ color: '#FFFFFF' }}
                >
                  {template.title}
                </h3>
                {template.subtitle && (
                  <p className="text-[10px] text-white/70">
                    {template.subtitle}
                  </p>
                )}
                <div className="flex gap-2 mt-3">
                  {['💬', '❤️', '🔖'].map((emoji, i) => (
                    <span key={i} className="text-sm">{emoji}</span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Tips Layout - List style */}
            {template.layout === 'tips' && (
              <>
                {template.author && (
                  <div className="flex items-center gap-2 mb-3">
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ 
                        backgroundColor: '#E5E7EB',
                        color: '#374151'
                      }}
                    >
                      {template.author.charAt(0)}
                    </div>
                    <div>
                      <span className="text-xs text-gray-700">{template.author}</span>
                      {template.handle && (
                        <span className="text-[10px] text-gray-500 block">{template.handle}</span>
                      )}
                    </div>
                  </div>
                )}
                <div 
                  className="w-full h-0.5 mb-3"
                  style={{ backgroundColor: template.accentColor || '#0D9488' }}
                />
                <h3 className="text-xs font-medium text-gray-800 mb-2">
                  {template.title}
                </h3>
                {template.subtitle && (
                  <div className="text-[10px] text-gray-600 space-y-1">
                    {template.subtitle.split('\n').map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                )}
                {template.hasSwipe && (
                  <div className="mt-auto flex justify-end">
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                )}
              </>
            )}
            
            {/* Minimal Layout */}
            {template.layout === 'minimal' && (
              <>
                {template.author && (
                  <div className="flex items-center gap-2 mb-2">
                    <div 
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{ 
                        backgroundColor: isDarkText ? '#E5E7EB' : 'rgba(255,255,255,0.2)',
                        color: isDarkText ? '#374151' : '#FFFFFF'
                      }}
                    >
                      {template.author.charAt(0)}
                    </div>
                    <span 
                      className="text-[10px]"
                      style={{ color: isDarkText ? '#6B7280' : 'rgba(255,255,255,0.7)' }}
                    >
                      {template.handle || template.author}
                    </span>
                  </div>
                )}
                <div className="flex-1 flex flex-col justify-center">
                  <h3 
                    className="text-base font-bold leading-tight"
                    style={{ color: isDarkText ? '#1F2937' : '#FFFFFF' }}
                  >
                    {template.title}
                  </h3>
                </div>
                {template.hasSwipe && (
                  <div className="flex items-center justify-center gap-2 mt-auto">
                    <span 
                      className="text-xs"
                      style={{ color: isDarkText ? '#6B7280' : 'rgba(255,255,255,0.7)' }}
                    >
                      SWIPE
                    </span>
                    <div className="w-16 h-0.5 bg-current opacity-30" />
                    <ArrowRight className="w-4 h-4" style={{ color: isDarkText ? '#6B7280' : 'rgba(255,255,255,0.7)' }} />
                  </div>
                )}
              </>
            )}
            
            {/* Numbered Layout - With step indicator */}
            {template.layout === 'numbered' && (
              <>
                {template.accentColor && (
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-2"
                    style={{ backgroundColor: template.accentColor, color: '#FFFFFF' }}
                  >
                    01
                  </div>
                )}
                <h3 
                  className="text-sm font-bold leading-tight mb-2"
                  style={{ color: isDarkText ? '#1F2937' : '#FFFFFF' }}
                >
                  {template.title}
                </h3>
                {template.author && (
                  <div className="flex items-center gap-2 mt-auto">
                    <div 
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{ 
                        backgroundColor: isDarkText ? '#E5E7EB' : 'rgba(255,255,255,0.2)',
                        color: isDarkText ? '#374151' : '#FFFFFF'
                      }}
                    >
                      {template.author.charAt(0)}
                    </div>
                    <span 
                      className="text-[10px]"
                      style={{ color: isDarkText ? '#6B7280' : 'rgba(255,255,255,0.7)' }}
                    >
                      {template.handle || template.author}
                    </span>
                    {template.hasSwipe && (
                      <span 
                        className="ml-auto text-[10px] flex items-center gap-1"
                        style={{ color: isDarkText ? '#6B7280' : 'rgba(255,255,255,0.7)' }}
                      >
                        Swipe right →
                      </span>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
      </button>
    )
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Carousel Maker</h1>
        <p className="text-gray-500 mt-1">Design high-performing LinkedIn carousel posts in minutes.</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('templates')}
            className={`pb-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'templates'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Templates
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`pb-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'saved'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Saved
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              activeTab === 'saved' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'
            }`}>
              {savedCount}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('text-to-carousel')}
            className={`pb-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'text-to-carousel'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Text to Carousel
          </button>
          <button
            onClick={() => setActiveTab('voice-to-carousel')}
            className={`pb-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'voice-to-carousel'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Mic className="w-4 h-4" />
            Voice to Carousel
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'templates' && (
        <div className="space-y-10">
          {CATEGORIES.map((category) => {
            const categoryTemplates = TEMPLATES.filter(t => t.category === category)
            return (
              <div key={category}>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">{category}</h2>
                <p className="text-sm text-gray-500 mb-4">
                  {category === 'Basic' && 'For those who want to get started quickly.'}
                  {category === 'Professional' && 'Perfect for business and corporate content.'}
                  {category === 'Creative' && 'Stand out with bold and unique designs.'}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {categoryTemplates.map(renderTemplateCard)}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {activeTab === 'saved' && (
        <div>
          {savedCount === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bookmark className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No saved carousels yet</h3>
              <p className="text-gray-500 mb-6">Create your first carousel from a template</p>
              <button
                onClick={() => setActiveTab('templates')}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Browse Templates
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Saved carousels would be rendered here */}
              <p className="text-gray-500 col-span-full">Loading saved carousels...</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'text-to-carousel' && (
        <div className="max-w-2xl">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Type className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Text to Carousel</h3>
                <p className="text-sm text-gray-500">Paste your text and we&apos;ll convert it into slides</p>
              </div>
            </div>
            
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Paste your blog post, article, or any text content here...

AI will automatically:
• Break it into digestible slides
• Add engaging headlines
• Format for maximum impact"
              rows={8}
              className="w-full p-4 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            
            <div className="flex justify-between items-center mt-4">
              <p className="text-sm text-gray-500">
                {textContent.length} characters
              </p>
              <button
                onClick={handleTextToCarousel}
                disabled={!textContent.trim() || generating}
                className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {generating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Carousel
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'voice-to-carousel' && (
        <div className="max-w-2xl">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Mic className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Voice to Carousel</h3>
                <p className="text-sm text-gray-500">Record your voice and we&apos;ll create a carousel</p>
              </div>
            </div>
            
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mic className="w-10 h-10 text-emerald-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Record Your Voice</h4>
              <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                Speak naturally about your topic. We&apos;ll transcribe, structure, and design your carousel automatically.
              </p>
              <Link
                href="/record?mode=carousel"
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
              >
                <Mic className="w-5 h-5" />
                Start Recording
              </Link>
            </div>
            
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h5 className="font-medium text-gray-900 mb-2">How it works:</h5>
              <ol className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">1</span>
                  Record your voice explaining your topic (up to 3 minutes)
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">2</span>
                  AI transcribes and extracts key points
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">3</span>
                  Choose a template and customize your carousel
                </li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
