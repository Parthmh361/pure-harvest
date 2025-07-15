import useAuthStore from '@/stores/auth-store'
import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '../ui/button'

export default function LogoutButton({ className = '' }) {
  const logout = useAuthStore(state => state.logout)
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
     <Button
                variant="ghost"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 py-3"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5 mr-3" />
                <span className="text-responsive-base">Logout</span>
              </Button>
  )
}