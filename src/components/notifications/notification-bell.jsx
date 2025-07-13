"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Bell, 
  X, 
  Check,
  Package,
  ShoppingCart,
  Star,
  AlertCircle,
  User,
  MoreHorizontal
} from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import Link from 'next/link'

export default function NotificationBell({ user }) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState(null)

  // Debug logs
  useEffect(() => {
    console.log('NotificationBell mounted with user:', user)
    console.log('Open state:', open)
  }, [user, open])

  useEffect(() => {
    if (user) {
      console.log('User detected, fetching notifications...')
      fetchNotifications()
      
      const interval = setInterval(fetchNotifications, 30000)
      return () => clearInterval(interval)
    } else {
      console.log('No user, skipping notification fetch')
    }
  }, [user])

  const fetchNotifications = async () => {
    if (!user) {
      console.log('No user available for fetching notifications')
      return
    }
    
    try {
      setError(null)
      setLoading(true)
      console.log('Fetching notifications...')
      
      const response = await fetch('/api/notifications?limit=10', {
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') && {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          })
        },
        credentials: 'include'
      })

      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)

      if (response.ok) {
        const data = await response.json()
        console.log('📬 Notifications fetched successfully:', data)
        
        if (data.success) {
          setNotifications(data.notifications || [])
          setUnreadCount(data.unreadCount || 0)
          console.log('Set notifications:', data.notifications?.length || 0)
          console.log('Set unread count:', data.unreadCount || 0)
        } else {
          throw new Error(data.error || 'Failed to fetch notifications')
        }
      } else {
        const errorData = await response.json()
        console.error('Failed to fetch notifications:', errorData)
        setError(errorData.error || 'Failed to load notifications')
      }
    } catch (error) {
      console.error('Notification fetch error:', error)
      setError('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId) => {
    if (!user) return
    
    try {
      console.log('Marking notification as read:', notificationId)
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') && {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          })
        },
        credentials: 'include',
        body: JSON.stringify({ notificationId })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setNotifications(prev => 
            prev.map(notif => 
              notif._id === notificationId 
                ? { ...notif, read: true, readAt: new Date() }
                : notif
            )
          )
          setUnreadCount(prev => Math.max(0, prev - 1))
          console.log('Notification marked as read successfully')
        }
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    if (!user) return
    
    try {
      console.log('Marking all notifications as read')
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') && {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          })
        },
        credentials: 'include',
        body: JSON.stringify({ markAllAsRead: true })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setNotifications(prev => 
            prev.map(notif => ({ ...notif, read: true, readAt: new Date() }))
          )
          setUnreadCount(0)
          console.log('All notifications marked as read')
        }
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order':
        return <ShoppingCart className="h-4 w-4 text-blue-600" />
      case 'product':
        return <Package className="h-4 w-4 text-green-600" />
      case 'payment':
        return <Star className="h-4 w-4 text-yellow-600" />
      case 'system':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'success':
        return <Check className="h-4 w-4 text-green-600" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Bell className="h-4 w-4 text-gray-600" />
    }
  }

  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`
    
    return date.toLocaleDateString()
  }

  const handleNotificationClick = (notification) => {
    console.log('Notification clicked:', notification)
    if (!notification.read) {
      markAsRead(notification._id)
    }
    
    setOpen(false)
    
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl
    }
  }

  const handleBellClick = () => {
    console.log('Bell clicked, current open state:', open)
    setOpen(!open)
    console.log('New open state:', !open)
  }

  // Don't render if user is not logged in
  if (!user) {
    console.log('Not rendering NotificationBell - no user')
    return null
  }

  console.log('Rendering NotificationBell with:', {
    user: user.name,
    unreadCount,
    notificationsCount: notifications.length,
    open,
    loading,
    error
  })

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative"
          onClick={handleBellClick}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Mark all read
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {loading && (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading notifications...</p>
              </div>
            )}
            
            {error && !loading && (
              <div className="p-4 text-center text-red-600">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchNotifications}
                  className="mt-2"
                >
                  Retry
                </Button>
              </div>
            )}
            
            {!error && !loading && notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No notifications yet</p>
                <p className="text-xs text-gray-400 mt-1">We'll let you know when something happens</p>
              </div>
            ) : (
              !loading && (
                <ScrollArea className="h-96">
                  <div className="space-y-1">
                    {notifications.map((notification) => (
                      <div
                        key={notification._id}
                        className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                          !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className={`text-sm font-medium truncate ${
                                !notification.read ? 'text-gray-900' : 'text-gray-700'
                              }`}>
                                {notification.title}
                              </h4>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatRelativeTime(notification.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )
            )}
            
            {!error && !loading && notifications.length > 0 && (
              <div className="p-3 border-t bg-gray-50">
                <Link href="/notifications">
                  <Button variant="ghost" className="w-full text-sm" onClick={() => setOpen(false)}>
                    View All Notifications
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  )
}