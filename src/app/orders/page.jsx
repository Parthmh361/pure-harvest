"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/layout/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Package, 
  Clock, 
  Truck, 
  CheckCircle, 
  XCircle,
  Eye,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import useAuthStore from '@/stores/auth-store'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function OrdersPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    console.log('🔍 Orders page mounted')
    console.log('User:', user)
    console.log('IsAuthenticated:', isAuthenticated)
    
    if (!isAuthenticated) {
      console.log('❌ Not authenticated, redirecting to login')
      router.push('/login')
      return
    }

    // Only allow buyers
    if (user?.role !== 'buyer' && user?.role !== 'farmer') {
      console.warn(user?.role)
      router.push('/') // or '/'
      return
    }

    fetchOrders()
  }, [isAuthenticated, user, router])

  const fetchOrders = async (page = 1) => {
    try {
      console.log('📦 Fetching orders, page:', page)
      setLoading(true)
      setError(null)

      const token = localStorage.getItem('token')
      console.log('🔑 Token exists:', !!token)
      
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`/api/orders?page=${page}&limit=10`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      console.log('📡 API Response status:', response.status)

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ Orders data received:', data)

      if (page === 1) {
        setOrders(data.orders || [])
      } else {
        setOrders(prev => [...prev, ...(data.orders || [])])
      }

      setHasMore(data.pagination?.hasNextPage || false)
      setCurrentPage(page)

    } catch (error) {
      console.error('❌ Fetch orders error:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const loadMoreOrders = () => {
    if (!loading && hasMore) {
      fetchOrders(currentPage + 1)
    }
  }

  const refreshOrders = () => {
    setOrders([])
    setCurrentPage(1)
    setHasMore(true)
    fetchOrders(1)
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />
      case 'processing':
        return <Package className="h-4 w-4" />
      case 'shipped':
        return <Truck className="h-4 w-4" />
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />
      case 'cancelled':
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800'
      case 'processing':
        return 'bg-purple-100 text-purple-800'
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Show loading state
  if (loading && orders.length === 0) {
    return (
      <Layout requireAuth allowedRoles={['buyer', 'farmer', 'admin']}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
            <Button onClick={refreshOrders} disabled>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Loading...
            </Button>
          </div>

          {/* Loading skeleton */}
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-3 flex-1">
                      <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-300 rounded w-1/3"></div>
                    </div>
                    <div className="h-8 bg-gray-300 rounded w-20"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    )
  }

  // Show error state
  if (error && orders.length === 0) {
    return (
      <Layout requireAuth allowedRoles={['buyer']}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
            <Button onClick={refreshOrders}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>

          <Card className="text-center py-12">
            <CardContent>
              <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Error Loading Orders
              </h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={refreshOrders}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    )
  }

  return (
    <Layout requireAuth allowedRoles={['buyer', 'farmer', 'admin']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
            <p className="text-gray-600">Track and manage your orders</p>
          </div>
          <Button onClick={refreshOrders} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Debug Info (remove in production) */}
        <div className="mb-4 p-4 bg-gray-100 rounded-lg text-sm">
          <strong>Debug Info:</strong>
          <br />
          • User Role: {user?.role}
          • Orders Count: {orders.length}
          • Has More: {hasMore ? 'Yes' : 'No'}
          • Current Page: {currentPage}
          • Loading: {loading ? 'Yes' : 'No'}
          • Error: {error || 'None'}
        </div>

        {/* Orders List */}
        {orders.length === 0 && !loading ? (
          <Card className="text-center py-12">
            <CardContent>
              <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Orders Yet
              </h3>
              <p className="text-gray-600 mb-6">
                You haven't placed any orders yet. Start shopping to see your orders here!
              </p>
              <Button onClick={() => router.push('/products')}>
                Browse Products
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order._id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Order #{order.orderNumber}
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        Placed on {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className={`${getStatusColor(order.status)} border-0`}>
                        <span className="flex items-center space-x-1">
                          {getStatusIcon(order.status)}
                          <span className="capitalize">{order.status}</span>
                        </span>
                      </Badge>
                      <span className="text-lg font-semibold">
                        {formatCurrency(order.totalAmount)}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Order Items */}
                    <div className="space-y-2">
                      {order.items?.map((item, index) => (
                        <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                          <div className="flex items-center space-x-3">
                            {item.product?.images?.[0] && (
                              <img
                                src={item.product.images[0]}
                                alt={item.name}
                                className="w-12 h-12 object-cover rounded-md"
                              />
                            )}
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-gray-600">
                                Qty: {item.quantity} × {formatCurrency(item.price)}
                              </p>
                            </div>
                          </div>
                          <span className="font-medium">
                            {formatCurrency(item.total)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-4">
                      <div className="text-sm text-gray-600">
                        Payment: <span className="capitalize">{order.paymentMethod}</span>
                        {order.paymentStatus && (
                          <span className="ml-2 capitalize">({order.paymentStatus})</span>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/orders/${order._id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                        {order.status === 'delivered' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/orders/${order._id}/review`)}
                          >
                            Write Review
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={loadMoreOrders}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More Orders'
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}

