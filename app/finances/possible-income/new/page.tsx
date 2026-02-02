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

export default function NewPossibleIncomePage() {
  const router = useRouter()
  const { user } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    concept: '',
    amount: '',
    category: 'consulta',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'efectivo' as const,
    notes: ''
  })

  const incomeCategories = [
    { value: 'consulta', label: 'Consulta' },
    { value: 'tratamiento', label: 'Tratamiento' },
    { value: 'cirugia', label: 'Cirugía' },
    { value: 'limpieza', label: 'Limpieza' },
    { value: 'ortodoncia', label: 'Ortodoncia' },
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

    // Mapear método de pago de español a inglés
    const paymentMethodMap: Record<string, 'cash' | 'card' | 'transfer' | 'other'> = {
      'efectivo': 'cash',
      'transferencia': 'transfer',
      'tarjeta-debito': 'card',
      'tarjeta-credito': 'card',
      'mercadopago': 'transfer',
      'otro': 'other'
    }

    try {
      setLoading(true)
      
      // Sanitizar inputs de texto y marcar como posible ingreso
      await addTransaction(user.uid, {
        type: 'income',
        concept: sanitizeString(formData.concept.trim()),
        amount: amount,
        category: formData.category,
        date: new Date(formData.date),
        paymentMethod: paymentMethodMap[formData.paymentMethod] || 'cash',
        status: 'pending', // Los ingresos posibles siempre están pendientes
        isPossible: true, // Marcar como posible ingreso
        notes: formData.notes.trim() ? sanitizeString(formData.notes.trim()) : undefined
      })

      toast.success('Posible ingreso registrado exitosamente')
      router.push('/finances')
      router.refresh()
    } catch (error) {
      console.error('Error al registrar posible ingreso:', error)
      toast.error('Error al registrar el posible ingreso')
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout title="Registrar Posible Ingreso">
        <div className="mb-6">
          <Link href="/finances">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Finanzas
            </Button>
          </Link>
        </div>

        <Card className="max-w-2xl border-yellow-200">
          <CardHeader className="bg-yellow-50">
            <CardTitle className="text-yellow-700">⚡ Nuevo Posible Ingreso</CardTitle>
            <p className="text-sm text-yellow-600 mt-2">
              Registra ingresos que aún no están concretados pero son probables
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Concepto */}
                <div className="md:col-span-2">
                  <Label htmlFor="concept">Concepto *</Label>
                  <Input
                    id="concept"
                    value={formData.concept}
                    onChange={(e) => setFormData({ ...formData, concept: e.target.value })}
                    placeholder="Ej: Posible tratamiento de ortodoncia - Paciente María"
                    required
                  />
                </div>

                {/* Monto */}
                <div>
                  <Label htmlFor="amount">Monto Estimado *</Label>
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
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    required
                  >
                    {incomeCategories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                {/* Fecha */}
                <div>
                  <Label htmlFor="date">Fecha Estimada *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>

                {/* Método de pago esperado */}
                <div>
                  <Label htmlFor="paymentMethod">Método de Pago Esperado *</Label>
                  <select
                    id="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    required
                  >
                    {paymentMethods.map(method => (
                      <option key={method.value} value={method.value}>{method.label}</option>
                    ))}
                  </select>
                </div>

                {/* Notas */}
                <div className="md:col-span-2">
                  <Label htmlFor="notes">Notas Adicionales</Label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 min-h-[100px]"
                    placeholder="Agrega información adicional sobre este posible ingreso..."
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t">
                <Link href="/finances">
                  <Button type="button" variant="outline">
                    Cancelar
                  </Button>
                </Link>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white"
                >
                  {loading ? 'Guardando...' : 'Registrar Posible Ingreso'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
