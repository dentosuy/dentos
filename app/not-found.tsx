import Link from 'next/link'
import { Button } from '@/components/ui/button'

/**
 * Página de error 404 - No encontrado
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary-600">404</h1>
          <div className="text-6xl mb-4">🦷</div>
        </div>
        
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Página no encontrada
        </h2>
        
        <p className="text-gray-600 mb-8">
          Lo sentimos, la página que buscas no existe o ha sido movida.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/dashboard">
            <Button size="lg">
              Ir al Dashboard
            </Button>
          </Link>
          <Link href="/patients">
            <Button variant="outline" size="lg">
              Ver Pacientes
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
