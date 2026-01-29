'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getPatient } from '@/lib/patients'
import { getTransactions, updateTransaction } from '@/lib/transactions'
import { updateAppointment } from '@/lib/appointments'
import { useAuth } from '@/contexts/auth-context'
import type { Patient, Transaction } from '@/types'
import Link from 'next/link'
import { DollarSign, AlertCircle, CheckCircle, Clock, Edit2, X, ArrowLeft } from 'lucide-react'

export default function PatientPaymentsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const patientId = params.id as string
  
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all')
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null)
  const [editStatus, setEditStatus] = useState<Transaction['status']>('paid')
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const patientData = await getPatient(patientId)
        if (!patientData) {
          router.push('/patients')
          return
        }
        setPatient(patientData)

        if (user) {
          const allTransactions = await getTransactions(user.uid)
          const patientTransactions = allTransactions.filter(t => t.patientId === patientId)
          setTransactions(patientTransactions)
        }
      } catch (error) {
        console.error('Error al cargar datos:', error)
        router.push('/patients')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [patientId, router, user])

  const handleUpdateStatus = async (transaction: Transaction) => {
    try {
      setIsUpdating(true)

      await updateTransaction(transaction.id!, {
        status: editStatus,
      })

      if (transaction.appointmentId) {
        await updateAppointment(transaction.appointmentId, {
          paymentStatus: editStatus,
        })
      }

      setTransactions(prev => 
        prev.map(t => t.id === transaction.id ? { ...t, status: editStatus } : t)
      )

      setEditingTransactionId(null)
    } catch (error) {
      alert('Error al actualizar estado de pago')
    } finally {
      setIsUpdating(false)
    }
  }

  const isPaymentOverdue = (transaction: Transaction): boolean => {
    if (transaction.status !== 'pending') return false
    if (!transaction.appointmentId) return false

    const transactionDate = new Date(transaction.date)
    const today = new Date()
    const diffTime = today.getTime() - transactionDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays > 10
  }

  const totalPaid = transactions
    .filter(t => t.status === 'paid')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalPending = transactions
    .filter(t => t.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0)

  const overdueTransactions = transactions.filter(isPaymentOverdue)
  const totalOverdue = overdueTransactions.reduce((sum, t) => sum + t.amount, 0)

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return true
    if (filter === 'paid') return t.status === 'paid'
    if (filter === 'pending') return t.status === 'pending' && !isPaymentOverdue(t)
    if (filter === 'overdue') return isPaymentOverdue(t)
    return true
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const getStatusColor = (transaction: Transaction) => {
    if (isPaymentOverdue(transaction)) {
      return 'bg-red-100 text-red-800'
    }
    const colors = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      partial: 'bg-blue-100 text-blue-800',
    }
    return colors[transaction.status]
  }

  const getStatusText = (transaction: Transaction) => {
    if (isPaymentOverdue(transaction)) {
      return 'Atrasado'
    }
    const texts = {
      paid: 'Pagado',
      pending: 'Pendiente',
      partial: 'Parcial',
    }
    return texts[transaction.status]
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout title="Estado de Pagos">
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-600">Cargando...</p>
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
      <DashboardLayout title={`Estado de Pagos - ${patient.firstName} ${patient.lastName}`}>
        <div className="mb-6">
          <Link href={`/patients/${patientId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Paciente
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-green-600" />
              Estado de Pagos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Resumen de pagos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-600">Total Pagado</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  ${totalPaid.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {transactions.filter(t => t.status === 'paid').length} transacciones
                </p>
              </div>

              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm font-medium text-gray-600">Total Pendiente</span>
                </div>
                <p className="text-2xl font-bold text-yellow-600">
                  ${totalPending.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {transactions.filter(t => t.status === 'pending').length} pendientes
                </p>
              </div>

              <div className="bg-red-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-sm font-medium text-gray-600">Pagos Atrasados</span>
                </div>
                <p className="text-2xl font-bold text-red-600">
                  ${totalOverdue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {overdueTransactions.length} atrasados (+10 días)
                </p>
              </div>
            </div>

            {/* Alerta de pagos atrasados */}
            {overdueTransactions.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-900 mb-1">
                      ⚠️ Tiene {overdueTransactions.length} pago{overdueTransactions.length > 1 ? 's' : ''} atrasado{overdueTransactions.length > 1 ? 's' : ''}
                    </h4>
                    <p className="text-sm text-red-700">
                      Pagos pendientes con más de 10 días desde la fecha de la cita
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Filtros */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todas ({transactions.length})
              </button>
              <button
                onClick={() => setFilter('paid')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'paid'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pagadas ({transactions.filter(t => t.status === 'paid').length})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'pending'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pendientes ({transactions.filter(t => t.status === 'pending' && !isPaymentOverdue(t)).length})
              </button>
              <button
                onClick={() => setFilter('overdue')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'overdue'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Atrasados ({overdueTransactions.length})
              </button>
            </div>

            {/* Lista de transacciones */}
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No hay transacciones {filter !== 'all' ? `con estado "${filter}"` : 'registradas'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTransactions.map(transaction => (
                  <div
                    key={transaction.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      isPaymentOverdue(transaction) ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900">{transaction.concept}</h4>
                        <span className="text-xs text-gray-500">• {transaction.category}</span>
                        {editingTransactionId === transaction.id ? (
                          <div className="flex items-center gap-2">
                            <select
                              value={editStatus}
                              onChange={(e) => setEditStatus(e.target.value as Transaction['status'])}
                              className="rounded border border-gray-300 px-2 py-0.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                              disabled={isUpdating}
                            >
                              <option value="paid">Pagado</option>
                              <option value="pending">Pendiente</option>
                              <option value="partial">Parcial</option>
                            </select>
                            <button
                              onClick={() => handleUpdateStatus(transaction)}
                              disabled={isUpdating}
                              className="px-2 py-1 bg-primary-600 text-white rounded text-xs hover:bg-primary-700 disabled:opacity-50"
                            >
                              {isUpdating ? '...' : '✓'}
                            </button>
                            <button
                              onClick={() => setEditingTransactionId(null)}
                              disabled={isUpdating}
                              className="p-1 text-gray-600 hover:bg-white rounded transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(transaction)}`}>
                              {getStatusText(transaction)}
                            </span>
                            <button
                              onClick={() => {
                                setEditStatus(transaction.status)
                                setEditingTransactionId(transaction.id!)
                              }}
                              className="p-1 text-gray-600 hover:bg-white rounded transition-colors"
                              title="Editar estado"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>
                          {new Date(transaction.date).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                        {transaction.appointmentId && (
                          <Link 
                            href={`/appointments/${transaction.appointmentId}`}
                            className="text-primary-600 hover:text-primary-700 font-medium"
                          >
                            Ver cita →
                          </Link>
                        )}
                      </div>
                    </div>

                    <div className="text-right ml-4">
                      <p className="text-xl font-bold text-gray-900">
                        ${transaction.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-gray-500">{transaction.paymentMethod}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
