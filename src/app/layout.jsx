'use client'

import { Inter } from 'next/font/google'
import './globals.css'
import { useEffect } from 'react'
import useAuthStore from '@/stores/auth-store'
import useWishlistStore from '@/stores/wishlist-store'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }) {
  const { initializeAuth, isAuthenticated, user } = useAuthStore()
  const { initializeWishlist, resetWishlist } = useWishlistStore()

  useEffect(() => {
    // Initialize auth first
    initializeAuth()
  }, [])

  useEffect(() => {
    // Initialize wishlist when user logs in as buyer
    if (isAuthenticated && user?.role === 'buyer') {
      initializeWishlist()
    } else {
      // Reset wishlist when user logs out or is not a buyer
      resetWishlist()
    }
  }, [isAuthenticated, user?.role])

  useEffect(() => {
    if (!window.Razorpay) {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      document.body.appendChild(script)
    }
  }, [])

  return (
    <html lang="en">
      <body className={inter.className}>
        <Toaster richColors position="top-center" />
        {children}
      </body>
    </html>
  )
}