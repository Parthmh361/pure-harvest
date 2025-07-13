"use client"
import { useState } from "react"

export default function PayButton({ amount }) {
  const [loading, setLoading] = useState(false)

  const handlePay = async () => {
    setLoading(true)
    // 1. Create order on backend
    const res = await fetch("/api/razorpay-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    })
    const order = await res.json()
    setLoading(false)

    if (!order.id) {
      alert("Failed to create order")
      return
    }

    // 2. Open Razorpay checkout
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: "Pure Harvest",
      description: "Order Payment",
      order_id: order.id,
      handler: function (response) {
        alert("Payment successful! Payment ID: " + response.razorpay_payment_id)
        // Optionally: verify payment on backend here
      },
      prefill: {
        name: "Parth",
        email: "parthchoudhari3612@gmail.com",
      },
      theme: { color: "#22c55e" },
    }
    const rzp = new window.Razorpay(options)
    rzp.open()
  }

  return (
    <button
      onClick={handlePay}
      className="bg-green-600 text-white px-4 py-2 rounded"
      disabled={loading}
    >
      {loading ? "Processing..." : `Pay ₹${amount}`}
    </button>
  )
}