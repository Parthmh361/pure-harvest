"use client"

import Layout from "@/components/layout/layout"

export default function AboutPage() {
  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-4">About Pure Harvest</h1>
        <p className="mb-6 text-gray-700">
          Pure Harvest is a marketplace connecting farmers and buyers for fresh, sustainable produce. Our mission is to empower local farmers and provide healthy food options to our community.
        </p>
        <h2 className="text-xl font-semibold mb-2">Our Vision</h2>
        <p className="mb-4 text-gray-700">
          To create a transparent and fair food supply chain, supporting both producers and consumers.
        </p>
        <h2 className="text-xl font-semibold mb-2">Contact</h2>
        <p className="text-gray-700">
          Email: <a href="mailto:info@pureharvest.com" className="text-green-700 underline">info@pureharvest.com</a>
        </p>
      </div>
    </Layout>
  )
}