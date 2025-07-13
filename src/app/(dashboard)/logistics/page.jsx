"use client"

import { useState, useEffect } from 'react'
import AuthGuard from '@/components/auth/auth-gaurd'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Truck, 
  Package, 
  DollarSign, 
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Navigation,
  Star,
  MessageSquare
} from 'lucide-react'
import Link from 'next/link'

export default function LogisticsDashboard() {
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    activeDeliveries: 0,
    totalEarnings: 0,
    averageRating: 0
  })

  const [availableDeliveries, setAvailableDeliveries] = useState([])
  const [activeDeliveries, setActiveDeliveries] = useState([])

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }

    // Mock data - replace with actual API calls
    setStats({
      totalDeliveries: 87,
      activeDeliveries: 3,
      totalEarnings: 1450.75,
      averageRating: 4.6
    })

    setAvailableDeliveries([
      {
        id: "DEL-001",
        orderId: "ORD-156",
        farmer: "Green Valley Farm",
        buyer: "John Doe",
        pickupAddress: "123 Farm Road, Valley City",
        deliveryAddress: "456 Main St, Downtown",
        distance: "12.5 km",
        estimatedFee: 15.50,
        products: "Organic Tomatoes (5kg)",
        urgency: "standard",
        pickupTime: "2024-01-18 10:00",
        deliveryTime: "2024-01-18 14:00"
      },
      {
        id: "DEL-002",
        orderId: "ORD-157",
        farmer: "Sunny Acres",
        buyer: "Jane Smith",
        pickupAddress: "789 Garden Lane, Greenfield",
        deliveryAddress: "321 Oak Ave, Suburb",
        distance: "8.2 km",
        estimatedFee: 12.00,
        products: "Fresh Spinach (3 bunches)",
        urgency: "urgent",
        pickupTime: "2024-01-18 14:00",
        deliveryTime: "2024-01-18 16:00"
      },
      {
        id: "DEL-003",
        orderId: "ORD-158",
        farmer: "Mountain Orchards",
        buyer: "Mike Johnson",
        pickupAddress: "555 Hill Top, Mountain View",
        deliveryAddress: "777 Pine St, City Center",
        distance: "18.7 km",
        estimatedFee: 22.50,
        products: "Red Apples (2kg), Pears (1kg)",
        urgency: "standard",
        pickupTime: "2024-01-19 09:00",
        deliveryTime: "2024-01-19 12:00"
      }
    ])

    setActiveDeliveries([
      {
        id: "DEL-098",
        orderId: "ORD-145",
        farmer: "Berry Farm",
        buyer: "Sarah Wilson",
        pickupAddress: "222 Berry Lane, Countryside",
        deliveryAddress: "888 Elm St, Uptown",
        distance: "15.3 km",
        fee: 18.00,
        products: "Strawberries (2kg)",
        status: "picked_up",
        progress: 60,
        estimatedArrival: "2024-01-18 15:30"
      },
      {
        id: "DEL-099",
        orderId: "ORD-146",
        farmer: "Herb Garden",
        buyer: "Tom Brown",
        pickupAddress: "333 Herb Row, Garden City",
        deliveryAddress: "999 Maple Ave, Riverside",
        distance: "9.8 km",
        fee: 13.50,
        products: "Fresh Basil, Mint",
        status: "in_transit",
        progress: 80,
        estimatedArrival: "2024-01-18 16:45"
      }
    ])
  }, [])

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'urgent':
        return 'bg-red-100 text-red-800'
      case 'standard':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'picked_up':
        return 'bg-yellow-100 text-yellow-800'
      case 'in_transit':
        return 'bg-blue-100 text-blue-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleAcceptDelivery = (deliveryId) => {
    // Handle accept delivery logic
    console.log('Accepting delivery:', deliveryId)
  }

  const handleRejectDelivery = (deliveryId) => {
    // Handle reject delivery logic
    console.log('Rejecting delivery:', deliveryId)
  }

  return (
    <AuthGuard allowedRoles={['logistics']}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.businessName || user?.name}!
            </h1>
            <p className="text-gray-600">
              Manage your delivery requests and track earnings
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalDeliveries}</div>
                <p className="text-xs text-muted-foreground">
                  +5 this week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Deliveries</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeDeliveries}</div>
                <p className="text-xs text-muted-foreground">
                  In progress
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.totalEarnings}</div>
                <p className="text-xs text-muted-foreground">
                  +$125 this week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.averageRating}</div>
                <p className="text-xs text-muted-foreground">
                  From 45 reviews
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="flex flex-wrap gap-4">
              <Button className="bg-primary hover:bg-primary-dark" asChild>
                <Link href="/logistics/deliveries">
                  <Truck className="h-4 w-4 mr-2" />
                  View All Deliveries
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/logistics/earnings">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Earnings Report
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/chat">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Messages
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/logistics/settings">
                  <Navigation className="h-4 w-4 mr-2" />
                  Route Settings
                </Link>
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="available" className="space-y-6">
            <TabsList>
              <TabsTrigger value="available">Available Deliveries</TabsTrigger>
              <TabsTrigger value="active">Active Deliveries</TabsTrigger>
            </TabsList>

            <TabsContent value="available">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Available Deliveries</CardTitle>
                      <CardDescription>
                        Choose deliveries that match your route
                      </CardDescription>
                    </div>
                    <Button variant="outline" asChild>
                      <Link href="/logistics/deliveries">View All</Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {availableDeliveries.map((delivery) => (
                      <div key={delivery.id} className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-semibold">{delivery.id}</h3>
                              <Badge className={getUrgencyColor(delivery.urgency)}>
                                {delivery.urgency}
                              </Badge>
                              <span className="text-sm text-gray-500">Order: {delivery.orderId}</span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              <strong>Products:</strong> {delivery.products}
                            </p>
                            <p className="text-sm text-gray-600 mb-1">
                              <strong>From:</strong> {delivery.farmer}
                            </p>
                            <p className="text-sm text-gray-600 mb-3">
                              <strong>To:</strong> {delivery.buyer}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-primary mb-1">
                              ${delivery.estimatedFee}
                            </div>
                            <div className="text-sm text-gray-500">
                              {delivery.distance}
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="flex items-center space-x-1 mb-1">
                              <MapPin className="h-4 w-4 text-green-600" />
                              <span className="font-medium">Pickup:</span>
                            </div>
                            <p className="text-gray-600 ml-5">{delivery.pickupAddress}</p>
                            <p className="text-gray-500 ml-5">{delivery.pickupTime}</p>
                          </div>
                          <div>
                            <div className="flex items-center space-x-1 mb-1">
                              <MapPin className="h-4 w-4 text-red-600" />
                              <span className="font-medium">Delivery:</span>
                            </div>
                            <p className="text-gray-600 ml-5">{delivery.deliveryAddress}</p>
                            <p className="text-gray-500 ml-5">{delivery.deliveryTime}</p>
                          </div>
                        </div>
                        
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRejectDelivery(delivery.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Decline
                          </Button>
                          <Button 
                            size="sm" 
                            className="bg-primary hover:bg-primary-dark"
                            onClick={() => handleAcceptDelivery(delivery.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="active">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Active Deliveries</CardTitle>
                      <CardDescription>
                        Track your ongoing deliveries
                      </CardDescription>
                    </div>
                    <Button variant="outline" asChild>
                      <Link href="/logistics/deliveries/active">View All</Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activeDeliveries.map((delivery) => (
                      <div key={delivery.id} className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-semibold">{delivery.id}</h3>
                              <Badge className={getStatusColor(delivery.status)}>
                                {delivery.status.replace('_', ' ')}
                              </Badge>
                              <span className="text-sm text-gray-500">Order: {delivery.orderId}</span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              <strong>Products:</strong> {delivery.products}
                            </p>
                            <p className="text-sm text-gray-600 mb-1">
                              <strong>From:</strong> {delivery.farmer}
                            </p>
                            <p className="text-sm text-gray-600 mb-3">
                              <strong>To:</strong> {delivery.buyer}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-primary mb-1">
                              ${delivery.fee}
                            </div>
                            <div className="text-sm text-gray-500">
                              {delivery.distance}
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Progress</span>
                            <span className="text-sm text-gray-500">{delivery.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${delivery.progress}%` }}
                            ></div>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">ETA: {delivery.estimatedArrival}</span>
                            <Button size="sm" variant="outline">
                              <Navigation className="h-4 w-4 mr-1" />
                              Navigate
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AuthGuard>
  )
}