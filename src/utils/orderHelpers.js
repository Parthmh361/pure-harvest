export const getStatusDisplay = (status) => {
  const statusMap = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    returned: 'Returned'
  }
  return statusMap[status] || 'Unknown'
}

export const canBeCancelled = (order) => {
  const cancellableStatuses = ['pending', 'confirmed']
  return cancellableStatuses.includes(order.status)
}

export const canBeReturned = (order) => {
  if (order.status !== 'delivered' || !order.actualDelivery) {
    return false
  }
  
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  
  return new Date(order.actualDelivery) > sevenDaysAgo
}

export const getPaymentStatusDisplay = (paymentStatus) => {
  const statusMap = {
    pending: 'Payment Pending',
    paid: 'Paid',
    failed: 'Payment Failed',
    refunded: 'Refunded'
  }
  return statusMap[paymentStatus] || 'Unknown'
}

export const getEstimatedDeliveryDays = (estimatedDelivery) => {
  if (estimatedDelivery) {
    const now = new Date()
    const delivery = new Date(estimatedDelivery)
    const diffTime = delivery - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }
  return null
}

export const formatOrderDate = (createdAt) => {
  return new Date(createdAt).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const getTotalItems = (items) => {
  return items.reduce((total, item) => total + item.quantity, 0)
}

export const getFarmersCount = (items) => {
  const farmers = new Set(items.map(item => item.farmer._id || item.farmer))
  return farmers.size
}

export const getOrderAge = (createdAt) => {
  const now = new Date()
  const diffTime = now - new Date(createdAt)
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}