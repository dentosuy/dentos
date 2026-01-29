'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

/**
 * Componente HOC para proteger rutas
 * Redirige a login si el usuario no está autenticado
 * Redirige a subscription-expired si la suscripción expiró
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, dentistProfile } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    // No validar suscripción en la página de expiración o login/register
    if (pathname === '/subscription-expired' || pathname === '/login' || pathname === '/register') {
      return
    }

    // Validar estado de suscripción
    if (!loading && user && dentistProfile) {
      const now = new Date()
      
      // Si está en trial y expiró
      if (dentistProfile.subscriptionStatus === 'trial' && dentistProfile.trialEndsAt) {
        const trialEnd = new Date(dentistProfile.trialEndsAt)
        if (now > trialEnd) {
          router.push('/subscription-expired')
          return
        }
      }

      // Si está expirado o cancelado
      if (dentistProfile.subscriptionStatus === 'expired' || dentistProfile.subscriptionStatus === 'cancelled') {
        router.push('/subscription-expired')
        return
      }

      // Si está activo pero la suscripción expiró
      if (dentistProfile.subscriptionStatus === 'active' && dentistProfile.subscriptionEndsAt) {
        const subscriptionEnd = new Date(dentistProfile.subscriptionEndsAt)
        if (now > subscriptionEnd) {
          router.push('/subscription-expired')
          return
        }
      }
    }
  }, [user, loading, dentistProfile, router, pathname])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
