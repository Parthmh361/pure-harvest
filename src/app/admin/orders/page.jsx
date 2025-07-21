"use client"

import { useEffect, useState } from "react"
import Layout from "@/components/layout/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [globalFilter, setGlobalFilter] = useState("")
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [pageIndex, setPageIndex] = useState(0)
  const [pageCount, setPageCount] = useState(1)

  useEffect(() => {
    fetchOrders()
  }, [pageIndex])

  const fetchOrders = async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/orders?page=${pageIndex + 1}`)
    const data = await res.json()
    setOrders(data.orders || [])
    setPageCount(data.pagination?.totalPages || 1)
    setLoading(false)
  }

  const handleStatusChange = async (orderId, newStatus) => {
    await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status: newStatus }),
    })
    fetchOrders()
  }

  return (
    <Layout requireAuth allowedRoles={["admin"]}>
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4">
        <h1 className="text-2xl font-bold mb-4">All Orders</h1>
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <Input
            placeholder="Search orders..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-xs"
          />
        </div>
        {/* Orders as cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-lg p-6 animate-pulse h-48"></div>
            ))
          ) : orders.length === 0 ? (
            <div className="col-span-full text-center py-8">No orders found.</div>
          ) : (
            orders
              .filter(order =>
                globalFilter
                  ? order.orderNumber.toString().includes(globalFilter) ||
                    order.buyer?.name?.toLowerCase().includes(globalFilter.toLowerCase())
                  : true
              )
              .map((order) => (
                <div
                  key={order._id}
                  className="bg-white rounded-lg shadow border p-6 cursor-pointer hover:shadow-lg transition"
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="font-bold text-lg">Order #{order.orderNumber}</h2>
                    <span className={`px-2 py-1 rounded text-xs ${order.status === "pending" ? "bg-yellow-100 text-yellow-800" : order.status === "confirmed" ? "bg-green-100 text-green-800" : order.status === "delivered" ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700 mb-1">
                    <b>Buyer:</b> {order.buyer?.name}
                  </div>
                  <div className="text-sm text-gray-700 mb-1">
                    <b>Total:</b> ₹{typeof order.totalAmount === "number"
  ? order.totalAmount
  : (
      (typeof order.subtotal === "number" ? order.subtotal : order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0)
      + (typeof order.deliveryFee === "number" ? order.deliveryFee : 0)
    )
}
                  </div>
                  <div className="text-sm text-gray-700 mb-1">
                    <b>Date:</b> {new Date(order.createdAt).toLocaleDateString()}
                  </div>
                  <div className="mt-2">
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}>
                      View Details
                    </Button>
                  </div>
                </div>
              ))
          )}
        </div>
        {/* Pagination */}
        <div className="flex flex-col sm:flex-row gap-2 items-center justify-between mt-4">
          <div>
            Page {pageIndex + 1} of {pageCount}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
              disabled={pageIndex === 0}
            >
              Prev
            </Button>
            <Button
              size="sm"
              onClick={() => setPageIndex((p) => Math.min(pageCount - 1, p + 1))}
              disabled={pageIndex + 1 >= pageCount}
            >
              Next
            </Button>
          </div>
        </div>
        {/* Order Detail Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-3xl w-full relative overflow-y-auto max-h-[90vh]">
              <button
                className="absolute top-2 right-2 text-gray-500"
                onClick={() => setSelectedOrder(null)}
              >
                ✕
              </button>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-1">
                    Order #{selectedOrder.orderNumber}
                  </h2>
                  <span className={`px-2 py-1 rounded text-xs ${selectedOrder.status === "pending" ? "bg-yellow-100 text-yellow-800" : selectedOrder.status === "confirmed" ? "bg-green-100 text-green-800" : selectedOrder.status === "delivered" ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"}`}>
                    {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">
                    ₹{typeof selectedOrder.totalAmount === "number"
                      ? selectedOrder.totalAmount
                      : (
                          (typeof selectedOrder.subtotal === "number" ? selectedOrder.subtotal : selectedOrder.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0)
                          + (typeof selectedOrder.deliveryFee === "number" ? selectedOrder.deliveryFee : 0)
                        )
                    }
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(selectedOrder.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
              
              {/* Order Items */}
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Order Items</h3>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between border rounded-lg p-3 gap-4">
                      <div className="flex items-center gap-3">
                        {item.product?.images?.length > 0 && (
                          <img
                            src={item.product.images[0]}
                            alt={item.product?.name || "Product"}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div>
                          <span className="font-medium">{item.product?.name || "Product"}</span>
                          <span className="ml-2 text-xs text-gray-500">
                            {item.quantity} {item.unit || ""} @ ₹{item.price} each
                          </span>
                          {item.product?.farmer && (
                            <span className="ml-2 text-xs text-gray-500">
                              (Farmer: {item.product.farmer.businessName || item.product.farmer.name})
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="font-bold">
                        ₹{item.price * item.quantity}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Buyer & Shipping Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold mb-2">Buyer Information</h4>
                  <div className="text-gray-700">
                    <div><b>Name:</b> {selectedOrder.buyer?.name}</div>
                    <div><b>Email:</b> {selectedOrder.buyer?.email}</div>
                    <div><b>Phone:</b> {selectedOrder.buyer?.phone}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Shipping Address</h4>
                  <div className="text-gray-700">
                    <div>{selectedOrder.shippingAddress?.fullName}</div>
                    <div>{selectedOrder.shippingAddress?.phone}</div>
                    <div>
                      {selectedOrder.shippingAddress?.street}, {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.pincode}
                    </div>
                    {selectedOrder.shippingAddress?.landmark && (
                      <div>Landmark: {selectedOrder.shippingAddress.landmark}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Timeline */}
              {selectedOrder.statusHistory && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-2">Order Timeline</h4>
                  <div className="space-y-2">
                    {selectedOrder.statusHistory.map((history, idx) => (
                      <div key={idx} className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <div>
                          <span className="capitalize font-medium">{history.status}</span>
                          <span className="ml-2 text-xs text-gray-500">{new Date(history.timestamp).toLocaleString()}</span>
                          {history.note && (
                            <div className="text-xs text-gray-500">{history.note}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment & Summary */}
              <div className="mb-6">
                <h4 className="font-semibold mb-2">Payment & Summary</h4>
                <div className="flex flex-col gap-1 text-gray-700">
                  <div><b>Payment Method:</b> {selectedOrder.paymentMethod}</div>
                  <div><b>Subtotal:</b> ₹{typeof selectedOrder.subtotal === "number" ? selectedOrder.subtotal : selectedOrder.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0}</div>
                  <div><b>Delivery Fee:</b> ₹{typeof selectedOrder.deliveryFee === "number" ? selectedOrder.deliveryFee : 0}</div>
                  <div><b>Total Amount:</b> ₹{typeof selectedOrder.totalAmount === "number"
                    ? selectedOrder.totalAmount
                    : (
                        (typeof selectedOrder.subtotal === "number" ? selectedOrder.subtotal : selectedOrder.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0)
                        + (typeof selectedOrder.deliveryFee === "number" ? selectedOrder.deliveryFee : 0)
                      )
                  }</div>
                </div>
              </div>

              {/* Status Change */}
              <div className="mb-4">
                <b>Change Status:</b>
                <select
                  className="ml-2 border rounded px-2 py-1"
                  value={selectedOrder.status}
                  onChange={async (e) => {
                    await handleStatusChange(selectedOrder._id, e.target.value)
                    setSelectedOrder({ ...selectedOrder, status: e.target.value })
                  }}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              {selectedOrder.status === "pending" && (
                <Button
                  className="mt-4"
                  onClick={async () => {
                    await handleStatusChange(selectedOrder._id, "confirmed")
                    setSelectedOrder(null)
                  }}
                >
                  Confirm Order
                </Button>
              )}
              <div className="mt-4">
                <Button onClick={() => setSelectedOrder(null)}>Close</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}