'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { getAppointmentsByMonth, getAppointmentsByDay } from '@/lib/appointments'
import { getPatients } from '@/lib/patients'
import type { Appointment, Patient } from '@/types'
import Link from 'next/link'
import { Edit2, Bell, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'

type ViewMode = 'calendar' | 'list'

/**
 * Página principal de Agenda
 */
export default function AppointmentsPage() {
  const { user } = useAuth()
  const [viewMode, setViewMode] = useState<ViewMode>('calendar')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [patients, setPatients] = useState<Patient[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  const currentMonth = selectedDate.getMonth()
  const currentYear = selectedDate.getFullYear()

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      try {
        setLoading(true)
        
        // Cargar pacientes y citas en paralelo
        const [patientsData, appointmentsData] = await Promise.all([
          getPatients(user.uid),
          viewMode === 'calendar'
            ? getAppointmentsByMonth(user.uid, currentYear, currentMonth)
            : getAppointmentsByDay(user.uid, selectedDate)
        ])
        
        setPatients(patientsData)
        setAppointments(appointmentsData)
      } catch (error) {
        console.error('Error al cargar datos:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, viewMode, selectedDate, currentMonth, currentYear])

  const handlePreviousMonth = () => {
    setSelectedDate(new Date(currentYear, currentMonth - 1, 1))
  }

  const handleNextMonth = () => {
    setSelectedDate(new Date(currentYear, currentMonth + 1, 1))
  }

  const handleToday = () => {
    setSelectedDate(new Date())
  }

  const handleDayClick = (date: Date) => {
    setSelectedDate(date)
    setViewMode('list')
  }

  return (
    <ProtectedRoute>
      <DashboardLayout title="Agenda">
        {/* Controles superiores */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          {/* Botones de vista */}
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📅 Calendario
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📋 Lista
            </button>
          </div>

          {/* Botón agregar cita */}
          <Link href="/appointments/new">
            <Button size="lg">
              ➕ Agregar Cita
            </Button>
          </Link>
        </div>

        {/* Navegación de mes */}
        <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-lg shadow">
          <Button onClick={handlePreviousMonth} variant="outline" size="sm">
            ←
          </Button>
          
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">
              {selectedDate.toLocaleDateString('es-ES', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </h2>
            <Button onClick={handleToday} variant="outline" size="sm">
              Hoy
            </Button>
          </div>
          
          <Button onClick={handleNextMonth} variant="outline" size="sm">
            →
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando agenda...</p>
            </div>
          </div>
        ) : (
          <>
            {viewMode === 'calendar' ? (
              <CalendarView 
                appointments={appointments} 
                selectedDate={selectedDate}
                onDateSelect={handleDayClick}
              />
            ) : (
              <ListView 
                appointments={appointments}
                patients={patients}
                selectedDate={selectedDate}
              />
            )}
          </>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  )
}

/**
 * Vista de calendario mensual
 */
function CalendarView({ 
  appointments, 
  selectedDate,
  onDateSelect 
}: { 
  appointments: Appointment[]
  selectedDate: Date
  onDateSelect: (date: Date) => void
}) {
  const month = selectedDate.getMonth()
  const year = selectedDate.getFullYear()

  // Obtener primer día del mes
  const firstDay = new Date(year, month, 1).getDay()
  
  // Obtener número de días en el mes
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  
  // Crear array de días
  const days = []
  
  // Agregar días vacíos al inicio
  for (let i = 0; i < firstDay; i++) {
    days.push(null)
  }
  
  // Agregar días del mes
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  const getAppointmentsForDay = (day: number) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.date)
      return aptDate.getDate() === day && 
             aptDate.getMonth() === month && 
             aptDate.getFullYear() === year
    })
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
          <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Días del mes */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square" />
          }

          const dayAppointments = getAppointmentsForDay(day)
          const isToday = new Date().getDate() === day && 
                         new Date().getMonth() === month && 
                         new Date().getFullYear() === year

          return (
            <button
              key={day}
              onClick={() => onDateSelect(new Date(year, month, day))}
              className={`aspect-square border rounded-lg p-2 hover:bg-gray-50 transition-colors ${
                isToday ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
              }`}
            >
              <div className="text-sm font-medium mb-1">{day}</div>
              {dayAppointments.length > 0 && (
                <div className="text-xs">
                  <div className="w-2 h-2 bg-primary-500 rounded-full mx-auto"></div>
                  <div className="text-gray-600">{dayAppointments.length}</div>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Vista de lista diaria
 */
function ListView({ 
  appointments, 
  selectedDate,
  patients 
}: { 
  appointments: Appointment[]
  selectedDate: Date
  patients: Patient[]
}) {
  const router = useRouter()

  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId)
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Paciente no encontrado'
  }

  const handleEdit = (e: React.MouseEvent, appointmentId: string) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/appointments/${appointmentId}/edit`)
  }

  const handleSendReminder = async (e: React.MouseEvent, appointment: Appointment) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Por ahora mostrar confirmación, luego implementar envío real
    const patientName = getPatientName(appointment.patientId)
    const time = new Date(appointment.date).toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
    
    if (confirm(`¿Enviar recordatorio a ${patientName} para la cita del ${time}?`)) {
      // TODO: Implementar envío de recordatorio (email/SMS)
      alert('Recordatorio enviado exitosamente')
    }
  }

  const handleViewHistory = (e: React.MouseEvent, patientId: string) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/patients/${patientId}`)
  }

  const getTypeColor = (type: Appointment['type']) => {
    const colors = {
      consultation: 'bg-blue-100 text-blue-800',
      cleaning: 'bg-green-100 text-green-800',
      treatment: 'bg-purple-100 text-purple-800',
      emergency: 'bg-red-100 text-red-800',
      other: 'bg-gray-100 text-gray-800',
    }
    return colors[type]
  }

  const getStatusColor = (status: Appointment['status']) => {
    const colors = {
      scheduled: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return colors[status]
  }

  const getStatusText = (status: Appointment['status']) => {
    const texts = {
      scheduled: 'Programada',
      confirmed: 'Confirmada',
      completed: 'Completada',
      cancelled: 'Cancelada',
    }
    return texts[status]
  }

  if (appointments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-600">No hay citas para este día</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {appointments.map((appointment) => (
        <div key={appointment.id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start gap-4">
            <Link href={`/appointments/${appointment.id}`} className="flex-1">
              <div className="cursor-pointer">
                {/* Nombre del Paciente */}
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  {getPatientName(appointment.patientId)}
                </h3>
                
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-lg">
                    {new Date(appointment.date).toLocaleTimeString('es-ES', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-600">{appointment.duration} min</span>
                </div>
                <div className="flex gap-2 mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(appointment.type)}`}>
                    {appointment.type}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(appointment.status)}`}>
                    {getStatusText(appointment.status)}
                  </span>
                </div>
                {appointment.notes && (
                  <p className="text-sm text-gray-600 mt-2">{appointment.notes}</p>
                )}
              </div>
            </Link>
            
            {/* Botones de acción */}
            <div className="flex flex-col gap-2">
              <button
                onClick={(e) => handleEdit(e, appointment.id!)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Editar cita"
              >
                <Edit2 className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => handleSendReminder(e, appointment)}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Enviar recordatorio"
              >
                <Bell className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => handleViewHistory(e, appointment.patientId)}
                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                title="Ver historia clínica"
              >
                <FileText className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
