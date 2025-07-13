"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { 
  Menu, 
  X, 
  Home, 
  Search, 
  ShoppingCart, 
  User, 
  Package, 
  MessageSquare,
  Settings,
  LogOut,
  Sprout,
  MapPin,
  Key,
  Bell,
  Shield,
  BarChart3,
  Heart,
  CreditCard,
  UserCircle
} from 'lucide-react'
import useAuthStore from '@/stores/auth-store'
import useCartStore from '@/stores/cart-store'
import NotificationBell from '@/components/notifications/notification-bell'

export default function MobileHeader() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const { items } = useCartStore()
  const [isOpen, setIsOpen] = useState(false)

  const cartItemsCount = items.reduce((total, item) => total + item.quantity, 0)

  const navigation = [
    {
      name: 'Home',
      href: '/',
      icon: Home,
      roles: ['buyer', 'farmer', 'admin']
    },
    {
      name: 'Products',
      href: '/products',
      icon: Search,
      roles: ['buyer', 'farmer', 'admin']
    },
    {
      name: 'My Orders',
      href: user?.role === 'farmer' ? '/farmer/orders' : '/orders',
      icon: Package,
      roles: ['buyer', 'farmer']
    },
    {
      name: 'Messages',
      href: '/chat',
      icon: MessageSquare,
      roles: ['buyer', 'farmer']
    },
    {
      name: 'Dashboard',
      href: user?.role === 'farmer' ? '/farmer' : user?.role === 'admin' ? '/admin' : '/buyer',
      icon: User,
      roles: ['buyer', 'farmer', 'admin']
    }
    ,{
  name: 'Deliveries',
  href: '/logistics',
  icon: Truck, // import { Truck } from 'lucide-react'
  roles: ['logistics']
}
  ]

  // Profile dropdown items (now also in sidebar)
  const profileLinks = [
    {
      name: 'Profile',
      href: '/profile',
      icon: User,
    },
    {
      name: 'Addresses',
      href: '/profile#addresses',
      icon: MapPin,
    },
    {
      name: 'Change Password',
      href: '/profile#password',
      icon: Key,
    },
    {
      name: 'Notifications',
      href: '/profile#notifications',
      icon: Bell,
    },
    {
      name: 'Security',
      href: '/profile#security',
      icon: Shield,
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
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
      // Farmer specific links
    ],
    admin: [
      // Admin specific links
    ]
  }

  const visibleNavigation = navigation.filter(item => 
    !user?.role || item.roles.includes(user.role)
  )

  const closeMenu = () => setIsOpen(false)

  return (
    <header className="lg:hidden bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Sprout className="h-8 w-8 text-green-600" />
            <span className="text-xl font-bold text-gray-900">PureHarvest</span>
          </Link>

          {/* Right side actions */}
          <div className="flex items-center space-x-3">
            {/* Search Button */}
            <Link href="/search">
              <Button variant="ghost" size="sm" className="touch-target">
                <Search className="h-5 w-5" />
              </Button>
            </Link>

            {/* Cart */}
            {user?.role === 'buyer' && (
              <Link href="/cart">
                <Button variant="ghost" size="sm" className="relative touch-target">
                  <ShoppingCart className="h-5 w-5" />
                  {cartItemsCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {cartItemsCount > 99 ? '99+' : cartItemsCount}
                    </Badge>
                  )}
                </Button>
              </Link>
            )}

            {/* Notifications */}
            {isAuthenticated && <NotificationBell />}

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="touch-target">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              
              <SheetContent side="right" className="w-80 p-0">
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="p-6 border-b">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold">Menu</h2>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={closeMenu}
                        className="touch-target"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                    
                    {/* User Info */}
                    {isAuthenticated && user && (
                      <div className="mt-4 p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <User className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <Badge variant="outline" className="text-xs capitalize">
                              {user.role}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Navigation */}
                  <div className="flex-1 py-4">
                    {isAuthenticated ? (
                      user?.role === 'buyer' ? (
                        <nav className="space-y-1 px-3">
                          {roleSpecificLinks.buyer.map(link => (
                            <Link
                              key={link.label}
                              href={link.href}
                              onClick={closeMenu}
                              className="flex items-center space-x-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors touch-target"
                            >
                              <link.icon className="h-5 w-5" />
                              <div>
                                <span className="font-medium">{link.label}</span>
                                <div className="text-xs text-gray-500">{link.description}</div>
                              </div>
                            </Link>
                          ))}
                        </nav>
                      ) : (
                        <nav className="space-y-1 px-3">
                          {/* Render farmer/admin links here as needed */}
                        </nav>
                      )
                    ) : (
                      <div className="px-6 space-y-3">
                        <Link href="/login" onClick={closeMenu}>
                          <Button className="w-full touch-target">Login</Button>
                        </Link>
                        <Link href="/register" onClick={closeMenu}>
                          <Button variant="outline" className="w-full touch-target">
                            Sign Up
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  {isAuthenticated && (
                    <div className="border-t p-4">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          logout()
                          closeMenu()
                        }}
                        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 touch-target"
                      >
                        <LogOut className="h-5 w-5 mr-3" />
                        Logout
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}