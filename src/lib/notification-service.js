import connectDB from './mongodb'
import Notification from '@/models/notification'
import User from '@/models/user'

class NotificationService {
  // Create and send notification
  static async create({
    recipientId,
    type,
    title,
    message,
    data = {},
    channels = { inApp: true, email: false, sms: false },
    actionUrl = null
  }) {
    try {
      await connectDB()

      if (!message || message.trim() === '') {
        throw new Error('Message is required for notification')
      }

      const recipient = await User.findById(recipientId)
      if (!recipient) {
        throw new Error('Recipient not found')
      }

      // DEBUG: Log notification payload
      console.log('🔔 Creating notification with:', {
        user: recipientId,
        type,
        title,
        message,
        data,
        channels,
        actionUrl
      })

      // Actually create the notification
      const notification = new Notification({
        user: recipientId, // <-- must match your schema!
        type,
        title,
        message,
        data,
        channels,
        actionUrl
      })
      await notification.save()
      return notification
    } catch (error) {
      console.error('❌ Notification creation error:', error)
      throw error
    }
  }

  // Apply user preferences to channels
  static applyUserPreferences(user, channels) {
    const preferences = user.notificationPreferences || {}
    
    return {
      inApp: channels.inApp && (preferences.inApp !== false),
      email: channels.email && (preferences.email === true),
      sms: channels.sms && (preferences.sms === true)
    }
  }

  // Send in-app notification
  static async sendInApp(notification) {
    try {
      notification.status = 'sent'
      notification.sentAt = new Date()
      await notification.save()

      // Emit real-time notification via WebSocket (if implemented)
      // this.emitRealTime(notification)

      return true
    } catch (error) {
      console.error('In-app notification error:', error)
      return false
    }
  }

  // Send email notification
  static async sendEmail(notification, recipient) {
    try {
      // Email service implementation
      const emailContent = this.generateEmailContent(notification)
      
      // Replace with your email service (Nodemailer, SendGrid, etc.)


      return true
    } catch (error) {
      console.error('Email notification error:', error)
      return false
    }
  }

  // Send SMS notification
  static async sendSMS(notification, recipient) {
    try {
      if (!recipient.phone) return false

      // SMS service implementation
      const smsContent = this.generateSMSContent(notification)
      
      // Replace with your SMS service (Twilio, AWS SNS, etc.)


      return true
    } catch (error) {
      console.error('SMS notification error:', error)
      return false
    }
  }

  // Generate email content based on notification type
  static generateEmailContent(notification) {
    const templates = {
      order_placed: {
        subject: `Order Confirmation - ${notification.data.orderId}`,
        html: `

          <p>${notification.message}</p>
          <p>Order ID: ${notification.data.orderId}</p>
          <p>Amount: ₹${notification.data.amount}</p>
        `
      },
      order_delivered: {
        subject: `Order Delivered - ${notification.data.orderId}`,
        html: `

          <p>${notification.message}</p>
          <p>Please rate your experience and help other customers.</p>
        `
      },
      // Add more templates as needed
    }

    return templates[notification.type] || {
      subject: notification.title,
      html: `<p>${notification.message}</p>`
    }
  }

  // Generate SMS content
  static generateSMSContent(notification) {
    return `${notification.title}: ${notification.message}`
  }

  // Bulk notification methods
  static async notifyOrderUpdate(orderId, status, recipientId) {
    const titles = {
      confirmed: 'Order Confirmed',
      processing: 'Order Processing', 
      shipped: 'Order Shipped',
      delivered: 'Order Delivered',
      cancelled: 'Order Cancelled'
    }

    const messages = {
      confirmed: 'Your order has been confirmed and is being prepared.',
      processing: 'Your order is being processed and will be shipped soon.',
      shipped: 'Your order has been shipped and is on its way.',
      delivered: 'Your order has been delivered successfully!',
      cancelled: 'Your order has been cancelled.'
    }

    return await this.create({
      recipientId,
      type: `order_${status}`,
      title: titles[status],
      message: messages[status],
      data: { orderId },
      channels: { inApp: true, email: true, sms: status === 'delivered' }
    })
  }

  static async notifyLowStock(productId, farmerId, currentStock) {
    return await this.create({
      recipientId: farmerId,
      type: 'low_stock',
      title: 'Low Stock Alert',
      message: `Your product is running low on stock (${currentStock} remaining).`,
      data: { productId, currentStock },
      channels: { inApp: true, email: true }
    })
  }

  static async notifyNewReview(productId, farmerId, rating) {
    return await this.create({
      recipientId: farmerId,
      type: 'review_received',
      title: 'New Product Review',
      message: `You received a ${rating}-star review on your product.`,
      data: { productId, rating },
      channels: { inApp: true, email: false }
    })
  }

  // Mark notifications as read
  static async markAsRead(notificationIds, userId) {
    try {
      await connectDB()

      await Notification.updateMany(
        {
          _id: { $in: notificationIds },
          user: userId, // <-- fix here
          isRead: false
        },
        {
          isRead: true,
          readAt: new Date()
        }
      )

      return true
    } catch (error) {
      console.error('Mark as read error:', error)
      return false
    }
  }

