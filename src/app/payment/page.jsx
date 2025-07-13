// In any page or component
import PayButton from "@/components/paybtn"

export default function CheckoutPage() {
  return (
    <div>
      <h1>Checkout</h1>
      <PayButton amount={50} /> {/* Amount in INR */}
    </div>
  )
}