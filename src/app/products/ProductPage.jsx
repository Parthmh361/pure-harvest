"use client"

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Layout from '@/components/layout/layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Search, Filter, Star, MapPin, Grid3X3, List } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function ProductsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('grid')
  
  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all')
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest')
  const [priceRange, setPriceRange] = useState([0, 1000])
  const [isOrganic, setIsOrganic] = useState(searchParams.get('isOrganic') === 'true')
  const [showFilters, setShowFilters] = useState(false)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [currentPage, selectedCategory, sortBy, searchQuery, isOrganic, priceRange])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        ...(selectedCategory !== 'all' && { category: selectedCategory }),
        ...(searchQuery && { search: searchQuery }),
        sortBy,
        ...(isOrganic && { isOrganic: 'true' }),
        minPrice: priceRange[0].toString(),
        maxPrice: priceRange[1].toString()
      })

      const response = await fetch(`/api/products?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setProducts(data.products)
        setTotalPages(data.pagination.totalPages)
        setTotalItems(data.pagination.totalItems)
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/products/categories')
      const data = await response.json()
      
      if (data.success) {
        setCategories(data.categories)
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchProducts()
  }

  const handleFilterChange = () => {
    setCurrentPage(1)
    fetchProducts()
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('all')
    setSortBy('newest')
    setPriceRange([0, 1000])
    setIsOrganic(false)
    setCurrentPage(1)
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">All Products</h1>
          
          {/* Search and Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </form>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="sm:hidden"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex border rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
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
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {products.length} of {totalItems} products
            </span>
            {(selectedCategory !== 'all' || searchQuery || isOrganic) && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <div className={`w-64 space-y-6 ${showFilters ? 'block' : 'hidden sm:block'}`}>
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4">Categories</h3>
                <div className="space-y-2">
                  {/* All Categories */}
                  <button
                    onClick={() => {
                      setSelectedCategory('all')
                      setCurrentPage(1)
                    }}
                    className={`block w-full text-left px-2 py-1 rounded ${
                      selectedCategory === 'all' ? 'bg-green-100 text-green-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    All Categories
                  </button>

                  {/* Individual Categories */}
                  {categories.map((category) => (
                    <button
                      key={category.name}
                      onClick={() => {
                        // Ensure category.name is lowercase and matches backend
                        setSelectedCategory(category.name.toLowerCase())
                        setCurrentPage(1)
                      }}
                      className={`block w-full text-left px-2 py-1 rounded ${
                        selectedCategory === category.name.toLowerCase() ? 'bg-green-100 text-green-700' : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex items-center">
                          <span className="mr-2">{category.icon}</span>
                          {category.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {category.count}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4">Price Range</h3>
                <div className="space-y-4">
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={1000}
                    step={10}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>₹{priceRange[0]}</span>
                    <span>₹{priceRange[1]}</span>
                  </div>
                  <Button size="sm" onClick={handleFilterChange} className="w-full">
                    Apply
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4">Other Filters</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="organic"
                      checked={isOrganic}
                      onCheckedChange={setIsOrganic}
                    />
                    <label htmlFor="organic" className="text-sm font-medium">
                      Organic Only
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {loading ? (
              <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-48 bg-gray-300 rounded-t-lg"></div>
                    <CardContent className="p-4 space-y-2">
                      <div className="h-4 bg-gray-300 rounded"></div>
                      <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                      <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                  {products.map((product) => (
                    <Card key={product._id} className={`overflow-hidden hover:shadow-lg transition-shadow ${viewMode === 'list' ? 'flex' : ''}`}>
                      <div className={`relative bg-gray-200 ${viewMode === 'list' ? 'w-48 h-32' : 'h-48'}`}>
                        {product.images && product.images.length > 0 && product.images[0] ? (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-cover"
                            unoptimized // <-- add this if using dynamic API routes as src
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400">
                            No Image
                          </div>
                        )}
                        {product.isOrganic && (
                          <Badge className="absolute top-2 left-2 bg-green-600">
                            Organic
                          </Badge>
                        )}
                      </div>
                      
                      <CardContent className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-lg truncate">{product.name}</h3>
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-sm text-gray-600 ml-1">
                              {product.rating?.average?.toFixed(1) || '0.0'} 
                              ({product.rating?.count || 0} review{(product.rating?.count || 0) !== 1 ? 's' : ''})
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {product.description}
                        </p>
                        
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-lg font-bold text-green-600">
                            ₹{product.price}/{product.unit}
                          </div>
                          <Badge variant="outline">
                            {product.category}
                          </Badge>
                        </div>
                        
                        {product.farmer && (
                          <div className="flex items-center text-sm text-gray-500 mb-3">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span className="truncate">
                              {product.farmer.businessName || product.farmer.name}
                            </span>
                          </div>
                        )}
                        
                        <Button className="w-full" asChild>
                          <Link href={`/products/${product._id}`}>
                            View Details
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-8">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => prev - 1)}
                      >
                        Previous
                      </Button>
                      
                      {[...Array(Math.min(5, totalPages))].map((_, i) => {
                        const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i
                        if (page > totalPages) return null
                        
                        return (
                          <Button
                            key={page}
                            variant={page === currentPage ? 'default' : 'outline'}
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </Button>
                        )
                      })}
                      
                      <Button
                        variant="outline"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => prev + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your filters or search terms
                </p>
                <Button onClick={clearFilters}>Clear Filters</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}