"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/layout/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Star, 
  Eye, 
  Flag, 
  Check, 
  X, 
  Search,
  Filter,
  ArrowLeft
} from 'lucide-react'
import useAuthStore from '@/stores/auth-store'
import { formatDate } from '@/lib/utils'

export default function AdminReviewsPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  
  const [reviews, setReviews] = useState([])
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      router.push('/')
      return
    }

    fetchReviews()
    fetchReports()
  }, [isAuthenticated, user])

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/admin/reviews', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setReviews(data.reviews)
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/admin/reviews/reports', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setReports(data.reports)
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error)
    }
  }

  const handleReviewAction = async (reviewId, action) => {
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ action })
      })

      if (response.ok) {
        fetchReviews()
        alert(`Review ${action}d successfully`)
      } else {
        alert(`Failed to ${action} review`)
      }
    } catch (error) {
      console.error(`${action} review error:`, error)
      alert(`Failed to ${action} review`)
    }
  }

  return (
    <Layout requireAuth allowedRoles={['admin']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/admin')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Review Management</h1>
              <p className="text-gray-600">Moderate product reviews and handle reports</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'all', label: 'All Reviews', count: reviews.length },
                { id: 'reported', label: 'Reported', count: reports.length },
                { id: 'pending', label: 'Pending Approval', count: reviews.filter(r => !r.isApproved).length }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search reviews..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Reviews List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Loading reviews...</div>
          ) : (
            reviews
              .filter(review => {
                if (activeTab === 'reported') {
                  return reports.some(r => r.review._id === review._id)
                }
                if (activeTab === 'pending') {
                  return !review.isApproved
                }
                return true
              })
              .filter(review => 
                !searchTerm || 
                review.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
                review.buyer?.name.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((review) => (
                <Card key={review._id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-3">
                          <div className="flex items-center space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= review.rating 
                                    ? 'text-yellow-400 fill-yellow-400' 
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">
                            by {review.buyer?.name} on {formatDate(review.createdAt)}
                          </span>
                          <Badge variant={review.isApproved ? 'default' : 'secondary'}>
                            {review.isApproved ? 'Approved' : 'Pending'}
                          </Badge>
                          {review.isVerified && (
                            <Badge variant="outline">Verified Purchase</Badge>
                          )}
                        </div>
                        
                        <p className="text-gray-700 mb-3">{review.comment}</p>
                        
                        <div className="text-sm text-gray-500">
                          Product: {review.product?.name}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/products/${review.product._id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {!review.isApproved && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReviewAction(review._id, 'approve')}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReviewAction(review._id, 'reject')}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </div>
      </div>
    </Layout>
  )
}