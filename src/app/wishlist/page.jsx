"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/layout/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Heart, 
  ShoppingCart, 
  Trash2, 
  Package,
  ArrowRight,
  Filter,
  Grid,
  List
} from 'lucide-react'
import useAuthStore from '@/stores/auth-store'
import useCartStore from '@/stores/cart-store'
import { formatCurrency } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'

export default function WishlistPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const { addToCart } = useCartStore()
  
  const [wishlist, setWishlist] = useState(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('grid')
  const [sortBy, setSortBy] = useState('newest')

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/wishlist')
      return
    }

    if (user && user.role !== 'buyer') {
      router.push('/')
      return
    }

    fetchWishlist()
  }, [isAuthenticated, user, router])

  const fetchWishlist = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/wishlist', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        setWishlist(data.wishlist)
      } else {
        console.error('Failed to fetch wishlist:', data.error)
      }
    } catch (error) {
      console.error('Wishlist fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const removeFromWishlist = async (productId) => {
    try {
      const response = await fetch(`/api/wishlist/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        // Remove from local state
        setWishlist(prev => ({
          ...prev,
          products: prev.products.filter(item => item.product._id !== productId)
        }))
      } else {
        alert('Failed to remove from wishlist')
      }
    } catch (error) {
      console.error('Remove from wishlist error:', error)
      alert('Failed to remove from wishlist')
    }
  }

  const handleAddToCart = (product) => {
    addToCart({
      id: product._id,
      name: product.name,
      price: product.price,
      image: product.images?.[0],
      unit: product.unit,
      farmer: product.farmer
    })
    alert('Added to cart!')
  }

  const moveAllToCart = () => {
    if (!wishlist?.products.length) return

    wishlist.products.forEach(item => {
      handleAddToCart(item.product)
    })
  }

  const clearWishlist = async () => {
    if (!confirm('Are you sure you want to clear your wishlist?')) return

    try {
      const promises = wishlist.products.map(item => 
        fetch(`/api/wishlist/${item.product._id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
      )

      await Promise.all(promises)
      setWishlist(prev => ({ ...prev, products: [] }))
    } catch (error) {
      console.error('Clear wishlist error:', error)
      alert('Failed to clear wishlist')
    }
  }

  // Sort products
  const sortedProducts = wishlist?.products.sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.addedAt) - new Date(a.addedAt)
      case 'oldest':
        return new Date(a.addedAt) - new Date(b.addedAt)
      case 'price-low':
        return a.product.price - b.product.price
      case 'price-high':
        return b.product.price - a.product.price
      case 'name':
        return a.product.name.localeCompare(b.product.name)
      default:
        return 0
    }
  }) || []

  if (!isAuthenticated || (user && user.role !== 'buyer')) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <Heart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-6">You need to be logged in as a buyer to view your wishlist.</p>
            <Button onClick={() => router.push('/login')}>
              Login to Continue
            </Button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout requireAuth allowedRoles={['buyer']}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Heart className="h-8 w-8 mr-3 text-red-500" />
              My Wishlist
            </h1>
            <p className="text-gray-600">
              {loading ? 'Loading...' : `${sortedProducts.length} item${sortedProducts.length !== 1 ? 's' : ''} saved`}
            </p>
          </div>
          
          {sortedProducts.length > 0 && (
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={moveAllToCart}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add All to Cart
              </Button>
              <Button
                variant="outline"
                onClick={clearWishlist}
                className="text-red-600 hover:text-red-700"
              >
                Clear All
              </Button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="w-full h-48 bg-gray-300 rounded mb-4"></div>
                  <div className="h-6 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-2/3 mb-4"></div>
                  <div className="h-10 bg-gray-300 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-24 w-24 mx-auto text-gray-300 mb-6" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your wishlist is empty</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Start exploring our products and save your favorites here for easy access later.
            </p>
            <Button onClick={() => router.push('/products')}>
              <Package className="h-4 w-4 mr-2" />
              Browse Products
            </Button>
          </div>
        ) : (
          <>
            {/* Filters and Controls */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="name">Name A-Z</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Products Grid/List */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sortedProducts.map((item) => (
                  <Card key={item.product._id} className="group hover:shadow-lg transition-shadow">
                    <CardContent className="p-0">
                      <div className="relative">
                        <Link href={`/products/${item.product._id}`}>
                          {item.product.images?.[0] ? (
                            <Image
                              src={item.product.images[0]}
                              alt={item.product.name}
                              width={300}
                              height={200}
                              className="w-full h-48 object-cover rounded-t-lg"
                            />
                          ) : (
                            <div className="w-full h-48 bg-gray-200 rounded-t-lg flex items-center justify-center">
                              <Package className="h-12 w-12 text-gray-400" />
                            </div>
                          )}
                        </Link>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromWishlist(item.product._id)}
                          className="absolute top-2 right-2 bg-white shadow-sm hover:bg-red-50"
                        >
                          <Heart className="h-4 w-4 text-red-500 fill-current" />
                        </Button>
                      </div>

                      <div className="p-4">
                        <Link href={`/products/${item.product._id}`}>
                          <h3 className="font-semibold text-gray-900 mb-1 hover:text-green-600 transition-colors">
                            {item.product.name}
                          </h3>
                        </Link>
                        
                        <p className="text-sm text-gray-600 mb-2">
                          by {item.product.farmer?.businessName || item.product.farmer?.name}
                        </p>
                        
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-lg font-bold text-green-600">
                            {formatCurrency(item.product.price)}/{item.product.unit}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {item.product.category}
                          </Badge>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleAddToCart(item.product)}
                            className="flex-1"
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Add to Cart
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeFromWishlist(item.product._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {sortedProducts.map((item) => (
                  <Card key={item.product._id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-6">
                        <Link href={`/products/${item.product._id}`}>
                          {item.product.images?.[0] ? (
                            <Image
                              src={item.product.images[0]}
                              alt={item.product.name}
                              width={120}
                              height={120}
                              className="w-24 h-24 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                              <Package className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </Link>

                        <div className="flex-1">
                          <Link href={`/products/${item.product._id}`}>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1 hover:text-green-600 transition-colors">
                              {item.product.name}
                            </h3>
                          </Link>
                          
                          <p className="text-gray-600 mb-2">
                            by {item.product.farmer?.businessName || item.product.farmer?.name}
                          </p>
                          
                          <div className="flex items-center space-x-4">
                            <span className="text-xl font-bold text-green-600">
                              {formatCurrency(item.product.price)}/{item.product.unit}
                            </span>
                            <Badge variant="outline">
                              {item.product.category}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <Button
                            onClick={() => handleAddToCart(item.product)}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Add to Cart
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => removeFromWishlist(item.product._id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}