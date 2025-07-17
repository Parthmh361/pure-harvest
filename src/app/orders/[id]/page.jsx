"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/layout/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft,
  Package,
  Truck,
  CheckCircle,
  Clock,
  X,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  Download,
  MessageSquare
} from 'lucide-react'
import useAuthStore from '@/stores/auth-store'
import { formatCurrency, formatDate } from '@/lib/utils'
import Image from 'next/image'

const statusConfig = {
  pending: { 
    color: 'bg-yellow-100 text-yellow-800', 
    icon: Clock,
    description: 'Your order has been placed and is waiting for confirmation.'
  },
  confirmed: { 
    color: 'bg-blue-100 text-blue-800', 
    icon: CheckCircle,
    description: 'Your order has been confirmed and is being prepared.'
  },
  processing: { 
    color: 'bg-purple-100 text-purple-800', 
    icon: Package,
    description: 'Your order is being packed and prepared for shipment.'
  },
  shipped: { 
    color: 'bg-indigo-100 text-indigo-800', 
    icon: Truck,
    description: 'Your order has been shipped and is on its way to you.'
  },
  delivered: { 
    color: 'bg-green-100 text-green-800', 
    icon: CheckCircle,
    description: 'Your order has been successfully delivered.'
  },
  cancelled: { 
    color: 'bg-red-100 text-red-800', 
    icon: X,
    description: 'This order has been cancelled.'
  },
  returned: { 
    color: 'bg-gray-100 text-gray-800', 
    icon: AlertCircle,
    description: 'This order has been returned.'
  }
}

export default function OrderDetailsPage({ params }) {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    fetchOrderDetails()
  }, [isAuthenticated, params.id])

  const fetchOrderDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/orders/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        setOrder(data.order)
      } else {
        console.error('Failed to fetch order:', data.error)
        if (response.status === 404) {
          router.push('/orders')
        }
      }
    } catch (error) {
      console.error('Order fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelOrder = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return

    setCancelling(true)
    try {
      const response = await fetch(`/api/orders/${params.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        alert('Order cancelled successfully')
        fetchOrderDetails()
      } else {
        alert(data.error || 'Failed to cancel order')
      }
    } catch (error) {
      console.error('Cancel order error:', error)
      alert('Failed to cancel order')
    } finally {
      setCancelling(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Login</h1>
            <p className="text-gray-600 mb-6">You need to be logged in to view order details.</p>
            <Button onClick={() => router.push('/login')}>
              Login to Continue
            </Button>
          </div>
        </div>
      </Layout>
    )
  }

  if (loading) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-300 rounded w-1/4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-gray-300 rounded"></div>
                <div className="h-32 bg-gray-300 rounded"></div>
              </div>
              <div className="space-y-6">
                <div className="h-48 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (!order) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
            <p className="text-gray-600 mb-6">The order you're looking for doesn't exist or you don't have access to it.</p>
            <Button onClick={() => router.push('/orders')}>
              Back to Orders
            </Button>
          </div>
        </div>
      </Layout>
    )
  }

  const StatusIcon = statusConfig[order.status]?.icon || Package

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/orders')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">
              Order #{order.orderNumber}
            </h1>
            <p className="text-gray-600">
              Placed on {formatDate(order.createdAt, { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div
          >
          
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download Invoice
            </Button>
            
            {user?.role === 'buyer' && ['pending', 'confirmed'].includes(order.status) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="text-red-600 hover:text-red-700"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Order'}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <StatusIcon className="h-5 w-5 mr-2" />
                  Order Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <Badge className={`${statusConfig[order.status]?.color} text-sm px-3 py-1`}>
                    <StatusIcon className="h-4 w-4 mr-2" />
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                  
                  {order.trackingNumber && (
                    <div className="text-sm">
                      <span className="text-gray-600">Tracking: </span>
                      <span className="font-mono font-semibold">{order.trackingNumber}</span>
                    </div>
                  )}
                </div>
                
                <p className="text-gray-600 mb-4">
                  {statusConfig[order.status]?.description}
                </p>

                {/* Status Timeline */}
                <div className="space-y-3">
                  {order.statusHistory?.map((status, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        status.status === order.status ? 'bg-green-500' : 'bg-gray-300'
                      }`}></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium capitalize">{status.status}</span>
                          <span className="text-sm text-gray-500">
                            {formatDate(status.timestamp)}
                          </span>
                        </div>
                        {status.notes && (
                          <p className="text-sm text-gray-600">{status.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Order Items ({order.items.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div key={index}>
                      <div className="flex items-start space-x-4">
                        {item.product.images?.[0] ? (
                          <Image
                            src={item.product.images[0]}
                            alt={item.product.name}
                            width={80}
                            height={80}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                            <Package className="h-8 w-8 text-gray-400" />
                          </div>
                        )}

                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {item.product.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {item.product.category}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-sm">
                            <span>Quantity: {item.quantity}</span>
                            <span>Price: {formatCurrency(item.price)} each</span>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Package className="h-4 w-4" />
                              <span>Sold by: {item.farmer.businessName || item.farmer.name}</span>
                            </div>
                            <div className="font-semibold">
                              {formatCurrency(item.price * item.quantity)}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {index < order.items.length - 1 && (
                        <Separator className="mt-4" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="font-semibold">{order.shippingAddress.fullName}</div>
                  <div className="text-gray-600">
                    {order.shippingAddress.street}
                    {order.shippingAddress.landmark && (
                      <span>, Near {order.shippingAddress.landmark}</span>
                    )}
                  </div>
                  <div className="text-gray-600">
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mt-3">
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-1" />
                      {order.shippingAddress.phone}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>
                    {order.shippingCost === 0 ? (
                      <span className="text-green-600">Free</span>
                    ) : (
                      formatCurrency(order.shippingCost)
                    )}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>{formatCurrency(order.tax)}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span className="text-green-600">{formatCurrency(order.totalAmount)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Payment Method</span>
                  <Badge variant="outline">
                    {order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod}
                  </Badge>
                </div>
                
                <div className="flex justify-between">
                  <span>Payment Status</span>
                  <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                    {order.paymentStatus
                      ? order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)
                      : 'Unknown'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Order Notes */}
            {order.orderNotes && (
              <Card>
                <CardHeader>
                  <CardTitle>Order Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{order.orderNotes}</p>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
                
                {order.status === 'delivered' && (
                  <Button variant="outline" className="w-full">
                    <Package className="h-4 w-4 mr-2" />
                    Return Order
                  </Button>
                )}
                
                <Button variant="outline" className="w-full">
                  <Package className="h-4 w-4 mr-2" />
                  Reorder Items
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  )
}