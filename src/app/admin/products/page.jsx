"use client"

import { useEffect, useState, useMemo } from "react"
import Layout from "@/components/layout/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table"

export default function AdminProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [globalFilter, setGlobalFilter] = useState("")
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [pageIndex, setPageIndex] = useState(0)
  const [pageCount, setPageCount] = useState(1)

  useEffect(() => {
    fetchProducts()
  }, [pageIndex])

  const fetchProducts = async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/products?page=${pageIndex + 1}`)
    const data = await res.json()
    setProducts(data.products || [])
    setPageCount(data.pagination?.totalPages || 1)
    setLoading(false)
  }

  const handleApprove = async (productId) => {
    await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, isActive: true }),
    })
    fetchProducts()
  }

  const handleReject = async (productId) => {
    await fetch("/api/admin/products", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    })
    fetchProducts()
  }

  const columns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <button
            className="text-blue-600 underline"
            onClick={() => setSelectedProduct(row.original)}
          >
            {row.original.name}
          </button>
        ),
      },
      {
        accessorKey: "farmer.businessName",
        header: "Farmer",
        cell: ({ row }) =>
          row.original.farmer?.businessName || row.original.farmer?.name,
      },
      {
        accessorKey: "category",
        header: "Category",
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) =>
          row.original.isActive ? (
            <span className="text-green-600 font-semibold">Active</span>
          ) : (
            <span className="text-yellow-600 font-semibold">Pending</span>
          ),
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) =>
          new Date(row.original.createdAt).toLocaleDateString(),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex gap-2">
            {!row.original.isActive && (
              <Button size="sm" onClick={() => handleApprove(row.original._id)}>
                Approve
              </Button>
            )}
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleReject(row.original._id)}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    []
  )

  const table = useReactTable({
    data: products,
    columns,
    state: { globalFilter, pagination: { pageIndex } },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    manualPagination: true,
    pageCount,
  })

  return (
    <Layout requireAuth allowedRoles={["admin"]}>
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4">
        <h1 className="text-2xl font-bold mb-4">All Products</h1>
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <Input
            placeholder="Search products..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-xs"
          />
        </div>
        <div className="overflow-x-auto w-full rounded border bg-white">
          <table className="min-w-full text-xs sm:text-sm border">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-2 py-2 text-left font-semibold whitespace-nowrap border-r last:border-r-0"
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="text-center py-8 border-b">
                    Loading...
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="text-center py-8 border-b">
                    No products found.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 border-b">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-2 py-2 whitespace-nowrap border-r last:border-r-0">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex flex-col sm:flex-row gap-2 items-center justify-between mt-4">
          <div>
            Page {pageIndex + 1} of {pageCount}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
              disabled={pageIndex === 0}
            >
              Prev
            </Button>
            <Button
              size="sm"
              onClick={() => setPageIndex((p) => Math.min(pageCount - 1, p + 1))}
              disabled={pageIndex + 1 >= pageCount}
            >
              Next
            </Button>
          </div>
        </div>
        {/* Product Detail Modal */}
        {selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full relative">
              <button
                className="absolute top-2 right-2 text-gray-500"
                onClick={() => setSelectedProduct(null)}
              >
                ✕
              </button>
              <h2 className="text-xl font-bold mb-2">{selectedProduct.name}</h2>
              <p>
                <b>Category:</b> {selectedProduct.category}
              </p>
              <p>
                <b>Price:</b> ₹{selectedProduct.price}
              </p>
              <p>
                <b>Stock:</b> {selectedProduct.stock}
              </p>
              <p>
                <b>Unit:</b> {selectedProduct.unit}
              </p>
              <p>
                <b>Status:</b> {selectedProduct.isActive ? "Active" : "Pending"}
              </p>
              <p>
                <b>Farmer:</b>{" "}
                {selectedProduct.farmer?.businessName ||
                  selectedProduct.farmer?.name}
              </p>
              <p>
                <b>Created:</b>{" "}
                {new Date(selectedProduct.createdAt).toLocaleString()}
              </p>
              <div className="mt-4">
                <Button onClick={() => setSelectedProduct(null)}>Close</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}