"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from './header'
import Footer from './footer'
import MobileLayout from './mobile-layout'
import useAuthStore from '@/stores/auth-store'

export default function Layout({ 
  children, 
  requireAuth = false, 
  allowedRoles = [], 
  showHeader = true, 
  showFooter = true 
}) {
  const router = useRouter()
  const { user, isAuthenticated, loading } = useAuthStore()
  
  const [viewportSize, setViewportSize] = useState('lg') // Default to desktop
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    const updateViewportSize = () => {
      const width = window.innerWidth
      
      if (width < 480) {
        setViewportSize('xs')
      } else if (width < 640) {
        setViewportSize('sm')
      } else if (width < 768) {
        setViewportSize('md')
      } else if (width < 1024) {
        setViewportSize('lg')
      } else {
        setViewportSize('xl')
      }
    }

    updateViewportSize()
    window.addEventListener('resize', updateViewportSize)
    return () => window.removeEventListener('resize', updateViewportSize)
  }, [])

  // Auth checks
  useEffect(() => {
    if (!mounted || loading) return

    if (requireAuth && !isAuthenticated) {
      router.push('/login')
      return
    }

    if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
      router.push('/unauthorized')
      return
    }
  }, [requireAuth, isAuthenticated, allowedRoles, user, router, mounted, loading])

  // Loading state
  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Use mobile layout for small screens
  if (viewportSize === 'xs' || viewportSize === 'sm' || viewportSize === 'md') {
    return <MobileLayout>{children}</MobileLayout>
  }

  // Desktop layout for large screens
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {showHeader && <Header />}
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6">
          {children}
        </div>
      </main>
      
      {showFooter && <Footer />}
    </div>
  )
}