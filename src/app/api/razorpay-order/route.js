import Razorpay from "razorpay"

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end()

  const { amount, currency = "INR", receipt = "receipt#1" } = req.body

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  })

  try {
    const order = await razorpay.orders.create({
      amount: amount * 100, // amount in paise
      currency,
      receipt,
    })
    res.status(200).json(order)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}