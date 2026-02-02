'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/components/ui/toast'
import { addPatient } from '@/lib/patients'
import { sanitizeString } from '@/lib/validation'
import { ArrowLeft, Plus, Trash2, Users } from 'lucide-react'
import Link from 'next/link'

interface PatientInGroup {
  id: string
  firstName: string
  phone: string
}

export default function NewPatientGroupPage() {
  const router = useRouter()
  const { user } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [patients, setPatients] = useState<PatientInGroup[]>([
    { id: Date.now().toString(), firstName: '', phone: '' }
  ])

  const addPatientRow = () => {
    setPatients([
      ...patients,
      { id: Date.now().toString(), firstName: '', phone: '' }
    ])
  }

  const removePatientRow = (id: string) => {
    if (patients.length === 1) {
      toast.error('Debe haber al menos un paciente')
      return
    }
    setPatients(patients.filter(p => p.id !== id))
  }

  const updatePatient = (id: string, field: 'firstName' | 'phone', value: string) => {
    setPatients(patients.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) return

    // Validar nombre del grupo
    if (!groupName.trim()) {
      toast.error('El nombre del grupo es requerido')
      return
    }

    if (groupName.trim().length < 2) {
      toast.error('El nombre del grupo debe tener al menos 2 caracteres')
      return
    }

    // Validar pacientes
    const validPatients = patients.filter(p => p.firstName.trim() && p.phone.trim())
    
    if (validPatients.length === 0) {
      toast.error('Debe agregar al menos un paciente con nombre y teléfono')
      return
    }

    // Validar que todos los pacientes tengan nombre y teléfono
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
      console.error('Error al agregar grupo de pacientes:', error)
      toast.error('Error al agregar el grupo de pacientes')
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout title="Agregar Grupo de Pacientes">
        <div className="mb-6">
          <Link href="/patients">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Pacientes
            </Button>
          </Link>
        </div>

        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Nuevo Grupo de Pacientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nombre del grupo */}
              <div>
                <Label htmlFor="groupName">Nombre del Grupo *</Label>
                <Input
                  id="groupName"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Ej: Colegio San José - 3er Grado"
                  required
                  className="text-lg font-semibold"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Este nombre se asignará a todos los pacientes del grupo
                </p>
              </div>

              {/* Lista de pacientes */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <Label>Pacientes del Grupo</Label>
                  <Button
                    type="button"
                    size="sm"
                    onClick={addPatientRow}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Paciente
                  </Button>
                </div>

                <div className="space-y-3">
                  {patients.map((patient, index) => (
                    <div key={patient.id} className="flex gap-3 items-start p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor={`name-${patient.id}`} className="text-xs">
                            Nombre *
                          </Label>
                          <Input
                            id={`name-${patient.id}`}
                            value={patient.firstName}
                            onChange={(e) => updatePatient(patient.id, 'firstName', e.target.value)}
                            placeholder="Nombre del paciente"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`phone-${patient.id}`} className="text-xs">
                            Teléfono *
                          </Label>
                          <Input
                            id={`phone-${patient.id}`}
                            value={patient.phone}
                            onChange={(e) => updatePatient(patient.id, 'phone', e.target.value)}
                            placeholder="Teléfono"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removePatientRow(patient.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-6"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <p className="text-sm text-gray-500 mt-3">
                  💡 Solo completa nombre y teléfono. Puedes agregar más detalles después desde el perfil de cada paciente.
                </p>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-primary-600"
                >
                  {loading ? 'Guardando...' : `Guardar Grupo (${patients.filter(p => p.firstName.trim() && p.phone.trim()).length} pacientes)`}
                </Button>
                <Link href="/patients">
                  <Button type="button" variant="outline">
                    Cancelar
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
