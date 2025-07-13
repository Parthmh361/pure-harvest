"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/layout/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  Calendar,
  Eye,
  Star,
  Activity
} from 'lucide-react'
import useAuthStore from '@/stores/auth-store'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function FarmerAnalyticsPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()

  const [analytics, setAnalytics] = useState({
    overview: {
      totalRevenue: 0,
      totalOrders: 0,
      totalProducts: 0,
      avgOrderValue: 0
    },
    trends: {
      revenueChange: 0,
      ordersChange: 0,
      productsChange: 0
    },
    topProducts: [],
    recentOrders: [],
    monthlyData: []
  })

  const [timeRange, setTimeRange] = useState('30d')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/farmer/analytics')
      return
    }

    if (user && user.role !== 'farmer') {
      router.push('/')
      return
    }

    fetchAnalytics()
  }, [isAuthenticated, user, router, timeRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/farmer/analytics?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAnalytics(data.analytics)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated || (user && user.role !== 'farmer')) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-4">You need to be logged in as a farmer to view analytics.</p>
            <Button onClick={() => router.push('/login')}>
              Login
            </Button>
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
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600">Track your sales performance and insights</p>
          </div>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 3 months</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-8 bg-gray-300 rounded mb-4"></div>
                  <div className="h-6 bg-gray-300 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(analytics?.overview?.totalRevenue || 0)}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="flex items-center mt-4 text-sm">
                    {(analytics?.trends?.revenueChange || 0) >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                    )}
                    <span className={(analytics?.trends?.revenueChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {Math.abs(analytics?.trends?.revenueChange || 0).toFixed(1)}%
                    </span>
                    <span className="text-gray-500 ml-1">vs previous period</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Orders</p>
                      <p className="text-2xl font-bold">{analytics?.overview?.totalOrders || 0}</p>
                    </div>
                    <ShoppingCart className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="flex items-center mt-4 text-sm">
                    {(analytics?.trends?.ordersChange || 0) >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                    )}
                    <span className={(analytics?.trends?.ordersChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {Math.abs(analytics?.trends?.ordersChange || 0).toFixed(1)}%
                    </span>
                    <span className="text-gray-500 ml-1">vs previous period</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Active Products</p>
                      <p className="text-2xl font-bold">{analytics?.overview?.totalProducts || 0}</p>
                    </div>
                    <Package className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="flex items-center mt-4 text-sm">
                    {(analytics?.trends?.productsChange || 0) >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                    )}
                    <span className={(analytics?.trends?.productsChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {Math.abs(analytics?.trends?.productsChange || 0).toFixed(1)}%
                    </span>
                    <span className="text-gray-500 ml-1">vs previous period</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Avg Order Value</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(analytics?.overview?.avgOrderValue || 0)}
                      </p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="flex items-center mt-4 text-sm">
                    <Activity className="h-4 w-4 text-blue-600 mr-1" />
                    <span className="text-gray-600">Per order average</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Top Products */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Selling Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(analytics?.topProducts || []).length > 0 ? (
                      analytics.topProducts.map((product, index) => (
                        <div key={product._id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full text-sm font-semibold">
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="font-medium">{product.name}</h4>
                              <p className="text-sm text-gray-600">{product.category}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{product.soldQuantity} sold</p>
                            <p className="text-sm text-gray-600">
                              {formatCurrency(product.revenue)} revenue
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No sales data available</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Orders */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(analytics?.recentOrders || []).length > 0 ? (
                      analytics.recentOrders.map((order) => (
                        <div key={order._id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h4 className="font-medium">#{order.orderNumber}</h4>
                            <p className="text-sm text-gray-600">
                              {order.buyer?.name} • {formatDate(order.createdAt, { 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              {formatCurrency(order.totalAmount)}
                            </p>
                            <Badge 
                              variant={
                                order.status === 'delivered' ? 'default' :
                                order.status === 'cancelled' ? 'destructive' :
                                'secondary'
                              }
                              className="text-xs"
                            >
                              {order.status}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No recent orders</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Button className="h-20 flex-col" onClick={() => router.push('/farmer/products/new')}>
                    <Package className="h-6 w-6 mb-2" />
                    Add New Product
                  </Button>

                  <Button variant="outline" className="h-20 flex-col" onClick={() => router.push('/farmer/orders')}>
                    <ShoppingCart className="h-6 w-6 mb-2" />
                    Manage Orders
                  </Button>

                  <Button variant="outline" className="h-20 flex-col" onClick={() => router.push('/farmer/products')}>
                    <Eye className="h-6 w-6 mb-2" />
                    View Products
                  </Button>

                  <Button variant="outline" className="h-20 flex-col" onClick={() => router.push('/profile')}>
                    <Users className="h-6 w-6 mb-2" />
                    Update Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Layout>
  )
}