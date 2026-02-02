'use client'

import { useEffect, useState } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { EmptyPatientsCard } from '@/components/patients/empty-patients-card'
import { PatientCard } from '@/components/patients/patient-card'
import { Pagination } from '@/components/ui/pagination'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/components/ui/toast'
import { usePagination } from '@/hooks/use-pagination'
import { getPatients, markMonthlyPaymentAsPaid, markMonthlyPaymentAsUnpaid, hasPatientPaidThisMonth } from '@/lib/patients'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import type { Patient } from '@/types'

/**
 * Página principal de Pacientes
 */
export default function PatientsPage() {
  const { user } = useAuth()
  const toast = useToast()
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [updatingPayment, setUpdatingPayment] = useState<string | null>(null)

  // Obtener grupos únicos con cantidad de pacientes y estadísticas de pago
  const groups = patients.reduce((acc, patient) => {
    if (patient.groupName) {
      if (!acc[patient.groupName]) {
        acc[patient.groupName] = { total: 0, paid: 0 }
      }
      acc[patient.groupName].total++
      if (hasPatientPaidThisMonth(patient)) {
        acc[patient.groupName].paid++
      }
    }
    return acc
  }, {} as Record<string, { total: number; paid: number }>)

  // Función para alternar el estado de pago
  const togglePaymentStatus = async (patient: Patient, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (updatingPayment) return
    
    try {
      setUpdatingPayment(patient.id)
      const isPaid = hasPatientPaidThisMonth(patient)
      
      if (isPaid) {
        await markMonthlyPaymentAsUnpaid(patient.id)
        toast.success(`Mensualidad marcada como NO pagada`)
      } else {
        await markMonthlyPaymentAsPaid(patient.id)
        toast.success(`Mensualidad marcada como pagada`)
      }
      
      // Recargar pacientes
      const data = await getPatients(user!.uid)
      setPatients(data)
    } catch (error) {
      console.error('Error al actualizar estado de pago:', error)
      toast.error('Error al actualizar el estado de pago')
    } finally {
      setUpdatingPayment(null)
    }
  }

  // Filtrar pacientes por búsqueda y grupo seleccionado
  const filteredPatients = patients.filter(patient => {
    // NUNCA mostrar pacientes que tienen grupo como cards individuales
    // (excepto cuando hay búsqueda o cuando un grupo está seleccionado)
    
    // Si hay un grupo seleccionado, mostrar solo los pacientes de ese grupo para la lista
    if (selectedGroup) {
      return patient.groupName === selectedGroup
    }

    // Si hay búsqueda, buscar en todos los pacientes (incluidos los de grupos)
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        patient.firstName.toLowerCase().includes(query) ||
        patient.lastName.toLowerCase().includes(query) ||
        patient.email?.toLowerCase().includes(query) ||
        patient.phone.includes(query) ||
        patient.groupName?.toLowerCase().includes(query)
      )
    }

    // Por defecto, solo mostrar pacientes SIN grupo
    return !patient.groupName
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
    data: filteredPatients,
    itemsPerPage: 12
  })

  useEffect(() => {
    const fetchPatients = async () => {
      if (!user) return
      
      try {
        setLoading(true)
        const data = await getPatients(user.uid)
        setPatients(data)
      } catch (error) {
        console.error('Error al cargar pacientes:', error)
        toast.error('Error al cargar pacientes')
      } finally {
        setLoading(false)
      }
    }

    fetchPatients()
  }, [user, toast])

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout title="Pacientes">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando pacientes...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout title="Pacientes">
        {patients.length === 0 ? (
          <EmptyPatientsCard />
        ) : (
          <div>
            {/* Barra de búsqueda y botón agregar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div className="w-full md:w-96">
                <Input
                  type="text"
                  placeholder="Buscar por nombre, email o teléfono..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Link href="/patients/group/new">
                  <Button size="lg" variant="outline" className="border-primary-600 text-primary-600 hover:bg-primary-50">
                    👥 Agregar Grupo
                  </Button>
                </Link>
                <Link href="/patients/new">
                  <Button size="lg">
                    ➕ Agregar Paciente
                  </Button>
                </Link>
              </div>
            </div>

            {/* Contador de resultados */}
            {searchQuery && (
              <div className="mb-4 text-sm text-gray-600">
                {filteredPatients.length} paciente{filteredPatients.length !== 1 ? 's' : ''} encontrado{filteredPatients.length !== 1 ? 's' : ''}
              </div>
            )}

            {/* Filtro de grupo activo */}
            {selectedGroup && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm text-gray-600">Grupo:</span>
                  <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                    👥 {selectedGroup}
                  </span>
                  <button
                    onClick={() => setSelectedGroup(null)}
                    className="text-sm text-primary-600 hover:text-primary-800 underline"
                  >
                    ← Volver a todos los pacientes
                  </button>
                </div>

                {/* Lista de pacientes del grupo */}
                <div className="bg-white rounded-lg shadow">
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Pacientes del grupo ({filteredPatients.length})
                    </h3>
                    <Link href={`/patients/group/add?groupName=${encodeURIComponent(selectedGroup)}`}>
                      <Button size="sm">
                        ➕ Agregar pacientes
                      </Button>
                    </Link>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {filteredPatients.map((patient) => {
                      const isPaid = hasPatientPaidThisMonth(patient)
                      return (
                        <div
                          key={patient.id}
                          className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
                        >
                          <Link
                            href={`/patients/${patient.id}`}
                            className="flex-1"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-base font-semibold text-gray-900">
                                  {patient.firstName} {patient.lastName}
                                </h4>
                                <div className="flex gap-4 mt-1 text-sm text-gray-600">
                                  <span>📧 {patient.email || 'Sin email'}</span>
                                  <span>📱 {patient.phone}</span>
                                </div>
                              </div>
                              <span className="text-primary-600 hover:text-primary-800 mr-4">
                                Ver detalles →
                              </span>
                            </div>
                          </Link>
                          
                          {/* Indicador de pago clickeable */}
                          <button
                            onClick={(e) => togglePaymentStatus(patient, e)}
                            disabled={updatingPayment === patient.id}
                            className={`ml-4 px-4 py-2 rounded-lg font-medium transition-all ${
                              isPaid
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                            } ${updatingPayment === patient.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            {updatingPayment === patient.id ? '...' : isPaid ? '✓ Pagado' : '✗ No pagado'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Grid de cards: grupos + pacientes individuales (solo si no hay grupo seleccionado) */}
            {!selectedGroup && (currentData.length > 0 || (!searchQuery && Object.keys(groups).length > 0)) ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Cards de grupos (siempre visibles si no hay búsqueda) */}
                  {!searchQuery && Object.entries(groups).map(([groupName, stats]) => (
                    <div
                      key={`group-${groupName}`}
                      onClick={() => setSelectedGroup(groupName)}
                      className="cursor-pointer"
                    >
                      <Card className="hover:shadow-lg transition-all hover:border-primary-300 h-full">
                        <div className="pb-3 pt-6 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="text-xl">👥</span>
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900">{groupName}</h3>
                              <p className="text-sm text-gray-500">{stats.total} pacientes</p>
                            </div>
                          </div>
                        </div>
                        <div className="px-6 pb-6 space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>✅</span>
                            <span>Pagaron mensualidad: {stats.paid}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>⏳</span>
                            <span>No pagaron mensualidad: {stats.total - stats.paid}</span>
                          </div>
                        </div>
                      </Card>
                    </div>
                  ))}
                  
                  {/* Cards de pacientes individuales (sin grupo) */}
                  {currentData.map((patient) => (
                    <PatientCard key={patient.id} patient={patient} />
                  ))}
                </div>

                {/* Paginación (solo para pacientes, no para grupos) */}
                {!searchQuery && filteredPatients.length > 0 && (
                  <div className="mt-6">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={goToPage}
                      canGoNext={canGoNext}
                      canGoPrevious={canGoPrevious}
                      startIndex={startIndex}
                      endIndex={endIndex}
                      totalItems={filteredPatients.length}
                    />
                  </div>
                )}
              </>
            ) : !selectedGroup ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-500">No se encontraron pacientes con ese criterio de búsqueda</p>
              </div>
            ) : null}
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  )
}
