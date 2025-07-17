"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Menu, 
  X, 
  User, 
  ShoppingCart, 
  Search,
  Settings,
  Package,
  Heart,
  CreditCard,
  Bell,
  LogOut,
  UserCircle,
  Store,
  BarChart3,
  PlusCircle
} from 'lucide-react'
import NotificationBell from '@/components/notifications/notification-bell-simple'
import LogoutButton from '../auth/logout-button'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [cartCount, setCartCount] = useState(0)
  const router = useRouter()

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        setUser(JSON.parse(userData))
      } catch (error) {
        console.error('Error parsing user data:', error)
        localStorage.removeItem('user')
      }
    }

    // Get cart count
    const cartData = localStorage.getItem('cart')
    if (cartData) {
      try {
        const cart = JSON.parse(cartData)
        const count = cart.reduce((total, item) => total + (item.quantity || 0), 0)
        setCartCount(count)
      } catch (error) {
        console.error('Error parsing cart data:', error)
      }
    }
  }, [])



  // Role-based navigation items
  const getRoleBasedLinks = () => {
    if (!user) return []

    const commonLinks = [
      {
        href: '/profile',
        icon: UserCircle,
        label: 'Profile',
        description: 'Manage your account'
      },
      {
        href: '/orders',
        icon: Package,
        label: 'My Orders',
        description: 'Track your orders'
      },
      {
        href: '/notifications',
        icon: Bell,
        label: 'Notifications',
        description: 'View all notifications'
      }
    ]

    const roleSpecificLinks = {
      buyer: [
        {
          href: '/buyer',
          icon: BarChart3,
          label: 'Dashboard',
          description: 'Buyer dashboard'
        },
        {
          href: '/cart',
          icon: ShoppingCart,
          label: 'Shopping Cart',
          description: 'View cart items'
        },
        {
          href: '/orders',
          icon: Package,
          label: 'My Orders',
          description: 'Track your orders'
        },
        {
          href: '/wishlist',
          icon: Heart,
          label: 'Wishlist',
          description: 'Saved products'
        },
        {
          href: '/payment-methods',
          icon: CreditCard,
          label: 'Payment Methods',
          description: 'Manage payments'
        },
        {
          href: '/notifications',
          icon: Bell,
          label: 'Notifications',
          description: 'View all notifications'
        },
        {
          href: '/profile',
          icon: UserCircle,
          label: 'Profile',
          description: 'Manage your account'
        }
      ],
      farmer: [
        {
          href: '/farmer',
          icon: BarChart3,
          label: 'Dashboard',
          description: 'Farmer dashboard'
        },
        {
          href: '/farmer/products',
          icon: Package,
          label: 'My Products',
          description: 'Manage your products'
        },
        {
          href: '/farmer/products/add',
          icon: PlusCircle,
          label: 'Add Product',
          description: 'List new product'
        },
        {
          href: '/farmer/analytics',
          icon: BarChart3,
          label: 'Analytics',
          description: 'Sales analytics'
        },
        {
          href: '/farmer/orders',
          icon: Package,
          label: 'Orders Received',
          description: 'Manage orders'
        }
      ],
      admin: [
        {
          href: '/admin',
          icon: Settings,
          label: 'Admin Panel',
          description: 'System management'
        },
        {
          href: '/admin/users',
          icon: User,
          label: 'Users',
          description: 'Manage users'
        },
        {
          href: '/admin/products',
          icon: Package,
          label: 'All Products',
          description: 'Manage products'
        },
        {
          href: '/admin/orders',
          icon: ShoppingCart,
          label: 'All Orders',
          description: 'Manage orders'
        },
        {
          href: '/admin/analytics',
          icon: BarChart3,
          label: 'Analytics',
          description: 'System analytics'
        }
      ]
    }

    return [
      ...(roleSpecificLinks[user.role] || []),
      ...commonLinks
    ]
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">PH</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Pure Harvest</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/products" className="text-gray-700 hover:text-green-600 transition-colors">
              Products
            </Link>
            {/* <Link href="/farmers" className="text-gray-700 hover:text-green-600 transition-colors">
              Farmers
            </Link> */}
            <Link href="/about" className="text-gray-700 hover:text-green-600 transition-colors">
              About
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-green-600 transition-colors">
              Contact
            </Link>
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors">
              <Search className="w-5 h-5" />
            </button>

            {/* Cart (only for buyers) */}
            {user?.role === 'buyer' && (
              <Link
                href="/cart"
                className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
            )}

            {/* Notifications */}
            <NotificationBell user={user} />

            {/* User Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center space-x-2 p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-700 font-medium text-sm">
                      {user.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="hidden sm:block text-sm font-medium">{user.name}</span>
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-700 font-medium">
                            {user.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                          <span className="inline-block mt-1 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full capitalize">
                            {user.role}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Navigation Links */}
                    <div className="py-2">
                      {getRoleBasedLinks().map((link) => {
                        const IconComponent = link.icon
                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <IconComponent className="h-4 w-4 mr-3 text-gray-400" />
                            <div className="flex-1">
                              <div className="font-medium">{link.label}</div>
                              <div className="text-xs text-gray-500">{link.description}</div>
                            </div>
                          </Link>
                        )
                      })}
                    </div>

                    {/* Settings & Logout */}
                    <div className="border-t border-gray-100 py-2">
                      {/* <Link
                        href="/settings"
                        className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4 mr-3 text-gray-400" />
                        <div className="flex-1">
                          <div className="font-medium">Settings</div>
                          <div className="text-xs text-gray-500">Account preferences</div>
                        </div>
                      </Link> */}
                      
                      <LogoutButton/>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-green-600 font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-800"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="space-y-2">
              {/* Main navigation */}
              <Link
                href="/products"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                Products
              </Link>
              {/* <Link
                href="/farmers"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                Farmers
              </Link> */}
              <Link
                href="/about"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <Link
                href="/contact"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
              {/* Role-based links (profile, dashboard, etc.) */}
              {user && (
                <div className="mt-4 border-t pt-2">
                  {getRoleBasedLinks().map((link) => {
                    const IconComponent = link.icon
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <IconComponent className="h-4 w-4 mr-3 text-gray-400" />
                        <span>{link.label}</span>
                      </Link>
                    )
                  })}
                  {/* Settings */}
                  {/* <Link
                    href="/settings"
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Settings className="h-4 w-4 mr-3 text-gray-400" />
                    <span>Settings</span>
                  </Link> */}
                  {/* Logout */}
                 <LogoutButton/>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header