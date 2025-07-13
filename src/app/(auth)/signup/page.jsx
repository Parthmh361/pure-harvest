"use client"

import SignupForm from '@/components/auth/signup-form'
import Link from 'next/link'
import { Leaf } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SignupPage() {
  const router = useRouter()
  const [error, setError] = useState(null)

  const handleSignup = async (formData) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        // Store user data and token
        localStorage.setItem('user', JSON.stringify(data.user))
        localStorage.setItem('token', data.token)
        
        console.log('✅ Signup successful, user and token stored')
        
        // Redirect to dashboard or home
        router.push('/dashboard')
      } else {
        setError(data.error)
      }
    } catch (error) {
      console.error('Signup error:', error)
      setError('Signup failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="flex items-center justify-center space-x-2 mb-8">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <Leaf className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-primary">PureHarvest</span>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">
            Join PureHarvest
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Create your account to get started
          </p>
        </div>
        
        <SignupForm onSignup={handleSignup} />
        
        {error && (
          <div className="text-red-500 text-sm text-center">
            {error}
          </div>
        )}

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:text-primary-dark">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}