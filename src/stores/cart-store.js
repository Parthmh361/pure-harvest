import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useCartStore = create(
  persist(
    (set, get) => ({
      cart: [],
      isCartOpen: false,
      isLoading: false,
      error: null,

      // Add item to cart
      addItem: async (product, quantity = 1) => {
        const { cart } = get()
        const existingItem = cart.find(item => item._id === product._id)

        if (existingItem) {
          await get().updateQuantity(product._id, existingItem.quantity + quantity)
        } else {
          const newItem = {
            _id: product._id,
            name: product.name,
            price: product.price,
            image: product.images?.[0] || null,
            unit: product.unit,
            farmerName: product.farmer?.name || 'Unknown',
            farmerId: product.farmer?._id,
            quantity,
            maxQuantity: product.stock || 100
          }

          set(state => ({
            cart: [...state.cart, newItem]
          }))
        }
      },

      // Remove item from cart
      removeItem: async (productId) => {
        set(state => ({
          cart: state.cart.filter(item => item._id !== productId)
        }))
      },

      // Update item quantity
      updateQuantity: async (productId, newQuantity) => {
        if (newQuantity <= 0) {
          await get().removeItem(productId)
          return
        }

        set(state => ({
          cart: state.cart.map(item =>
            item._id === productId
              ? { ...item, quantity: newQuantity }
              : item
          )
        }))
      },

      // Clear cart
      clearCart: async () => {
        set({ cart: [] })
      },

      // Load cart (for compatibility)
      loadCart: async () => {
        set({ isLoading: false })
      },

      // Get total items count
      getTotalItems: () => {
        const { cart } = get()
        return cart.reduce((total, item) => total + item.quantity, 0)
      },

      // Get total price
      getTotalPrice: () => {
        const { cart } = get()
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
      },

      // Get item by id
      getItem: (productId) => {
        const { cart } = get()
        return cart.find(item => item._id === productId)
      },

      // Check if item is in cart
      isInCart: (productId) => {
        const { cart } = get()
        return cart.some(item => item._id === productId)
      },

      // Open cart
      openCart: () => set({ isCartOpen: true }),

      // Get items grouped by farmer
      getItemsByFarmer: () => {
        const items = get().cart
        const grouped = {}
        items.forEach(item => {
          const farmerId = item.farmer?._id || item.farmerId || 'unknown'
          if (!grouped[farmerId]) {
            grouped[farmerId] = {
              farmerId,
              farmerName: item.farmer?.businessName || item.farmer?.name || item.farmerName || 'Unknown Farmer',
              items: [],
              total: 0
            }
          }
          grouped[farmerId].items.push(item)
          grouped[farmerId].total += item.price * item.quantity
        })
        return Object.values(grouped)
      }
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ cart: state.cart })
    }
  )
)

export default useCartStore