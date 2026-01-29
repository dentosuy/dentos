'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { db } from '@/lib/firebase'
import { collection, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore'
import { DentistProfile } from '@/types'
import { Shield, CheckCircle, XCircle, Clock, AlertCircle, Calendar, Mail } from 'lucide-react'

export default function AdminPage() {
  const { user, dentistProfile } = useAuth()
  const { success, error: showError } = useToast()
  const router = useRouter()
  const [dentists, setDentists] = useState<DentistProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Email del administrador
  const ADMIN_EMAIL = 'manuelquartinoarocena@gmail.com'

  useEffect(() => {
    if (!user || dentistProfile?.email !== ADMIN_EMAIL) {
      router.push('/dashboard')
      return
    }

    loadDentists()
  }, [user, dentistProfile, router])

  const loadDentists = async () => {
    try {
      setLoading(true)
      const dentistsRef = collection(db, 'dentists')
      const snapshot = await getDocs(dentistsRef)
      
      const data = snapshot.docs.map(doc => {
        const docData = doc.data()
        return {
          uid: doc.id,
          email: docData.email,
          displayName: docData.displayName,
          licenseNumber: docData.licenseNumber,
          phone: docData.phone,
          clinicName: docData.clinicName,
          clinicAddress: docData.clinicAddress,
          subscriptionStatus: docData.subscriptionStatus || 'trial',
          trialEndsAt: docData.trialEndsAt?.toDate(),
          subscriptionEndsAt: docData.subscriptionEndsAt?.toDate(),
          planType: docData.planType,
          lastPaymentDate: docData.lastPaymentDate?.toDate(),
          createdAt: docData.createdAt?.toDate(),
          updatedAt: docData.updatedAt?.toDate()
        }
      })
      
      setDentists(data)
    } catch (err: any) {
      console.error('Error loading dentists:', err)
      
      // Mensaje específico si es error de permisos
      if (err.code === 'permission-denied') {
        showError('Sin permisos. Si acabas de actualizar las reglas de Firebase, espera 1-2 minutos y recarga la página.')
      } else {
        showError('No se pudieron cargar los dentistas: ' + (err.message || 'Error desconocido'))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleActivate = async (dentistId: string, planType: 'monthly' | 'annual') => {
    try {
      const dentistRef = doc(db, 'dentists', dentistId)
      
      const now = new Date()
      const durationMonths = planType === 'monthly' ? 1 : 12
      const subscriptionEndsAt = new Date(now.getTime() + durationMonths * 30 * 24 * 60 * 60 * 1000)
      
      await updateDoc(dentistRef, {
        subscriptionStatus: 'active',
        planType: planType,
        subscriptionEndsAt: Timestamp.fromDate(subscriptionEndsAt),
        lastPaymentDate: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now)
      })
      
      success(`Suscripción activada exitosamente con plan ${planType === 'monthly' ? 'mensual' : 'anual'}`)
      await loadDentists()
    } catch (err) {
      console.error('Error activating subscription:', err)
      showError('No se pudo activar la suscripción')
    }
  }

  const handleExtend = async (dentistId: string, months: number) => {
    try {
      const dentistRef = doc(db, 'dentists', dentistId)
      
      const now = new Date()
      const extensionMs = months * 30 * 24 * 60 * 60 * 1000
      
      // Obtener el dentista actual
      const currentDentist = dentists.find(d => d.uid === dentistId)
      
      if (!currentDentist) {
        throw new Error('Dentista no encontrado')
      }
      
      let newEndDate: Date
      
      if (currentDentist.subscriptionEndsAt) {
        // Si ya tiene fecha de finalización, extender desde esa fecha
        newEndDate = new Date(new Date(currentDentist.subscriptionEndsAt).getTime() + extensionMs)
      } else {
        // Si no tiene fecha, extender desde hoy
        newEndDate = new Date(now.getTime() + extensionMs)
      }
      
      await updateDoc(dentistRef, {
        subscriptionStatus: 'active',
        subscriptionEndsAt: Timestamp.fromDate(newEndDate),
        lastPaymentDate: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now)
      })
      
      success(`Suscripción extendida por ${months} ${months === 1 ? 'mes' : 'meses'}`)
      await loadDentists()
    } catch (err) {
      console.error('Error extending subscription:', err)
      showError('No se pudo extender la suscripción')
    }
  }

  const getStatusBadge = (dentist: DentistProfile) => {
    const now = new Date()
    
    if (dentist.subscriptionStatus === 'trial') {
      if (dentist.trialEndsAt && new Date(dentist.trialEndsAt) > now) {
        const daysLeft = Math.ceil((new Date(dentist.trialEndsAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3" />
            Trial ({daysLeft}d restantes)
          </span>
        )
      } else {
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertCircle className="w-3 h-3" />
            Trial Expirado
          </span>
        )
      }
    }

    if (dentist.subscriptionStatus === 'active') {
      if (dentist.subscriptionEndsAt && new Date(dentist.subscriptionEndsAt) > now) {
        const daysLeft = Math.ceil((new Date(dentist.subscriptionEndsAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" />
            Activo ({daysLeft}d restantes)
          </span>
        )
      }
    }

    if (dentist.subscriptionStatus === 'expired') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3" />
          Expirado
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <AlertCircle className="w-3 h-3" />
        {dentist.subscriptionStatus}
      </span>
    )
  }

  const filteredDentists = dentists.filter(d => 
    d.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.licenseNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!user || dentistProfile?.email !== ADMIN_EMAIL) {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando panel de administración...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <Card className="mb-6 border-2 border-primary-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-2xl">
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-primary-600" />
                Panel de Administración
              </div>
              {dentists.length === 0 && (
                <Button 
                  onClick={loadDentists}
                  size="sm"
                  variant="outline"
                >
                  🔄 Reintentar
                </Button>
              )}
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Gestiona las suscripciones de todos los dentistas registrados
            </p>
          </CardHeader>
        </Card>

        {/* Estadísticas */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600 mb-1">Total Dentistas</div>
              <div className="text-3xl font-bold text-gray-900">{dentists.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600 mb-1">En Trial</div>
              <div className="text-3xl font-bold text-yellow-600">
                {dentists.filter(d => d.subscriptionStatus === 'trial').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600 mb-1">Activos</div>
              <div className="text-3xl font-bold text-green-600">
                {dentists.filter(d => d.subscriptionStatus === 'active').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600 mb-1">Expirados</div>
              <div className="text-3xl font-bold text-red-600">
                {dentists.filter(d => d.subscriptionStatus === 'expired').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Búsqueda */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <Input
              type="text"
              placeholder="Buscar por nombre, email o licencia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </CardContent>
        </Card>

        {/* Lista de dentistas */}
        <div className="space-y-4">
          {filteredDentists.map((dentist) => (
            <Card key={dentist.uid} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-bold text-gray-900">{dentist.displayName}</h3>
                      {getStatusBadge(dentist)}
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Mail className="w-4 h-4" />
                          <span>{dentist.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <Shield className="w-4 h-4" />
                          <span>Licencia: {dentist.licenseNumber}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {dentist.trialEndsAt && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <Calendar className="w-4 h-4" />
                            <span>
                              Trial: {new Date(dentist.trialEndsAt).toLocaleDateString('es-ES')}
                            </span>
                          </div>
                        )}
                        {dentist.subscriptionEndsAt && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <Calendar className="w-4 h-4" />
                            <span>
                              Vence: {new Date(dentist.subscriptionEndsAt).toLocaleDateString('es-ES')}
                            </span>
                          </div>
                        )}
                        {dentist.planType && (
                          <div className="text-gray-700">
                            <strong>Plan:</strong> {dentist.planType === 'monthly' ? 'Mensual' : 'Anual'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-col gap-2">
                    {(dentist.subscriptionStatus === 'trial' || dentist.subscriptionStatus === 'expired') && (
                      <>
                        <Button
                          onClick={() => handleActivate(dentist.uid, 'monthly')}
                          size="sm"
                          className="whitespace-nowrap"
                        >
                          Activar Mensual
                        </Button>
                        <Button
                          onClick={() => handleActivate(dentist.uid, 'annual')}
                          size="sm"
                          variant="outline"
                          className="whitespace-nowrap"
                        >
                          Activar Anual
                        </Button>
                      </>
                    )}
                    
                    {dentist.subscriptionStatus === 'active' && (
                      <>
                        <Button
                          onClick={() => handleExtend(dentist.uid, 1)}
                          size="sm"
                          className="whitespace-nowrap"
                        >
                          + 1 Mes
                        </Button>
                        <Button
                          onClick={() => handleExtend(dentist.uid, 12)}
                          size="sm"
                          variant="outline"
                          className="whitespace-nowrap"
                        >
                          + 12 Meses
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredDentists.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center text-gray-500">
              No se encontraron dentistas con esos criterios de búsqueda
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
