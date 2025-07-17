"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Layout from "@/components/layout/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils"
import useAuthStore from '@/stores/auth-store'
import { ArrowLeft, Edit, Mail, MessageSquare, Package, Phone, User, CheckCircle, XCircle, Truck, Save } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import Image from "next/image"

export default function FarmerOrderDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [trackingNumber, setTrackingNumber] = useState("")
  const [orderNotes, setOrderNotes] = useState("")
  const [editingNotes, setEditingNotes] = useState(false)

  const { user, isAuthenticated } = useAuthStore()

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${id}`, {
          headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
        })
        const data = await res.json()
        if (res.ok) {
          setOrder(data.order)
          setTrackingNumber(data.order.trackingNumber || "")
          setOrderNotes(data.order.orderNotes || "")
        } else router.push("/farmer/orders")
      } catch {
        router.push("/farmer/orders")
      } finally {
        setLoading(false)
      }
    }
    fetchOrder()
  }, [id, router])

  const updateOrderStatus = async (newStatus, additionalData = {}) => {
    setUpdating(true)
    try {
      const response = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          status: newStatus,
          ...additionalData
        })
      })
      const data = await response.json()
      if (response.ok) {
        setOrder(data.order)
        alert('Order status updated successfully!')
      } else {
        alert(data.error || 'Failed to update order status')
      }
    } catch (error) {
      console.error('Update error:', error)
      alert('Failed to update order status')
    } finally {
      setUpdating(false)
    }
  }

  const saveOrderNotes = async () => {
    setUpdating(true)
    try {
      const response = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          adminNotes: orderNotes
        })
      })
      const data = await response.json()
      if (response.ok) {
        setOrder(data.order)
        setEditingNotes(false)
        alert('Notes saved successfully!')
      } else {
        alert(data.error || 'Failed to save notes')
      }
    } catch (error) {
      console.error('Save notes error:', error)
      alert('Failed to save notes')
    } finally {
      setUpdating(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-orange-100 text-orange-800',
      ready: 'bg-purple-100 text-purple-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (!isAuthenticated || user?.role !== 'farmer') {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-6">You need farmer privileges to access this page.</p>
            <Button onClick={() => router.push('/')}>Go Home</Button>
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
            <Button onClick={() => router.push('/farmer/orders')}>Back to Orders</Button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout requireAuth allowedRoles={['farmer']}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/farmer/orders')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
              <p className="text-gray-600">Manage order fulfillment and communicate with customer</p>
            </div>
          </div>

          <div className="text-right">
            <Badge className={getStatusColor(order.status)} style={{ fontSize: '14px', padding: '8px 16px' }}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Badge>
            <p className="text-2xl font-bold mt-2">
              {formatCurrency(order.farmerTotal || order.totalAmount)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(order.farmerItems || order.items)?.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        {item.product?.images?.[0] && (
                          <Image
                            src={item.product.images[0]}
                            alt={item.product.name || item.name}
                            width={64}
                            height={64}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        )}
                        <div>
                          <h4 className="font-medium">{item.product?.name || item.name}</h4>
                          <p className="text-sm text-gray-600">
                            {item.product?.category}
                          </p>
                          <p className="text-sm text-gray-600">
                            Unit Price: {formatCurrency(item.price)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">Qty: {item.quantity}</p>
                        <p className="text-lg font-bold">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Contact Details</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>{order.buyer?.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{order.buyer?.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{order.buyer?.phone}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Delivery Address</h4>
                    {order.shippingAddress && (
                      <div className="space-y-1 text-gray-600">
                        <p className="font-medium text-gray-900">{order.shippingAddress.fullName}</p>
                        <p>{order.shippingAddress.street}</p>
                        {order.shippingAddress.landmark && (
                          <p>Near {order.shippingAddress.landmark}</p>
                        )}
                        <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}</p>
                        <p>{order.shippingAddress.phone}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Order Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.statusHistory?.map((history, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium capitalize">{history.status}</p>
                          <p className="text-sm text-gray-600">
                            {formatDate(history.timestamp)}
                          </p>
                        </div>
                        {history.note && (
                          <p className="text-sm text-gray-600 mt-1">{history.note}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Order Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.status === 'pending' && (
                  <>
                    <Button
                      className="w-full"
                      onClick={() => updateOrderStatus('confirmed')}
                      disabled={updating}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirm Order
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => updateOrderStatus('cancelled', { cancellationReason: 'Unable to fulfill order' })}
                      disabled={updating}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Order
                    </Button>
                  </>
                )}

                {order.status === 'confirmed' && (
                  <Button
                    className="w-full"
                    onClick={() => updateOrderStatus('preparing')}
                    disabled={updating}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Start Preparing
                  </Button>
                )}

                {order.status === 'preparing' && (
                  <Button
                    className="w-full"
                    onClick={() => updateOrderStatus('ready')}
                    disabled={updating}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark Ready
                  </Button>
                )}

                {order.status === 'ready' && (
                  <Button
                    className="w-full"
                    onClick={() => updateOrderStatus('shipped', { trackingNumber })}
                    disabled={updating}
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Mark Shipped
                  </Button>
                )}

                <Button
                  variant="outline"
                  className="w-full"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contact Customer
                </Button>
              </CardContent>
            </Card>

            {/* Tracking Information */}
            {(order.status === 'ready' || order.status === 'shipped' || order.status === 'delivered') && (
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="tracking">Tracking Number</Label>
                    <Input
                      id="tracking"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="Enter tracking number"
                    />
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => updateOrderStatus(order.status, { trackingNumber })}
                    disabled={updating}
                  >
                    Update Tracking
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Order Notes */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Order Notes</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingNotes(!editingNotes)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {editingNotes ? (
                  <div className="space-y-3">
                    <Textarea
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="Add notes about this order..."
                      rows={4}
                    />
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={saveOrderNotes}
                        disabled={updating}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingNotes(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-600">
                    {order.orderNotes || 'No notes added yet'}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Order Date</span>
                  <span>{formatDate(order.createdAt)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Payment Method</span>
                  <span className="capitalize">{order.paymentMethod}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Payment Status</span>
                  <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                    {(order.paymentStatus
                      ? order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)
                      : 'Unknown')}
                  </Badge>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Total Amount</span>
                  <span>{formatCurrency(order.farmerTotal || order.totalAmount)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  )
}