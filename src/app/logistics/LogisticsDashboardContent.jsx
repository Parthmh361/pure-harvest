"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Truck, 
  Package, 
  DollarSign, 
  MapPin,
  CheckCircle,
  XCircle,
  Navigation,
  Star
} from 'lucide-react'
import Link from 'next/link'

export default function LogisticsDashboardContent() {
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState(null)
  const [availableDeliveries, setAvailableDeliveries] = useState([]);
  const [activeDeliveries, setActiveDeliveries] = useState([])

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }

    async function fetchData() {
      const statsRes = await fetch("/api/logistics/stats")
      setStats(await statsRes.json())

      try {
        const availRes = await fetch("/api/logistics/deliveries?status=available");
        const availData = await availRes.json();
        setAvailableDeliveries(Array.isArray(availData) ? availData : []);
      } catch {
        setAvailableDeliveries([]);
      }

      try {
        const activeRes = await fetch("/api/logistics/deliveries?status=active");
        const activeData = await activeRes.json();
        setActiveDeliveries(Array.isArray(activeData) ? activeData : []);
      } catch {
        setActiveDeliveries([]);
      }
    }
    fetchData()
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

  const handleAcceptDelivery = async (orderId) => {
    await fetch("/api/logistics/deliveries", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, action: "accept" })
    })
    window.location.reload()
  }

  const handleRejectDelivery = async (orderId) => {
    await fetch("/api/logistics/deliveries", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, action: "decline" })
    })
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
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
                <div className="text-2xl font-bold">₹{stats.totalEarnings}</div>
                <p className="text-xs text-muted-foreground">
                  +₹125 this week
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
        )}

        {/* Tabs for Available and Active Deliveries */}
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
                  {availableDeliveries.length === 0 && <div>No available deliveries.</div>}
                  {availableDeliveries.map(order => (
                    <div key={order._id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold">{order.orderNumber || order._id}</h3>
                            <Badge className={getUrgencyColor(order.urgency)}>
                              {order.urgency || "Standard"}
                            </Badge>
                            <span className="text-sm text-gray-500">Order ID: {order._id}</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Products:</strong>{" "}
                            {order.items && order.items.length > 0
                              ? order.items.map(item =>
                                  `${item.product?.name || "N/A"} (x${item.quantity})`
                                ).join(", ")
                              : "N/A"}
                          </p>
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>To:</strong>{" "}
                            {order.buyer?.name || order.shippingAddress?.fullName || "N/A"}
                          </p>
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Pickup Address:</strong>{" "}
                            {order.pickupAddress || order.shippingAddress?.address || "N/A"}
                          </p>
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Delivery Address:</strong>{" "}
                            {order.deliveryAddress || order.shippingAddress?.address || "N/A"}
                          </p>
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Phone:</strong>{" "}
                            {order.shippingAddress?.phone || "N/A"}
                          </p>
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Status:</strong>{" "}
                            {order.status}
                          </p>
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Delivery Fee:</strong>{" "}
                            ₹{order.deliveryFee ?? "N/A"}
                          </p>
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Created At:</strong>{" "}
                            {order.createdAt ? new Date(order.createdAt).toLocaleString() : "N/A"}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-primary mb-1">
                            ₹{order.estimatedFee}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.distance}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleRejectDelivery(order._id)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Decline
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-primary hover:bg-primary-dark"
                          onClick={() => handleAcceptDelivery(order._id)}
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
                  {activeDeliveries.length === 0 && <div>No active deliveries.</div>}
                  {activeDeliveries.map(order => (
                    <div key={order._id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold">{order._id}</h3>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status.replace('_', ' ')}
                            </Badge>
                            <span className="text-sm text-gray-500">Order: {order.orderId}</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Products:</strong>{" "}
                            {order.items && order.items.length > 0
                              ? order.items.map(item =>
                                  `${item.product?.name || "N/A"} (x${item.quantity})`
                                ).join(", ")
                              : "N/A"}
                          </p>
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>To:</strong>{" "}
                            {order.buyer?.name || order.shippingAddress?.fullName || "N/A"}
                          </p>
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Pickup Address:</strong>{" "}
                            {order.pickupAddress || order.shippingAddress?.address || "N/A"}
                          </p>
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Delivery Address:</strong>{" "}
                            {order.deliveryAddress || order.shippingAddress?.address || "N/A"}
                          </p>
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Phone:</strong>{" "}
                            {order.shippingAddress?.phone || "N/A"}
                          </p>
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Status:</strong>{" "}
                            {order.status}
                          </p>
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Delivery Fee:</strong>{" "}
                            ₹{order.deliveryFee ?? "N/A"}
                          </p>
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Created At:</strong>{" "}
                            {order.createdAt ? new Date(order.createdAt).toLocaleString() : "N/A"}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-primary mb-1">
                            ₹{order.fee}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.distance}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-2">
                        <span className="text-gray-600">ETA: {order.estimatedArrival}</span>
                        <Button size="sm" variant="outline">
                          <Navigation className="h-4 w-4 mr-1" />
                          Navigate
                        </Button>
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
  )
}