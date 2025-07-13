"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Layout from '@/components/layout/layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Star, 
  ArrowLeft, 
  Send, 
  Loader2,
  Package,
  CheckCircle
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import useAuthStore from '@/stores/auth-store'
import { formatCurrency } from '@/lib/utils'

export default function OrderReviewPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [reviews, setReviews] = useState({})

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (user && user.role !== 'buyer') {
      router.push('/')
      return
    }

    if (params.id) {
      fetchOrder()
    }
  }, [params.id, isAuthenticated, user, router])

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        if (data.order.status !== 'delivered') {
          setError('You can only review delivered orders')
          return
        }

        setOrder(data.order)

        // Initialize review state for each product
        const initialReviews = {}
        data.order.items.forEach(item => {
          initialReviews[item.productId._id] = {
            rating: 5,
            comment: '',
            submitted: false
          }
        })
        setReviews(initialReviews)
      } else {
        setError(data.error || 'Order not found')
      }
    } catch (error) {
      setError('Failed to load order')
    } finally {
      setLoading(false)
    }
  }

  const handleRatingChange = (productId, rating) => {
    setReviews(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        rating
      }
    }))
  }

  const handleCommentChange = (productId, comment) => {
    setReviews(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        comment
      }
    }))
  }

  const submitReview = async (productId) => {
    const review = reviews[productId]
    if (!review.comment.trim()) {
      setError('Please write a review comment')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          productId,
          orderId: params.id,
          rating: review.rating,
          comment: review.comment.trim()
        })
      })

      const data = await response.json()

      if (response.ok) {
        setReviews(prev => ({
          ...prev,
          [productId]: {
            ...prev[productId],
            submitted: true
          }
        }))
        setSuccess('Review submitted successfully!')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Failed to submit review')
      }
    } catch (error) {
      setError('Network error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const StarRating = ({ rating, onRatingChange, readOnly = false }) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => !readOnly && onRatingChange(star)}
            className={`${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
          >
            <Star
              className={`h-6 w-6 ${
                star <= rating
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    )
  }

  if (!isAuthenticated || (user && user.role !== 'buyer')) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-4">You need to be logged in as a buyer to review orders.</p>
            <Button asChild>
              <Link href="/login">Login</Link>
            </Button>
          </div>
        </div>
      </Layout>
    )
  }

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-300 rounded w-1/3"></div>
            <div className="h-64 bg-gray-300 rounded"></div>
          </div>
        </div>
      </Layout>
    )
  }

  if (error || !order) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Unable to Load Reviews</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.push('/orders')}>
              Back to Orders
            </Button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout requireAuth allowedRoles={['buyer']}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push(`/orders/${params.id}`)}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Order
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Rate & Review Products</h1>
            <p className="text-gray-600">Order #{order.orderNumber}</p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Products to Review */}
        <div className="space-y-6">
          {order.items.map((item) => {
            const review = reviews[item.productId._id]
            
            return (
              <Card key={item.productId._id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="relative w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400">
                            <Package className="h-8 w-8" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{item.name}</h3>
                        <p className="text-gray-600">
                          {item.quantity} {item.unit}s × {formatCurrency(item.price)}
                        </p>
                        <p className="text-sm text-gray-500">
                          by {item.farmerId.businessName || item.farmerId.name}
                        </p>
                      </div>
                    </div>
                    {review?.submitted && (
                      <Badge variant="outline" className="text-green-600">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Reviewed
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                
                {!review?.submitted && (
                  <CardContent className="space-y-6">
                    {/* Rating */}
                    <div>
                      <Label className="text-base font-medium mb-3 block">
                        Rate this product
                      </Label>
                      <StarRating
                        rating={review?.rating || 5}
                        onRatingChange={(rating) => handleRatingChange(item.productId._id, rating)}
                      />
                    </div>

                    {/* Comment */}
                    <div>
                      <Label htmlFor={`comment-${item.productId._id}`} className="text-base font-medium">
                        Write your review
                      </Label>
                      <Textarea
                        id={`comment-${item.productId._id}`}
                        value={review?.comment || ''}
                        onChange={(e) => handleCommentChange(item.productId._id, e.target.value)}
                        placeholder="Share your experience with this product..."
                        rows={4}
                        className="mt-2"
                      />
                    </div>

                    {/* Submit Button */}
                    <Button
                      onClick={() => submitReview(item.productId._id)}
                      disabled={submitting || !review?.comment?.trim()}
                      className="w-full sm:w-auto"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Submit Review
                        </>
                      )}
                    </Button>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>

        {/* Back to Orders */}
        <div className="text-center mt-8">
          <Button variant="outline" asChild>
            <Link href="/orders">
              Back to All Orders
            </Link>
          </Button>
        </div>
      </div>
    </Layout>
  )
}