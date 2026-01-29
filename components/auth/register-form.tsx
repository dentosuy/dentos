'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { registerDentist } from '@/lib/auth'
import { validateEmail, validatePassword, validateName, sanitizeString } from '@/lib/validation'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Formulario de registro para nuevos dentistas
 */
export function RegisterForm() {
  const router = useRouter()
  const toast = useToast()
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
    licenseNumber: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[e.target.name]) {
      setErrors(prev => ({ ...prev, [e.target.name]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Validar nombre completo
    const nameValidation = validateName(formData.displayName, 'nombre completo')
    if (!nameValidation.valid) {
      newErrors.displayName = nameValidation.error!
    }

    // Validar email
    const emailValidation = validateEmail(formData.email)
    if (!emailValidation.valid) {
      newErrors.email = emailValidation.error!
    }

    // Validar contraseña
    const passwordValidation = validatePassword(formData.password)
    if (!passwordValidation.valid) {
      newErrors.password = passwordValidation.error!
    }

    // Validar confirmación de contraseña
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Debes confirmar la contraseña'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden'
    }

    // Validar número de licencia
    if (!formData.licenseNumber.trim()) {
      newErrors.licenseNumber = 'El número de licencia es requerido'
    } else if (formData.licenseNumber.trim().length < 3) {
      newErrors.licenseNumber = 'El número de licencia es muy corto'
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
      // Sanitizar inputs antes de enviar
      await registerDentist(
        sanitizeString(formData.email.trim()),
        formData.password, // No sanitizar contraseñas
        sanitizeString(formData.displayName),
        sanitizeString(formData.licenseNumber.trim())
      )
      
      toast.success('¡Cuenta creada exitosamente! Redirigiendo...')
      
      // Esperar un momento para que Firebase Auth sincronice
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      router.push('/dashboard')
    } catch (err: any) {
      toast.error(err.message || 'Error al crear la cuenta')
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-3xl font-bold text-center">
          Crear Cuenta
        </CardTitle>
        <CardDescription className="text-center">
          Regístrate como dentista en DentOS
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre completo"
            name="displayName"
            type="text"
            placeholder="Dr. Juan Pérez"
            value={formData.displayName}
            onChange={handleChange}
            error={errors.displayName}
            disabled={isLoading}
            required
          />
          
          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="tu@email.com"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            disabled={isLoading}
            required
          />
          
          <Input
            label="Número de licencia profesional"
            name="licenseNumber"
            type="text"
            placeholder="12345678"
            value={formData.licenseNumber}
            onChange={handleChange}
            error={errors.licenseNumber}
            disabled={isLoading}
            required
          />
          
          <Input
            label="Contraseña"
            name="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            disabled={isLoading}
            required
          />
          
          <Input
            label="Confirmar contraseña"
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            disabled={isLoading}
            required
          />

          <Button
            type="submit"
            className="w-full"
            isLoading={isLoading}
          >
            Crear Cuenta
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <div className="text-sm text-center text-gray-600">
          ¿Ya tienes una cuenta?{' '}
          <Link 
            href="/login" 
            className="text-primary-600 hover:text-primary-700 font-medium hover:underline"
          >
            Inicia sesión
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}
