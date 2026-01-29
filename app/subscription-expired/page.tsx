'use client'

import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Calendar, Mail, Phone } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SubscriptionExpiredPage() {
  const { dentistProfile, signOut } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  const isTrialExpired = dentistProfile?.subscriptionStatus === 'trial' && 
    dentistProfile.trialEndsAt && 
    new Date() > new Date(dentistProfile.trialEndsAt)

  const isSubscriptionExpired = dentistProfile?.subscriptionStatus === 'expired'

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-2xl border-2 border-red-200">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">
            {isTrialExpired ? 'Período de Prueba Finalizado' : 'Suscripción Expirada'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-white rounded-lg p-6 border border-red-100">
            <p className="text-gray-700 text-lg leading-relaxed">
              {isTrialExpired ? (
                <>
                  Tu período de prueba gratuito de <strong>7 días</strong> ha finalizado.
                  <br />
                  Para seguir usando DentOS y gestionar tu consultorio, necesitas activar una suscripción.
                </>
              ) : (
                <>
                  Tu suscripción a DentOS ha expirado.
                  <br />
                  Renueva tu suscripción para recuperar el acceso a todas las funcionalidades.
                </>
              )}
            </p>
          </div>

          {/* Información del usuario */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Información de tu Cuenta
            </h3>
            <div className="space-y-2 text-sm text-blue-800">
              <p><strong>Nombre:</strong> {dentistProfile?.displayName}</p>
              <p><strong>Email:</strong> {dentistProfile?.email}</p>
              <p><strong>Licencia:</strong> {dentistProfile?.licenseNumber}</p>
              {dentistProfile?.trialEndsAt && (
                <p>
                  <strong>Trial finalizó:</strong>{' '}
                  {new Date(dentistProfile.trialEndsAt).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              )}
            </div>
          </div>

          {/* Instrucciones para activar */}
          <div className="bg-green-50 rounded-lg p-6 border border-green-200">
            <h3 className="font-bold text-green-900 mb-4 text-xl">
              ¿Cómo activar tu suscripción?
            </h3>
            <ol className="space-y-3 text-green-800">
              <li className="flex gap-3">
                <span className="font-bold">1.</span>
                <span>Contáctanos por WhatsApp o email para coordinar el pago</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold">2.</span>
                <span>Realiza el pago mensual ($3,000 ARS/mes)</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold">3.</span>
                <span>Envíanos el comprobante de pago</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold">4.</span>
                <span>Activaremos tu cuenta en menos de 24hs</span>
              </li>
            </ol>
          </div>

          {/* Contacto */}
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4 text-lg">
              Información de Contacto
            </h3>
            <div className="space-y-3">
              <a 
                href="https://wa.me/59892477741" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-green-600 hover:text-green-700 transition-colors"
              >
                <Phone className="w-5 h-5" />
                <span className="font-medium">WhatsApp: +598 92 477 741</span>
              </a>
              <a 
                href="mailto:manuelquartinoarocena@gmail.com" 
                className="flex items-center gap-3 text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Mail className="w-5 h-5" />
                <span className="font-medium">Email: manuelquartinoarocena@gmail.com</span>
              </a>
            </div>
          </div>

          {/* Planes */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-5 border-2 border-primary-200 hover:border-primary-400 transition-colors">
              <h4 className="font-bold text-lg text-gray-900 mb-2">Plan Mensual</h4>
              <p className="text-3xl font-bold text-primary-600 mb-2">$3,000</p>
              <p className="text-sm text-gray-600">por mes</p>
              <ul className="mt-4 space-y-2 text-sm text-gray-700">
                <li>✓ Pacientes ilimitados</li>
                <li>✓ Agenda completa</li>
                <li>✓ Control de stock</li>
                <li>✓ Gestión financiera</li>
              </ul>
            </div>
            
            <div className="bg-primary-50 rounded-lg p-5 border-2 border-primary-400 relative overflow-hidden">
              <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                AHORRÁS 2 MESES
              </div>
              <h4 className="font-bold text-lg text-gray-900 mb-2">Plan Anual</h4>
              <p className="text-3xl font-bold text-primary-600 mb-2">$30,000</p>
              <p className="text-sm text-gray-600">por año</p>
              <ul className="mt-4 space-y-2 text-sm text-gray-700">
                <li>✓ Todo del plan mensual</li>
                <li>✓ <strong>2 meses gratis</strong></li>
                <li>✓ Soporte prioritario</li>
                <li>✓ Actualizaciones premium</li>
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="w-full"
            >
              Cerrar Sesión
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
