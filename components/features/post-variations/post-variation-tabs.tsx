'use client'

import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { PostCard } from './post-card'

interface PostVariation {
  id: string
  title: string
  content: string
  label: 'Story' | 'Lesson' | 'Opinion'
}

interface PostVariationTabsProps {
  variations: PostVariation[]
  onEdit: (variation: PostVariation) => void
}

export function PostVariationTabs({ variations, onEdit }: PostVariationTabsProps) {
  const [activeTab, setActiveTab] = useState('story')

  const stories = variations.filter((v) => v.label === 'Story')
  const lessons = variations.filter((v) => v.label === 'Lesson')
  const opinions = variations.filter((v) => v.label === 'Opinion')

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="story">Story ({stories.length})</TabsTrigger>
        <TabsTrigger value="lesson">Lesson ({lessons.length})</TabsTrigger>
        <TabsTrigger value="opinion">Opinion ({opinions.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="story" className="mt-6">
        <div className="grid gap-4">
          {stories.map((variation) => (
            <PostCard
              key={variation.id}
              title={variation.title}
              content={variation.content}
              label={variation.label}
              onEdit={() => onEdit(variation)}
            />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="lesson" className="mt-6">
        <div className="grid gap-4">
          {lessons.map((variation) => (
            <PostCard
              key={variation.id}
              title={variation.title}
              content={variation.content}
              label={variation.label}
              onEdit={() => onEdit(variation)}
            />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="opinion" className="mt-6">
        <div className="grid gap-4">
          {opinions.map((variation) => (
            <PostCard
              key={variation.id}
              title={variation.title}
              content={variation.content}
              label={variation.label}
              onEdit={() => onEdit(variation)}
            />
          ))}
        </div>
      </TabsContent>
    </Tabs>
  )
}
