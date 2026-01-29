'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getPatient } from '@/lib/patients'
import { getTransactions, updateTransaction } from '@/lib/transactions'
import { updateAppointment, getAppointment } from '@/lib/appointments'
import { useAuth } from '@/contexts/auth-context'
import type { Patient, Transaction } from '@/types'
import Link from 'next/link'
import { DollarSign, AlertCircle, CheckCircle, Clock, Edit2, X } from 'lucide-react'

/**
 * Página individual de un paciente
 */
export default function PatientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const patientId = params.id as string
  
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const data = await getPatient(patientId)
        if (!data) {
          router.push('/patients')
          return
        }
        setPatient(data)
      } catch (error) {
        console.error('Error al cargar paciente:', error)
        router.push('/patients')
      } finally {
        setLoading(false)
      }
    }

    fetchPatient()
  }, [patientId, router])

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user) return

      try {
        const allTransactions = await getTransactions(user.uid)
        // Filtrar solo transacciones de este paciente
        const patientTransactions = allTransactions.filter(t => t.patientId === patientId)
        setTransactions(patientTransactions)
      } catch (error) {
        console.error('Error al cargar transacciones:', error)
      }
    }

    if (user) {
      fetchTransactions()
    }
  }, [user, patientId])

  const isPaymentOverdue = (transaction: Transaction): boolean => {
    if (transaction.status !== 'pending') return false
    if (!transaction.appointmentId) return false

    const transactionDate = new Date(transaction.date)
    const today = new Date()
    const diffTime = today.getTime() - transactionDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays > 10
  }

  // Calcular totales
  const totalPaid = transactions
    .filter(t => t.status === 'paid')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalPending = transactions
    .filter(t => t.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0)

  const overdueTransactions = transactions.filter(isPaymentOverdue)

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout title="Cargando...">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando información del paciente...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (!patient) {
    return null
  }

  return (
    <ProtectedRoute>
      <DashboardLayout title={`${patient.firstName} ${patient.lastName}`}>
        {/* Botón volver */}
        <div className="mb-6">
          <Link href="/patients">
            <Button variant="outline">
              ← Volver a Pacientes
            </Button>
          </Link>
        </div>

        {/* Grid de cards principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card Estado de Pagos */}
          <Link href={`/patients/${patientId}/payments`}>
            <Card className="hover:shadow-lg transition-all cursor-pointer hover:border-primary-300">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="text-xl">Estado de Pagos</CardTitle>
                <CardDescription>
                  Historial y estado de pagos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Pagado:</span>
                    <span className="font-semibold text-green-600">
                      ${totalPaid.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Pendiente:</span>
                    <span className="font-semibold text-yellow-600">
                      ${totalPending.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {overdueTransactions.length > 0 && (
                    <div className="flex items-center gap-2 mt-3 p-2 bg-red-50 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium text-red-900">
                        {overdueTransactions.length} pago{overdueTransactions.length > 1 ? 's' : ''} atrasado{overdueTransactions.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Card Historia Clínica */}
          <Link href={`/patients/${patientId}/medical-history`}>
            <Card className="hover:shadow-lg transition-all cursor-pointer hover:border-primary-300">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                  <span className="text-2xl">📋</span>
                </div>
                <CardTitle className="text-xl">Historia Clínica</CardTitle>
                <CardDescription>
                  Historial médico y tratamientos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Ver alergias, medicamentos y condiciones
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Card Historia de Visitas */}
          <Link href={`/patients/${patientId}/visits`}>
            <Card className="hover:shadow-lg transition-all cursor-pointer hover:border-primary-300">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                  <span className="text-2xl">📅</span>
                </div>
                <CardTitle className="text-xl">Historia de Visitas</CardTitle>
                <CardDescription>
                  Citas y consultas realizadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Ver todas las visitas del paciente
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Información rápida del paciente */}
        <div className="mt-8 p-6 bg-white rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4">Información Rápida</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Edad:</span>
              <span className="ml-2 font-medium">
                {calculateAge(patient.dateOfBirth)} años
              </span>
            </div>
            <div>
              <span className="text-gray-600">Teléfono:</span>
              <span className="ml-2 font-medium">{patient.phone}</span>
            </div>
            {patient.email && (
              <div>
                <span className="text-gray-600">Email:</span>
                <span className="ml-2 font-medium">{patient.email}</span>
              </div>
            )}
            <div>
              <span className="text-gray-600">Fecha de Nacimiento:</span>
              <span className="ml-2 font-medium">
                {patient.dateOfBirth.toLocaleDateString('es-ES')}
              </span>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

/**
 * Calcular edad a partir de fecha de nacimiento
 */
function calculateAge(dateOfBirth: Date): number {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  
  return age
}
