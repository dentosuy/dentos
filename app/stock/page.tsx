'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Pagination } from '@/components/ui/pagination'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/components/ui/toast'
import { usePagination } from '@/hooks/use-pagination'
import { getStockItems, deleteStockItem } from '@/lib/stock'
import type { StockItem } from '@/types'
import Link from 'next/link'
import { Edit2, Trash2, AlertTriangle, Package } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function StockPage() {
  const { user } = useAuth()
  const router = useRouter()
  const toast = useToast()
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'low'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null)

  useEffect(() => {
    const fetchStockItems = async () => {
      if (!user) return
      try {
        setLoading(true)
        const data = await getStockItems(user.uid)
        setStockItems(data)
      } catch (error) {
        console.error('Error al cargar stock:', error)
        toast.error('Error al cargar el inventario')
      } finally {
        setLoading(false)
      }
    }
    fetchStockItems()
  }, [user, toast])

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return
    try {
      await deleteStockItem(itemToDelete.id)
      setStockItems(prev => prev.filter(item => item.id !== itemToDelete.id))
      toast.success(`"${itemToDelete.name}" eliminado del inventario`)
    } catch (error) {
      console.error('Error al eliminar item:', error)
      toast.error('No se pudo eliminar el item')
    }
  }

  const getCategoryLabel = (category: StockItem['category']) => {
    const labels = {
      material: 'Material',
      instrument: 'Instrumento',
      medication: 'Medicamento',
      consumable: 'Consumible',
      other: 'Otro',
    }
    return labels[category]
  }

  const getCategoryColor = (category: StockItem['category']) => {
    const colors = {
      material: 'bg-blue-100 text-blue-800',
      instrument: 'bg-purple-100 text-purple-800',
      medication: 'bg-green-100 text-green-800',
      consumable: 'bg-yellow-100 text-yellow-800',
      other: 'bg-gray-100 text-gray-800',
    }
    return colors[category]
  }

  const isLowStock = (item: StockItem) => item.quantity <= item.minQuantity

  const filteredItems = stockItems.filter(item => {
    if (filter === 'low' && !isLowStock(item)) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.supplier?.toLowerCase().includes(query) ||
        item.location?.toLowerCase().includes(query)
      )
    }
    return true
  })

  const lowStockCount = stockItems.filter(isLowStock).length

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
    data: filteredItems,
    itemsPerPage: 12
  })

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout title="Stock">
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-600">Cargando inventario...</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (stockItems.length === 0) {
    return (
      <ProtectedRoute>
        <DashboardLayout title="Stock">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay items en el inventario
            </h3>
            <p className="text-gray-600 mb-6">
              Comienza agregando materiales, instrumentos o insumos
            </p>
            <Link href="/stock/new">
              <Button>Agregar Primer Item</Button>
            </Link>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout title="Stock">
        <div className="space-y-4 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todos ({stockItems.length})
              </button>
              <button
                onClick={() => setFilter('low')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  filter === 'low'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {lowStockCount > 0 && <AlertTriangle className="w-4 h-4" />}
                Stock Bajo ({lowStockCount})
              </button>
            </div>
            <Link href="/stock/new">
              <Button>+ Agregar Item</Button>
            </Link>
          </div>

          <div className="w-full md:w-96">
            <Input
              type="text"
              placeholder="Buscar por nombre, categoría, proveedor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {searchQuery && (
            <div className="text-sm text-gray-600">
              {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} encontrado{filteredItems.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {currentData.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentData.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow ${
                    isLowStock(item) ? 'border-2 border-orange-300' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(item.category)}`}>
                        {getCategoryLabel(item.category)}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => router.push(`/stock/${item.id}/edit`)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setItemToDelete({ id: item.id!, name: item.name })}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex items-baseline gap-2">
                      <span className={`text-2xl font-bold ${isLowStock(item) ? 'text-orange-600' : 'text-gray-900'}`}>
                        {item.quantity}
                      </span>
                      <span className="text-sm text-gray-600">{item.unit}</span>
                    </div>
                    {isLowStock(item) && (
                      <div className="flex items-center gap-1 mt-1 text-orange-600 text-xs">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Stock bajo (mín: {item.minQuantity})</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 text-sm text-gray-600">
                    {item.location && <p>📍 {item.location}</p>}
                    {item.supplier && <p>🏪 {item.supplier}</p>}
                    {item.cost && <p>💰 ${item.cost.toFixed(2)} por {item.unit}</p>}
                    {item.expirationDate && (
                      <p className={`${
                        new Date(item.expirationDate) < new Date() 
                          ? 'text-red-600 font-medium' 
                          : ''
                      }`}>
                        📅 Vence: {new Date(item.expirationDate).toLocaleDateString('es-ES')}
                      </p>
                    )}
                  </div>

                  {item.notes && (
                    <p className="mt-3 text-xs text-gray-500 italic border-t pt-2">
                      {item.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={goToPage}
                canGoNext={canGoNext}
                canGoPrevious={canGoPrevious}
                startIndex={startIndex}
                endIndex={endIndex}
                totalItems={filteredItems.length}
              />
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">
              {searchQuery 
                ? 'No se encontraron items con ese criterio de búsqueda'
                : filter === 'low' 
                  ? '¡Excelente! No hay items con stock bajo'
                  : 'No hay items en el inventario'}
            </p>
          </div>
        )}

        <ConfirmDialog
          isOpen={itemToDelete !== null}
          onClose={() => setItemToDelete(null)}
          onConfirm={handleDeleteConfirm}
          title="Eliminar Item del Inventario"
          message={`¿Estás seguro de que deseas eliminar "${itemToDelete?.name}" del inventario? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          type="danger"
        />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
