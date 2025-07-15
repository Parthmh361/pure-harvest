"use client"

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Menu, 
  X, 
  Home, 
  Search, 
  ShoppingCart, 
  MessageSquare, 
  User,
  Package,
  Settings,
  Bell,
  Heart,
  MapPin,
  Phone,
  Mail,
  LogOut,
  ChevronRight,
  CreditCard
} from 'lucide-react'
import useAuthStore from '@/stores/auth-store'
import useCartStore from '@/stores/cart-store'
import NotificationBell from '@/components/notifications/notification-bell'
import LogoutButton from '@/components/auth/logout-button'

const buyerSidebarLinks = [
  {
    href: '/buyer',
    icon: Package,
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
    icon: User,
    label: 'Profile',
    description: 'Manage your account'
  }
]

export default function MobileLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, logout } = useAuthStore()
  const items = useCartStore(state => state.cart)
  const cartItemCount = (items || []).reduce((total, item) => total + item.quantity, 0)
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [showBottomNav, setShowBottomNav] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [viewportSize, setViewportSize] = useState('sm')

  useEffect(() => {
    const updateViewportSize = () => {
      const width = window.innerWidth
      if (width < 480) setViewportSize('xs')
      else if (width < 640) setViewportSize('sm')
      else if (width < 768) setViewportSize('md')
      else setViewportSize('lg')
    }

    updateViewportSize()
    window.addEventListener('resize', updateViewportSize)
    return () => window.removeEventListener('resize', updateViewportSize)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Hide bottom nav when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowBottomNav(false)
      } else {
        setShowBottomNav(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchTerm.trim())}`)
      setShowSearch(false)
    }
  }

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen)
  }

  const closeDrawer = () => {
    setIsDrawerOpen(false)
  }



  const navigationItems = [
    { href: '/', icon: Home, label: 'Home', active: pathname === '/' },
    { href: '/products', icon: Search, label: 'Browse', active: pathname.startsWith('/products') },
    { href: '/cart', icon: ShoppingCart, label: 'Cart', active: pathname === '/cart', badge: cartItemCount },
    { href: '/chat', icon: MessageSquare, label: 'Chat', active: pathname === '/chat' },
    { href: '/profile', icon: User, label: 'Profile', active: pathname === '/profile' }
  ]

  // Role-specific navigation
  const roleNavigation = {
    farmer: [
      { href: '/farmer', icon: Package, label: 'Dashboard' },
      { href: '/farmer/products', icon: Package, label: 'My Products' },
      { href: '/farmer/orders', icon: Package, label: 'Orders' },
    ],
    admin: [
      { href: '/admin', icon: Settings, label: 'Admin Panel' },
      { href: '/admin/users', icon: User, label: 'Users' },
      { href: '/admin/products', icon: Package, label: 'Products' },
    ],
    buyer: [
      { href: '/buyer', icon: Package, label: 'Dashboard', description: 'Buyer dashboard' },
      { href: '/cart', icon: ShoppingCart, label: 'Shopping Cart', description: 'View cart items' },
      { href: '/orders', icon: Package, label: 'My Orders', description: 'Track your orders' },
      { href: '/wishlist', icon: Heart, label: 'Wishlist', description: 'Saved products' },
      { href: '/payment-methods', icon: CreditCard, label: 'Payment Methods', description: 'Manage payments' },
      { href: '/notifications', icon: Bell, label: 'Notifications', description: 'View all notifications' },
      { href: '/profile', icon: User, label: 'Profile', description: 'Manage your account' }
    ]
  }

  const isSmallScreen = viewportSize === 'xs'
  const isMediumScreen = ['xs', 'sm'].includes(viewportSize)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="header-responsive">
        <div className="header-content">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size={isSmallScreen ? "sm" : "sm"}
              onClick={toggleDrawer}
              className="p-2"
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <Link href="/" className="text-responsive-lg font-bold text-green-600">
              Pure Harvest
            </Link>
          </div>

          <div className="flex items-center space-x-2">
            {/* Search Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSearch(!showSearch)}
              className="p-2"
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Notifications - only on sm+ */}
            {isAuthenticated && !isSmallScreen && (
              <NotificationBell />
            )}
            
            {/* Cart */}
            <Link href="/cart" className="relative p-2">
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-xs"
                >
                  {cartItemCount > 9 ? '9+' : cartItemCount}
                </Badge>
              )}
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="border-t p-4">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                  autoFocus
                />
              </div>
            </form>
          </div>
        )}
      </header>

      {/* Mobile Navigation Drawer */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${
          isDrawerOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`} 
        onClick={closeDrawer} 
      />
      
      <aside className={`sidebar-responsive ${isDrawerOpen ? 'open' : ''}`}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-responsive-lg font-semibold">Menu</h2>
            <Button variant="ghost" size="sm" onClick={closeDrawer}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          {isAuthenticated && (
            <div className="mt-4 flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-green-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{user?.name}</p>
                <p className="text-responsive-sm text-gray-600 capitalize">{user?.role}</p>
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          {/* Main Navigation */}
          <div className="space-y-1 mb-6">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeDrawer}
                className={`flex items-center justify-between px-3 py-3 rounded-lg transition-colors ${
                  item.active 
                    ? 'bg-green-100 text-green-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <item.icon className="h-5 w-5" />
                  <span className="text-responsive-base">{item.label}</span>
                </div>
                {item.badge > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {item.badge}
                  </Badge>
                )}
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </Link>
            ))}
          </div>

          {/* Role-specific Navigation */}
          {isAuthenticated && user?.role === 'buyer' && (
            <div className="mb-6">
              <h3 className="text-responsive-sm font-medium text-gray-500 mb-3 uppercase tracking-wider px-3">
                Buyer Menu
              </h3>
              <div className="space-y-1">
                {buyerSidebarLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeDrawer}
                    className="flex items-center justify-between px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className="h-5 w-5" />
                      <span className="text-responsive-base">{item.label}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </Link>
                ))}
              </div>
            </div>
          )}
          {/* For other roles, keep your existing logic: */}
          {isAuthenticated && user?.role !== 'buyer' && user?.role && roleNavigation[user.role] && (
            <div className="mb-6">
              <h3 className="text-responsive-sm font-medium text-gray-500 mb-3 uppercase tracking-wider px-3">
                {user.role} Menu
              </h3>
              <div className="space-y-1">
                {roleNavigation[user.role].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeDrawer}
                    className="flex items-center justify-between px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className="h-5 w-5" />
                      <span className="text-responsive-base">{item.label}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Additional Links */}
          <div className="space-y-1 mb-6">
            <h3 className="text-responsive-sm font-medium text-gray-500 mb-3 uppercase tracking-wider px-3">
              Support
            </h3>
            <Link
              href="/help"
              onClick={closeDrawer}
              className="flex items-center justify-between px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5" />
                <span className="text-responsive-base">Help & Support</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </Link>
            <Link
              href="/contact"
              onClick={closeDrawer}
              className="flex items-center justify-between px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5" />
                <span className="text-responsive-base">Contact Us</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </Link>
          </div>

          {/* Auth Actions */}
          <div className="pt-4 border-t">
            {user ? (
             <LogoutButton/>
            ) : (
              <div className="space-y-3">
                <Link href="/login" onClick={closeDrawer}>
                  <Button className="w-full btn-responsive">Login</Button>
                </Link>
                <Link href="/signup" onClick={closeDrawer}>
                  <Button variant="outline" className="w-full btn-responsive">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={`pb-20 ${isMediumScreen ? 'pb-20' : 'pb-4'}`}>
        <div className="container-responsive">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className={`fixed bottom-0 left-0 right-0 bg-white border-t z-30 transition-transform duration-300 ${
        showBottomNav ? 'translate-y-0' : 'translate-y-full'
      } ${isMediumScreen ? 'block' : 'hidden'}`}>
        <div className="safe-area-bottom">
          <div className="flex justify-around items-center py-2 px-4">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-2 px-3 min-w-0 flex-1 transition-colors ${
                  item.active ? 'text-green-600' : 'text-gray-600'
                }`}
              >
                <div className="relative">
                  <item.icon className="h-5 w-5 mb-1" />
                  {item.badge > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center p-0 text-xs"
                    >
                      {item.badge > 9 ? '9+' : item.badge}
                    </Badge>
                  )}
                </div>
                <span className="text-xs font-medium truncate">
                  {isSmallScreen && item.label.length > 4 
                    ? item.label.substring(0, 4) 
                    : item.label
                  }
                </span>
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </div>
  )
}