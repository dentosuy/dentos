'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/components/ui/toast'
import { addPatient } from '@/lib/patients'
import { 
  validateName, 
  validateEmail, 
  validatePhone, 
  validateDateOfBirth,
  sanitizeString 
} from '@/lib/validation'
import Link from 'next/link'

/**
 * Página para agregar un nuevo paciente
 */
export default function NewPatientPage() {
  const router = useRouter()
  const { user } = useAuth()
  const toast = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    medicalHistory: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    // Limpiar error del campo
    if (errors[e.target.name]) {
      setErrors(prev => ({ ...prev, [e.target.name]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Validar nombre
    const firstNameValidation = validateName(formData.firstName, 'nombre')
    if (!firstNameValidation.valid) {
      newErrors.firstName = firstNameValidation.error!
    }

    // Validar apellido
    const lastNameValidation = validateName(formData.lastName, 'apellido')
    if (!lastNameValidation.valid) {
      newErrors.lastName = lastNameValidation.error!
    }

    // Validar teléfono
    const phoneValidation = validatePhone(formData.phone)
    if (!phoneValidation.valid) {
      newErrors.phone = phoneValidation.error!
    }

    // Validar fecha de nacimiento
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'La fecha de nacimiento es requerida'
    } else {
      const dobValidation = validateDateOfBirth(formData.dateOfBirth)
      if (!dobValidation.valid) {
        newErrors.dateOfBirth = dobValidation.error!
      }
    }

    // Validar email (opcional)
    if (formData.email) {
      const emailValidation = validateEmail(formData.email)
      if (!emailValidation.valid) {
        newErrors.email = emailValidation.error!
      }
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

      // Sanitizar inputs
      await addPatient(user.uid, {
        firstName: sanitizeString(formData.firstName),
        lastName: sanitizeString(formData.lastName),
        email: formData.email ? sanitizeString(formData.email) : undefined,
        phone: sanitizeString(formData.phone),
        dateOfBirth: new Date(formData.dateOfBirth),
        address: formData.address ? sanitizeString(formData.address) : undefined,
        medicalHistory: formData.medicalHistory ? sanitizeString(formData.medicalHistory) : undefined,
      })
      
      toast.success('Paciente agregado exitosamente')
      router.push('/patients')
    } catch (error: any) {
      toast.error(error.message || 'Error al agregar paciente')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout title="Agregar Nuevo Paciente">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Información del Paciente</CardTitle>
              <CardDescription>
                Completa todos los campos para registrar un nuevo paciente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {errors.general && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-sm text-red-800">{errors.general}</p>
                  </div>
                )}

                {/* Nombre y Apellido */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nombre *"
                    name="firstName"
                    type="text"
                    placeholder="Juan"
                    value={formData.firstName}
                    onChange={handleChange}
                    error={errors.firstName}
                    disabled={isLoading}
                    required
                  />
                  
                  <Input
                    label="Apellido *"
                    name="lastName"
                    type="text"
                    placeholder="Pérez"
                    value={formData.lastName}
                    onChange={handleChange}
                    error={errors.lastName}
                    disabled={isLoading}
                    required
                  />
                </div>

                {/* Email y Teléfono */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Email"
                    name="email"
                    type="email"
                    placeholder="juan@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    error={errors.email}
                    disabled={isLoading}
                  />
                  
                  <Input
                    label="Teléfono *"
                    name="phone"
                    type="tel"
                    placeholder="+54 9 11 1234-5678"
                    value={formData.phone}
                    onChange={handleChange}
                    error={errors.phone}
                    disabled={isLoading}
                    required
                  />
                </div>

                {/* Fecha de Nacimiento */}
                <Input
                  label="Fecha de Nacimiento *"
                  name="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  error={errors.dateOfBirth}
                  disabled={isLoading}
                  required
                />

                {/* Dirección */}
                <Input
                  label="Dirección"
                  name="address"
                  type="text"
                  placeholder="Av. Corrientes 1234, CABA"
                  value={formData.address}
                  onChange={handleChange}
                  error={errors.address}
                  disabled={isLoading}
                />

                {/* Historia Médica */}
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Historia Médica / Notas
                  </label>
                  <textarea
                    name="medicalHistory"
                    rows={4}
                    placeholder="Alergias, medicamentos, condiciones médicas relevantes..."
                    value={formData.medicalHistory}
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
                    Guardar Paciente
                  </Button>
                  
                  <Link href="/patients" className="flex-1">
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
