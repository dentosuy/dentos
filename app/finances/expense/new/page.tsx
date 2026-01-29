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
import { addTransaction } from '@/lib/transactions'
import { sanitizeString, validatePrice } from '@/lib/validation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewExpensePage() {
  const router = useRouter()
  const { user } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    concept: '',
    amount: '',
    category: 'materiales',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'efectivo' as const,
    status: 'paid' as const,
    notes: ''
  })

  const expenseCategories = [
    { value: 'materiales', label: 'Materiales' },
    { value: 'alquiler', label: 'Alquiler' },
    { value: 'servicios', label: 'Servicios (luz, agua, etc.)' },
    { value: 'salarios', label: 'Salarios' },
    { value: 'mantenimiento', label: 'Mantenimiento' },
    { value: 'impuestos', label: 'Impuestos' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'equipamiento', label: 'Equipamiento' },
    { value: 'otro', label: 'Otro' }
  ]

  const paymentMethods = [
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'transferencia', label: 'Transferencia' },
    { value: 'tarjeta-debito', label: 'Tarjeta Débito' },
    { value: 'tarjeta-credito', label: 'Tarjeta Crédito' },
    { value: 'mercadopago', label: 'MercadoPago' },
    { value: 'otro', label: 'Otro' }
  ]

  const statusOptions = [
    { value: 'paid', label: 'Pagado' },
    { value: 'pending', label: 'Pendiente' },
    { value: 'partial', label: 'Parcial' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) return

    // Validar concepto
    if (!formData.concept.trim()) {
      toast.error('El concepto es requerido')
      return
    }

    if (formData.concept.trim().length < 2) {
      toast.error('El concepto debe tener al menos 2 caracteres')
      return
    }

    if (formData.concept.trim().length > 500) {
      toast.error('El concepto es demasiado largo')
      return
    }

    // Validar monto
    const priceValidation = validatePrice(formData.amount)
    if (!priceValidation.valid) {
      toast.error(priceValidation.error!)
      return
    }

    const amount = parseFloat(formData.amount)
    if (amount > 10000000) {
      toast.error('El monto es demasiado alto')
      return
    }

    try {
      setLoading(true)
      
      // Sanitizar inputs de texto
      await addTransaction(user.uid, {
        type: 'expense',
        concept: sanitizeString(formData.concept.trim()),
        amount: amount,
        category: formData.category,
        date: new Date(formData.date),
        paymentMethod: 'cash' as const,
        status: formData.status,
        notes: formData.notes.trim() ? sanitizeString(formData.notes.trim()) : undefined
      })

      toast.success('Egreso registrado exitosamente')
      router.push('/finances')
    } catch (error) {
      console.error('Error al registrar egreso:', error)
      toast.error('Error al registrar el egreso')
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout title="Registrar Egreso">
        <div className="mb-6">
          <Link href="/finances">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Finanzas
            </Button>
          </Link>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="text-red-600">- Nuevo Egreso</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Concepto */}
                <div className="md:col-span-2">
                  <Label htmlFor="concept">Concepto *</Label>
                  <Input
                    id="concept"
                    value={formData.concept}
                    onChange={(e) => setFormData({ ...formData, concept: e.target.value })}
                    placeholder="Ej: Compra de materiales odontológicos"
                    required
                  />
                </div>

                {/* Monto */}
                <div>
                  <Label htmlFor="amount">Monto *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="pl-7"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                {/* Categoría */}
                <div>
                  <Label htmlFor="category">Categoría *</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    {expenseCategories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                {/* Fecha */}
                <div>
                  <Label htmlFor="date">Fecha *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>

                {/* Método de pago */}
                <div>
                  <Label htmlFor="paymentMethod">Método de Pago *</Label>
                  <select
                    id="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    {paymentMethods.map(method => (
                      <option key={method.value} value={method.value}>{method.label}</option>
                    ))}
                  </select>
                </div>

                {/* Estado */}
                <div>
                  <Label htmlFor="status">Estado *</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    {statusOptions.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>

                {/* Notas */}
                <div className="md:col-span-2">
                  <Label htmlFor="notes">Notas (opcional)</Label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                    placeholder="Información adicional..."
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {loading ? 'Guardando...' : 'Registrar Egreso'}
                </Button>
                <Link href="/finances">
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
