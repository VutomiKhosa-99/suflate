'use client'

import { TEMPLATE_LIST, CarouselTemplate } from '@/lib/carousel-templates'
import { Check } from 'lucide-react'

interface TemplateSelectorProps {
  selectedTemplate: string
  onSelect: (templateId: string) => void
}

/**
 * Story 5.2: Template Selector Component
 * Displays 5 pre-built carousel templates for selection
 */
export function TemplateSelector({ selectedTemplate, onSelect }: TemplateSelectorProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Choose Template</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {TEMPLATE_LIST.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            isSelected={selectedTemplate === template.id}
            onClick={() => onSelect(template.id)}
          />
        ))}
      </div>
    </div>
  )
}

interface TemplateCardProps {
  template: CarouselTemplate
  isSelected: boolean
  onClick: () => void
}

function TemplateCard({ template, isSelected, onClick }: TemplateCardProps) {
  return (
    <button
      onClick={onClick}
      className={`relative p-4 rounded-lg border-2 transition-all text-left ${
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300 bg-white'
      }`}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
          <Check className="w-3 h-3 text-white" />
        </div>
      )}

      {/* Template preview */}
      <div
        className="w-full aspect-square rounded-md mb-3"
        style={{ background: template.preview }}
      >
        {/* Mini preview of template style */}
        <div className="p-2 h-full flex flex-col">
          <div
            className="h-2 w-3/4 rounded mb-1"
            style={{ backgroundColor: template.colors.primary }}
          />
          <div
            className="h-1 w-full rounded mb-1"
            style={{ backgroundColor: `${template.colors.text}40` }}
          />
          <div
            className="h-1 w-5/6 rounded mb-1"
            style={{ backgroundColor: `${template.colors.text}30` }}
          />
          <div
            className="h-1 w-2/3 rounded mb-auto"
            style={{ backgroundColor: `${template.colors.text}20` }}
          />
          <div
            className="h-1.5 w-1/2 rounded mt-1"
            style={{ backgroundColor: template.colors.accent }}
          />
        </div>
      </div>

      {/* Template info */}
      <h4 className="font-medium text-gray-900 text-sm">{template.name}</h4>
      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{template.description}</p>
    </button>
  )
}
