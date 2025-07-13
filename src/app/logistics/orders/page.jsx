"use client"
import { useEffect, useState } from "react"
import useAuthStore from "@/stores/auth-store"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function LogisticsDashboard() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "logistics") {
      router.push("/login")
      return
    }
    fetchOrders()
  }, [isAuthenticated, user])

  async function fetchOrders() {
    setLoading(true)
    const res = await fetch("/api/logistics/orders")
    const data = await res.json()
    setOrders(data.orders || [])
    setLoading(false)
  }

  async function updateStatus(orderId, status) {
    await fetch("/api/logistics/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status }),
    })
    fetchOrders()
  }

  if (!isAuthenticated || user?.role !== "logistics") return null

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">My Deliveries</h1>
      {loading ? (
        <div>Loading...</div>
      ) : orders.length === 0 ? (
        <div>No deliveries assigned.</div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <Card key={order._id}>
              <CardHeader>
                <CardTitle>Order #{order._id}</CardTitle>
              </CardHeader>
              <CardContent>
                <div>Status: <b>{order.status}</b></div>
                <div>Address: {order.shippingAddress}</div>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" onClick={() => updateStatus(order._id, "in_transit")}>Mark In Transit</Button>
                  <Button size="sm" onClick={() => updateStatus(order._id, "delivered")}>Mark Delivered</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}