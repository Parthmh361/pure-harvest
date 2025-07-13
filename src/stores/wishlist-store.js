import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useWishlistStore = create(
  persist(
    (set, get) => ({
      items: [],
      loading: false,

      // Add item to wishlist
      addToWishlist: async (product) => {
        console.log('🔄 Store: addToWishlist called with:', product)
        
        // ✅ FIX: Handle both id and _id fields
        const productId = product.id || product._id
        
        if (!productId) {
          console.log('❌ No product ID found in:', product)
          return { success: false, message: 'Product ID is required' }
        }
        
        const { items } = get()
        
        // Check if item already exists
        const existingItem = items.find(item => item.id === productId)
        if (existingItem) {
          console.log('❌ Product already in wishlist')
          return { success: false, message: 'Product already in wishlist' }
        }

        try {
          const token = localStorage.getItem('token')
          if (!token) {
            console.log('❌ No token found')
            return { success: false, message: 'Please login to add to wishlist' }
          }

          console.log('🔄 Making API call with productId:', productId)

          // ✅ FIX: Use the extracted productId
          const requestBody = { 
            productId: productId
          }
          
          console.log('📤 Request body:', requestBody)

          const response = await fetch('/api/wishlist', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(requestBody)
          })

          console.log('📥 Response status:', response.status)
          
          const data = await response.json()
          console.log('📥 Response data:', data)

          if (response.ok) {
            const wishlistItem = {
              id: productId,
              name: product.name,
              price: product.price,
              image: product.image || product.images?.[0],
              unit: product.unit,
              farmer: product.farmer,
              addedAt: new Date().toISOString()
            }

            set(state => ({
              items: [...state.items, wishlistItem]
            }))

            console.log('✅ Added to wishlist successfully')
            return { success: true, message: data.message || 'Added to wishlist' }
          } else {
            console.error('❌ API error:', data)
            return { success: false, message: data.error || 'Failed to add to wishlist' }
          }
        } catch (error) {
          console.error('❌ Network error:', error)
          return { success: false, message: 'Network error occurred' }
        }
      },

      // Remove item from wishlist
      removeFromWishlist: async (productId) => {
        console.log('🔄 Store: removeFromWishlist called with:', productId)
        
        try {
          const token = localStorage.getItem('token')
          if (!token) {
            return { success: false, message: 'Please login first' }
          }

          const response = await fetch(`/api/wishlist/${productId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })

          const data = await response.json()
          console.log('🗑️ Remove response:', data)

          if (response.ok) {
            set(state => ({
              items: state.items.filter(item => item.id !== productId)
            }))

            console.log('✅ Removed from wishlist successfully')
            return { success: true, message: 'Removed from wishlist' }
          } else {
            console.error('❌ Remove error:', data)
            return { success: false, message: data.error || 'Failed to remove from wishlist' }
          }
        } catch (error) {
          console.error('❌ Remove network error:', error)
          return { success: false, message: 'Network error occurred' }
        }
      },

      // Check if item is in wishlist
      isInWishlist: (productId) => {
        const { items } = get()
        const isInList = items.some(item => item.id === productId)
        console.log('🔍 Checking if', productId, 'is in wishlist:', isInList)
        return isInList
      },

      // Get wishlist count
      getWishlistCount: () => {
        const { items } = get()
        return items?.length || 0
      },

      // Clear entire wishlist
      clearWishlist: async () => {
        const { items } = get()
        
        try {
          const token = localStorage.getItem('token')
          if (!token) {
            return { success: false, message: 'Please login first' }
          }

          // Remove all items from server
          const promises = items.map(item => 
            fetch(`/api/wishlist/${item.id}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            })
          )

          await Promise.all(promises)

          set({ items: [] })
          return { success: true, message: 'Wishlist cleared' }
        } catch (error) {
          console.error('Clear wishlist error:', error)
          return { success: false, message: 'Failed to clear wishlist' }
        }
      },

      // Load wishlist from server
      loadWishlist: async () => {
        console.log('🔄 Loading wishlist from server...')
        set({ loading: true })

        try {
          const token = localStorage.getItem('token')
          if (!token) {
            console.log('❌ No token for loading wishlist')
            set({ loading: false })
            return { success: false, error: 'No authentication token' }
          }

          const response = await fetch('/api/wishlist', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })

          const data = await response.json()
          console.log('📥 Loaded wishlist data:', data)

          if (response.ok) {
            const items = data.wishlist?.products?.map(item => ({
              id: item.product._id,
              name: item.product.name,
              price: item.product.price,
              image: item.product.images?.[0],
              unit: item.product.unit,
              farmer: item.product.farmer,
              addedAt: item.addedAt
            })) || []

            console.log('✅ Parsed wishlist items:', items)
            set({ items, loading: false })
            return { success: true, items }
          } else {
            console.error('❌ Load error:', data)
            set({ loading: false })
            return { success: false, error: data.error }
          }
        } catch (error) {
          console.error('❌ Load network error:', error)
          set({ loading: false })
          return { success: false, error: 'Failed to load wishlist' }
        }
      },

      // Initialize wishlist (call this when user logs in)
      initializeWishlist: async () => {
        console.log('🚀 Initializing wishlist...')
        const token = localStorage.getItem('token')
        if (token) {
          await get().loadWishlist()
        }
      },

      // Reset wishlist (call this when user logs out)
      resetWishlist: () => {
        console.log('🔄 Resetting wishlist...')
        set({ items: [], loading: false })
      }
    }),
    {
      name: 'wishlist-storage',
      partialize: (state) => ({ items: state.items })
    }
  )
)

export default useWishlistStore