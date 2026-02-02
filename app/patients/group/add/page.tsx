'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/components/ui/toast'
import { addPatient } from '@/lib/patients'
import { sanitizeString } from '@/lib/validation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'

interface PatientRow {
  id: string
  firstName: string
  phone: string
}

/**
 * Página para agregar pacientes a un grupo existente
 */
export default function AddToGroupPage() {
  const { user } = useAuth()
  const router = useRouter()
  const toast = useToast()
  const searchParams = useSearchParams()
  const groupName = searchParams.get('groupName') || ''
  
  const [patients, setPatients] = useState<PatientRow[]>([
    { id: '1', firstName: '', phone: '' }
  ])
  const [loading, setLoading] = useState(false)

  // Si no hay groupName en la URL, redirigir
  useEffect(() => {
    if (!groupName) {
      router.push('/patients')
    }
  }, [groupName, router])

  const addPatientRow = () => {
    const newId = (Math.max(...patients.map(p => parseInt(p.id))) + 1).toString()
    setPatients([...patients, { id: newId, firstName: '', phone: '' }])
  }

  const removePatientRow = (id: string) => {
    if (patients.length === 1) {
      toast.error('Debe haber al menos un paciente')
      return
    }
    setPatients(patients.filter(p => p.id !== id))
  }

  const updatePatient = (id: string, field: keyof PatientRow, value: string) => {
    setPatients(patients.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast.error('Debe iniciar sesión')
      return
    }

    // Filtrar pacientes con datos completos
    const validPatients = patients.filter(p => p.firstName.trim() && p.phone.trim())

    if (validPatients.length === 0) {
      toast.error('Debe agregar al menos un paciente con nombre y teléfono')
      return
    }

    // Verificar que todos los pacientes tengan nombre y teléfono
    const invalidPatients = patients.filter(p => 
      (p.firstName.trim() && !p.phone.trim()) || (!p.firstName.trim() && p.phone.trim())
    )

    if (invalidPatients.length > 0) {
      toast.error('Todos los pacientes deben tener nombre y teléfono, o déjelos vacíos')
      return
    }

    try {
      setLoading(true)

      // Crear todos los pacientes
      const promises = validPatients.map(patient => 
        addPatient(user.uid, {
          firstName: sanitizeString(patient.firstName.trim()),
          lastName: '', // Vacío para pacientes de grupo
          phone: patient.phone.trim(),
          dateOfBirth: new Date('2010-01-01'), // Fecha por defecto para niños
          groupName: sanitizeString(groupName.trim())
        })
      )

      await Promise.all(promises)

      toast.success(`${validPatients.length} paciente(s) agregado(s) al grupo "${groupName}"`)
      router.push('/patients')
    } catch (error) {
      console.error('Error al agregar pacientes al grupo:', error)
      toast.error('Error al agregar pacientes al grupo')
      setLoading(false)
    }
  }

  if (!groupName) return null

  return (
    <ProtectedRoute>
      <DashboardLayout title={`Agregar pacientes a: ${groupName}`}>
        <div className="mb-6">
          <Link href="/patients">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Pacientes
            </Button>
          </Link>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Agregar pacientes al grupo: {groupName}
              </h2>
              <p className="text-sm text-gray-600">
                Complete los datos de los nuevos pacientes que se agregarán a este grupo.
              </p>
            </div>

            <div className="space-y-4">
              {patients.map((patient, index) => (
                <div key={patient.id} className="flex gap-4 items-end">
                  <div className="flex-1">
                    <Label htmlFor={`firstName-${patient.id}`}>
                      Nombre del paciente {index + 1}
                    </Label>
                    <Input
                      id={`firstName-${patient.id}`}
                      value={patient.firstName}
                      onChange={(e) => updatePatient(patient.id, 'firstName', e.target.value)}
                      placeholder="Ej: Juan"
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="flex-1">
                    <Label htmlFor={`phone-${patient.id}`}>
                      Teléfono
                    </Label>
                    <Input
                      id={`phone-${patient.id}`}
                      value={patient.phone}
                      onChange={(e) => updatePatient(patient.id, 'phone', e.target.value)}
                      placeholder="Ej: 099 123 456"
                      disabled={loading}
                    />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removePatientRow(patient.id)}
                    disabled={loading || patients.length === 1}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={addPatientRow}
              disabled={loading}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar otro paciente
            </Button>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Guardando...' : `Agregar pacientes al grupo`}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/patients')}
                disabled={loading}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
