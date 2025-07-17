"use client"
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import useAuthStore from '@/stores/auth-store'
import Layout from '@/components/layout/layout'
import LogisticsDashboardContent from './LogisticsDashboardContent'

export default function LogisticsDashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/logistics')
      return
    }
    if (user && user.role !== 'logistics') {
      router.push('/')
      return
    }
  }, [isAuthenticated, user, router])

  if (!isAuthenticated || (user && user.role !== 'logistics')) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-4">You need to be logged in as a logistics user to access this page.</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout requireAuth allowedRoles={['logistics']}>
      <LogisticsDashboardContent />
    </Layout>
  )
}