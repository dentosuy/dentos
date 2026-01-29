'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/components/ui/toast'
import { addAppointment } from '@/lib/appointments'
import { getPatients } from '@/lib/patients'
import { sanitizeString } from '@/lib/validation'
import type { Patient } from '@/types'
import Link from 'next/link'

/**
 * Página para agregar una nueva cita
 */
export default function NewAppointmentPage() {
  const router = useRouter()
  const { user } = useAuth()
  const toast = useToast()
  const [patients, setPatients] = useState<Patient[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    patientId: '',
    date: '',
    time: '',
    duration: '30',
    type: 'consultation' as const,
    notes: '',
  })

  useEffect(() => {
    const fetchPatients = async () => {
      if (!user) return
      
      try {
        const data = await getPatients(user.uid)
        setPatients(data)
      } catch (error) {
        console.error('Error al cargar pacientes:', error)
        toast.error('Error al cargar la lista de pacientes')
      }
    }

    fetchPatients()
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    if (errors[e.target.name]) {
      setErrors(prev => ({ ...prev, [e.target.name]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.patientId) {
      newErrors.patientId = 'Debe seleccionar un paciente'
    }

    if (!formData.date) {
      newErrors.date = 'La fecha es requerida'
    } else {
      const selectedDate = new Date(formData.date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (selectedDate < today) {
        newErrors.date = 'No puedes agendar citas en el pasado'
      }
    }

    if (!formData.time) {
      newErrors.time = 'La hora es requerida'
    }

    const duration = parseInt(formData.duration)
    if (isNaN(duration) || duration < 15 || duration > 480) {
      newErrors.duration = 'La duración debe ser entre 15 y 480 minutos'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Por favor corrige los errores en el formulario')
      return
    }

    setIsLoading(true)

    try {
      if (!user) {
        throw new Error('Usuario no autenticado')
      }

      // Combinar fecha y hora correctamente
      const [year, month, day] = formData.date.split('-')
      const [hours, minutes] = formData.time.split(':')
      const appointmentDate = new Date(
        parseInt(year),
        parseInt(month) - 1, // Los meses en JS van de 0-11
        parseInt(day),
        parseInt(hours),
        parseInt(minutes),
        0,
        0
      )

      await addAppointment(user.uid, {
        patientId: formData.patientId,
        date: appointmentDate,
        duration: parseInt(formData.duration),
        type: formData.type,
        status: 'scheduled',
        notes: formData.notes.trim() ? sanitizeString(formData.notes.trim()) : undefined,
      })
      
      toast.success('Cita agendada exitosamente')
      router.push('/appointments')
    } catch (error: any) {
      toast.error(error.message || 'Error al agendar la cita')
    } finally {
      setIsLoading(false)
    }
  }

  if (patients.length === 0) {
    return (
      <ProtectedRoute>
        <DashboardLayout title="Agregar Nueva Cita">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">
                  No tienes pacientes registrados. Debes agregar pacientes antes de crear citas.
                </p>
                <Link href="/patients/new">
                  <Button>Agregar Paciente</Button>
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
      <DashboardLayout title="Agregar Nueva Cita">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Información de la Cita</CardTitle>
              <CardDescription>
                Completa los datos para agendar una nueva cita
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {errors.general && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-sm text-red-800">{errors.general}</p>
                  </div>
                )}

                {/* Seleccionar Paciente */}
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paciente *
                  </label>
                  <select
                    name="patientId"
                    value={formData.patientId}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                    className="flex h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Seleccionar paciente...</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.firstName} {patient.lastName}
                      </option>
                    ))}
                  </select>
                  {errors.patientId && (
                    <p className="mt-1 text-sm text-red-600">{errors.patientId}</p>
                  )}
                </div>

                {/* Fecha y Hora */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Fecha *"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleChange}
                    error={errors.date}
                    disabled={isLoading}
                    required
                  />
                  
                  <Input
                    label="Hora *"
                    name="time"
                    type="time"
                    value={formData.time}
                    onChange={handleChange}
                    error={errors.time}
                    disabled={isLoading}
                    required
                  />
                </div>

                {/* Duración y Tipo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duración (minutos) *
                    </label>
                    <select
                      name="duration"
                      value={formData.duration}
                      onChange={handleChange}
                      disabled={isLoading}
                      className="flex h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="15">15 minutos</option>
                      <option value="30">30 minutos</option>
                      <option value="45">45 minutos</option>
                      <option value="60">60 minutos</option>
                      <option value="90">90 minutos</option>
                    </select>
                  </div>

                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Consulta *
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      disabled={isLoading}
                      className="flex h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="consultation">Consulta</option>
                      <option value="cleaning">Limpieza</option>
                      <option value="treatment">Tratamiento</option>
                      <option value="emergency">Emergencia</option>
                      <option value="other">Otro</option>
                    </select>
                  </div>
                </div>

                {/* Notas */}
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas / Observaciones
                  </label>
                  <textarea
                    name="notes"
                    rows={4}
                    placeholder="Motivo de la consulta, síntomas, preparación necesaria..."
                    value={formData.notes}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="flex w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                {/* Botones */}
                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    isLoading={isLoading}
                    className="flex-1"
                  >
                    Agendar Cita
                  </Button>
                  
                  <Link href="/appointments" className="flex-1">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      disabled={isLoading}
                    >
                      Cancelar
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
