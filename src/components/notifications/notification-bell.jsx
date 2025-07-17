"use client"

import { useEffect, useState } from "react"
import { Bell } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function NotificationBell({ user }) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!user) return
    fetch(`/api/notifications?limit=10`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(res => res.json())
      .then(data => {
        setNotifications(data.notifications || [])
        setUnreadCount(data.notifications?.filter(n => !n.read).length || 0)
      })
  }, [user, open])

  if (!user) return null

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative">
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <Badge variant="destructive" className="absolute -top-2 -right-2">{unreadCount}</Badge>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border rounded shadow-lg z-50">
          <div className="p-4 font-bold">Notifications</div>
          <ul>
            {notifications.length === 0 ? (
              <li className="p-4 text-gray-500">No notifications</li>
            ) : (
              notifications.map(n => (
                <li key={n._id} className={`p-4 border-b ${n.read ? "text-gray-500" : "font-semibold"}`}>
                  <div>{n.title}</div>
                  <div className="text-xs">{n.message}</div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}