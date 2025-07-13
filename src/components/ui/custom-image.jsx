"use client"

import { useState } from 'react'
import Image from 'next/image'
import { Package, ImageIcon } from 'lucide-react'

export default function CustomImage({ 
  src, 
  alt, 
  width, 
  height, 
  className = '', 
  fallback = '/images/placeholder-product.jpg',
  priority = false,
  ...props 
}) {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const handleError = () => {
    console.warn(`Failed to load image: ${src}`)
    setImageError(true)
    setIsLoading(false)
  }

  const handleLoad = () => {
    setIsLoading(false)
  }

  // If no src provided or error occurred, show placeholder
  if (!src || src === '' || imageError) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
        <div className="text-gray-400 text-center">
          <Package className="h-8 w-8 mx-auto mb-2" />
          <span className="text-sm">No Image</span>
        </div>
      </div>
    )
  }

  // For development, use unoptimized images
  if (process.env.NODE_ENV === 'development') {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        {isLoading && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
            <ImageIcon className="h-8 w-8 text-gray-400" />
          </div>
        )}
        
        <img
          src={src}
          alt={alt || 'Image'}
          width={width}
          height={height}
          onError={handleError}
          onLoad={handleLoad}
          className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          style={{ width, height, objectFit: 'cover' }}
          {...props}
        />
      </div>
    )
  }

  // For production, use Next.js Image
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <ImageIcon className="h-8 w-8 text-gray-400" />
        </div>
      )}
      
      <Image
        src={src}
        alt={alt || 'Image'}
        width={width}
        height={height}
        priority={priority}
        onError={handleError}
        onLoad={handleLoad}
        className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        unoptimized={process.env.NODE_ENV === 'development'}
        {...props}
      />
    </div>
  )
}