  // Get user notifications with pagination
  static async getUserNotifications(userId, { page = 1, limit = 20, unreadOnly = false } = {}) {
    try {
      await connectDB()

      const filter = { user: userId } // <-- fix here
      if (unreadOnly) {
        filter.isRead = false
      }

      const skip = (page - 1) * limit

      const [notifications, total, unreadCount] = await Promise.all([
        Notification.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Notification.countDocuments(filter),
        Notification.countDocuments({ user: userId, isRead: false }) // <-- fix here
      ])

      return {
        notifications,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          total,
          hasMore: skip + notifications.length < total
        },
        unreadCount
      }
    } catch (error) {
      console.error('Get notifications error:', error)
      throw error
    }
  }

  static async createOrderNotification(order, type = 'new_order') {
    try {
      console.log('📧 Creating order notifications for:', order.orderNumber)

      const messages = {
        new_order: `New order #${order.orderNumber} placed for ₹${order.totalAmount}`,
        order_confirmed: `Order #${order.orderNumber} has been confirmed`,
        order_processing: `Order #${order.orderNumber} is being processed`,
        order_shipped: `Order #${order.orderNumber} has been shipped`,
        order_delivered: `Order #${order.orderNumber} has been delivered`,
        order_cancelled: `Order #${order.orderNumber} has been cancelled`
      }

      const titles = {
        new_order: '🛒 New Order Received',
        order_confirmed: '✅ Order Confirmed',
        order_processing: '⚙️ Order Processing',
        order_shipped: '🚚 Order Shipped',
        order_delivered: '📦 Order Delivered',
        order_cancelled: '❌ Order Cancelled'
      }

      const notifications = []

      // Create notification for buyer
      if (order.buyer) {
        const buyerNotification = await this.create({
          userId: order.buyer._id || order.buyer,
          title: titles[type] || 'Order Update',
          message: messages[type] || `Order #${order.orderNumber} has been updated`,
          type: 'order',
          data: { 
            orderId: order._id.toString(),
            orderNumber: order.orderNumber,
            status: order.status,
            totalAmount: order.totalAmount,
            orderType: 'buyer'
          },
          actionUrl: `/orders/${order._id}`
        })
        notifications.push(buyerNotification)
        console.log('✅ Buyer notification created')
      }

      // Create notifications for farmers
      if (order.items && order.items.length > 0) {
        for (const item of order.items) {
          if (item.farmer) {
            const farmerId = item.farmer._id || item.farmer
            const farmerNotification = await this.create({
              userId: farmerId,
              title: titles[type] || 'Order Update',
              message: `${messages[type]} - ${item.productName} (Qty: ${item.quantity})`,
              type: 'order',
              data: { 
                orderId: order._id.toString(),
                orderNumber: order.orderNumber,
                productId: item.product?.toString(),
                productName: item.productName,
                quantity: item.quantity,
                status: order.status,
                orderType: 'farmer'
              },
              actionUrl: `/farmer/orders/${order._id}`
            })
            notifications.push(farmerNotification)
            console.log('✅ Farmer notification created for:', farmerId)
          }
        }
      }

      console.log('✅ All order notifications created:', notifications.length)
      return notifications
    } catch (error) {
      console.error('❌ Order notification creation error:', error)
      throw error
    }
  }

  static async createProductNotification(product, type = 'product_created') {
    try {
      const messages = {
        product_created: `New product "${product.name}" has been listed`,
        product_updated: `Product "${product.name}" has been updated`,
        product_deleted: `Product "${product.name}" has been removed`,
        low_stock: `Product "${product.name}" is running low on stock (${product.stock} left)`,
        out_of_stock: `Product "${product.name}" is out of stock`
      }

      const titles = {
        product_created: '🆕 New Product Listed',
        product_updated: '📝 Product Updated',
        product_deleted: '🗑️ Product Removed',
        low_stock: '⚠️ Low Stock Alert',
        out_of_stock: '❌ Out of Stock'
      }

      // Notify the farmer who owns the product
      if (product.farmer) {
        const farmerId = product.farmer._id || product.farmer
        await this.create({
          userId: farmerId,
          title: titles[type] || 'Product Update',
          message: messages[type] || `Product "${product.name}" has been updated`,
          type: 'product',
          data: { 
            productId: product._id.toString(),
            productName: product.name,
            productType: type,
            stock: product.stock,
            price: product.price
          },
          actionUrl: `/farmer/products/${product._id}`
        })
        console.log('✅ Product notification created for farmer:', farmerId)
      }

      return true
    } catch (error) {
      console.error('❌ Product notification creation error:', error)
      throw error
    }
  }

  // Mark notifications as read
  static async markAsRead(notificationIds, userId) {
    try {
      await connectDB()

      await Notification.updateMany(
        {
          _id: { $in: notificationIds },
          user: userId, // <-- fix here
          isRead: false
        },
        {
          isRead: true,
          readAt: new Date()
        }
      )

      return true
    } catch (error) {
      console.error('Mark as read error:', error)
      return false
    }
  }

  // Get user notifications with pagination
  static async getUserNotifications(userId, { page = 1, limit = 20, unreadOnly = false } = {}) {
    try {
      await connectDB()

      const filter = { user: userId } // <-- fix here
      if (unreadOnly) {
        filter.isRead = false
      }

      const skip = (page - 1) * limit

      const [notifications, total, unreadCount] = await Promise.all([
        Notification.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Notification.countDocuments(filter),
        Notification.countDocuments({ user: userId, isRead: false }) // <-- fix here
      ])

      return {
        notifications,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          total,
          hasMore: skip + notifications.length < total
        },
        unreadCount
      }
    } catch (error) {
      console.error('Get notifications error:', error)
      throw error
    }
  }

  static async createOrderNotification(order, type = 'new_order') {
    try {
      console.log('📧 Creating order notifications for:', order.orderNumber)

      const messages = {
        new_order: `New order #${order.orderNumber} placed for ₹${order.totalAmount}`,
        order_confirmed: `Order #${order.orderNumber} has been confirmed`,
        order_processing: `Order #${order.orderNumber} is being processed`,
        order_shipped: `Order #${order.orderNumber} has been shipped`,
        order_delivered: `Order #${order.orderNumber} has been delivered`,
        order_cancelled: `Order #${order.orderNumber} has been cancelled`
      }

      const titles = {
        new_order: '🛒 New Order Received',
        order_confirmed: '✅ Order Confirmed',
        order_processing: '⚙️ Order Processing',
        order_shipped: '🚚 Order Shipped',
        order_delivered: '📦 Order Delivered',
        order_cancelled: '❌ Order Cancelled'
      }

      const notifications = []

      // Create notification for buyer
      if (order.buyer) {
        const buyerNotification = await this.create({
          userId: order.buyer._id || order.buyer,
          title: titles[type] || 'Order Update',
          message: messages[type] || `Order #${order.orderNumber} has been updated`,
          type: 'order',
          data: { 
            orderId: order._id.toString(),
            orderNumber: order.orderNumber,
            status: order.status,
            totalAmount: order.totalAmount,
            orderType: 'buyer'
          },
          actionUrl: `/orders/${order._id}`
        })
        notifications.push(buyerNotification)
        console.log('✅ Buyer notification created')
      }

      // Create notifications for farmers
      if (order.items && order.items.length > 0) {
        for (const item of order.items) {
          if (item.farmer) {
            const farmerId = item.farmer._id || item.farmer
            const farmerNotification = await this.create({
              userId: farmerId,
              title: titles[type] || 'Order Update',
              message: `${messages[type]} - ${item.productName} (Qty: ${item.quantity})`,
              type: 'order',
              data: { 
                orderId: order._id.toString(),
                orderNumber: order.orderNumber,
                productId: item.product?.toString(),
                productName: item.productName,
                quantity: item.quantity,
                status: order.status,
                orderType: 'farmer'
              },
              actionUrl: `/farmer/orders/${order._id}`
            })
            notifications.push(farmerNotification)
            console.log('✅ Farmer notification created for:', farmerId)
          }
        }
      }

      console.log('✅ All order notifications created:', notifications.length)
      return notifications
    } catch (error) {
      console.error('❌ Order notification creation error:', error)
      throw error
    }
  }

  static async markAllAsRead(userId) {
    try {
      await connectDB()
      
      await Notification.updateMany(
        { user: userId, isRead: false }, // <-- fix here
        { isRead: true, readAt: new Date() }
      )

      return true
    } catch (error) {
      console.error('Mark all as read error:', error)
      return false
    }
  }

  static async deleteNotification(notificationId, userId) {
    try {
      await connectDB()
      
      await Notification.findOneAndDelete({
        _id: notificationId,
        user: userId // <-- fix here
      })

      return true
    } catch (error) {
      console.error('Delete notification error:', error)
      throw error
    }
  }

  static async getUnreadCount(userId) {
    try {
      await connectDB()
      
      const count = await Notification.countDocuments({
        user: userId,
        read: false
      })

      return count
    } catch (error) {
      console.error('❌ Get unread count error:', error)
      throw error
    }
  }

  static async createSystemNotification(message, type = 'system', userIds = []) {
    try {
      await connectDB()

      const notifications = []

      // If no specific users, send to all active users
      if (userIds.length === 0) {
        const users = await User.find({ isActive: true }).select('_id')
        userIds = users.map(user => user._id)
      }

      // Create notification for each user
      for (const userId of userIds) {
        const notification = await this.create({
          userId,
          title: '📢 System Notification',
          message,
          type,
          data: { isSystem: true },
          actionUrl: null
        })
        notifications.push(notification)
      }

      console.log('✅ System notifications created:', notifications.length)
      return notifications
    } catch (error) {
      console.error('❌ System notification creation error:', error)
      throw error
    }
  }
}

export default NotificationService