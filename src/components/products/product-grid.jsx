"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Star, 
  ShoppingCart, 
  Heart,
  Eye
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import useCartStore from '@/stores/cart-store'

export default function ProductGrid({ products, loading = false }) {
  const { addItem } = useCartStore()
  const [viewportSize, setViewportSize] = useState('lg')

  useEffect(() => {
    const updateViewportSize = () => {
      const width = window.innerWidth
      if (width < 480) setViewportSize('xs')
      else if (width < 640) setViewportSize('sm')
      else if (width < 768) setViewportSize('md')
      else if (width < 1024) setViewportSize('lg')
      else setViewportSize('xl')
    }

    updateViewportSize()
    window.addEventListener('resize', updateViewportSize)
    return () => window.removeEventListener('resize', updateViewportSize)
  }, [])

  const handleAddToCart = (product) => {
    addItem({
      id: product._id,
      name: product.name,
      price: product.price,
      image: product.images?.[0],
      farmerId: product.farmer,
      stock: product.stock
    })
  }

  const getGridColumns = () => {
    switch (viewportSize) {
      case 'xs': return 'grid-cols-2'
      case 'sm': return 'grid-cols-2'
      case 'md': return 'grid-cols-3'
      case 'lg': return 'grid-cols-3'
      case 'xl': return 'grid-cols-4'
      default: return 'grid-cols-4'
    }
  }

  const getCardSize = () => {
    switch (viewportSize) {
      case 'xs': return { image: 'h-32', padding: 'p-3' }
      case 'sm': return { image: 'h-36', padding: 'p-3' }
      case 'md': return { image: 'h-40', padding: 'p-4' }
      case 'lg': return { image: 'h-44', padding: 'p-4' }
      case 'xl': return { image: 'h-48', padding: 'p-4' }
      default: return { image: 'h-48', padding: 'p-4' }
    }
  }

  const isSmallScreen = ['xs', 'sm'].includes(viewportSize)
  const cardSize = getCardSize()

  if (loading) {
    return (
      <div className={`responsive-grid ${getGridColumns()}`}>
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="card-responsive animate-pulse">
            <div className={`${cardSize.image} bg-gray-300 rounded-t-lg`}></div>
            <CardContent className={cardSize.padding}>
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                <div className="h-4 bg-gray-300 rounded w-1/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <ShoppingCart className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-responsive-lg font-semibold text-gray-900 mb-2">No Products Found</h3>
        <p className="text-responsive-base text-gray-600">Try adjusting your search or filters</p>
      </div>
    )
  }

  return (
    <div className={`responsive-grid ${getGridColumns()}`}>
      {products.map((product) => (
        <Card key={product._id} className="card-responsive group hover:shadow-lg transition-all duration-300">
          <div className="relative overflow-hidden rounded-t-lg">
            <Link href={`/products/${product._id}`}>
              <div className={`${cardSize.image} relative overflow-hidden bg-gray-100`}>
                <Image
                  src={product.images?.[0] || '/placeholder-product.jpg'}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes={`(max-width: 480px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw`}
                />
                
                {product.stock === 0 && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
                  </div>
                )}
              </div>
            </Link>

            {/* Action Buttons */}
            <div className={`absolute top-2 right-2 space-y-2 ${isSmallScreen ? 'hidden group-hover:block' : ''}`}>
              <Button
                variant="secondary"
                size="sm"
                className="h-8 w-8 p-0 bg-white bg-opacity-90 hover:bg-opacity-100 shadow-sm"
              >
                <Heart className="h-4 w-4" />
              </Button>
              {!isSmallScreen && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-8 w-8 p-0 bg-white bg-opacity-90 hover:bg-opacity-100 shadow-sm"
                  asChild
                >
                  <Link href={`/products/${product._id}`}>
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </div>

          <CardContent className={`${cardSize.padding} flex flex-col justify-between h-full`}>
            <div className="flex-1">
              <Link href={`/products/${product._id}`}>
                <h3 className={`font-medium ${isSmallScreen ? 'text-sm' : 'text-base'} line-clamp-2 mb-2 hover:text-green-600 transition-colors`}>
                  {product.name}
                </h3>
              </Link>
              
              <div className="flex items-center space-x-1 mb-2">
                <Star className="h-3 w-3 text-yellow-400 fill-current" />
                <span className="text-xs text-gray-600">
                  {product.rating?.average?.toFixed(1) || '0.0'}
                </span>
                <span className="text-xs text-gray-400">
                  ({product.rating?.count || 0})
                </span>
              </div>

              <Badge variant="outline" className="text-xs mb-2">
                {product.category}
              </Badge>
            </div>

            <div className="flex items-center justify-between mt-auto">
              <div>
                <p className={`text-green-600 font-semibold ${isSmallScreen ? 'text-sm' : 'text-base'}`}>
                  {formatCurrency(product.price)}
                </p>
                <p className="text-xs text-gray-500">per {product.unit}</p>
              </div>
              
              <Button
                size={isSmallScreen ? "sm" : "sm"}
                onClick={() => handleAddToCart(product)}
                disabled={product.stock === 0}
                className={isSmallScreen ? 'h-8 w-8 p-0' : 'h-9 px-3'}
              >
                <ShoppingCart className="h-3 w-3" />
                {!isSmallScreen && <span className="ml-2 hidden sm:inline">Add</span>}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}