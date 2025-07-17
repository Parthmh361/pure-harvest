"use client"

import Layout from "@/components/layout/layout"

export default function ContactPage() {
  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-4">Contact Us</h1>
        <p className="mb-6 text-gray-700">
          For any inquiries, feedback, or support, please reach out to us using the form below or email us at <a href="mailto:support@pureharvest.com" className="text-green-700 underline">support@pureharvest.com</a>.
        </p>
        <form className="space-y-4">
          <input type="text" placeholder="Your Name" className="w-full border rounded px-3 py-2" />
          <input type="email" placeholder="Your Email" className="w-full border rounded px-3 py-2" />
          <textarea placeholder="Your Message" rows={5} className="w-full border rounded px-3 py-2" />
          <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded">Send Message</button>
        </form>
      </div>
    </Layout>
  )
}