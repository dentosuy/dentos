'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/components/ui/toast'
import { exportAllData, downloadBackupFile, getBackupStats, BackupData } from '@/lib/backup'
import { Download, Database, FileJson, Shield, Clock, CheckCircle, AlertTriangle } from 'lucide-react'

export default function BackupPage() {
  const { user, dentistProfile } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [lastBackup, setLastBackup] = useState<BackupData | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [lastBackupInfo, setLastBackupInfo] = useState<any>(null)

  // Cargar información del último backup desde localStorage (solo en el cliente)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const lastDate = localStorage.getItem('lastBackupDate')
      if (lastDate) {
        const date = new Date(lastDate)
        const now = new Date()
        const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

        setLastBackupInfo({
          date: date.toLocaleDateString('es-AR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          daysAgo: daysDiff
        })
      }
    }
  }, [])

  const handleExportBackup = async () => {
    if (!user || !dentistProfile) return

    try {
      setLoading(true)
      toast.success('Recopilando datos... Esto puede tardar unos segundos')

      // Exportar todos los datos
      const backupData = await exportAllData(user.uid, dentistProfile)
      
      // Obtener estadísticas
      const backupStats = getBackupStats(backupData)
      setStats(backupStats)
      setLastBackup(backupData)

      // Descargar archivo
      downloadBackupFile(backupData)
      
      // Guardar fecha del último backup en localStorage (solo en el cliente)
      if (typeof window !== 'undefined') {
        localStorage.setItem('lastBackupDate', new Date().toISOString())
        
        // Actualizar el estado local
        const now = new Date()
        setLastBackupInfo({
          date: now.toLocaleDateString('es-AR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          daysAgo: 0
        })
      }
      
      toast.success('¡Backup completado! El archivo se ha descargado')
    } catch (error) {
      console.error('Error al crear backup:', error)
      toast.error('Error al crear el backup. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout title="Backup y Exportación">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header con información */}
          <Card className="border-primary-200 bg-primary-50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary-100 rounded-full">
                  <Shield className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <CardTitle className="text-primary-900">Protege tu Información</CardTitle>
                  <CardDescription className="text-primary-700">
                    Crea copias de seguridad de todos tus datos de forma regular
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Estado del último backup */}
          {lastBackupInfo && (
            <Card className={lastBackupInfo.daysAgo > 30 ? 'border-yellow-200 bg-yellow-50' : 'border-green-200 bg-green-50'}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {lastBackupInfo.daysAgo > 30 ? (
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                    <div>
                      <p className={`font-medium ${lastBackupInfo.daysAgo > 30 ? 'text-yellow-900' : 'text-green-900'}`}>
                        Último backup: {lastBackupInfo.date}
                      </p>
                      <p className={`text-sm ${lastBackupInfo.daysAgo > 30 ? 'text-yellow-700' : 'text-green-700'}`}>
                        Hace {lastBackupInfo.daysAgo} {lastBackupInfo.daysAgo === 1 ? 'día' : 'días'}
                        {lastBackupInfo.daysAgo > 30 && ' - Se recomienda hacer un nuevo backup'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botón principal de backup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Crear Backup Completo
              </CardTitle>
              <CardDescription>
                Descarga una copia de seguridad de todos tus datos en formato JSON
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium text-gray-900">📦 El backup incluye:</p>
                <ul className="text-sm text-gray-700 space-y-1 ml-4">
                  <li>✓ Todos los pacientes y sus datos personales</li>
                  <li>✓ Historias clínicas completas (odontogramas, diagnósticos, presupuestos)</li>
                  <li>✓ Agenda de citas y consultas</li>
                  <li>✓ Transacciones financieras (ingresos y egresos)</li>
                  <li>✓ Inventario de stock y materiales</li>
                  <li>✓ Registro de visitas y evoluciones</li>
                </ul>
              </div>

              <Button
                onClick={handleExportBackup}
                disabled={loading}
                size="lg"
                className="w-full bg-primary-600 hover:bg-primary-700"
              >
                {loading ? (
                  <>
                    <Clock className="w-5 h-5 mr-2 animate-spin" />
                    Creando backup...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-2" />
                    Descargar Backup Completo
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Estadísticas del último backup generado */}
          {stats && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-900 flex items-center gap-2">
                  <FileJson className="w-5 h-5" />
                  Estadísticas del Backup
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Pacientes</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalPacientes}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Historias Clínicas</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalHistorias}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Citas</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalCitas}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Transacciones</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalTransacciones}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Stock</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalStock}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Visitas</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalVisitas}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-900 font-medium">Total de registros:</span>
                    <span className="text-blue-900 font-bold">{stats.totalRegistros}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-blue-900 font-medium">Tamaño del archivo:</span>
                    <span className="text-blue-900 font-bold">{stats.tamanioEstimado}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-blue-900 font-medium">Fecha de exportación:</span>
                    <span className="text-blue-900 font-bold">{stats.fechaExportacion}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Información importante */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">ℹ️ Información Importante</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-700">
              <div>
                <p className="font-medium text-gray-900">📁 Formato del archivo:</p>
                <p className="text-gray-600 mt-1">
                  El backup se descarga como un archivo JSON que contiene todos tus datos estructurados.
                  Este formato es estándar y puede ser leído por cualquier programa.
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-900">🔒 Seguridad:</p>
                <p className="text-gray-600 mt-1">
                  Guarda el archivo de backup en un lugar seguro (disco externo, nube personal, etc.).
                  Contiene información sensible de tus pacientes.
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-900">📅 Frecuencia recomendada:</p>
                <p className="text-gray-600 mt-1">
                  Se recomienda hacer un backup al menos una vez al mes, o antes de realizar
                  cambios importantes en el sistema.
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-900">💾 Restauración:</p>
                <p className="text-gray-600 mt-1">
                  Si necesitas restaurar tus datos desde un backup, contacta con soporte técnico.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
