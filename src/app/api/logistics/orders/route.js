import { getSession } from 'next-auth/react'
import dbConnect from '@/lib/mongodb'
import Order from '@/models/order'

export default async function handler(req, res) {
  await dbConnect()
  const session = await getSession({ req })
  if (!session || session.user.role !== 'logistics') {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method === 'GET') {
    // Fetch orders assigned to this logistics user
    const orders = await Order.find({ logisticsId: session.user._id })
    return res.json({ orders })
  }

  if (req.method === 'PATCH') {
    // Update delivery status
    const { orderId, status } = req.body
    const order = await Order.findOneAndUpdate(
      { _id: orderId, logisticsId: session.user._id },
      { status },
      { new: true }
    )
    return res.json({ order })
  }

  res.status(405).end()
}