'use client'

import { useAuth } from '@/contexts/auth-context'

/**
 * Hook personalizado para acceder al usuario autenticado
 */
export function useUser() {
  const { user, loading } = useAuth()
  return { user, loading }
}

/**
 * Hook personalizado para acceder al perfil del dentista
 */
export function useDentistProfile() {
  const { dentistProfile, loading } = useAuth()
  return { dentistProfile, loading }
}
