'use client'

import React from 'react'
import Image from 'next/image'
import { Badge } from '@shared/types/strapi'
import { truncateText } from '@shared/utils/formatting'

interface BadgeCardProps {
  badge: Badge
  onClick?: () => void
  className?: string
}

export const BadgeCard: React.FC<BadgeCardProps> = ({
  badge,
  onClick,
  className = '',
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick()
    }
  }

  return (
    <div 
      className={`relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md transition-all hover:shadow-lg ${className}`} 
      onClick={handleClick}
    >
      <div className="aspect-square w-full relative">
        {badge.attributes.image?.data && (
          <Image
            src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}${badge.attributes.image.data.attributes.url}`}
            alt={badge.attributes.name}
            fill
            unoptimized
            className="object-contain p-4"
          />
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold">{badge.attributes.name}</h3>
        <p className="mt-1 text-sm text-gray-500">{truncateText(badge.attributes.description, 100)}</p>
        {badge.attributes.issuer?.data && (
          <div className="mt-2 flex items-center text-xs text-gray-500">
            <span>Issued by: {badge.attributes.issuer.data.attributes.name}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default BadgeCard 