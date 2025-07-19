"use client"
import { useEffect, useState } from "react"
import Layout from "@/components/layout/layout"
import { useRouter, useParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

export default function ProductDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) fetchProduct()
  }, [params.id])

  const fetchProduct = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/products/${params.id}`)
      const data = await response.json()
      if (data.success) setProduct(data.product)
      else router.push("/admin/products")
    } catch (error) {
      router.push("/admin/products")
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Layout><div className="p-8">Loading...</div></Layout>
  if (!product) return <Layout><div className="p-8">Product not found</div></Layout>

  return (
    <Layout requireAuth allowedRoles={["admin"]}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">{product.name}</h1>
        <div className="mb-4">
          <Badge variant={product.isActive ? "success" : "destructive"}>
            {product.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
        <div className="mb-4">
          <Image src={product.images?.[0] || "/placeholder.png"} alt={product.name} width={300} height={200} className="rounded" />
        </div>
        <div className="mb-2"><strong>Category:</strong> {product.category}</div>
        <div className="mb-2"><strong>Description:</strong> {product.description}</div>
        <div className="mb-2"><strong>Price:</strong> ₹{product.price} / {product.unit}</div>
        <div className="mb-2"><strong>Quantity:</strong> {product.quantity}</div>
        <div className="mb-2"><strong>Farmer:</strong> {product.farmer?.businessName || product.farmer?.name}</div>
        <div className="mb-2"><strong>Organic Certified:</strong> {product.organicCertified ? "Yes" : "No"}</div>
        <div className="mb-2"><strong>Harvest Date:</strong> {product.harvestDate ? new Date(product.harvestDate).toLocaleDateString() : "N/A"}</div>
        <div className="mb-2"><strong>Created At:</strong> {new Date(product.createdAt).toLocaleString()}</div>
        <div className="mb-2"><strong>Updated At:</strong> {new Date(product.updatedAt).toLocaleString()}</div>
      </div>
    </Layout>
  )
}