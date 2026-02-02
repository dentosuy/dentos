'use client'

import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface DashboardLayoutProps {
  children: React.ReactNode
  title: string
}

/**
 * Layout reutilizable para todas las páginas del dashboard
 */
export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const { user, dentistProfile, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-2xl font-bold text-primary-700 hover:text-primary-800 transition-colors">
              🦷 DentOS
            </Link>
            <nav className="hidden md:flex gap-6">
              <Link href="/dashboard" className="text-gray-600 hover:text-primary-600 font-medium">
                Inicio
              </Link>
              <Link href="/patients" className="text-gray-600 hover:text-primary-600 font-medium">
                Pacientes
              </Link>
              <Link href="/appointments" className="text-gray-600 hover:text-primary-600 font-medium">
                Agenda
              </Link>
              <Link href="/stock" className="text-gray-600 hover:text-primary-600 font-medium">
                Stock
              </Link>
              <Link href="/finances" className="text-gray-600 hover:text-primary-600 font-medium">
                Finanzas
              </Link>
              <Link href="/backup" className="text-gray-600 hover:text-primary-600 font-medium">
                Backup
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">
                {dentistProfile?.displayName || user?.displayName}
              </p>
              <p className="text-xs text-gray-600">{user?.email}</p>
            </div>
            <Button onClick={handleSignOut} variant="outline" size="sm">
              Salir
            </Button>
          </div>
        </div>
      </header>

      {/* Page Title */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
