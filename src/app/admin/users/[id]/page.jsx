"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/layout/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft,
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Shield,
  ShieldCheck,
  ShieldX,
  Eye,
  EyeOff,
  Edit,
  Save,
  X,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Package,
  ShoppingCart,
  TrendingUp,
  Activity,
  MessageSquare,
  Ban,
  UserCheck,
  FileText,
  Download
} from 'lucide-react'
import useAuthStore from '@/stores/auth-store'
import { formatCurrency, formatDate } from '@/lib/utils'
import Image from 'next/image'

export default function AdminUserDetailPage({ params }) {
  const router = useRouter()
  const { user: currentUser, isAuthenticated } = useAuthStore()
  
  const [user, setUser] = useState(null)
  const [userStats, setUserStats] = useState({})
  const [recentOrders, setRecentOrders] = useState([])
  const [recentProducts, setRecentProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [editingNotes, setEditingNotes] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (currentUser?.role !== 'admin') {
      router.push('/')
      return
    }

    fetchUserDetails()
    fetchUserActivity()
  }, [isAuthenticated, currentUser, params.id])

  const fetchUserDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/users/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        setUserStats(data.stats)
        setAdminNotes(data.user.adminNotes || '')
      } else {
        console.error('Failed to fetch user:', data.error)
        if (response.status === 404) {
          router.push('/admin/users')
        }
      }
    } catch (error) {
      console.error('User fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserActivity = async () => {
    try {
      // Fetch recent orders
      const ordersResponse = await fetch(`/api/admin/users/${params.id}/orders`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json()
        setRecentOrders(ordersData.orders || [])
      }

      // Fetch recent products (if farmer)
      if (user?.role === 'farmer') {
        const productsResponse = await fetch(`/api/admin/users/${params.id}/products`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })

        if (productsResponse.ok) {
          const productsData = await productsResponse.json()
          setRecentProducts(productsData.products || [])
        }
      }
    } catch (error) {
      console.error('Activity fetch error:', error)
    }
  }

  const handleUpdateUserStatus = async (updates) => {
    setUpdating(true)
    try {
      const response = await fetch(`/api/admin/users/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updates)
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        alert('User updated successfully!')
      } else {
        alert(data.error || 'Failed to update user')
      }
    } catch (error) {
      console.error('Update user error:', error)
      alert('Failed to update user')
    } finally {
      setUpdating(false)
    }
  }

  const handleSaveNotes = async () => {
    await handleUpdateUserStatus({ adminNotes })
    setEditingNotes(false)
  }

  const handleSendMessage = () => {
    // TODO: Implement messaging system
    alert('Messaging system not implemented yet')
  }

  const handleExportUserData = async () => {
    try {
      const response = await fetch(`/api/admin/users/${params.id}/export`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `user-${user.name}-data.json`
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export user data')
    }
  }

  if (!isAuthenticated || currentUser?.role !== 'admin') {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <User className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-6">You need admin privileges to access this page.</p>
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

  if (!user) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <User className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">User Not Found</h1>
            <p className="text-gray-600 mb-6">The user you're looking for doesn't exist.</p>
            <Button onClick={() => router.push('/admin/users')}>Back to Users</Button>
          </div>
        </div>
      </Layout>
    )
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'farmer': return 'bg-green-100 text-green-800'
      case 'buyer': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Layout requireAuth allowedRoles={['admin']}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/admin/users')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-gray-600">User Details & Management</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={handleSendMessage}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Send Message
            </Button>
            <Button variant="outline" onClick={handleExportUserData}>
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {/* User Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {user.role === 'buyer' && (
                    <>
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Total Orders</p>
                              <p className="text-2xl font-bold">{userStats.totalOrders || 0}</p>
                            </div>
                            <ShoppingCart className="h-8 w-8 text-blue-600" />
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Total Spent</p>
                              <p className="text-2xl font-bold">{formatCurrency(userStats.totalSpent || 0)}</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-green-600" />
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                              <p className="text-2xl font-bold">{formatCurrency(userStats.avgOrderValue || 0)}</p>
                            </div>
                            <Activity className="h-8 w-8 text-purple-600" />
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}

                  {user.role === 'farmer' && (
                    <>
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Products</p>
                              <p className="text-2xl font-bold">{userStats.totalProducts || 0}</p>
                            </div>
                            <Package className="h-8 w-8 text-green-600" />
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Total Orders</p>
                              <p className="text-2xl font-bold">{userStats.totalOrders || 0}</p>
                            </div>
                            <ShoppingCart className="h-8 w-8 text-blue-600" />
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Revenue</p>
                              <p className="text-2xl font-bold">{formatCurrency(userStats.totalRevenue || 0)}</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-green-600" />
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </div>

                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <User className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600">Full Name</p>
                            <p className="font-medium">{user.name}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <Mail className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600">Email</p>
                            <p className="font-medium">{user.email}</p>
                          </div>
                        </div>
                        
                        {user.phone && (
                          <div className="flex items-center space-x-3">
                            <Phone className="h-5 w-5 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-600">Phone</p>
                              <p className="font-medium">{user.phone}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <Calendar className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600">Member Since</p>
                            <p className="font-medium">{formatDate(user.createdAt)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <Shield className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600">Account Status</p>
                            <div className="flex items-center space-x-2">
                              <Badge className={getRoleColor(user.role)}>
                                {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
                              </Badge>
                              <Badge variant={user.isVerified ? 'default' : 'secondary'}>
                                {user.isVerified ? 'Verified' : 'Unverified'}
                              </Badge>
                              {user.isActive === false && (
                                <Badge variant="destructive">Inactive</Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {user.businessName && (
                          <div className="flex items-center space-x-3">
                            <Package className="h-5 w-5 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-600">Business Name</p>
                              <p className="font-medium">{user.businessName}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {user.description && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Description</p>
                        <p className="text-gray-900">{user.description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Address Information */}
                {user.address && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <MapPin className="h-5 w-5 mr-2" />
                        Address Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {user.address.street && (
                          <p>{user.address.street}</p>
                        )}
                        {user.address.landmark && (
                          <p className="text-gray-600">Near {user.address.landmark}</p>
                        )}
                        <p>
                          {user.address.city}, {user.address.state} {user.address.pincode}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Saved Addresses (for buyers) */}
                {user.role === 'buyer' && user.savedAddresses && user.savedAddresses.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Saved Addresses ({user.savedAddresses.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {user.savedAddresses.map((address, index) => (
                          <div key={index} className="p-4 border rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge variant="outline">{address.type}</Badge>
                              {address.isDefault && (
                                <Badge variant="default">Default</Badge>
                              )}
                            </div>
                            <h4 className="font-medium">{address.fullName}</h4>
                            <p className="text-sm text-gray-600">
                              {address.street}, {address.city}, {address.state} {address.pincode}
                            </p>
                            <p className="text-sm text-gray-600">{address.phone}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Activity Tab */}
              <TabsContent value="activity" className="space-y-6">
                {/* Recent Orders */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Orders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {recentOrders.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No orders found</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {recentOrders.map((order) => (
                          <div key={order._id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <h4 className="font-medium">Order #{order.orderNumber}</h4>
                              <p className="text-sm text-gray-600">{formatDate(order.createdAt)}</p>
                              <Badge variant="outline">{order.status}</Badge>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{formatCurrency(order.totalAmount)}</p>
                              <p className="text-sm text-gray-600">{order.items?.length} items</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Products (for farmers) */}
                {user.role === 'farmer' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Products</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {recentProducts.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>No products found</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {recentProducts.map((product) => (
                            <div key={product._id} className="flex items-center space-x-4 p-4 border rounded-lg">
                              {product.images?.[0] ? (
                                <Image
                                  src={product.images[0]}
                                  alt={product.name}
                                  width={60}
                                  height={60}
                                  className="w-15 h-15 object-cover rounded"
                                />
                              ) : (
                                <div className="w-15 h-15 bg-gray-200 rounded flex items-center justify-center">
                                  <Package className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                              <div className="flex-1">
                                <h4 className="font-medium">{product.name}</h4>
                                <p className="text-sm text-gray-600">{product.category}</p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Badge variant={product.isActive ? 'default' : 'secondary'}>
                                    {product.isActive ? 'Active' : 'Inactive'}
                                  </Badge>
                                  <span className="text-sm font-medium">{formatCurrency(product.price)}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Details Tab */}
              <TabsContent value="details" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>User ID</Label>
                        <Input value={user._id} disabled className="font-mono text-sm" />
                      </div>
                      <div>
                        <Label>Last Login</Label>
                        <Input value={user.lastLogin ? formatDate(user.lastLogin) : 'Never'} disabled />
                      </div>
                      <div>
                        <Label>Created At</Label>
                        <Input value={formatDate(user.createdAt)} disabled />
                      </div>
                      <div>
                        <Label>Updated At</Label>
                        <Input value={formatDate(user.updatedAt)} disabled />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Security & Permissions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Account Status Controls */}
                    <div>
                      <h4 className="font-medium mb-4">Account Status</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            {user.isVerified ? (
                              <ShieldCheck className="h-5 w-5 text-green-600" />
                            ) : (
                              <ShieldX className="h-5 w-5 text-red-600" />
                            )}
                            <div>
                              <p className="font-medium">Email Verification</p>
                              <p className="text-sm text-gray-600">
                                {user.isVerified ? 'Email is verified' : 'Email is not verified'}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant={user.isVerified ? "outline" : "default"}
                            onClick={() => handleUpdateUserStatus({ isVerified: !user.isVerified })}
                            disabled={updating}
                          >
                            {user.isVerified ? 'Unverify' : 'Verify'}
                          </Button>
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            {user.isActive !== false ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-600" />
                            )}
                            <div>
                              <p className="font-medium">Account Status</p>
                              <p className="text-sm text-gray-600">
                                {user.isActive !== false ? 'Account is active' : 'Account is suspended'}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant={user.isActive !== false ? "outline" : "default"}
                            onClick={() => handleUpdateUserStatus({ isActive: user.isActive === false })}
                            disabled={updating}
                          >
                            {user.isActive !== false ? 'Suspend' : 'Activate'}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Admin Notes */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">Admin Notes</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => editingNotes ? setEditingNotes(false) : setEditingNotes(true)}
                        >
                          {editingNotes ? <X className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
                          {editingNotes ? 'Cancel' : 'Edit'}
                        </Button>
                      </div>
                      
                      {editingNotes ? (
                        <div className="space-y-4">
                          <Textarea
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            placeholder="Add admin notes about this user..."
                            rows={4}
                          />
                          <div className="flex justify-end space-x-3">
                            <Button variant="outline" onClick={() => setEditingNotes(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleSaveNotes} disabled={updating}>
                              <Save className="h-4 w-4 mr-2" />
                              Save Notes
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-gray-50 rounded-lg">
                          {user.adminNotes ? (
                            <p className="text-gray-700">{user.adminNotes}</p>
                          ) : (
                            <p className="text-gray-500 italic">No admin notes</p>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleUpdateUserStatus({ isVerified: !user.isVerified })}
                  disabled={updating}
                >
                  {user.isVerified ? <ShieldX className="h-4 w-4 mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                  {user.isVerified ? 'Remove Verification' : 'Verify User'}
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleUpdateUserStatus({ isActive: user.isActive === false })}
                  disabled={updating}
                >
                  {user.isActive !== false ? <Ban className="h-4 w-4 mr-2" /> : <UserCheck className="h-4 w-4 mr-2" />}
                  {user.isActive !== false ? 'Suspend Account' : 'Activate Account'}
                </Button>

                <Button variant="outline" className="w-full justify-start" onClick={handleSendMessage}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Message
                </Button>

                <Button variant="outline" className="w-full justify-start" onClick={handleExportUserData}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </CardContent>
            </Card>

            {/* Account Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Account Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{user.name}</h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Role</span>
                    <Badge className={getRoleColor(user.role)}>
                      {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Status</span>
                    <div className="flex items-center space-x-1">
                      <Badge variant={user.isVerified ? 'default' : 'secondary'}>
                        {user.isVerified ? 'Verified' : 'Unverified'}
                      </Badge>
                      {user.isActive === false && (
                        <Badge variant="destructive">Inactive</Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Member since</span>
                    <span>{formatDate(user.createdAt)}</span>
                  </div>

                  {user.lastLogin && (
                    <div className="flex justify-between">
                      <span>Last login</span>
                      <span>{formatDate(user.lastLogin)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Risk Assessment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Risk Assessment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Account verification</span>
                    <Badge variant={user.isVerified ? 'default' : 'destructive'}>
                      {user.isVerified ? 'Low' : 'High'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Account age</span>
                    <Badge variant="default">Low</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Activity level</span>
                    <Badge variant="secondary">Medium</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  )
}