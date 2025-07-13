"use client"

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { 
  Home, 
  Search, 
  ShoppingCart, 
  MessageSquare,
  User,
  Package,
  BarChart3,
  Truck
} from 'lucide-react'
import useAuthStore from '@/stores/auth-store'
import useCartStore from '@/stores/cart-store'

export default function MobileBottomNav() {
  const pathname = usePathname()
  const { user, isAuthenticated } = useAuthStore()
  const { items } = useCartStore()

  const cartItemsCount = items.reduce((total, item) => total + item.quantity, 0)

  if (!isAuthenticated) {
    return null
  }

  const getNavItems = () => {
    const baseItems = [
      {
        name: 'Home',
        href: '/',
        icon: Home,
        roles: ['buyer', 'farmer', 'admin']
      },
      {
        name: 'Search',
        href: '/products',
        icon: Search,
        roles: ['buyer', 'farmer', 'admin']
      }
    ]

    if (user?.role === 'buyer') {
      return [
        ...baseItems,
        {
          name: 'Cart',
          href: '/cart',
          icon: ShoppingCart,
          badge: cartItemsCount,
          roles: ['buyer']
        },
        {
          name: 'Messages',
          href: '/chat',
          icon: MessageSquare,
          roles: ['buyer']
        },
        {
          name: 'Profile',
          href: '/buyer',
          icon: User,
          roles: ['buyer']
        },
        {
    name: 'Deliveries',
    href: '/logistics',
    icon: Truck,
    roles: ['logistics']
  }
      ]
    }

    if (user?.role === 'farmer') {
      return [
        ...baseItems,
        {
          name: 'Orders',
          href: '/farmer/orders',
          icon: Package,
          roles: ['farmer']
        },
        {
          name: 'Messages',
          href: '/chat',
          icon: MessageSquare,
          roles: ['farmer']
        },
        {
          name: 'Dashboard',
          href: '/farmer',
          icon: BarChart3,
          roles: ['farmer']
        }
      ]
    }

    if (user?.role === 'admin') {
      return [
        ...baseItems,
        {
          name: 'Orders',
          href: '/admin/orders',
          icon: Package,
          roles: ['admin']
        },
        {
          name: 'Messages',
          href: '/chat',
          icon: MessageSquare,
          roles: ['admin']
        },
        {
          name: 'Dashboard',
          href: '/admin',
          icon: BarChart3,
          roles: ['admin']
        }
      ]
    }

    return baseItems
  }

  const navItems = getNavItems().filter(item => 
    !user?.role || item.roles.includes(user.role)
  )

  const isActive = (href) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 mobile-safe-area">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`flex flex-col items-center justify-center space-y-1 transition-colors touch-target ${
              isActive(item.href)
                ? 'text-green-600 bg-green-50'
                : 'text-gray-600 hover:text-green-600'
            }`}
          >
            <div className="relative">
              <item.icon className="h-5 w-5" />
              {item.badge && item.badge > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center p-0 text-xs"
                >
                  {item.badge > 99 ? '99+' : item.badge}
                </Badge>
              )}
            </div>
            <span className="text-xs font-medium">{item.name}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}