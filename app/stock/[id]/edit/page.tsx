'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/components/ui/toast'
import { getStockItem, updateStockItem } from '@/lib/stock'
import { sanitizeString, validatePrice } from '@/lib/validation'
import type { StockItem } from '@/types'
import Link from 'next/link'

/**
 * Página para editar un item del stock
 */
export default function EditStockItemPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const toast = useToast()
  const [stockItem, setStockItem] = useState<StockItem | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState<{
    name: string
    category: 'material' | 'instrument' | 'medication' | 'consumable' | 'other'
    quantity: string
    unit: string
    minQuantity: string
    location: string
    supplier: string
    cost: string
    expirationDate: string
    notes: string
  }>({
    name: '',
    category: 'material',
    quantity: '',
    unit: 'unidades',
    minQuantity: '',
    location: '',
    supplier: '',
    cost: '',
    expirationDate: '',
    notes: '',
  })

  const stockItemId = params.id as string

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingData(true)
        const data = await getStockItem(stockItemId)
        
        if (data) {
          setStockItem(data)
          
          setFormData({
            name: data.name,
            category: data.category,
            quantity: data.quantity.toString(),
            unit: data.unit,
            minQuantity: data.minQuantity.toString(),
            location: data.location || '',
            supplier: data.supplier || '',
            cost: data.cost?.toString() || '',
            expirationDate: data.expirationDate 
              ? new Date(data.expirationDate).toISOString().split('T')[0]
              : '',
            notes: data.notes || '',
          })
        }
      } catch (error) {
        console.error('Error al cargar item:', error)
        toast.error('Error al cargar el item del stock')
      } finally {
        setIsLoadingData(false)
      }
    }

    fetchData()
  }, [stockItemId])

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

    // Validar nombre
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres'
    } else if (formData.name.trim().length > 200) {
      newErrors.name = 'El nombre es demasiado largo'
    }

    // Validar cantidad
    if (!formData.quantity) {
      newErrors.quantity = 'La cantidad es requerida'
    } else if (isNaN(parseFloat(formData.quantity)) || parseFloat(formData.quantity) < 0) {
      newErrors.quantity = 'La cantidad debe ser un número mayor o igual a 0'
    }

    // Validar unidad
    if (!formData.unit.trim()) {
      newErrors.unit = 'La unidad es requerida'
    } else if (formData.unit.trim().length > 50) {
      newErrors.unit = 'La unidad es demasiado larga'
    }

    // Validar cantidad mínima
    if (!formData.minQuantity) {
      newErrors.minQuantity = 'La cantidad mínima es requerida'
    } else if (isNaN(parseFloat(formData.minQuantity)) || parseFloat(formData.minQuantity) < 0) {
      newErrors.minQuantity = 'La cantidad mínima debe ser un número mayor o igual a 0'
    }

    // Validar costo (opcional)
    if (formData.cost) {
      const costValidation = validatePrice(formData.cost)
      if (!costValidation.valid) {
        newErrors.cost = costValidation.error!
      }
    }

    // Validar fecha de vencimiento (opcional)
    if (formData.expirationDate) {
      const expDate = new Date(formData.expirationDate)
      if (isNaN(expDate.getTime())) {
        newErrors.expirationDate = 'Fecha inválida'
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

      // Sanitizar todos los inputs de texto
      await updateStockItem(stockItemId, {
        name: sanitizeString(formData.name.trim()),
        category: formData.category,
        quantity: parseFloat(formData.quantity),
        unit: sanitizeString(formData.unit.trim()),
        minQuantity: parseFloat(formData.minQuantity),
        location: formData.location.trim() ? sanitizeString(formData.location.trim()) : undefined,
        supplier: formData.supplier.trim() ? sanitizeString(formData.supplier.trim()) : undefined,
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
        expirationDate: formData.expirationDate ? new Date(formData.expirationDate) : undefined,
        notes: formData.notes.trim() ? sanitizeString(formData.notes.trim()) : undefined,
      })
      
      toast.success('Item actualizado exitosamente')
      router.push('/stock')
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar el item')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingData) {
    return (
      <ProtectedRoute>
        <DashboardLayout title="Editar Item">
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-600">Cargando...</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (!stockItem) {
    return (
      <ProtectedRoute>
        <DashboardLayout title="Editar Item">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No se encontró el item.</p>
                <Link href="/stock">
                  <Button>Volver al Stock</Button>
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
      <DashboardLayout title="Editar Item del Stock">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Editar Item de Inventario</CardTitle>
              <CardDescription>
                Actualiza la información del item
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {errors.general && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-sm text-red-800">{errors.general}</p>
                  </div>
                )}

                {/* Nombre y Categoría */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nombre del Item *"
                    name="name"
                    type="text"
                    placeholder="Ej: Guantes de látex, Anestesia, etc."
                    value={formData.name}
                    onChange={handleChange}
                    error={errors.name}
                    disabled={isLoading}
                    required
                  />

                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categoría *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      disabled={isLoading}
                      className="flex h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="material">Material</option>
                      <option value="instrument">Instrumento</option>
                      <option value="medication">Medicamento</option>
                      <option value="consumable">Consumible</option>
                      <option value="other">Otro</option>
                    </select>
                  </div>
                </div>

                {/* Cantidad y Unidad */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Cantidad Actual *"
                    name="quantity"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="100"
                    value={formData.quantity}
                    onChange={handleChange}
                    error={errors.quantity}
                    disabled={isLoading}
                    required
                  />

                  <Input
                    label="Unidad *"
                    name="unit"
                    type="text"
                    placeholder="unidades, cajas, ml, gr"
                    value={formData.unit}
                    onChange={handleChange}
                    error={errors.unit}
                    disabled={isLoading}
                    required
                  />

                  <Input
                    label="Stock Mínimo *"
                    name="minQuantity"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="20"
                    value={formData.minQuantity}
                    onChange={handleChange}
                    error={errors.minQuantity}
                    disabled={isLoading}
                    required
                  />
                </div>

                {/* Ubicación y Proveedor */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Ubicación en el Consultorio"
                    name="location"
                    type="text"
                    placeholder="Ej: Armario 2, Cajón 3"
                    value={formData.location}
                    onChange={handleChange}
                    disabled={isLoading}
                  />

                  <Input
                    label="Proveedor"
                    name="supplier"
                    type="text"
                    placeholder="Nombre del proveedor"
                    value={formData.supplier}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>

                {/* Costo y Fecha de Vencimiento */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Costo Unitario"
                    name="cost"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.cost}
                    onChange={handleChange}
                    disabled={isLoading}
                  />

                  <Input
                    label="Fecha de Vencimiento"
                    name="expirationDate"
                    type="date"
                    value={formData.expirationDate}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>

                {/* Notas */}
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas / Observaciones
                  </label>
                  <textarea
                    name="notes"
                    rows={3}
                    placeholder="Información adicional sobre el item..."
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
                    Guardar Cambios
                  </Button>
                  
                  <Link href="/stock" className="flex-1">
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
