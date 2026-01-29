'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'
import { getAppointment, updateAppointment } from '@/lib/appointments'
import { getPatient } from '@/lib/patients'
import { getStockItems } from '@/lib/stock'
import { getAppointmentMaterials, addAppointmentMaterial, deleteAppointmentMaterial } from '@/lib/appointment-materials'
import { addTransaction, updateTransaction } from '@/lib/transactions'
import { getVisitByAppointment } from '@/lib/visits'
import type { Appointment, Patient, StockItem, AppointmentMaterial, Visit } from '@/types'
import Link from 'next/link'
import { Calendar, Clock, FileText, Package, Trash2, X, DollarSign, CheckCircle, Edit2 } from 'lucide-react'

export default function AppointmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const appointmentId = params.id as string

  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [patient, setPatient] = useState<Patient | null>(null)
  const [materials, setMaterials] = useState<AppointmentMaterial[]>([])
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [visit, setVisit] = useState<Visit | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddMaterial, setShowAddMaterial] = useState(false)
  const [showAddPrice, setShowAddPrice] = useState(false)
  
  // Form state para agregar material
  const [selectedStockId, setSelectedStockId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  // Form state para agregar precio
  const [price, setPrice] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'transferencia' | 'tarjeta-debito' | 'tarjeta-credito' | 'mercadopago' | 'otro'>('efectivo')
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending' | 'partial'>('paid')
  const [isSavingPrice, setIsSavingPrice] = useState(false)

  // Estado para editar pago
  const [isEditingPayment, setIsEditingPayment] = useState(false)
  const [editPaymentStatus, setEditPaymentStatus] = useState<'paid' | 'pending' | 'partial'>('paid')
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      try {
        setLoading(true)
        
        const [appointmentData, stockData, materialsData] = await Promise.all([
          getAppointment(appointmentId),
          getStockItems(user.uid),
          getAppointmentMaterials(appointmentId)
        ])

        if (appointmentData) {
          setAppointment(appointmentData)
          
          // Cargar datos del paciente
          const patientData = await getPatient(appointmentData.patientId)
          setPatient(patientData)

          // Verificar si ya existe una visita para esta cita
          const existingVisit = await getVisitByAppointment(appointmentId)
          setVisit(existingVisit)
        }

        setStockItems(stockData)
        setMaterials(materialsData)
      } catch (error) {
        console.error('Error al cargar datos:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, appointmentId])

  const handleAddMaterial = async () => {
    if (!selectedStockId || !quantity || parseFloat(quantity) <= 0) {
      alert('Selecciona un material y una cantidad válida')
      return
    }

    const stockItem = stockItems.find(item => item.id === selectedStockId)
    if (!stockItem) return

    setIsAdding(true)

    try {
      const newMaterial = await addAppointmentMaterial({
        appointmentId,
        stockItemId: stockItem.id!,
        stockItemName: stockItem.name,
        category: stockItem.category,
        quantityUsed: parseFloat(quantity),
        unit: stockItem.unit,
        cost: stockItem.cost,
      })

      setMaterials(prev => [newMaterial, ...prev])
      setSelectedStockId('')
      setQuantity('')
      setShowAddMaterial(false)
    } catch (error: any) {
      alert(error.message || 'Error al agregar material')
    } finally {
      setIsAdding(false)
    }
  }

  const handleDeleteMaterial = async (material: AppointmentMaterial) => {
    if (!confirm(`¿Eliminar ${material.stockItemName} de esta cita?`)) {
      return
    }

    try {
      await deleteAppointmentMaterial(material.id, material.stockItemId, material.quantityUsed)
      setMaterials(prev => prev.filter(m => m.id !== material.id))
    } catch (error: any) {
      alert(error.message || 'Error al eliminar material')
    }
  }

  const handleSavePrice = async () => {
    if (!price || parseFloat(price) <= 0) {
      alert('Ingrese un precio válido')
      return
    }

    if (!user || !appointment || !patient) return

    const priceAmount = parseFloat(price)

    try {
      setIsSavingPrice(true)

      // Crear transacción en finanzas
      const transaction = await addTransaction(user.uid, {
        type: 'income',
        concept: `${appointment.type === 'consultation' ? 'Consulta' : 
                   appointment.type === 'cleaning' ? 'Limpieza' :
                   appointment.type === 'treatment' ? 'Tratamiento' :
                   appointment.type === 'emergency' ? 'Emergencia' : 'Servicio'} - ${patient.firstName} ${patient.lastName}`,
        amount: priceAmount,
        category: appointment.type === 'consultation' ? 'consulta' :
                  appointment.type === 'cleaning' ? 'limpieza' :
                  appointment.type === 'treatment' ? 'tratamiento' : 'otro',
        date: new Date().toISOString(),
        paymentMethod: paymentMethod,
        status: paymentStatus,
        patientId: appointment.patientId,
        appointmentId: appointmentId,
      })

      // Actualizar la cita con el precio y la referencia a la transacción
      await updateAppointment(appointmentId, {
        price: priceAmount,
        paymentStatus: paymentStatus,
        transactionId: transaction.id,
      })

      // Actualizar estado local
      setAppointment({
        ...appointment,
        price: priceAmount,
        paymentStatus: paymentStatus,
        transactionId: transaction.id,
      })

      setShowAddPrice(false)
      setPrice('')
      alert('Precio registrado y transacción creada exitosamente')
    } catch (error: any) {
      console.error('Error al guardar precio:', error)
      alert(error.message || 'Error al guardar precio')
    } finally {
      setIsSavingPrice(false)
    }
  }

  const handleUpdatePaymentStatus = async () => {
    if (!appointment || !appointment.transactionId) return

    try {
      setIsUpdatingPayment(true)

      // Actualizar la transacción
      await updateTransaction(appointment.transactionId, {
        status: editPaymentStatus,
      })

      // Actualizar la cita
      await updateAppointment(appointmentId, {
        paymentStatus: editPaymentStatus,
      })

      // Actualizar estado local
      setAppointment({
        ...appointment,
        paymentStatus: editPaymentStatus,
      })

      setIsEditingPayment(false)
      alert('Estado de pago actualizado exitosamente')
    } catch (error: any) {
      console.error('Error al actualizar estado de pago:', error)
      alert(error.message || 'Error al actualizar estado de pago')
    } finally {
      setIsUpdatingPayment(false)
    }
  }

  const getStatusColor = (status: Appointment['status']) => {
    const colors = {
      scheduled: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return colors[status]
  }

  const getStatusText = (status: Appointment['status']) => {
    const texts = {
      scheduled: 'Programada',
      confirmed: 'Confirmada',
      completed: 'Completada',
      cancelled: 'Cancelada',
    }
    return texts[status]
  }

  const getTypeText = (type: Appointment['type']) => {
    const types = {
      consultation: 'Consulta',
      cleaning: 'Limpieza',
      treatment: 'Tratamiento',
      emergency: 'Emergencia',
      other: 'Otro',
    }
    return types[type]
  }

  const getCategoryColor = (category: StockItem['category']) => {
    const colors = {
      material: 'bg-blue-100 text-blue-800',
      instrument: 'bg-purple-100 text-purple-800',
      medication: 'bg-green-100 text-green-800',
      consumable: 'bg-yellow-100 text-yellow-800',
      other: 'bg-gray-100 text-gray-800',
    }
    return colors[category]
  }

  const totalCost = materials.reduce((sum, m) => {
    return sum + (m.cost ? m.cost * m.quantityUsed : 0)
  }, 0)

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout title="Detalle de Cita">
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-600">Cargando...</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (!appointment || !patient) {
    return (
      <ProtectedRoute>
        <DashboardLayout title="Detalle de Cita">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No se encontró la cita.</p>
                <Link href="/appointments">
                  <Button>Volver a Agenda</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout title="Detalle de Cita">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Información de la cita */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl mb-2">
                    {patient.firstName} {patient.lastName}
                  </CardTitle>
                  <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                      {getStatusText(appointment.status)}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {getTypeText(appointment.type)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {visit ? (
                    <Link href={`/patients/${patient.id}/visits`}>
                      <Button variant="outline" size="sm" className="bg-green-50 border-green-300 text-green-700 hover:bg-green-100">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Ver Visita Registrada
                      </Button>
                    </Link>
                  ) : (
                    <Link href={`/patients/${patient.id}/visits?fromAppointment=${appointmentId}`}>
                      <Button variant="outline" size="sm" className="bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100">
                        <Calendar className="w-4 h-4 mr-2" />
                        Registrar Visita
                      </Button>
                    </Link>
                  )}
                  <Link href={`/appointments/${appointmentId}/edit`}>
                    <Button variant="outline" size="sm">
                      Editar Cita
                    </Button>
                  </Link>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Fecha</p>
                    <p className="font-medium">
                      {new Date(appointment.date).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Hora</p>
                    <p className="font-medium">
                      {new Date(appointment.date).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })} ({appointment.duration} min)
                    </p>
                  </div>
                </div>
              </div>

              {appointment.notes && (
                <div className="flex items-start gap-3 pt-4 border-t">
                  <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Notas</p>
                    <p className="text-gray-900">{appointment.notes}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Materiales usados */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Materiales Usados
                </CardTitle>
                <Button
                  onClick={() => setShowAddMaterial(!showAddMaterial)}
                  size="sm"
                >
                  {showAddMaterial ? 'Cancelar' : '+ Agregar Material'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Formulario para agregar material */}
              {showAddMaterial && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Material *
                      </label>
                      <select
                        value={selectedStockId}
                        onChange={(e) => setSelectedStockId(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">Seleccionar material...</option>
                        {stockItems.map(item => (
                          <option key={item.id} value={item.id}>
                            {item.name} ({item.quantity} {item.unit} disponibles)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cantidad *
                      </label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="0"
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleAddMaterial}
                    isLoading={isAdding}
                    className="w-full"
                  >
                    Agregar Material
                  </Button>
                </div>
              )}

              {/* Lista de materiales */}
              {materials.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No se han registrado materiales para esta cita</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {materials.map(material => (
                    <div
                      key={material.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900">
                            {material.stockItemName}
                          </h4>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(material.category)}`}>
                            {material.category}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {material.quantityUsed} {material.unit}
                          {material.cost && (
                            <span className="ml-2">
                              • ${(material.cost * material.quantityUsed).toFixed(2)}
                            </span>
                          )}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeleteMaterial(material)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {totalCost > 0 && (
                    <div className="pt-4 border-t flex justify-between items-center">
                      <span className="font-semibold text-gray-900">Costo Total de Materiales:</span>
                      <span className="text-xl font-bold text-primary-600">
                        ${totalCost.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Precio y pago */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Precio y Pago
                </CardTitle>
                {!appointment.price && (
                  <Button
                    onClick={() => setShowAddPrice(!showAddPrice)}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {showAddPrice ? 'Cancelar' : '+ Registrar Precio'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Formulario para agregar precio */}
              {showAddPrice && !appointment.price && (
                <div className="bg-green-50 rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Precio *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder="0.00"
                          className="w-full rounded-lg border border-gray-300 pl-7 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Método de Pago *
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="efectivo">Efectivo</option>
                        <option value="transferencia">Transferencia</option>
                        <option value="tarjeta-debito">Tarjeta Débito</option>
                        <option value="tarjeta-credito">Tarjeta Crédito</option>
                        <option value="mercadopago">MercadoPago</option>
                        <option value="otro">Otro</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estado *
                      </label>
                      <select
                        value={paymentStatus}
                        onChange={(e) => setPaymentStatus(e.target.value as any)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="paid">Pagado</option>
                        <option value="pending">Pendiente</option>
                        <option value="partial">Parcial</option>
                      </select>
                    </div>
                  </div>

                  <Button
                    onClick={handleSavePrice}
                    isLoading={isSavingPrice}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    Guardar Precio y Crear Transacción
                  </Button>
                </div>
              )}

              {/* Mostrar precio registrado */}
              {appointment.price ? (
                <div className="bg-green-50 rounded-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Precio Registrado</h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Monto:</span>
                          <span className="text-2xl font-bold text-green-600">
                            ${appointment.price.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        {appointment.paymentStatus && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Estado:</span>
                            <div className="flex items-center gap-2">
                              {!isEditingPayment ? (
                                <>
                                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    appointment.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                                    appointment.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-blue-100 text-blue-800'
                                  }`}>
                                    {appointment.paymentStatus === 'paid' ? 'Pagado' :
                                     appointment.paymentStatus === 'pending' ? 'Pendiente' : 'Parcial'}
                                  </span>
                                  <button
                                    onClick={() => {
                                      setEditPaymentStatus(appointment.paymentStatus || 'paid')
                                      setIsEditingPayment(true)
                                    }}
                                    className="p-1.5 text-gray-600 hover:bg-white rounded-lg transition-colors"
                                    title="Editar estado"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <select
                                    value={editPaymentStatus}
                                    onChange={(e) => setEditPaymentStatus(e.target.value as any)}
                                    className="rounded-lg border border-gray-300 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                  >
                                    <option value="paid">Pagado</option>
                                    <option value="pending">Pendiente</option>
                                    <option value="partial">Parcial</option>
                                  </select>
                                  <Button
                                    onClick={handleUpdatePaymentStatus}
                                    isLoading={isUpdatingPayment}
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 h-8"
                                  >
                                    Guardar
                                  </Button>
                                  <button
                                    onClick={() => setIsEditingPayment(false)}
                                    className="p-1.5 text-gray-600 hover:bg-white rounded-lg transition-colors"
                                    title="Cancelar"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        {appointment.transactionId && (
                          <div className="pt-2 border-t border-green-200 mt-3">
                            <Link href="/finances" className="text-sm text-green-600 hover:text-green-700 font-medium">
                              Ver en Finanzas →
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No se ha registrado un precio para esta cita</p>
                  <p className="text-sm mt-1">Haz clic en "Registrar Precio" para agregar el monto</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botón volver */}
          <div className="flex justify-center">
            <Link href="/appointments">
              <Button variant="outline">
                Volver a la Agenda
              </Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
