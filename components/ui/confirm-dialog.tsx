'use client'

import { Button } from './button'
import { Card, CardContent, CardHeader, CardTitle } from './card'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
}

/**
 * Componente de diálogo de confirmación
 * Usar antes de acciones destructivas
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger'
}: ConfirmDialogProps) {
  if (!isOpen) return null

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700'
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700'
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700'
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return '🗑️'
      case 'warning':
        return '⚠️'
      case 'info':
        return 'ℹ️'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4 shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">{getIcon()}</span>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 mb-6">{message}</p>
          
          <div className="flex gap-3 justify-end">
            <Button
              onClick={onClose}
              variant="outline"
            >
              {cancelText}
            </Button>
            <Button
              onClick={() => {
                onConfirm()
                onClose()
              }}
              className={getTypeStyles()}
            >
              {confirmText}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
