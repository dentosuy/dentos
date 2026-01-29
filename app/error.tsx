'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

/**
 * Página de error global
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log del error para debugging
    console.error('Error en la aplicación:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">😕</span>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          ¡Ups! Algo salió mal
        </h1>
        
        <p className="text-gray-600 mb-6">
          Ha ocurrido un error inesperado. No te preocupes, tus datos están seguros.
        </p>

        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg text-left">
            <p className="text-xs font-mono text-red-600 break-all">
              {error.message}
            </p>
          </div>
        )}
        
        <div className="flex gap-3 justify-center">
          <Button
            onClick={reset}
            size="lg"
          >
            Intentar de nuevo
          </Button>
          <Button
            onClick={() => window.location.href = '/dashboard'}
            variant="outline"
            size="lg"
          >
            Ir al inicio
          </Button>
        </div>
      </div>
    </div>
  )
}
