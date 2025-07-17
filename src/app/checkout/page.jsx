"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/layout/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  CreditCard, 
  MapPin, 
  Package, 
  Truck,
  ShoppingBag,
  AlertCircle,
  CheckCircle,
  Store,
  ArrowLeft
} from 'lucide-react'
import useCartStore from '@/stores/cart-store'
import useAuthStore from '@/stores/auth-store'
import { formatCurrency, INDIAN_STATES } from '@/lib/utils'
import Image from 'next/image'
import { toast } from 'sonner'

export default function CheckoutPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const items = useCartStore(state => state.cart)
  const getItemsByFarmer = useCartStore(state => state.getItemsByFarmer)
  const getTotalItems = useCartStore(state => state.getTotalItems)
  const getTotalPrice = useCartStore(state => state.getTotalPrice)
  const clearCart = useCartStore(state => state.clearCart)

  const [loading, setLoading] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderId, setOrderId] = useState(null)

  // Form state
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    landmark: ''
  })
  
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [orderNotes, setOrderNotes] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/checkout')
      return
    }

    if (user && user.role !== 'buyer') {
      router.push('/')
      return
    }

    if (items.length === 0) {
      router.push('/cart')
      return
    }

    // Pre-fill address from user profile
    if (user?.address) {
      setShippingAddress({
        fullName: user.name || '',
        phone: user.phone || '',
        street: user.address.street || '',
        city: user.address.city || '',
        state: user.address.state || '',
        pincode: user.address.pincode || '',
        landmark: ''
      })
    }
  }, [isAuthenticated, user, router, items])

  const handleAddressChange = (field, value) => {
    setShippingAddress(prev => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    const required = ['fullName', 'phone', 'street', 'city', 'state', 'pincode']
    return required.every(field => shippingAddress[field].trim() !== '')
  }

  const handlePlaceOrder = async () => {
    if (!validateForm()) {
      toast.error('Please fill in all required shipping address fields')
      return
    }

    setLoading(true)

    try {
      const orderData = {
        items: items.map(item => ({
          productId: item._id,
          quantity: item.quantity,
          price: item.price,
          farmer: item.farmer?._id || item.farmer // <-- ensure farmer is sent
        })),
        shippingAddress,
        paymentMethod,
        orderNotes,
        totalAmount: subtotal + shipping + tax
      }
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(orderData)
      })

      const data = await response.json()

      if (response.ok) {
        // Success: show confirmation, clear cart, etc.
        setOrderId(data.order._id)
        setOrderPlaced(true)
        clearCart()
      } else {
        // Error: show error message
        alert(data.error || 'Failed to place order')
      }
    } catch (error) {
      console.error('Order placement error:', error)
      alert('Failed to place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated || (user && user.role !== 'buyer')) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <ShoppingBag className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-6">You need to be logged in as a buyer to checkout.</p>
            <Button onClick={() => router.push('/login')}>
              Login to Continue
            </Button>
          </div>
        </div>
      </Layout>
    )
  }

  if (items.length === 0) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <ShoppingBag className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
            <p className="text-gray-600 mb-6">Add some products to your cart before checkout.</p>
            <Button onClick={() => router.push('/products')}>
              Browse Products
            </Button>
          </div>
        </div>
      </Layout>
    )
  }

  if (orderPlaced) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <CheckCircle className="h-16 w-16 mx-auto text-green-600 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Placed Successfully!</h1>
            <p className="text-gray-600 mb-6">
              Your order has been placed and will be processed soon.
            </p>
            <div className="space-y-4">
              <Card className="max-w-md mx-auto">
                <CardContent className="p-6 text-center">
                  <h3 className="font-semibold mb-2">Order Details</h3>
                  <p className="text-sm text-gray-600 mb-4">Order ID: {orderId}</p>
                  <Button onClick={() => router.push('/orders')} className="w-full">
                    View My Orders
                  </Button>
                </CardContent>
              </Card>
              <Button variant="outline" onClick={() => router.push('/products')}>
                Continue Shopping
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  const itemsByFarmer = getItemsByFarmer()
  const totalItems = getTotalItems()
  const subtotal = getTotalPrice()
  const tax = subtotal * 0.05 // 5% tax
  const shipping = subtotal > 1000 ? 0 : 50 // Free shipping over ₹1000
  const total = subtotal + tax + shipping

  return (
    <Layout requireAuth allowedRoles={['buyer']}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/cart')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cart
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
            <p className="text-gray-600">Review your order and complete purchase</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Checkout Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={shippingAddress.fullName}
                      onChange={(e) => handleAddressChange('fullName', e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={shippingAddress.phone}
                      onChange={(e) => handleAddressChange('phone', e.target.value)}
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="street">Street Address *</Label>
                  <Textarea
                    id="street"
                    value={shippingAddress.street}
                    onChange={(e) => handleAddressChange('street', e.target.value)}
                    placeholder="House no, Building name, Street"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={shippingAddress.city}
                      onChange={(e) => handleAddressChange('city', e.target.value)}
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <select
                      id="state"
                      value={shippingAddress.state}
                      onChange={(e) => handleAddressChange('state', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="pincode">Pincode *</Label>
                    <Input
                      id="pincode"
                      value={shippingAddress.pincode}
                      onChange={(e) => handleAddressChange('pincode', e.target.value)}
                      placeholder="Pincode"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="landmark">Landmark (Optional)</Label>
                  <Input
                    id="landmark"
                    value={shippingAddress.landmark}
                    onChange={(e) => handleAddressChange('landmark', e.target.value)}
                    placeholder="Nearby landmark"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cod" id="cod" />
                    <Label htmlFor="cod" className="flex items-center cursor-pointer">
                      <Truck className="h-4 w-4 mr-2" />
                      Cash on Delivery
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 opacity-50">
                    <RadioGroupItem value="online" id="online" disabled />
                    <Label htmlFor="online" className="flex items-center cursor-not-allowed">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Online Payment (Coming Soon)
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Order Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Order Notes (Optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Any special instructions for delivery..."
                  rows={3}
                />
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items by Farmer */}
                {itemsByFarmer.map((farmer, index) => (
                  <div key={farmer.farmerId} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Store className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-sm">{farmer.farmerName}</span>
                    </div>
                    
                    <div className="space-y-2 pl-6">
                      {farmer.items.map((item) => (
                        <div key={item._id} className="flex justify-between text-sm">
                          <div className="flex items-center space-x-2">
                            {item.image && (
                              <Image
                                src={item.image}
                                alt={item.name}
                                width={24}
                                height={24}
                                className="w-6 h-6 object-cover rounded"
                              />
                            )}
                            <span>
                              {item.name} × {item.quantity}
                            </span>
                          </div>
                          <span>{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex justify-between text-sm font-medium pl-6">
                      <span>Farmer Subtotal:</span>
                      <span>{formatCurrency(farmer.total)}</span>
                    </div>
                    
                    {index < itemsByFarmer.length - 1 && <Separator />}
                  </div>
                ))}

                <Separator />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal ({totalItems} items)</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>
                      {shipping === 0 ? (
                        <span className="text-green-600">Free</span>
                      ) : (
                        formatCurrency(shipping)
                      )}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Tax (5%)</span>
                    <span>{formatCurrency(tax)}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span className="text-green-600">{formatCurrency(total)}</span>
                  </div>
                </div>

                {/* Free Shipping Notice */}
                {shipping > 0 && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2 text-blue-700">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-xs">
                        Add {formatCurrency(1000 - subtotal)} more for free shipping!
                      </span>
                    </div>
                  </div>
                )}

                {/* Place Order Button */}
                <Button 
                  onClick={handlePlaceOrder}
                  disabled={loading || !validateForm()}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Placing Order...
                    </div>
                  ) : (
                    <>
                      <Package className="h-4 w-4 mr-2" />
                      Place Order - {formatCurrency(total)}
                    </>
                  )}
                </Button>

                <div className="text-xs text-gray-500 text-center">
                  By placing this order, you agree to our Terms of Service
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  )
}