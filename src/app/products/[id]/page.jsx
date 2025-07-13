"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Layout from '@/components/layout/layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Star, MapPin, Calendar, Package, Phone, Mail, Plus, Minus, ShoppingCart, Heart } from 'lucide-react'
import Image from 'next/image'
import useCartStore from '@/stores/cart-store'
import useWishlistStore from '@/stores/wishlist-store'
import useAuthStore from '@/stores/auth-store'
import ProductReviews from '@/components/reviews/product-reviews'
import { toast } from 'sonner'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const { addItem, openCart, clearCart } = useCartStore()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [addingToCart, setAddingToCart] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchProduct()
    }
  }, [params.id])

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${params.id}`)
      const data = await response.json()
      
      if (data.success) {
        setProduct(data.product)
      } else {
        console.error('Product not found')
        router.push('/products')
      }
    } catch (error) {
      console.error('Failed to fetch product:', error)
      router.push('/products')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=' + encodeURIComponent(`/products/${product._id}`))
      return
    }

    if (user.role !== 'buyer') {
      alert('Only buyers can add items to cart')
      return
    }

    if (quantity > product.quantity) {
      alert('Requested quantity exceeds available stock')
      return
    }

    // Ensure product has proper farmer data structure
    const productForCart = {
      ...product,
      farmer: product.farmer || {
        _id: product.farmerId || null,
        name: product.farmerName || 'Unknown Farmer',
        businessName: product.farmerBusinessName || null
      }
    }

    addItem(productForCart, quantity)
    openCart()
    toast.success('Added to cart!')
  }

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=' + encodeURIComponent(`/products/${product._id}`))
      return
    }

    if (user.role !== 'buyer') {
      alert('Only buyers can purchase items')
      return
    }

    if (quantity > product.quantity) {
      alert('Requested quantity exceeds available stock')
      return
    }

    // Ensure product has proper farmer data structure
    const productForCart = {
      ...product,
      farmer: product.farmer || {
        _id: product.farmerId || null,
        name: product.farmerName || 'Unknown Farmer',
        businessName: product.farmerBusinessName || null
      }
    }

    // Clear cart and add this item, then go to checkout
    clearCart()
    addItem(productForCart, quantity)
    router.push('/checkout')
  }

  const handleWishlistToggle = () => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (user?.role !== 'buyer') {
      alert('Only buyers can add items to wishlist')
      return
    }

    if (isInWishlist(product._id)) {
      removeFromWishlist(product._id)
    } else {
      // ✅ FIX: Transform the product object to match wishlist store expectations
      const productForWishlist = {
        id: product._id,           // ✅ Map _id to id
        name: product.name,
        price: product.price,
        image: product.images?.[0],
        unit: product.unit,
        farmer: product.farmer
      }
      
      console.log('🔄 Adding to wishlist:', productForWishlist)
      addToWishlist(productForWishlist)
    }
  }

  const increaseQuantity = () => {
    if (quantity < product.quantity) {
      setQuantity(prev => prev + 1)
    }
  }

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="aspect-square bg-gray-300 rounded-lg"></div>
                <div className="grid grid-cols-4 gap-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="aspect-square bg-gray-300 rounded"></div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-300 rounded"></div>
                <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                <div className="h-6 bg-gray-300 rounded w-1/3"></div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (!product) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
            <Button onClick={() => router.push('/products')}>
              Back to Products
            </Button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li>
              <button onClick={() => router.push('/')} className="hover:text-green-600">
                Home
              </button>
            </li>
            <li>/</li>
            <li>
              <button onClick={() => router.push('/products')} className="hover:text-green-600">
                Products
              </button>
            </li>
            <li>/</li>
            <li className="text-gray-900">{product.name}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden">
              {product.images && product.images.length > 0 ? (
                <Image
                  src={
                    product.images?.[selectedImage]
                      ? product.images[selectedImage]
                      : '/placeholder-product.jpg'
                  }
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <Package className="h-24 w-24" />
                </div>
              )}
            </div>
            
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square relative bg-gray-100 rounded overflow-hidden border-2 ${
                      selectedImage === index ? 'border-green-600' : 'border-transparent'
                    }`}
                  >
                    <Image
                      src={image || '/placeholder-product.jpg'}
                      alt={`${product.name} ${index + 1}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
                {isAuthenticated && user?.role === 'buyer' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleWishlistToggle}
                    className={`${
                      isInWishlist(product._id) ? 'text-red-600' : 'text-gray-400'
                    }`}
                  >
                    <Heart className={`h-6 w-6 ${
                      isInWishlist(product._id) ? 'fill-current' : ''
                    }`} />
                  </Button>
                )}
              </div>
              
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="ml-1 text-gray-600">
                    {product.rating?.average?.toFixed(1) || '0.0'} ({product.rating?.count || 0} reviews)
                  </span>
                </div>
                <Badge variant="outline">{product.category}</Badge>
                {product.isOrganic && (
                  <Badge className="bg-green-600">Organic</Badge>
                )}
              </div>

              <div className="text-3xl font-bold text-green-600 mb-4">
                ₹{product.price}/{product.unit}
              </div>

              <p className="text-gray-600 text-lg mb-6">
                {product.description}
              </p>
            </div>

            {/* Farmer Info */}
            {product.farmer && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">Sold by</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {product.farmer.businessName || product.farmer.name}
                      </p>
                      {product.farmer.location && (
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>
                            {product.farmer.location.coordinates?.join(', ') || 'Location not specified'}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center mt-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="ml-1 text-sm text-gray-600">
                          {product.farmer.rating?.average?.toFixed(1) || '0.0'}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {product.farmer.phone && (
                        <Button size="sm" variant="outline">
                          <Phone className="h-4 w-4" />
                        </Button>
                      )}
                      {product.farmer.email && (
                        <Button size="sm" variant="outline">
                          <Mail className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Product Details */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Available Quantity:</span>
                  <p className="font-medium">{product.quantity} {product.unit}s</p>
                </div>
                {product.harvestDate && (
                  <div>
                    <span className="text-gray-500">Harvest Date:</span>
                    <p className="font-medium">
                      {new Date(product.harvestDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {product.expiryDate && (
                  <div>
                    <span className="text-gray-500">Expiry Date:</span>
                    <p className="font-medium">
                      {new Date(product.expiryDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-gray-500">Min Order:</span>
                  <p className="font-medium">{product.minOrderQuantity || 1} {product.unit}(s)</p>
                </div>
              </div>

              {product.tags && product.tags.length > 0 && (
                <div>
                  <span className="text-gray-500 text-sm">Tags:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {product.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Add to Cart */}
            {product.quantity > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <span className="text-gray-700">Quantity:</span>
                  <div className="flex items-center border rounded-lg">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={decreaseQuantity}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="px-4 py-2 font-medium">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={increaseQuantity}
                      disabled={quantity >= product.quantity}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <span className="text-gray-500">({product.quantity} available)</span>
                </div>

                <div className="flex space-x-4">
                  <Button
                    onClick={handleAddToCart}
                    disabled={addingToCart || !isAuthenticated || user?.role !== 'buyer'}
                    className="flex-1"
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    {addingToCart ? 'Adding...' : 'Add to Cart'}
                  </Button>
                  <Button
                    onClick={handleBuyNow}
                    variant="outline"
                    className="flex-1"
                  >
                    Buy Now
                  </Button>
                </div>

                {!isAuthenticated && (
                  <p className="text-sm text-gray-500 text-center">
                    <button 
                      onClick={() => router.push('/login')}
                      className="text-green-600 hover:underline"
                    >
                      Login
                    </button> to add items to cart
                  </p>
                )}

                {isAuthenticated && user?.role !== 'buyer' && (
                  <p className="text-sm text-gray-500 text-center">
                    Only buyers can purchase products
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <Badge variant="destructive">Out of Stock</Badge>
                <p className="text-gray-500 mt-2">This product is currently unavailable</p>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12">
          <ProductReviews productId={product._id} />
        </div>
      </div>
    </Layout>
  )
}