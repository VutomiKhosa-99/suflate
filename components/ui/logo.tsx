import Link from 'next/link'

interface LogoProps {
  className?: string
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
  href?: string
  asLink?: boolean
}

export function Logo({ className = '', showText = true, size = 'md', href = '/', asLink = true }: LogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  }

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  }

  const content = (
    <>
      <div className={`${sizeClasses[size]} bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center`}>
        <span className="text-white font-bold text-xs">S</span>
      </div>
      {showText && (
        <span className={`font-bold ${textSizes[size]} bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600`}>
          Suflate
        </span>
      )}
    </>
  )

  if (!asLink) {
    return <div className={`flex items-center gap-2 ${className}`}>{content}</div>
  }

  return (
    <Link href={href} className={`flex items-center gap-2 ${className}`}>
      {content}
    </Link>
  )
}
