import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Login
      login: async (email, password) => {
        set({ isLoading: true, error: null })
        
        try {
          console.log('🔍 Auth Store - Login called with:', { email, password })
          
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          })

          console.log('🔍 Auth Store - Response status:', response.status)
          
          const data = await response.json()
          console.log('🔍 Auth Store - Response data:', data)

          if (data.success) {
            set({
              user: data.user,
              token: data.token,
              isAuthenticated: true,
              isLoading: false,
              error: null
            })

            // Also store in localStorage for compatibility
            localStorage.setItem('user', JSON.stringify(data.user))
            localStorage.setItem('token', data.token)

            return { success: true, user: data.user }
          } else {
            set({ 
              isLoading: false, 
              error: data.error || 'Login failed' 
            })
            return { success: false, error: data.error }
          }
        } catch (error) {
          const errorMessage = 'Network error. Please try again.'
          set({ isLoading: false, error: errorMessage })
          return { success: false, error: errorMessage }
        }
      },

      // Signup
      signup: async (userData) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
          })

          const data = await response.json()

          if (data.success) {
            set({
              user: data.user,
              token: data.token,
              isAuthenticated: true,
              isLoading: false,
              error: null
            })

            // Also store in localStorage for compatibility
            localStorage.setItem('user', JSON.stringify(data.user))
            localStorage.setItem('token', data.token)

            return { success: true, user: data.user }
          } else {
            set({ 
              isLoading: false, 
              error: data.error || 'Signup failed' 
            })
            return { success: false, error: data.error }
          }
        } catch (error) {
          const errorMessage = 'Network error. Please try again.'
          set({ isLoading: false, error: errorMessage })
          return { success: false, error: errorMessage }
        }
      },

      // Logout
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null
        })

        // Clear localStorage
        localStorage.removeItem('user')
        localStorage.removeItem('token')
        localStorage.removeItem('cart')
      },

      // Initialize auth from localStorage
      initializeAuth: () => {
        try {
          const userData = localStorage.getItem('user')
          const token = localStorage.getItem('token')

          if (userData && token) {
            const user = JSON.parse(userData)
            set({
              user,
              token,
              isAuthenticated: true
            })
          }
        } catch (error) {
          console.error('Error initializing auth:', error)
          get().logout()
        }
      },

      // Update user
      updateUser: (userData) => {
        set(state => ({
          user: { ...state.user, ...userData }
        }))

        // Update localStorage
        const updatedUser = get().user
        localStorage.setItem('user', JSON.stringify(updatedUser))
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token, 
        isAuthenticated: state.isAuthenticated 
      })
    }
  )
)

export default useAuthStore