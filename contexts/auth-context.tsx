'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User as FirebaseUser } from 'firebase/auth'
import { onAuthChange, getDentistProfile, signOut as firebaseSignOut } from '@/lib/auth'
import type { User, DentistProfile } from '@/types'

interface AuthContextType {
  user: User | null
  dentistProfile: DentistProfile | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Provider de autenticación
 * Maneja el estado global del usuario autenticado
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [dentistProfile, setDentistProfile] = useState<DentistProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Usuario autenticado
        const profile = await getDentistProfile(firebaseUser.uid)
        
        if (profile) {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email!,
            displayName: firebaseUser.displayName || undefined,
            photoURL: firebaseUser.photoURL || undefined,
            createdAt: profile.createdAt,
            updatedAt: profile.updatedAt,
          })
          setDentistProfile(profile)
        }
      } else {
        // Usuario no autenticado
        setUser(null)
        setDentistProfile(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await firebaseSignOut()
    setUser(null)
    setDentistProfile(null)
  }

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        dentistProfile, 
        loading, 
        signOut: handleSignOut 
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook para usar el contexto de autenticación
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider')
  }
  return context
}
