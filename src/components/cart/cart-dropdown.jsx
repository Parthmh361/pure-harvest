"use client"

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import useCartStore from '@/stores/cart-store'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Star, 
  MapPin, 
  Heart, 
  ShoppingCart,
  Eye,
  Truck
} from 'lucide-react'

export default function ProductCard({ product, viewMode = 'grid' }) {
  const { addToCart, isLoading: cartLoading } = useCartStore()
  const [isWishlisted, setIsWishlisted] = useState(false)

  const handleWishlist = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsWishlisted(!isWishlisted)
    // Add wishlist API call here
  }

  const handleAddToCart = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      await addToCart(product, 1)
    } catch (error) {
      console.error('Error adding to cart:', error)
    }
  }

  const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0]
  const imageUrl = primaryImage?.url || '/placeholder-product.jpg'

  if (viewMode === 'list') {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <Link href={`/products/${product._id}`}>
          <div className="flex p-4">
            {/* Image */}
            <div className="flex-shrink-0 w-32 h-32 bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src={imageUrl}
                alt={product.name}
                width={128}
                height={128}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Content */}
            <div className="flex-1 ml-4 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 hover:text-primary">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      by {product.farmName}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleWishlist}
                    className={`${isWishlisted ? 'text-red-500' : 'text-gray-400'} hover:text-red-500`}
                  >
                    <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
                  </Button>
                </div>

                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {product.description}
                </p>

                <div className="flex items-center space-x-4 mb-3">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600 ml-1">
                      {product.rating?.average?.toFixed(1) || '0.0'} ({product.rating?.count || 0})
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="h-4 w-4 mr-1" />
                    {product.location?.city}, {product.location?.state}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Badge className="capitalize">{product.category}</Badge>
                  {product.isOrganic && (
                    <Badge className="bg-green-100 text-green-800">Organic</Badge>
                  )}
                  {product.deliveryOptions?.homeDelivery && (
                    <Badge variant="outline" className="flex items-center">
                      <Truck className="h-3 w-3 mr-1" />
                      Delivery
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div>
                  <span className="text-2xl font-bold text-primary">
                    ${product.price}
                  </span>
                  <span className="text-gray-600 ml-1">per {product.unit}</span>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddToCart}
                    disabled={cartLoading || product.quantity === 0}
                  >
                    {cartLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Add to Cart
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </Card>
    )
  }

  // Grid view (default)
  return (
    <Card className="group hover:shadow-lg transition-all duration-300">
      <Link href={`/products/${product._id}`}>
        <div className="relative">
          {/* Image */}
          <div className="aspect-square bg-gray-100 overflow-hidden rounded-t-lg">
            <Image
              src={imageUrl}
              alt={product.name}
              width={400}
              height={400}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* Wishlist Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleWishlist}
            className={`absolute top-2 right-2 bg-white/80 backdrop-blur-sm ${
              isWishlisted ? 'text-red-500' : 'text-gray-600'
            } hover:text-red-500 hover:bg-white`}
          >
            <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </Button>

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col space-y-1">
            {product.isOrganic && (
              <Badge className="bg-green-500 text-white">Organic</Badge>
            )}
            {product.quantity === 0 && (
              <Badge className="bg-red-500 text-white">Out of Stock</Badge>
            )}
            {product.deliveryOptions?.homeDelivery && (
              <Badge className="bg-blue-500 text-white flex items-center">
                <Truck className="h-3 w-3 mr-1" />
                Delivery
              </Badge>
            )}
          </div>

          {/* Quick View Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button variant="secondary" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Quick View
            </Button>
          </div>
        </div>

        <CardContent className="p-4">
          <div className="mb-2">
            <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-1">
              {product.name}
            </h3>
            <p className="text-sm text-gray-600">by {product.farmName}</p>
          </div>

          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {product.description}
          </p>

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-sm text-gray-600 ml-1">
                {product.rating?.average?.toFixed(1) || '0.0'} ({product.rating?.count || 0})
              </span>
            </div>
            <Badge className="capitalize text-xs">{product.category}</Badge>
          </div>

          <div className="flex items-center text-sm text-gray-500 mb-3">
            <MapPin className="h-4 w-4 mr-1" />
            {product.location?.city}, {product.location?.state}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xl font-bold text-primary">
                ${product.price}
              </span>
              <span className="text-gray-600 text-sm ml-1">/{product.unit}</span>
            </div>
            <span className="text-sm text-gray-500">
              {product.quantity} {product.unit} left
            </span>
          </div>
        </CardContent>

        <CardFooter className="px-4 pb-4">
          <Button
            onClick={handleAddToCart}
            disabled={cartLoading || product.quantity === 0}
            className="w-full bg-primary hover:bg-primary-dark"
          >
            {cartLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : product.quantity === 0 ? (
              'Out of Stock'
            ) : (
              <>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </>
            )}
          </Button>
        </CardFooter>
      </Link>
    </Card>
  )
}