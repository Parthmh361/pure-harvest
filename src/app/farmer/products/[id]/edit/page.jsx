"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import Layout from '@/components/layout/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Upload, 
  X, 
  Package, 
  IndianRupee,
  Scale,
  Camera,
  Save,
  ArrowLeft,
  Loader2
} from 'lucide-react'
import useAuthStore from '@/stores/auth-store'
import { PRODUCT_CATEGORIES, PRODUCT_UNITS } from '@/lib/utils'
import Image from 'next/image'

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const { user, isAuthenticated } = useAuthStore()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: 0,
    unit: 'kg',
    quantity: '',
    minimumOrder: '1',
    organicCertified: false,
    harvestDate: '',
    shelfLife: '',
    storageInstructions: '',
    images: [],
    isActive: true
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (user && user.role !== 'farmer') {
      router.push('/')
      return
    }

    if (params.id) {
      fetchProduct()
    }
  }, [isAuthenticated, user, router, params.id])

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        const product = data.product
        
        // Check if user owns this product
        if (product.farmer._id !== user.id) {
          alert('You can only edit your own products')
          router.push('/farmer/products')
          return
        }

        setFormData({
          name: product.name || '',
          description: product.description || '',
          category: product.category || '',
          price: product.price?.toString() || '',
          unit: product.unit || 'kg',
          quantity: product.quantity?.toString() || '',
          minimumOrder: product.minimumOrder?.toString() || '1',
          organicCertified: product.organicCertified || false,
          harvestDate: product.harvestDate ? product.harvestDate.split('T')[0] : '',
          shelfLife: product.shelfLife?.toString() || '',
          storageInstructions: product.storageInstructions || '',
          images: product.images || [],
          isActive: product.isActive
        })
      } else {
        alert(data.error || 'Failed to fetch product')
        router.push('/farmer/products')
      }
    } catch (error) {
      console.error('Product fetch error:', error)
      alert('Failed to fetch product')
      router.push('/farmer/products')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    // Validate files
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file`)
        return false
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert(`${file.name} is too large. Max size is 5MB`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    // Check total images limit
    if (formData.images.length + validFiles.length > 5) {
      alert('Maximum 5 images allowed per product')
      return
    }

    setImageUploading(true)
    
    try {
      const uploadPromises = validFiles.map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', 'products')

        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        })

        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || 'Upload failed')
        }
        
        return data.url
      })

      const uploadedUrls = await Promise.all(uploadPromises)
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }))
      
    } catch (error) {
      console.error('Image upload error:', error)
      alert('Failed to upload images. Please try again.')
    } finally {
      setImageUploading(false)
    }
  }

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) newErrors.name = 'Product name is required'
    if (!formData.description.trim()) newErrors.description = 'Description is required'
    if (!formData.category) newErrors.category = 'Category is required'
    // Only require price for admin
    if (user?.role === 'admin') {
      if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = 'Valid price is required'
    }
    if (!formData.quantity || parseInt(formData.quantity) < 0) newErrors.quantity = 'Valid quantity is required'
    if (!formData.minimumOrder || parseInt(formData.minimumOrder) <= 0) newErrors.minimumOrder = 'Valid minimum order is required'
    if (formData.images.length === 0) newErrors.images = 'At least one product image is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      alert('Please fix all errors before submitting')
      return
    }

    setSaving(true)
    try {
      const productData = {
        ...formData,
        price: user?.role === 'admin' ? parseFloat(formData.price) : 0, // Set price to 0 for farmers
        quantity: parseInt(formData.quantity),
        minimumOrder: parseInt(formData.minimumOrder),
        shelfLife: formData.shelfLife ? parseInt(formData.shelfLife) : null
      }

      const response = await fetch(`/api/products/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(productData)
      })

      const data = await response.json()

      if (response.ok) {
        alert('Product updated successfully!')
        router.push('/farmer/products')
      } else {
        alert(data.error || 'Failed to update product')
      }
    } catch (error) {
      console.error('Product update error:', error)
      alert('Failed to update product. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!isAuthenticated || (user && user.role !== 'farmer')) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-6">Only farmers can edit products.</p>
            <Button onClick={() => router.push('/login')}>
              Login as Farmer
            </Button>
          </div>
        </div>
      </Layout>
    )
  }

  if (loading) {
    return (
      <Layout requireAuth allowedRoles={['farmer']}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading product...</span>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout requireAuth allowedRoles={['farmer']}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/farmer/products')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
            <p className="text-gray-600">Update your product details</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Product Status */}
          <Card>
            <CardHeader>
              <CardTitle>Product Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                />
                <Label htmlFor="isActive">Product is active and visible to buyers</Label>
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Fresh Organic Tomatoes"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                  <Label htmlFor="category">Category *</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.category ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Category</option>
                    {(PRODUCT_CATEGORIES || []).map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your product, growing methods, quality, etc..."
                  rows={4}
                  className={errors.description ? 'border-red-500' : ''}
                />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Quantity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <IndianRupee className="h-5 w-5 mr-2" />
                Pricing & Quantity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Show price input only for admin */}
                {user?.role === 'admin' && (
                  <div>
                    <Label htmlFor="price">Price per Unit *</Label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', e.target.value)}
                        placeholder="0.00"
                        className={`pl-10 ${errors.price ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
                  </div>
                )}

                <div>
                  <Label htmlFor="unit">Unit *</Label>
                  <select
                    id="unit"
                    value={formData.unit}
                    onChange={(e) => handleInputChange('unit', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {PRODUCT_UNITS.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="quantity">Available Quantity *</Label>
                  <div className="relative">
                    <Scale className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      value={formData.quantity}
                      onChange={(e) => handleInputChange('quantity', e.target.value)}
                      placeholder="0"
                      className={`pl-10 ${errors.quantity ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="minimumOrder">Minimum Order Quantity *</Label>
                  <Input
                    id="minimumOrder"
                    type="number"
                    min="1"
                    value={formData.minimumOrder}
                    onChange={(e) => handleInputChange('minimumOrder', e.target.value)}
                    className={errors.minimumOrder ? 'border-red-500' : ''}
                  />
                  {errors.minimumOrder && <p className="text-red-500 text-sm mt-1">{errors.minimumOrder}</p>}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="organicCertified"
                    checked={formData.organicCertified}
                    onChange={(e) => handleInputChange('organicCertified', e.target.checked)}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <Label htmlFor="organicCertified">Organic Certified</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Details */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="harvestDate">Harvest Date</Label>
                  <Input
                    id="harvestDate"
                    type="date"
                    value={formData.harvestDate}
                    onChange={(e) => handleInputChange('harvestDate', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="shelfLife">Shelf Life (days)</Label>
                  <Input
                    id="shelfLife"
                    type="number"
                    min="1"
                    value={formData.shelfLife}
                    onChange={(e) => handleInputChange('shelfLife', e.target.value)}
                    placeholder="e.g., 7"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="storageInstructions">Storage Instructions</Label>
                <Textarea
                  id="storageInstructions"
                  value={formData.storageInstructions}
                  onChange={(e) => handleInputChange('storageInstructions', e.target.value)}
                  placeholder="How should this product be stored? e.g., Keep refrigerated, store in cool dry place..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Product Images */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Camera className="h-5 w-5 mr-2" />
                Product Images *
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <div className="flex text-sm text-gray-600 justify-center">
                    <label
                      htmlFor="images"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500"
                    >
                      <span>Upload more images</span>
                      <input
                        id="images"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={imageUploading}
                        className="sr-only"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB each (max 5 images)</p>
                </div>
              </div>

              {errors.images && <p className="text-red-500 text-sm">{errors.images}</p>}

              {/* Image Preview */}
              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {formData.images.map((url, index) => (
                    <div key={index} className="relative group">
                      <Image
                        src={url}
                        alt={`Product ${index + 1}`}
                        width={200}
                        height={200}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      {index === 0 && (
                        <span className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                          Main
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {imageUploading && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                  <p className="text-sm text-gray-600 mt-2">Uploading images...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/farmer/products')}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || imageUploading}
              className="min-w-[120px]"
            >
              {saving ? (
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </div>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Product
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  )
}