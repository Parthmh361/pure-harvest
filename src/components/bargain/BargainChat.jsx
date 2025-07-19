import { useState } from 'react'

export default function BargainChat({ bargain, onCounter, onAgree, onReject }) {
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('')

  if (!bargain || !bargain.initialOffer) {
    return <div>Loading bargain...</div>
  }

  return (
    <div>
      <h3>Bargain History</h3>
      <ul>
        <li>Initial Offer: ₹{bargain.initialOffer.price} x {bargain.initialOffer.quantity}</li>
        {bargain.counterOffers.map((offer, idx) => (
          <li key={idx}>
            {offer.by}: ₹{offer.price} x {offer.quantity}
          </li>
        ))}
      </ul>
      <div>
        <input
          type="number"
          placeholder="Price"
          value={price}
          onChange={e => setPrice(e.target.value)}
        />
        <input
          type="number"
          placeholder="Quantity"
          value={quantity}
          onChange={e => setQuantity(e.target.value)}
        />
        <button onClick={() => onCounter(price, quantity)}>Counter Offer</button>
        <button onClick={() => onAgree(price, quantity)}>Agree</button>
        <button onClick={onReject}>Reject</button>
      </div>
    </div>
  )
}