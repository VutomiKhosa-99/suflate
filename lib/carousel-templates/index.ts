/**
 * Story 5.2: Carousel Template Definitions
 * 
 * 5 pre-built carousel templates with different visual styles
 */

export interface CarouselTemplate {
  id: string
  name: string
  description: string
  colors: {
    primary: string
    secondary: string
    background: string
    text: string
    accent: string
  }
  fonts: {
    title: string
    body: string
    keyPoint: string
  }
  fontSizes: {
    title: number
    body: number
    keyPoint: number
    slideNumber: number
  }
  layout: {
    titlePosition: 'top' | 'center' | 'bottom'
    keyPointStyle: 'badge' | 'highlight' | 'subtle' | 'boxed' | 'underline'
    backgroundPattern: 'none' | 'dots' | 'lines' | 'gradient' | 'shapes'
  }
  preview: string // Preview image path or gradient
}

export const CAROUSEL_TEMPLATES: Record<string, CarouselTemplate> = {
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean, text-focused design with plenty of whitespace',
    colors: {
      primary: '#1A1A1A',
      secondary: '#666666',
      background: '#FFFFFF',
      text: '#1A1A1A',
      accent: '#0077B5',
    },
    fonts: {
      title: 'Inter',
      body: 'Inter',
      keyPoint: 'Inter',
    },
    fontSizes: {
      title: 36,
      body: 18,
      keyPoint: 14,
      slideNumber: 12,
    },
    layout: {
      titlePosition: 'top',
      keyPointStyle: 'subtle',
      backgroundPattern: 'none',
    },
    preview: 'linear-gradient(135deg, #FFFFFF 0%, #F5F5F5 100%)',
  },

  bold: {
    id: 'bold',
    name: 'Bold',
    description: 'High contrast, impactful design that stands out',
    colors: {
      primary: '#FFFFFF',
      secondary: '#E0E0E0',
      background: '#1A1A1A',
      text: '#FFFFFF',
      accent: '#FFD700',
    },
    fonts: {
      title: 'Inter',
      body: 'Inter',
      keyPoint: 'Inter',
    },
    fontSizes: {
      title: 42,
      body: 20,
      keyPoint: 16,
      slideNumber: 14,
    },
    layout: {
      titlePosition: 'center',
      keyPointStyle: 'badge',
      backgroundPattern: 'gradient',
    },
    preview: 'linear-gradient(135deg, #1A1A1A 0%, #333333 100%)',
  },

  professional: {
    id: 'professional',
    name: 'Professional',
    description: 'Corporate, polished look for business content',
    colors: {
      primary: '#0077B5',
      secondary: '#004182',
      background: '#F8FAFC',
      text: '#1E293B',
      accent: '#0077B5',
    },
    fonts: {
      title: 'Inter',
      body: 'Inter',
      keyPoint: 'Inter',
    },
    fontSizes: {
      title: 34,
      body: 18,
      keyPoint: 14,
      slideNumber: 12,
    },
    layout: {
      titlePosition: 'top',
      keyPointStyle: 'boxed',
      backgroundPattern: 'lines',
    },
    preview: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)',
  },

  creative: {
    id: 'creative',
    name: 'Creative',
    description: 'Colorful, engaging design with visual flair',
    colors: {
      primary: '#7C3AED',
      secondary: '#A78BFA',
      background: '#FAF5FF',
      text: '#1F2937',
      accent: '#EC4899',
    },
    fonts: {
      title: 'Inter',
      body: 'Inter',
      keyPoint: 'Inter',
    },
    fontSizes: {
      title: 38,
      body: 18,
      keyPoint: 15,
      slideNumber: 12,
    },
    layout: {
      titlePosition: 'top',
      keyPointStyle: 'highlight',
      backgroundPattern: 'shapes',
    },
    preview: 'linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%)',
  },

  story: {
    id: 'story',
    name: 'Story',
    description: 'Narrative flow design optimized for storytelling',
    colors: {
      primary: '#059669',
      secondary: '#34D399',
      background: '#ECFDF5',
      text: '#064E3B',
      accent: '#F59E0B',
    },
    fonts: {
      title: 'Inter',
      body: 'Inter',
      keyPoint: 'Inter',
    },
    fontSizes: {
      title: 32,
      body: 20,
      keyPoint: 14,
      slideNumber: 12,
    },
    layout: {
      titlePosition: 'top',
      keyPointStyle: 'underline',
      backgroundPattern: 'dots',
    },
    preview: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
  },
}

export const TEMPLATE_LIST = Object.values(CAROUSEL_TEMPLATES)

export function getTemplate(templateId: string): CarouselTemplate {
  return CAROUSEL_TEMPLATES[templateId] || CAROUSEL_TEMPLATES.minimal
}

export function applyBrandingOverrides(
  template: CarouselTemplate,
  branding?: {
    primary_color?: string
    secondary_color?: string
    font_family?: string
    title_font_size?: number
    body_font_size?: number
    key_point_font_size?: number
  }
): CarouselTemplate {
  if (!branding) return template

  return {
    ...template,
    colors: {
      ...template.colors,
      primary: branding.primary_color || template.colors.primary,
      secondary: branding.secondary_color || template.colors.secondary,
      accent: branding.primary_color || template.colors.accent,
    },
    fonts: {
      title: branding.font_family || template.fonts.title,
      body: branding.font_family || template.fonts.body,
      keyPoint: branding.font_family || template.fonts.keyPoint,
    },
    fontSizes: {
      ...template.fontSizes,
      title: branding.title_font_size || template.fontSizes.title,
      body: branding.body_font_size || template.fontSizes.body,
      keyPoint: branding.key_point_font_size || template.fontSizes.keyPoint,
    },
  }
}
