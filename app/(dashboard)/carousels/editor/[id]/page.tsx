'use client'

import { useParams, useSearchParams } from 'next/navigation'
import { SupergrowCarouselEditor } from '@/components/features/carousel/supergrow-carousel-editor'

export default function NewCarouselEditorPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const carouselId = params?.id as string
  const templateId = searchParams?.get('template')

  // Default slides based on template or generic
  const getInitialSlides = () => {
    if (templateId === 'hook-teal' || templateId === 'hook-purple' || templateId === 'orlando-hooks') {
      return [
        { id: '1', title: 'HOW TO WRITE HOOKS THAT DON\'T SUCK', description: '' },
        { id: '2', title: 'KEEP IT SHORT', description: 'Your hook should fit on one line and get a point across quickly.' },
        { id: '3', title: 'USE POWER WORDS', description: 'Words like "secret", "proven", "instant" grab attention.' },
        { id: '4', title: 'CREATE CURIOSITY', description: 'Make people want to know more. Tease the value inside.' },
        { id: '5', title: 'FOLLOW FOR MORE', description: 'Like and share if you found this helpful!' },
      ]
    }
    
    if (templateId === 'ways-green' || templateId === 'numbered') {
      return [
        { id: '1', title: '6 WAYS TO GAIN CUSTOMER TRUST', description: '' },
        { id: '2', title: '1. BE TRANSPARENT', description: 'Share your process openly. Customers appreciate honesty.' },
        { id: '3', title: '2. DELIVER ON PROMISES', description: 'Do what you say you\'ll do. Every single time.' },
        { id: '4', title: '3. RESPOND QUICKLY', description: 'Fast responses show you care about their time.' },
        { id: '5', title: '4. ADMIT MISTAKES', description: 'Own your errors and fix them promptly.' },
        { id: '6', title: '5. ASK FOR FEEDBACK', description: 'Show you want to improve for them.' },
      ]
    }

    if (templateId === 'content-plan') {
      return [
        { id: '1', title: 'CONTENT PLAN STRATEGY', description: '' },
        { id: '2', title: 'DEFINE YOUR GOALS', description: 'What do you want to achieve with your content?' },
        { id: '3', title: 'KNOW YOUR AUDIENCE', description: 'Who are you creating content for?' },
        { id: '4', title: 'PLAN YOUR TOPICS', description: 'Create a content calendar with themes.' },
        { id: '5', title: 'CREATE CONSISTENTLY', description: 'Stick to a regular posting schedule.' },
      ]
    }

    // Default slides
    return [
      { id: '1', title: 'YOUR CAROUSEL TITLE', description: 'Add a compelling hook that grabs attention' },
      { id: '2', title: 'KEY POINT 1', description: 'Explain your first main point here.' },
      { id: '3', title: 'KEY POINT 2', description: 'Add more valuable insights.' },
      { id: '4', title: 'KEY POINT 3', description: 'Keep delivering value to your audience.' },
      { id: '5', title: 'FOLLOW FOR MORE', description: 'Like and share if you found this helpful!' },
    ]
  }

  // Get brand kit colors based on template
  const getInitialBrandKit = () => {
    const templates: Record<string, { bgColor: string; primaryColor: string }> = {
      'hook-teal': { bgColor: '#2A5A5A', primaryColor: '#1ACD8A' },
      'visual-emerald': { bgColor: '#10B981', primaryColor: '#34D399' },
      'data-driven': { bgColor: '#F8FAFC', primaryColor: '#0D9488' },
      'tweet-thread': { bgColor: '#1E293B', primaryColor: '#3B82F6' },
      'master-skill': { bgColor: '#134E4A', primaryColor: '#14B8A6' },
      'question-purple': { bgColor: '#7C3AED', primaryColor: '#A78BFA' },
      'email-tips': { bgColor: '#FFFFFF', primaryColor: '#0D9488' },
      'ways-green': { bgColor: '#22C55E', primaryColor: '#4ADE80' },
      'business-mindset': { bgColor: '#FFFFFF', primaryColor: '#374151' },
      'hook-purple': { bgColor: '#8B5CF6', primaryColor: '#C4B5FD' },
      'leads-lavender': { bgColor: '#DDD6FE', primaryColor: '#7C3AED' },
      'product-desc': { bgColor: '#1E1B4B', primaryColor: '#F59E0B' },
      'orlando-hooks': { bgColor: '#064E3B', primaryColor: '#10B981' },
      'attention-cyan': { bgColor: '#06B6D4', primaryColor: '#22D3EE' },
      'linkedin-post': { bgColor: '#FFFFFF', primaryColor: '#0EA5E9' },
      'personal-brand': { bgColor: '#0EA5E9', primaryColor: '#38BDF8' },
      'content-plan': { bgColor: '#7C3AED', primaryColor: '#A78BFA' },
      'paste-article': { bgColor: '#FFFFFF', primaryColor: '#0D9488' },
      'web-article': { bgColor: '#0EA5E9', primaryColor: '#F97316' },
      'agency-finder': { bgColor: '#F97316', primaryColor: '#FB923C' },
    }

    const colors = templates[templateId || ''] || { bgColor: '#37474F', primaryColor: '#1ACD8A' }
    
    return {
      name: 'Jon Snow',
      handle: '@jon-snow',
      profilePic: '',
      backgroundColor: colors.bgColor,
      primaryColor: colors.primaryColor,
      secondaryColor: colors.bgColor === '#FFFFFF' || colors.bgColor === '#F8FAFC' || colors.bgColor === '#DDD6FE' ? '#1F2937' : '#FFFFFF',
      primaryFont: 'Inter',
      secondaryFont: 'Inter',
      backgroundType: 'solid' as const,
    }
  }

  return (
    <SupergrowCarouselEditor
      carouselId={carouselId}
      carouselName={templateId ? `${templateId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Carousel` : 'Untitled Carousel'}
      initialSlides={getInitialSlides()}
      initialBrandKit={getInitialBrandKit()}
    />
  )
}
