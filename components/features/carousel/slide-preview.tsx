'use client'

import { CarouselTemplate } from '@/lib/carousel-templates'

interface SlideData {
  slide_number: number
  title: string
  body: string
  key_point: string
}

interface SlidePreviewProps {
  slide: SlideData
  template: CarouselTemplate
  isSelected?: boolean
  onClick?: () => void
  size?: 'small' | 'medium' | 'large'
}

/**
 * Story 5.2: Slide Preview Component
 * Renders a single carousel slide with the selected template styling
 */
export function SlidePreview({
  slide,
  template,
  isSelected = false,
  onClick,
  size = 'medium',
}: SlidePreviewProps) {
  const sizeClasses = {
    small: 'w-32 h-32',
    medium: 'w-64 h-64',
    large: 'w-96 h-96',
  }

  const fontSizes = {
    small: { title: 10, body: 6, keyPoint: 5, number: 4 },
    medium: { title: 16, body: 10, keyPoint: 8, number: 6 },
    large: { title: 24, body: 14, keyPoint: 12, number: 10 },
  }

  const padding = {
    small: 8,
    medium: 16,
    large: 24,
  }

  const fs = fontSizes[size]
  const p = padding[size]

  // Generate background pattern
  const getBackgroundPattern = () => {
    switch (template.layout.backgroundPattern) {
      case 'dots':
        return `radial-gradient(circle, ${template.colors.secondary}20 1px, transparent 1px)`
      case 'lines':
        return `repeating-linear-gradient(0deg, ${template.colors.secondary}10 0px, ${template.colors.secondary}10 1px, transparent 1px, transparent 20px)`
      case 'gradient':
        return `linear-gradient(135deg, ${template.colors.background} 0%, ${template.colors.secondary}20 100%)`
      case 'shapes':
        return `radial-gradient(ellipse at 10% 90%, ${template.colors.accent}20 0%, transparent 50%)`
      default:
        return 'none'
    }
  }

  // Get key point style
  const getKeyPointStyle = () => {
    const base = {
      fontSize: fs.keyPoint,
      fontFamily: template.fonts.keyPoint,
    }

    switch (template.layout.keyPointStyle) {
      case 'badge':
        return {
          ...base,
          backgroundColor: template.colors.accent,
          color: '#FFFFFF',
          padding: `${p / 4}px ${p / 2}px`,
          borderRadius: 4,
          display: 'inline-block',
        }
      case 'highlight':
        return {
          ...base,
          backgroundColor: `${template.colors.accent}20`,
          color: template.colors.accent,
          padding: `${p / 4}px ${p / 2}px`,
          borderRadius: 4,
        }
      case 'boxed':
        return {
          ...base,
          border: `1px solid ${template.colors.accent}`,
          color: template.colors.accent,
          padding: `${p / 4}px ${p / 2}px`,
          borderRadius: 4,
        }
      case 'underline':
        return {
          ...base,
          borderBottom: `2px solid ${template.colors.accent}`,
          color: template.colors.text,
          paddingBottom: 2,
        }
      default:
        return {
          ...base,
          color: template.colors.secondary,
          fontStyle: 'italic' as const,
        }
    }
  }

  return (
    <div
      onClick={onClick}
      className={`${sizeClasses[size]} rounded-lg overflow-hidden cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : 'hover:shadow-lg'
      }`}
      style={{
        backgroundColor: template.colors.background,
        backgroundImage: getBackgroundPattern(),
        backgroundSize: template.layout.backgroundPattern === 'dots' ? '16px 16px' : undefined,
      }}
    >
      <div
        className="h-full flex flex-col"
        style={{ padding: p }}
      >
        {/* Slide number */}
        <div
          className="mb-1"
          style={{
            fontSize: fs.number,
            color: template.colors.secondary,
            fontFamily: template.fonts.body,
          }}
        >
          {slide.slide_number}
        </div>

        {/* Title */}
        <h3
          className="font-bold mb-2 line-clamp-2"
          style={{
            fontSize: fs.title,
            color: template.colors.primary,
            fontFamily: template.fonts.title,
          }}
        >
          {slide.title}
        </h3>

        {/* Body */}
        <p
          className="flex-1 line-clamp-3 overflow-hidden"
          style={{
            fontSize: fs.body,
            color: template.colors.text,
            fontFamily: template.fonts.body,
            lineHeight: 1.4,
          }}
        >
          {slide.body}
        </p>

        {/* Key point */}
        {slide.key_point && (
          <div className="mt-auto">
            <span style={getKeyPointStyle()}>{slide.key_point}</span>
          </div>
        )}
      </div>
    </div>
  )
}
