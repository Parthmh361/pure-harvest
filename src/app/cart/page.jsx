"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  ArrowLeft,
  Package,
  Store,
  CreditCard,
  ArrowRight
} from 'lucide-react'
import Layout from '@/components/layout/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import CustomImage from '@/components/ui/custom-image'
import useCartStore from '@/stores/cart-store'
import useAuthStore from '@/stores/auth-store'
import { formatCurrency, getImageUrl } from '@/lib/utils'

export default function CartPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const items = useCartStore(state => state.cart)
  const removeItem = useCartStore(state => state.removeItem)
  const updateQuantity = useCartStore(state => state.updateQuantity)
  const getTotalPrice = useCartStore(state => state.getTotalPrice)
  const getTotalItems = useCartStore(state => state.getTotalItems)
  const clearCart = useCartStore(state => state.clearCart)
  const loadCart = useCartStore(state => state.loadCart)

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/cart')
      return
    }

    if (user && user.role !== 'buyer') {
      router.push('/')
      return
    }

    loadCart().finally(() => setLoading(false))
  }, [isAuthenticated, user, router, loadCart])

  const handleQuantityChange = async (productId, newQuantity) => {
    if (newQuantity < 1) return
    await updateQuantity(productId, newQuantity)
  }

  const handleRemoveItem = async (productId) => {
    await removeItem(productId)
  }

  const handleClearCart = async () => {
    if (confirm('Are you sure you want to clear your cart?')) {
      await clearCart()
    }
  }

  const handleCheckout = () => {
    if (items.length === 0) {
      alert('Your cart is empty')
      return
    }
    router.push('/checkout')
  }

  if (!isAuthenticated || (user && user.role !== 'buyer')) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <ShoppingCart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Restricted</h1>
            <p className="text-gray-600 mb-6">Only buyers can access the shopping cart.</p>
            <Button onClick={() => router.push('/login')}>
              Login as Buyer
            </Button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
              <p className="text-gray-600">
                {getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'} in your cart
              </p>
            </div>
          </div>

          {items.length > 0 && (
            <Button 
              variant="outline" 
              onClick={handleClearCart}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Cart
            </Button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex space-x-4">
                      <div className="w-20 h-20 bg-gray-300 rounded"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-6 bg-gray-300 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                        <div className="h-6 bg-gray-300 rounded w-1/4"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div>
              <Card className="animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="h-6 bg-gray-300 rounded"></div>
                    <div className="h-4 bg-gray-300 rounded"></div>
                    <div className="h-10 bg-gray-300 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : items.length === 0 ? (
          // Empty Cart
          <div className="text-center py-16">
            <ShoppingCart className="h-24 w-24 mx-auto text-gray-300 mb-6" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Looks like you haven't added any items to your cart yet. 
              Start shopping to fill it up!
            </p>
            <div className="space-x-4">
              <Button onClick={() => router.push('/products')}>
                <Package className="h-4 w-4 mr-2" />
                Browse Products
              </Button>
              <Button variant="outline" onClick={() => router.push('/')}>
                Go to Homepage
              </Button>
            </div>
          </div>
        ) : (
          // Cart Items
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="space-y-4">
                {items.map((item) => (
                  <Card key={item._id}>
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        {/* Product Image */}
                        <div className="flex-shrink-0">
                          <CustomImage
                            src={item.image}
                            alt={item.name}
                            width={80}
                            height={80}
                            className="w-20 h-20 rounded-lg object-cover"
                            fallback="product"
                          />
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 truncate">
                                <Link 
                                  href={`/products/${item._id}`}
                                  className="hover:text-green-600"
                                >
                                  {item.name}
                                </Link>
                              </h3>
                              
                              <div className="flex items-center space-x-2 mt-1">
                                <Store className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  {item.farmerName || 'Unknown Farmer'}
                                </span>
                              </div>

                              <div className="flex items-center space-x-4 mt-3">
                                <span className="text-xl font-bold text-green-600">
                                  {formatCurrency(item.price)}
                                </span>
                                <span className="text-sm text-gray-500">
                                  per {item.unit || 'unit'}
                                </span>
                              </div>
                            </div>

                            {/* Remove Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(item._id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center space-x-3">
                              <span className="text-sm text-gray-600">Quantity:</span>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                
                                <Input
                                  type="number"
                                  min="1"
                                  max={item.maxQuantity || 100}
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const qty = parseInt(e.target.value) || 1
                                    if (qty >= 1 && qty <= (item.maxQuantity || 100)) {
                                      handleQuantityChange(item._id, qty)
                                    }
                                  }}
                                  className="w-16 text-center"
                                />
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                                  disabled={item.quantity >= (item.maxQuantity || 100)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              
                              <span className="text-xs text-gray-500">
                                (Max: {item.maxQuantity || 100})
                              </span>
                            </div>

                            {/* Item Total */}
                            <div className="text-right">
                              <div className="text-sm text-gray-600">Total</div>
                              <div className="text-lg font-semibold">
                                {formatCurrency(item.price * item.quantity)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal ({getTotalItems()} items)</span>
                    <span className="font-semibold">
                      {formatCurrency(getTotalPrice())}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Shipping</span>
                    <span>{getTotalPrice() > 1000 ? 'Free' : formatCurrency(50)}</span>
                  </div>

                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Tax (5%)</span>
                    <span>{formatCurrency(getTotalPrice() * 0.05)}</span>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span className="text-green-600">
                        {formatCurrency(
                          getTotalPrice() + 
                          (getTotalPrice() > 1000 ? 0 : 50) + 
                          (getTotalPrice() * 0.05)
                        )}
                      </span>
                    </div>
                  </div>

                  <Button 
                    onClick={handleCheckout}
                    className="w-full"
                    size="lg"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Proceed to Checkout
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>

                  <Button 
                    variant="outline" 
                    onClick={() => router.push('/products')}
                    className="w-full"
                  >
                    Continue Shopping
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}