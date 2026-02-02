'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Pagination } from '@/components/ui/pagination'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/components/ui/toast'
import { usePagination } from '@/hooks/use-pagination'
import { getTransactions, getMonthlyBalance, deleteTransaction, updateTransaction } from '@/lib/transactions'
import { updateAppointment } from '@/lib/appointments'
import type { Transaction } from '@/types'
import Link from 'next/link'
import { TrendingUp, TrendingDown, DollarSign, Trash2, Calendar, Edit2, X } from 'lucide-react'

export default function FinancesPage() {
  const { user } = useAuth()
  const toast = useToast()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [monthlyBalance, setMonthlyBalance] = useState({ grossIncome: 0, netIncome: 0, expenses: 0, balance: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null)
  const [editStatus, setEditStatus] = useState<Transaction['status']>('paid')
  const [isUpdating, setIsUpdating] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState<{ id: string; concept: string } | null>(null)

  const currentDate = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      try {
        setLoading(true)
        const [transactionsData, balance] = await Promise.all([
          getTransactions(user.uid),
          getMonthlyBalance(user.uid, currentYear, currentMonth)
        ])
        
        setTransactions(transactionsData)
        setMonthlyBalance(balance)
      } catch (error) {
        console.error('Error al cargar finanzas:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, currentYear, currentMonth])

  const handleDeleteConfirm = async () => {
    if (!transactionToDelete) return

    try {
      await deleteTransaction(transactionToDelete.id)
      setTransactions(prev => prev.filter(t => t.id !== transactionToDelete.id))
      
      // Recalcular balance
      const newBalance = await getMonthlyBalance(user!.uid, currentYear, currentMonth)
      setMonthlyBalance(newBalance)
      toast.success('Transacción eliminada exitosamente')
    } catch (error) {
      toast.error('Error al eliminar transacción')
    }
  }

  const handleUpdateStatus = async (transaction: Transaction) => {
    try {
      setIsUpdating(true)

      // Actualizar la transacción
      await updateTransaction(transaction.id!, {
        status: editStatus,
      })

      // Si está vinculada a una cita, actualizar también la cita
      if (transaction.appointmentId) {
        await updateAppointment(transaction.appointmentId, {
          paymentStatus: editStatus,
        })
      }

      // Actualizar estado local
      setTransactions(prev => 
        prev.map(t => t.id === transaction.id ? { ...t, status: editStatus } : t)
      )

      // Recalcular balance
      const newBalance = await getMonthlyBalance(user!.uid, currentYear, currentMonth)
      setMonthlyBalance(newBalance)

      setEditingTransactionId(null)
    } catch (error) {
      alert('Error al actualizar estado de pago')
    } finally {
      setIsUpdating(false)
    }
  }

  const getTypeColor = (type: Transaction['type']) => {
    return type === 'income' ? 'text-green-600' : 'text-red-600'
  }

  const getTypeIcon = (type: Transaction['type']) => {
    return type === 'income' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />
  }

  const getStatusColor = (status: Transaction['status']) => {
    const colors = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      partial: 'bg-blue-100 text-blue-800',
    }
    return colors[status]
  }

  const getStatusText = (status: Transaction['status']) => {
    const texts = {
      paid: 'Pagado',
      pending: 'Pendiente',
      partial: 'Parcial',
    }
    return texts[status]
  }

  const filteredTransactions = transactions.filter(t => {
    // Filtrar por tipo
    if (filter !== 'all' && t.type !== filter) return false
    
    // Filtrar por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        t.concept.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query) ||
        t.amount.toString().includes(query)
      )
    }
    
    return true
  })

  // Paginación
  const {
    currentData,
    currentPage,
    totalPages,
    goToPage,
    canGoNext,
    canGoPrevious,
    startIndex,
    endIndex
  } = usePagination({
    data: filteredTransactions,
    itemsPerPage: 15
  })

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout title="Finanzas">
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-600">Cargando...</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout title="Finanzas">
        {/* Resumen del mes */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Ingreso Bruto */}
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-yellow-700 mb-1 font-medium">Ingreso Bruto</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      ${monthlyBalance.grossIncome.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <TrendingUp className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ingresos Netos */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Ingresos Netos</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${monthlyBalance.netIncome.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Egresos */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Egresos</p>
                    <p className="text-2xl font-bold text-red-600">
                      ${monthlyBalance.expenses.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-full">
                    <TrendingDown className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Balance */}
            <Card className={monthlyBalance.balance >= 0 ? 'bg-primary-50' : 'bg-red-50'}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Balance</p>
                    <p className={`text-2xl font-bold ${monthlyBalance.balance >= 0 ? 'text-primary-700' : 'text-red-600'}`}>
                      ${monthlyBalance.balance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${monthlyBalance.balance >= 0 ? 'bg-primary-100' : 'bg-red-100'}`}>
                    <DollarSign className={`w-6 h-6 ${monthlyBalance.balance >= 0 ? 'text-primary-700' : 'text-red-600'}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Acciones y filtros */}
        <div className="space-y-4 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex gap-2">
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
                onClick={() => setFilter('income')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'income'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Ingresos ({transactions.filter(t => t.type === 'income').length})
              </button>
              <button
                onClick={() => setFilter('expense')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'expense'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Egresos ({transactions.filter(t => t.type === 'expense').length})
              </button>
            </div>

            <div className="flex gap-2">
              <Link href="/finances/income/new">
                <Button className="bg-green-600 hover:bg-green-700">+ Registrar Ingreso</Button>
              </Link>
              <Link href="/finances/possible-income/new">
                <Button className="bg-yellow-500 hover:bg-yellow-600 text-white">
                  ⚡ Registrar Posible Ingreso
                </Button>
              </Link>
              <Link href="/finances/expense/new">
                <Button variant="outline" className="border-red-600 text-red-600 hover:bg-red-50">
                  + Registrar Egreso
                </Button>
              </Link>
            </div>
          </div>

          {/* Barra de búsqueda */}
          <div className="w-full md:w-96">
            <Input
              type="text"
              placeholder="Buscar por concepto, categoría o monto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Contador de resultados */}
          {searchQuery && (
            <div className="text-sm text-gray-600">
              {filteredTransactions.length} transacción{filteredTransactions.length !== 1 ? 'es' : ''} encontrada{filteredTransactions.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Lista de transacciones */}
        <Card>
          <CardHeader>
            <CardTitle>Transacciones</CardTitle>
          </CardHeader>
          <CardContent>
            {currentData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>{searchQuery ? 'No se encontraron transacciones' : 'No hay transacciones registradas'}</p>
                <p className="text-sm mt-1">
                  {searchQuery ? 'Intenta con otro criterio de búsqueda' : 'Comienza registrando tus ingresos y egresos'}
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {currentData.map(transaction => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`p-2 rounded-full ${transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                        {getTypeIcon(transaction.type)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900">{transaction.concept}</h4>
                          {transaction.isPossible && (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
                              Posible
                            </span>
                          )}
                          <span className="text-xs text-gray-500">• {transaction.category}</span>
                          {editingTransactionId === transaction.id ? (
                            <div className="flex items-center gap-2">
                              <select
                                value={editStatus}
                                onChange={(e) => setEditStatus(e.target.value as Transaction['status'])}
                                className="rounded-lg border border-gray-300 px-2 py-0.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(transaction.status)}`}>
                                {getStatusText(transaction.status)}
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
                        <p className="text-sm text-gray-600">
                          {new Date(transaction.date).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                          {transaction.notes && <span className="ml-2">• {transaction.notes}</span>}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-xl font-bold ${getTypeColor(transaction.type)}`}>
                        {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                      <button
                        onClick={() => setTransactionToDelete({ id: transaction.id!, concept: transaction.concept })}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Paginación */}
              <div className="mt-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={goToPage}
                  canGoNext={canGoNext}
                  canGoPrevious={canGoPrevious}
                  startIndex={startIndex}
                  endIndex={endIndex}
                  totalItems={filteredTransactions.length}
                />
              </div>
            </>
            )}
          </CardContent>
        </Card>

        {/* Diálogo de confirmación */}
        <ConfirmDialog
          isOpen={transactionToDelete !== null}
          onClose={() => setTransactionToDelete(null)}
          onConfirm={handleDeleteConfirm}
          title="Eliminar Transacción"
          message={`¿Estás seguro de que deseas eliminar la transacción "${transactionToDelete?.concept}"? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          type="danger"
        />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
