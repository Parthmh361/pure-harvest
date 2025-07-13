"use client"

import { useEffect, useState } from "react"
import Layout from "@/components/layout/layout"
import { Bar } from "react-chartjs-2"
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js"
Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

export default function AdminReportsPage() {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReport()
  }, [])

  const fetchReport = async () => {
    setLoading(true)
    const res = await fetch("/api/admin/reports")
    const data = await res.json()
    setReport(data.report || {})
    setLoading(false)
  }

  const monthlyLabels = report?.monthlySales?.map((m) => m._id) || []
  const monthlyTotals = report?.monthlySales?.map((m) => m.total) || []

  return (
    <Layout requireAuth allowedRoles={["admin"]}>
      <div className="max-w-4xl mx-auto px-2 sm:px-4 py-4">
        <h1 className="text-2xl font-bold mb-4">Admin Reports</h1>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-white rounded shadow p-4">
                <h2 className="font-semibold">Total Sales</h2>
                <p className="text-2xl">{report.totalSales}</p>
              </div>
              <div className="bg-white rounded shadow p-4">
                <h2 className="font-semibold">Total Revenue</h2>
                <p className="text-2xl">₹{report.totalRevenue}</p>
              </div>
            </div>
            <div className="mb-8">
              <h2 className="font-semibold mb-2">Monthly Revenue</h2>
              <Bar
                data={{
                  labels: monthlyLabels,
                  datasets: [
                    {
                      label: "Revenue",
                      data: monthlyTotals,
                      backgroundColor: "rgba(34,197,94,0.7)",
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: { legend: { display: false } },
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h2 className="font-semibold mb-2">Top Products</h2>
                <ul>
                  {report.topProducts?.map((p) => (
                    <li key={p.name}>
                      {p.name} ({p.count} sold)
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="font-semibold mb-2">Top Farmers</h2>
                <ul>
                  {report.topFarmers?.map((f) => (
                    <li key={f.name}>
                      {f.name} (₹{f.revenue})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}