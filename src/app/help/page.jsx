"use client"

import Layout from '@/components/layout/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  Users, 
  Package, 
  Truck, 
  MessageSquare, 
  Phone,
  Mail,
  ChevronRight,
  HelpCircle
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const helpCategories = [
    {
      title: 'Getting Started',
      description: 'Learn the basics of using PureHarvest',
      icon: HelpCircle,
      articles: [
        'How to create an account',
        'Setting up your profile',
        'Understanding user roles',
        'First time buyer guide'
      ],
      href: '/help/getting-started'
    },
    {
      title: 'For Farmers',
      description: 'Everything farmers need to know',
      icon: Users,
      articles: [
        'Adding your first product',
        'Managing inventory',
        'Processing orders',
        'Payment and earnings'
      ],
      href: '/help/farmers'
    },
    {
      title: 'For Buyers',
      description: 'Shopping and ordering help',
      icon: Package,
      articles: [
        'How to search for products',
        'Placing an order',
        'Payment methods',
        'Order tracking'
      ],
      href: '/help/buyers'
    },
    {
      title: 'Shipping & Delivery',
      description: 'Information about logistics',
      icon: Truck,
      articles: [
        'Delivery areas',
        'Shipping costs',
        'Delivery timeframes',
        'Handling issues'
      ],
      href: '/help/shipping'
    }
  ]

  const contactOptions = [
    {
      title: 'Live Chat',
      description: 'Chat with our support team',
      icon: MessageSquare,
      action: 'Start Chat',
      href: '/chat'
    },
    {
      title: 'Phone Support',
      description: 'Call us at +91 8000-000-000',
      icon: Phone,
      action: 'Call Now',
      href: 'tel:+918000000000'
    },
    {
      title: 'Email Support',
      description: 'Send us an email',
      icon: Mail,
      action: 'Send Email',
      href: 'mailto:support@pureharvest.com'
    }
  ]

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            How can we help you?
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Find answers to your questions and get the support you need
          </p>
          
          {/* Search */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search for help articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-lg"
              />
            </div>
          </div>
        </div>

        {/* Help Categories */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Browse Help Topics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {helpCategories.map((category) => {
              const Icon = category.icon
              return (
                <Card key={category.title} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Icon className="h-6 w-6 text-green-600 mr-3" />
                      {category.title}
                    </CardTitle>
                    <p className="text-gray-600">{category.description}</p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-4">
                      {category.articles.map((article, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-center">
                          <ChevronRight className="h-3 w-3 mr-2" />
                          {article}
                        </li>
                      ))}
                    </ul>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={category.href}>
                        View All Articles
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="text-center">
              <CardContent className="p-6">
                <Package className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Track Your Order</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Check the status of your recent orders
                </p>
                <Button asChild>
                  <Link href="/orders">View Orders</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Manage Products</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Add or update your product listings
                </p>
                <Button asChild>
                  <Link href="/farmer/products">Manage Products</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <MessageSquare className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Contact Seller</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Get in touch with product sellers
                </p>
                <Button asChild>
                  <Link href="/chat">Start Chat</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Contact Support */}
        <div className="bg-gray-50 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Still need help?
          </h2>
          <p className="text-gray-600 text-center mb-8">
            Our support team is here to help you with any questions or issues
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {contactOptions.map((option) => {
              const Icon = option.icon
              return (
                <Card key={option.title} className="text-center">
                  <CardContent className="p-6">
                    <Icon className="h-8 w-8 text-green-600 mx-auto mb-3" />
                    <h3 className="font-semibold mb-1">{option.title}</h3>
                    <p className="text-gray-600 text-sm mb-4">{option.description}</p>
                    <Button size="sm" asChild>
                      <Link href={option.href}>{option.action}</Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </Layout>
  )
}