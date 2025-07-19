"use client"

import { useEffect, useState } from "react"
import Layout from "@/components/layout/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Combobox } from "@/components/ui/combobox" // Make sure you have a Combobox component or use a library
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Search, Filter, Edit, CheckCircle, XCircle, Grid3X3, List, Package } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function AdminProductsPage() {
  // Filters and state
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [allCategories, setAllCategories] = useState([])
  const [farmers, setFarmers] = useState([])
  const [selectedFarmer, setSelectedFarmer] = useState("")
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [isOrganic, setIsOrganic] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    fetchProducts()
    fetchCategories()
    fetchFarmers()
  }, [currentPage, selectedCategory, sortBy, searchQuery, isOrganic, selectedFarmer, statusFilter])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "12",
        ...(selectedCategory !== "all" && { category: selectedCategory.toLowerCase() }),
        ...(selectedFarmer && { farmer: selectedFarmer }),
        ...(searchQuery && { search: searchQuery }),
        sortBy,
        ...(isOrganic && { isOrganic: "true" }),
        ...(statusFilter !== "all" && { status: statusFilter })
      })
      const response = await fetch(`/api/admin/products?${params}`)
      const data = await response.json()
      setProducts(data.products || [])
      setTotalPages(data.pagination?.totalPages || 1)
      setTotalItems(data.pagination?.totalItems || 0)
    } catch (error) {
      console.error("Failed to fetch products:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/products/categories/admin")
      const data = await response.json()
      setAllCategories(data.allCategories || [])
    } catch (error) {
      console.error("Failed to fetch categories:", error)
    }
  }

  const fetchFarmers = async () => {
    try {
      const response = await fetch("/api/admin/users?role=farmer")
      const data = await response.json()
      setFarmers(data.users || [])
    } catch (error) {
      console.error("Failed to fetch farmers:", error)
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
    setSearchQuery("")
    setSelectedCategory("all")
    setSortBy("newest")
    setIsOrganic(false)
    setSelectedFarmer("")
    setStatusFilter("all")
    setCurrentPage(1)
  }

  const handleActivate = async (productId, active) => {
    await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, isActive: active }),
    })
    fetchProducts()
  }

  return (
    <Layout requireAuth allowedRoles={["admin"]}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Manage Products</h1>
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
                  <SelectItem value="name">Name A-Z</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex border rounded-lg">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {products.length} of {totalItems} products
            </span>
            {(selectedCategory !== "all" || searchQuery || isOrganic) && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        </div>
        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <div className={`w-64 space-y-6 ${showFilters ? "block" : "hidden sm:block"}`}>
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4">Categories</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setSelectedCategory("all")
                      setCurrentPage(1)
                    }}
                    className={`block w-full text-left px-2 py-1 rounded ${
                      selectedCategory === "all" ? "bg-green-100 text-green-700" : "hover:bg-gray-100"
                    }`}
                  >
                    All Categories
                  </button>
                  {allCategories.map((category) => (
                    <button
                      key={category.name}
                      onClick={() => {
                        setSelectedCategory(category.name) // use original name!
                        setCurrentPage(1)
                      }}
                      className={`block w-full text-left px-2 py-1 rounded ${
                        selectedCategory === category.name
                          ? "bg-green-100 text-green-700"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex items-center">
                          <span className="mr-2">{category.icon}</span>
                          {category.name}
                        </span>
                        <span className="text-xs text-gray-500">{category.count}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4">Farmer</h3>
                <Combobox
                  options={farmers.map(farmer => ({
                    value: farmer._id,
                    label: farmer.businessName || farmer.name
                  }))}
                  value={selectedFarmer}
                  onChange={setSelectedFarmer}
                  placeholder="Select Farmer"
                  clearable
                />
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
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4">Status</h3>
                <Select value={statusFilter} onValueChange={value => { setStatusFilter(value); setCurrentPage(1); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>
          {/* Products Grid/List */}
          <div className="flex-1">
            {loading ? (
              <div className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
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
                <div className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
                  {products.map((product) => (
                    <Card key={product._id} className={`overflow-hidden hover:shadow-lg transition-shadow ${viewMode === "list" ? "flex" : ""}`}>
                      <div className={`relative bg-gray-200 ${viewMode === "list" ? "w-48 h-32" : "h-48"}`}>
                        {product.images && product.images.length > 0 && product.images[0] ? (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-cover"
                            unoptimized
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
                        {!product.isActive && (
                          <Badge className="absolute top-2 right-2 bg-yellow-600">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <CardContent className={`p-4 ${viewMode === "list" ? "flex-1" : ""}`}>
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-lg truncate">{product.name}</h3>
                          <div className="flex items-center space-x-1">
                            <span className="text-sm text-gray-600 ml-1">
                              {product.farmer?.businessName || product.farmer?.name}
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
                            {(() => {
                           
                              return  product.category;
                            })()}
                          </Badge>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 mb-3">
                          Stock: {product.quantity} {product.unit}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" asChild>
                            <Link href={`/admin/products/${product._id}/edit`}>
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Link>
                          </Button>
                          {product.isActive ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleActivate(product._id, false)}
                            >
                              <XCircle className="h-4 w-4 text-red-600 mr-1" />
                              Deactivate
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleActivate(product._id, true)}
                            >
                              <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                              Activate
                            </Button>
                          )}
                        </div>
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
                            variant={page === currentPage ? "default" : "outline"}
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