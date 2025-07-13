"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Layout from '@/components/layout/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  SlidersHorizontal,
  MapPin,
  Star,
  Package,
  X
} from 'lucide-react'
import { debounce, PRODUCT_CATEGORIES, formatCurrency } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'

export default function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState('grid')
  const [showFilters, setShowFilters] = useState(false)
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    location: searchParams.get('location') || '',
    organicOnly: searchParams.get('organic') === 'true',
    sortBy: searchParams.get('sort') || 'newest'
  })
  
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0
  })

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query, currentFilters) => {
      performSearch(query, currentFilters, 1)
    }, 500),
    []
  )

  useEffect(() => {
    debouncedSearch(searchQuery, filters)
  }, [searchQuery, filters, debouncedSearch])

  const performSearch = async (query = searchQuery, currentFilters = filters, page = 1) => {
    setLoading(true)
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12'
      })

      if (query.trim()) params.append('search', query.trim())
      if (currentFilters.category) params.append('category', currentFilters.category)
      if (currentFilters.minPrice) params.append('minPrice', currentFilters.minPrice)
      if (currentFilters.maxPrice) params.append('maxPrice', currentFilters.maxPrice)
      if (currentFilters.location) params.append('location', currentFilters.location)
      if (currentFilters.organicOnly) params.append('organicOnly', 'true')
      if (currentFilters.sortBy) params.append('sortBy', currentFilters.sortBy)

      const response = await fetch(`/api/search?${params}`)
      const data = await response.json()

      if (response.ok) {
        setProducts(data.products)
        setPagination(data.pagination)
        
        // Update URL
        const newUrl = new URL(window.location)
        newUrl.pathname = '/search'
        if (query.trim()) newUrl.searchParams.set('q', query.trim())
        if (currentFilters.category) newUrl.searchParams.set('category', currentFilters.category)
        if (currentFilters.minPrice) newUrl.searchParams.set('minPrice', currentFilters.minPrice)
        if (currentFilters.maxPrice) newUrl.searchParams.set('maxPrice', currentFilters.maxPrice)
        if (currentFilters.organicOnly) newUrl.searchParams.set('organic', 'true')
        if (currentFilters.sortBy !== 'newest') newUrl.searchParams.set('sort', currentFilters.sortBy)
        
        window.history.replaceState({}, '', newUrl)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      category: '',
      minPrice: '',
      maxPrice: '',
      location: '',
      organicOnly: false,
      sortBy: 'newest'
    })
    setSearchQuery('')
  }

  const handlePageChange = (page) => {
    performSearch(searchQuery, filters, page)
    setPagination(prev => ({ ...prev, currentPage: page }))
  }

  const activeFiltersCount = Object.values(filters).filter(value => 
    value !== '' && value !== false && value !== 'newest'
  ).length + (searchQuery ? 1 : 0)

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Search Products</h1>
          
          {/* Search Bar */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search for products, farmers, locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-3 text-lg"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
            
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="relative"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* Active Filters */}
          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-gray-600">Active filters:</span>
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  Search: "{searchQuery}"
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setSearchQuery('')}
                  />
                </Badge>
              )}
              {filters.category && (
                <Badge variant="secondary" className="gap-1">
                  {filters.category}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleFilterChange('category', '')}
                  />
                </Badge>
              )}
              {filters.organicOnly && (
                <Badge variant="secondary" className="gap-1">
                  Organic Only
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleFilterChange('organicOnly', false)}
                  />
                </Badge>
              )}
              {(filters.minPrice || filters.maxPrice) && (
                <Badge variant="secondary" className="gap-1">
                  Price: ₹{filters.minPrice || '0'} - ₹{filters.maxPrice || '∞'}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => {
                      handleFilterChange('minPrice', '')
                      handleFilterChange('maxPrice', '')
                    }}
                  />
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            </div>
          )}
        </div>

        <div className="flex gap-8">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="w-80 flex-shrink-0">
              <Card>
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Filters</h3>
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Clear All
                    </Button>
                  </div>

                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <select
                      value={filters.category}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">All Categories</option>
                      {PRODUCT_CATEGORIES.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Price Range</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filters.minPrice}
                        onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filters.maxPrice}
                        onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Location</label>
                    <Input
                      type="text"
                      placeholder="City, State"
                      value={filters.location}
                      onChange={(e) => handleFilterChange('location', e.target.value)}
                    />
                  </div>

                  {/* Organic Only */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="organicOnly"
                      checked={filters.organicOnly}
                      onChange={(e) => handleFilterChange('organicOnly', e.target.checked)}
                      className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                    />
                    <label htmlFor="organicOnly" className="text-sm font-medium">
                      Organic Only
                    </label>
                  </div>

                  {/* Sort By */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Sort By</label>
                    <select
                      value={filters.sortBy}
                      onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="newest">Newest First</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="rating">Highest Rated</option>
                      <option value="popular">Most Popular</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Results */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-gray-600">
                  {loading ? 'Searching...' : `${pagination.totalProducts} results found`}
                  {searchQuery && ` for "${searchQuery}"`}
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="aspect-square bg-gray-300"></div>
                    <CardContent className="p-4">
                      <div className="h-4 bg-gray-300 rounded mb-2"></div>
                      <div className="h-3 bg-gray-300 rounded mb-2"></div>
                      <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* No Results */}
            {!loading && products.length === 0 && (
              <div className="text-center py-16">
                <Package className="h-24 w-24 mx-auto text-gray-300 mb-6" />
                <h3 className="text-xl font-semibold text-gray-900 mb-4">No products found</h3>
                <p className="text-gray-600 mb-8">
                  Try adjusting your search terms or filters
                </p>
                <Button onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            )}

            {/* Products Grid/List */}
            {!loading && products.length > 0 && (
              <>
                <div className={viewMode === 'grid' 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                  : "space-y-4"
                }>
                  {products.map((product) => (
                    <Card key={product._id} className="hover:shadow-lg transition-shadow">
                      <Link href={`/products/${product._id}`}>
                        <div className={viewMode === 'grid' ? "aspect-square" : "flex"}>
                          {product.images && product.images.length > 0 ? (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              width={300}
                              height={300}
                              className={viewMode === 'grid' 
                                ? "w-full h-full object-cover" 
                                : "w-32 h-32 object-cover flex-shrink-0"
                              }
                            />
                          ) : (
                            <div className={`bg-gray-200 flex items-center justify-center ${
                              viewMode === 'grid' ? "w-full h-full" : "w-32 h-32"
                            }`}>
                              <Package className="h-12 w-12 text-gray-400" />
                            </div>
                          )}
                          
                          <CardContent className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-semibold truncate">{product.name}</h3>
                              {product.organicCertified && (
                                <Badge variant="secondary" className="ml-2 text-xs">
                                  Organic
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                              {product.description}
                            </p>
                            
                            <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                              <MapPin className="h-3 w-3" />
                              <span>{product.farmer?.city || 'Location'}</span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-lg font-bold text-green-600">
                                  {formatCurrency(product.price)}
                                </span>
                                <span className="text-sm text-gray-500">/{product.unit}</span>
                              </div>
                              
                              <div className="flex items-center space-x-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm">4.5</span>
                              </div>
                            </div>
                          </CardContent>
                        </div>
                      </Link>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center space-x-4 mt-8">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={pagination.currentPage <= 1}
                    >
                      Previous
                    </Button>
                    
                    <span className="text-sm text-gray-600">
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </span>
                    
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={pagination.currentPage >= pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}