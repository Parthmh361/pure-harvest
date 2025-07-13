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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [globalFilter, setGlobalFilter] = useState("")
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [pageIndex, setPageIndex] = useState(0)
  const [pageCount, setPageCount] = useState(1)

  useEffect(() => {
    fetchOrders()
  }, [pageIndex])

  const fetchOrders = async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/orders?page=${pageIndex + 1}`)
    const data = await res.json()
    setOrders(data.orders || [])
    setPageCount(data.pagination?.totalPages || 1)
    setLoading(false)
  }

  const handleStatusChange = async (orderId, newStatus) => {
    await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status: newStatus }),
    })
    fetchOrders()
  }

  const columns = useMemo(
    () => [
      {
        accessorKey: "orderNumber",
        header: "Order #",
        cell: ({ row }) => (
          <button
            className="text-blue-600 underline"
            onClick={() => setSelectedOrder(row.original)}
          >
            {row.original.orderNumber}
          </button>
        ),
      },
      {
        accessorKey: "buyer.name",
        header: "Buyer",
        cell: ({ row }) => row.original.buyer?.name,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <select
            value={row.original.status}
            onChange={(e) =>
              handleStatusChange(row.original._id, e.target.value)
            }
            className="border px-2 py-1 rounded"
          >
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        ),
      },
      {
        accessorKey: "totalAmount",
        header: "Total",
        cell: ({ row }) => `₹${row.original.totalAmount}`,
      },
      {
        accessorKey: "createdAt",
        header: "Date",
        cell: ({ row }) =>
          new Date(row.original.createdAt).toLocaleDateString(),
      },
    ],
    []
  )

  const table = useReactTable({
    data: orders,
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
        <h1 className="text-2xl font-bold mb-4">All Orders</h1>
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <Input
            placeholder="Search orders..."
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
                    No orders found.
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
        {/* Order Detail Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full relative">
              <button
                className="absolute top-2 right-2 text-gray-500"
                onClick={() => setSelectedOrder(null)}
              >
                ✕
              </button>
              <h2 className="text-xl font-bold mb-2">
                Order #{selectedOrder.orderNumber}
              </h2>
              <p>
                <b>Buyer:</b> {selectedOrder.buyer?.name}
              </p>
              <p>
                <b>Status:</b> {selectedOrder.status}
              </p>
              <p>
                <b>Total:</b> ₹{selectedOrder.totalAmount}
              </p>
              <p>
                <b>Date:</b>{" "}
                {new Date(selectedOrder.createdAt).toLocaleString()}
              </p>
              <div className="mt-4">
                <Button onClick={() => setSelectedOrder(null)}>Close</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}