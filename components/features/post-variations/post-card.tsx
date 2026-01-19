'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface PostCardProps {
  title: string
  content: string
  label: string
  onEdit: () => void
}

export function PostCard({ title, content, label, onEdit }: PostCardProps) {
  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded mb-2">
            {label}
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
      </div>
      <p className="text-gray-600 mb-6 line-clamp-4">{content}</p>
      <Button onClick={onEdit} variant="outline" className="w-full">
        Edit
      </Button>
    </Card>
  )
}
