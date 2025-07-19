"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/layout/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Package, 
  Search, 
  Filter,
  Eye,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  Calendar,
  User,
  Phone,
  MapPin,
  DollarSign,
  AlertCircle,
  LucideIndianRupee
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import useAuthStore from '@/stores/auth-store'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function FarmerOrdersPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState({})
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    dateRange: '30',
    page: 1
  })
  const [pagination, setPagination] = useState({})
  const [stats, setStats] = useState({})

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    if (user?.role !== 'farmer') {
      console.log('User role:', user?.role)
      router.push('/')
      return
    }

    fetchOrders()
  }, [isAuthenticated, user, filters])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        page: filters.page.toString(),
        limit: '10'
      })

      if (filters.status !== 'all') {
        params.append('status', filters.status)
      }

      if (filters.search) {
        params.append('search', filters.search)
      }

      if (filters.dateRange !== 'all') {
        const days = parseInt(filters.dateRange)
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)
        params.append('startDate', startDate.toISOString())
      }

      const response = await fetch(`/api/orders/farmer-orders?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        setOrders(data.orders)
        setPagination(data.pagination)
        setStats(data.stats)
      } else {
        console.error('Failed to fetch orders:', data.error)
      }
    } catch (error) {
      console.error('Orders fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId, newStatus, note = '') => {
    setUpdating(prev => ({ ...prev, [orderId]: true }))
    
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          status: newStatus,
          adminNotes: note
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Update local state
        setOrders(prev => prev.map(order => 
          order._id === orderId 
            ? { ...order, status: newStatus }
            : order
        ))
        alert('Order status updated successfully!')
      } else {
        alert(data.error || 'Failed to update order status')
      }
    } catch (error) {
      console.error('Update error:', error)
      alert('Failed to update order status')
    } finally {
      setUpdating(prev => ({ ...prev, [orderId]: false }))
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'confirmed':
      case 'preparing':
        return <Package className="h-4 w-4" />
      case 'ready':
      case 'shipped':
        return <Truck className="h-4 w-4" />
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />
      case 'cancelled':
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
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

  return (
    <Layout requireAuth allowedRoles={['farmer']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
            <p className="text-gray-600">Manage your incoming orders and track fulfillment</p>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Orders</p>
                    <p className="text-2xl font-bold">{stats.totalOrders || 0}</p>
                  </div>
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                    <p className="text-2xl font-bold">{stats.pendingOrders || 0}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue || 0)}</p>
                  </div>
                  <LucideIndianRupee className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                    <p className="text-2xl font-bold">{formatCurrency(stats.avgOrderValue || 0)}</p>
                  </div>
                  <LucideIndianRupee className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search orders..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                  className="pl-10"
                />
              </div>
              
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value, page: 1 }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.dateRange}
                onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value, page: 1 }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 3 months</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                onClick={() => setFilters({ search: '', status: 'all', dateRange: '30', page: 1 })}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                    <div className="h-16 bg-gray-300 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Orders Found</h3>
              <p className="text-gray-600">
                {filters.search || filters.status !== 'all' 
                  ? 'Try adjusting your filters'
                  : 'No orders have been placed for your products yet'
                }
              </p>
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
                      <div className="flex items-center space-x-4 mt-2">
                        <p className="text-sm text-gray-600">
                          <Calendar className="h-4 w-4 inline mr-1" />
                          {formatDate(order.createdAt)}
                        </p>
                        <p className="text-sm text-gray-600">
                          <User className="h-4 w-4 inline mr-1" />
                          {order.buyer?.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1">{order.status}</span>
                        </Badge>
                      </div>
                      <p className="text-lg font-semibold">
                        {formatCurrency(order.farmerTotal || order.totalAmount)}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Customer Info */}
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Customer Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p><strong>Name:</strong> {order.buyer?.name}</p>
                        <p><strong>Email:</strong> {order.buyer?.email}</p>
                        <p><strong>Phone:</strong> {order.buyer?.phone}</p>
                      </div>
                      <div>
                        <p><strong>Delivery Address:</strong></p>
                        <div className="text-gray-600">
                          {order.shippingAddress && (
                            <>
                              <p>{order.shippingAddress.fullName}</p>
                              <p>{order.shippingAddress.street}</p>
                              <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}</p>
                              <p>{order.shippingAddress.phone}</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="mb-4">
                    <h4 className="font-medium mb-3">Your Items in this Order</h4>
                    <div className="space-y-2">
                      {(order.farmerItems || order.items)?.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            {item.product?.images?.[0] && (
                              <Image
                                src={item.product.images[0]}
                                alt={item.product.name || item.name}
                                width={48}
                                height={48}
                                className="w-12 h-12 object-cover rounded"
                              />
                            )}
                            <div>
                              <p className="font-medium">{item.product?.name || item.name}</p>
                              <p className="text-sm text-gray-600">
                                Quantity: {item.quantity} × {formatCurrency(item.price)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {formatCurrency(item.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Actions */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <Link href={`/farmer/orders/${order._id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Link>
                    </Button>

                    {order.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatus(order._id, 'confirmed')}
                          disabled={updating[order._id]}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Confirm Order
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => updateOrderStatus(order._id, 'cancelled', 'Unable to fulfill order')}
                          disabled={updating[order._id]}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject Order
                        </Button>
                      </>
                    )}

                    {order.status === 'confirmed' && (
                      <Button
                        size="sm"
                        onClick={() => updateOrderStatus(order._id, 'preparing')}
                        disabled={updating[order._id]}
                      >
                        <Package className="h-4 w-4 mr-2" />
                        Start Preparing
                      </Button>
                    )}

                    {order.status === 'preparing' && (
                      <Button
                        size="sm"
                        onClick={() => updateOrderStatus(order._id, 'ready')}
                        disabled={updating[order._id]}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark Ready
                      </Button>
                    )}

                    {order.status === 'ready' && (
                      <Button
                        size="sm"
                        onClick={() => updateOrderStatus(order._id, 'shipped')}
                        disabled={updating[order._id]}
                      >
                        <Truck className="h-4 w-4 mr-2" />
                        Mark Shipped
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Contact Buyer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center space-x-4 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={!pagination.hasPrevPage}
                >
                  Previous
                </Button>
                
                <span className="text-sm text-gray-600">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                
                <Button
                  variant="outline"
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={!pagination.hasNextPage}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}