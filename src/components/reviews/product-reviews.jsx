"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  Flag, 
  ChevronDown,
  ChevronUp,
  Filter,
  Calendar,
  User,
  MoreHorizontal
} from 'lucide-react'
import useAuthStore from '@/stores/auth-store'
import { formatDate } from '@/lib/utils'
import Image from 'next/image'

export default function ProductReviews({ productId, initialReviews = [], initialStats = null }) {
  const { user, isAuthenticated } = useAuthStore()
  
  const [reviews, setReviews] = useState(initialReviews)
  const [stats, setStats] = useState(initialStats)
  const [loading, setLoading] = useState(!initialReviews.length)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [sortBy, setSortBy] = useState('newest')
  const [filterRating, setFilterRating] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (!initialReviews.length) {
      fetchReviews()
    }
  }, [productId, sortBy, filterRating])

  const fetchReviews = async (page = 1, append = false) => {
    try {
      setLoading(!append)
      
      const params = new URLSearchParams({
        productId,
        page: page.toString(),
        limit: '10',
        sort: sortBy
      })

      if (filterRating !== 'all') {
        params.append('rating', filterRating)
      }

      const response = await fetch(`/api/reviews?${params}`)
      const data = await response.json()

      if (response.ok) {
        if (append) {
          setReviews(prev => [...prev, ...data.reviews])
        } else {
          setReviews(data.reviews)
        }
        
        setStats(data.stats)
        setHasMore(data.pagination.hasNextPage)
        setCurrentPage(page)
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMoreReviews = () => {
    fetchReviews(currentPage + 1, true)
  }

  const handleHelpfulVote = async (reviewId, isHelpful) => {
    if (!isAuthenticated) {
      alert('Please login to vote on reviews')
      return
    }

    try {
      const response = await fetch(`/api/reviews/${reviewId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ helpful: isHelpful })
      })

      const data = await response.json()

      if (response.ok) {
        // Update local state
        setReviews(prev => prev.map(review => 
          review._id === reviewId 
            ? { ...review, helpfulVotes: data.helpfulVotes, totalVotes: data.totalVotes }
            : review
        ))
      } else {
        alert(data.error || 'Failed to vote')
      }
    } catch (error) {
      console.error('Vote error:', error)
      alert('Failed to vote on review')
    }
  }

  const reportReview = async (reviewId) => {
    if (!isAuthenticated) {
      alert('Please login to report reviews')
      return
    }

    if (confirm('Are you sure you want to report this review?')) {
      try {
        const response = await fetch(`/api/reviews/${reviewId}/report`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })

        if (response.ok) {
          alert('Review reported successfully')
        } else {
          alert('Failed to report review')
        }
      } catch (error) {
        console.error('Report error:', error)
        alert('Failed to report review')
      }
    }
  }

  const StarRating = ({ rating, size = 'sm' }) => {
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6'
    }

    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating 
                ? 'text-yellow-400 fill-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  const RatingDistribution = () => {
    if (!stats) return null

    const total = stats.totalReviews
    if (total === 0) return null

    return (
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map(rating => {
          const count = stats.distribution[rating] || 0
          const percentage = total > 0 ? (count / total) * 100 : 0

          return (
            <div key={rating} className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 w-16">
                <span className="text-sm">{rating}</span>
                <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
              </div>
              <Progress value={percentage} className="flex-1 h-2" />
              <span className="text-xs text-gray-600 w-8">{count}</span>
            </div>
          )
        })}
      </div>
    )
  }

  if (loading && !reviews.length) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex space-x-4">
                <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                  <div className="h-16 bg-gray-300 rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Reviews Overview */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Customer Reviews</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {showFilters ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Overall Rating */}
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">{stats.averageRating}</div>
                <StarRating rating={Math.round(stats.averageRating)} size="lg" />
                <p className="text-gray-600 mt-2">
                  Based on {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Rating Distribution */}
              <div>
                <h4 className="font-medium mb-3">Rating Distribution</h4>
                <RatingDistribution />
              </div>
            </div>

            {/* Filters */}
            {showFilters && (
              <>
                <Separator className="my-4" />
                <div className="flex flex-wrap gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Sort by</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="highest">Highest Rating</option>
                      <option value="lowest">Lowest Rating</option>
                      <option value="helpful">Most Helpful</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Filter by Rating</label>
                    <select
                      value={filterRating}
                      onChange={(e) => setFilterRating(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="all">All Ratings</option>
                      <option value="5">5 Stars</option>
                      <option value="4">4 Stars</option>
                      <option value="3">3 Stars</option>
                      <option value="2">2 Stars</option>
                      <option value="1">1 Star</option>
                    </select>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Star className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Reviews Yet</h3>
              <p className="text-gray-600">
                Be the first to review this product and help other customers!
              </p>
            </CardContent>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review._id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">{review.buyer?.name || 'Anonymous'}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <StarRating rating={review.rating} />
                        <span className="text-sm text-gray-600">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                      {review.isVerified && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          Verified Purchase
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => reportReview(review._id)}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>

                <div className="mb-4">
                  <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                </div>

                {review.images && review.images.length > 0 && (
                  <div className="flex space-x-2 mb-4">
                    {review.images.map((image, index) => (
                      <Image
                        key={index}
                        src={image}
                        alt={`Review image ${index + 1}`}
                        width={80}
                        height={80}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleHelpfulVote(review._id, true)}
                      className="text-gray-600 hover:text-green-600"
                    >
                      <ThumbsUp className="h-4 w-4 mr-1" />
                      Helpful ({review.helpfulVotes || 0})
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleHelpfulVote(review._id, false)}
                      className="text-gray-600 hover:text-red-600"
                    >
                      <ThumbsDown className="h-4 w-4 mr-1" />
                      Not helpful
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => reportReview(review._id)}
                    className="text-gray-600 hover:text-red-600"
                  >
                    <Flag className="h-4 w-4 mr-1" />
                    Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}

        {/* Load More Button */}
        {hasMore && reviews.length > 0 && (
          <div className="text-center">
            <Button
              variant="outline"
              onClick={loadMoreReviews}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Load More Reviews'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}