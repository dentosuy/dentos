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
import { getPatients } from '@/lib/patients'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

  // Filtrar pacientes por búsqueda
  const filteredPatients = patients.filter(patient => {
    const query = searchQuery.toLowerCase()
    return (
      patient.firstName.toLowerCase().includes(query) ||
      patient.lastName.toLowerCase().includes(query) ||
      patient.email?.toLowerCase().includes(query) ||
      patient.phone.includes(query)
    )
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

            {/* Grid de pacientes */}
            {currentData.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentData.map((patient) => (
                    <PatientCard key={patient.id} patient={patient} />
                  ))}
                </div>

                {/* Paginación */}
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
              </>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-500">No se encontraron pacientes con ese criterio de búsqueda</p>
              </div>
            )}
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  )
}
