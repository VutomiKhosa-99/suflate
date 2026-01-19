'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface StaggerProps {
  children: ReactNode[]
  className?: string
  staggerDelay?: number
}

export function Stagger({ children, className = '', staggerDelay = 0.1 }: StaggerProps) {
  return (
    <>
      {children.map((child, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: index * staggerDelay }}
          className={className}
        >
          {child}
        </motion.div>
      ))}
    </>
  )
}
