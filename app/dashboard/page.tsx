'use client'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

/**
 * Dashboard principal
 * Página de inicio después del login
 */
export default function DashboardPage() {
  const { user, dentistProfile, signOut } = useAuth()
  const router = useRouter()

  const isAdmin = user?.email === 'manuelquartinoarocena@gmail.com'

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-primary-700">
                🦷 DentOS
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {dentistProfile?.displayName || user?.displayName}
                </p>
                <p className="text-xs text-gray-600">{user?.email}</p>
              </div>
              {isAdmin && (
                <Button 
                  onClick={() => router.push('/admin')} 
                  variant="primary"
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  🛡️ Panel Admin
                </Button>
              )}
              <Button onClick={handleSignOut} variant="outline" size="sm">
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              ¡Bienvenido de nuevo! 👋
            </h2>
            <p className="text-gray-600">
              Este es tu panel de control personalizado
            </p>
          </div>

          {/* Subscription Status Banner */}
          {dentistProfile && (
            <>
              {dentistProfile.subscriptionStatus === 'trial' && dentistProfile.trialEndsAt && (
                <Card className="mb-6 border-2 border-yellow-300 bg-yellow-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-4xl">⏰</div>
                        <div>
                          <h3 className="text-lg font-bold text-yellow-900">
                            Período de Prueba
                          </h3>
                          <p className="text-sm text-yellow-800">
                            Tu trial finaliza el{' '}
                            <strong>
                              {new Date(dentistProfile.trialEndsAt).toLocaleDateString('es-ES', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </strong>
                            {' '}({Math.ceil((new Date(dentistProfile.trialEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} días restantes)
                          </p>
                        </div>
                      </div>
                      <Button 
                        onClick={() => window.location.href = 'https://wa.me/59892477741'}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Activar Ahora
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {dentistProfile.subscriptionStatus === 'active' && dentistProfile.subscriptionEndsAt && (
                <Card className="mb-6 border-2 border-green-300 bg-green-50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="text-4xl">✅</div>
                      <div>
                        <h3 className="text-lg font-bold text-green-900">
                          Suscripción Activa - Plan {dentistProfile.planType === 'monthly' ? 'Mensual' : 'Anual'}
                        </h3>
                        <p className="text-sm text-green-800">
                          Tu suscripción se renueva el{' '}
                          <strong>
                            {new Date(dentistProfile.subscriptionEndsAt).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </strong>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Grid de tarjetas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">👤</span>
                  Perfil
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Gestiona tu información personal y profesional
                </p>
              </CardContent>
            </Card>

            <a href="/patients">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">👥</span>
                    Pacientes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Administra la información de tus pacientes
                  </p>
                </CardContent>
              </Card>
            </a>

            <a href="/appointments">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">📅</span>
                    Agenda
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Organiza tus citas y horarios
                  </p>
                </CardContent>
              </Card>
            </a>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">�</span>
                  Pedidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Gestiona pedidos y suministros
                </p>
              </CardContent>
            </Card>

            <a href="/finances">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">💰</span>
                    Finanzas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Gestiona ingresos, egresos y flujo de caja
                  </p>
                </CardContent>
              </Card>
            </a>

            <a href="/stock">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">📦</span>
                    Stock
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Controla el inventario de materiales e insumos
                  </p>
                </CardContent>
              </Card>
            </a>

            <a href="/backup">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-primary-200 bg-primary-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary-900">
                    <span className="text-2xl">🔐</span>
                    Backup
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-primary-700 font-medium">
                    Protege tu información con copias de seguridad
                  </p>
                </CardContent>
              </Card>
            </a>
          </div>

          {/* Info adicional */}
          <div className="mt-8 p-6 bg-white rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">
              ℹ️ Información del Sistema
            </h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Usuario:</strong> {user?.email}</p>
              <p><strong>ID:</strong> {user?.uid}</p>
              {dentistProfile?.licenseNumber && (
                <p><strong>Licencia:</strong> {dentistProfile.licenseNumber}</p>
              )}
              <p><strong>Fecha de registro:</strong> {user?.createdAt.toLocaleDateString('es-ES')}</p>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
