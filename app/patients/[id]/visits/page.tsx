'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getPatient } from '@/lib/patients'
import { getPatientVisits, createVisit, updateVisit, deleteVisit } from '@/lib/visits'
import { getAppointment } from '@/lib/appointments'
import { useAuth } from '@/contexts/auth-context'
import type { Patient, Visit } from '@/types'
import Link from 'next/link'
import { ArrowLeft, Plus, Calendar, Trash2, Edit2, Save, X } from 'lucide-react'

export default function VisitsHistoryPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const patientId = params.id as string
  const fromAppointment = searchParams.get('fromAppointment')
  
  const [patient, setPatient] = useState<Patient | null>(null)
  const [visits, setVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewVisitForm, setShowNewVisitForm] = useState(false)
  const [editingVisitId, setEditingVisitId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState<Partial<Visit>>({
    visitDate: new Date(),
    chiefComplaint: '',
    symptoms: '',
    treatmentsPerformed: [],
    notes: '',
    diagnosis: '',
    prescriptions: [],
    nextAppointmentSuggestion: '',
  })

  useEffect(() => {
    const fetchData = async () => {
      console.log('🔍 [Visits] Intentando cargar datos para paciente:', patientId)
      if (!patientId) {
        console.error('❌ [Visits] No hay patientId')
        return
      }

      try {
        setLoading(true)
        const patientData = await getPatient(patientId)
        console.log('👤 [Visits] Paciente cargado:', patientData)
        
        if (!patientData) {
          console.error('❌ [Visits] No se encontró el paciente con ID:', patientId)
          // No redirigir inmediatamente, dar tiempo para depurar
          setLoading(false)
          return
        }
        
        setPatient(patientData)

        const visitsData = await getPatientVisits(patientId)
        console.log('📅 [Visits] Visitas cargadas:', visitsData.length, 'visitas')
        setVisits(visitsData)

        // Si viene de una cita, cargar datos de la cita y mostrar formulario
        if (fromAppointment) {
          const appointmentData = await getAppointment(fromAppointment)
          if (appointmentData) {
            setFormData({
              visitDate: appointmentData.date,
              chiefComplaint: appointmentData.notes || '',
              symptoms: '',
              treatmentsPerformed: [appointmentData.type === 'consultation' ? 'Consulta' : 
                                   appointmentData.type === 'cleaning' ? 'Limpieza' : 
                                   appointmentData.type === 'treatment' ? 'Tratamiento' :
                                   appointmentData.type === 'emergency' ? 'Emergencia' : 'Otro'],
              notes: '',
              diagnosis: '',
              prescriptions: [],
              nextAppointmentSuggestion: '',
              appointmentId: fromAppointment,
            })
            setShowNewVisitForm(true)
          }
        }
      } catch (error) {
        console.error('❌ [Visits] Error al cargar datos:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [patientId, fromAppointment])

  const handleSaveVisit = async () => {
    if (!user) return

    try {
      setSaving(true)
      
      if (editingVisitId) {
        // Actualizar visita existente
        await updateVisit(editingVisitId, formData)
        const updatedVisits = await getPatientVisits(patientId)
        setVisits(updatedVisits)
        setEditingVisitId(null)
      } else {
        // Crear nueva visita
        await createVisit(user.uid, patientId, formData)
        const updatedVisits = await getPatientVisits(patientId)
        setVisits(updatedVisits)
        setShowNewVisitForm(false)
      }
      
      // Resetear formulario
      setFormData({
        visitDate: new Date(),
        chiefComplaint: '',
        symptoms: '',
        treatmentsPerformed: [],
        notes: '',
        diagnosis: '',
        prescriptions: [],
        nextAppointmentSuggestion: '',
      })
      
    } catch (error) {
      alert('Error al guardar visita')
    } finally {
      setSaving(false)
    }
  }

  const handleEditVisit = (visit: Visit) => {
    setFormData({
      visitDate: visit.visitDate,
      chiefComplaint: visit.chiefComplaint,
      symptoms: visit.symptoms,
      treatmentsPerformed: visit.treatmentsPerformed,
      notes: visit.notes,
      diagnosis: visit.diagnosis,
      prescriptions: visit.prescriptions,
      nextAppointmentSuggestion: visit.nextAppointmentSuggestion,
    })
    setEditingVisitId(visit.id)
    setShowNewVisitForm(true)
  }

  const handleDeleteVisit = async (visitId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta visita?')) return

    try {
      await deleteVisit(visitId)
      const updatedVisits = await getPatientVisits(patientId)
      setVisits(updatedVisits)
    } catch (error) {
      alert('Error al eliminar visita')
    }
  }

  const handleCancel = () => {
    setShowNewVisitForm(false)
    setEditingVisitId(null)
    setFormData({
      visitDate: new Date(),
      chiefComplaint: '',
      symptoms: '',
      treatmentsPerformed: [],
      notes: '',
      diagnosis: '',
      prescriptions: [],
      nextAppointmentSuggestion: '',
    })
  }

  const addTreatment = (treatment: string) => {
    if (!treatment.trim()) return
    setFormData({
      ...formData,
      treatmentsPerformed: [...(formData.treatmentsPerformed || []), treatment.trim()]
    })
  }

  const removeTreatment = (index: number) => {
    const updated = [...(formData.treatmentsPerformed || [])]
    updated.splice(index, 1)
    setFormData({ ...formData, treatmentsPerformed: updated })
  }

  const addPrescription = (prescription: string) => {
    if (!prescription.trim()) return
    setFormData({
      ...formData,
      prescriptions: [...(formData.prescriptions || []), prescription.trim()]
    })
  }

  const removePrescription = (index: number) => {
    const updated = [...(formData.prescriptions || [])]
    updated.splice(index, 1)
    setFormData({ ...formData, prescriptions: updated })
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout title="Historia de Visitas">
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-600">Cargando...</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (!patient) {
    return null
  }

  return (
    <ProtectedRoute>
      <DashboardLayout title={`Historia de Visitas - ${patient.firstName} ${patient.lastName}`}>
        <div className="mb-6 flex justify-between items-center">
          <Link href={`/patients/${patientId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Paciente
            </Button>
          </Link>
          {!showNewVisitForm && (
            <Button onClick={() => setShowNewVisitForm(true)} className="bg-primary-600">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Visita
            </Button>
          )}
        </div>

        {/* Formulario de nueva visita o edición */}
        {showNewVisitForm && (
          <Card className="mb-6 border-2 border-primary-300">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{editingVisitId ? 'Editar Visita' : 'Nueva Visita'}</CardTitle>
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="visitDate">Fecha de la Visita</Label>
                  <Input
                    id="visitDate"
                    type="date"
                    value={formData.visitDate ? new Date(formData.visitDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setFormData({ ...formData, visitDate: new Date(e.target.value) })}
                  />
                </div>

                <div>
                  <Label htmlFor="chiefComplaint">Motivo de Consulta</Label>
                  <Input
                    id="chiefComplaint"
                    value={formData.chiefComplaint || ''}
                    onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
                    placeholder="¿Por qué vino el paciente?"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="symptoms">Síntomas</Label>
                <textarea
                  id="symptoms"
                  value={formData.symptoms || ''}
                  onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={2}
                  placeholder="Síntomas presentados por el paciente..."
                />
              </div>

              <div>
                <Label>Tratamientos Realizados</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    id="treatmentInput"
                    placeholder="Agregar tratamiento..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.target as HTMLInputElement
                        addTreatment(input.value)
                        input.value = ''
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      const input = document.getElementById('treatmentInput') as HTMLInputElement
                      addTreatment(input.value)
                      input.value = ''
                    }}
                  >
                    +
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(formData.treatmentsPerformed || []).map((treatment, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2"
                    >
                      {treatment}
                      <button
                        onClick={() => removeTreatment(index)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="diagnosis">Diagnóstico</Label>
                <textarea
                  id="diagnosis"
                  value={formData.diagnosis || ''}
                  onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={2}
                />
              </div>

              <div>
                <Label>Prescripciones</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    id="prescriptionInput"
                    placeholder="Agregar medicamento..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.target as HTMLInputElement
                        addPrescription(input.value)
                        input.value = ''
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      const input = document.getElementById('prescriptionInput') as HTMLInputElement
                      addPrescription(input.value)
                      input.value = ''
                    }}
                  >
                    +
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(formData.prescriptions || []).map((prescription, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm flex items-center gap-2"
                    >
                      {prescription}
                      <button
                        onClick={() => removePrescription(index)}
                        className="text-green-600 hover:text-green-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notas de Evolución</Label>
                <textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="Evolución del paciente, observaciones..."
                />
              </div>

              <div>
                <Label htmlFor="nextAppointment">Próxima Cita Sugerida</Label>
                <Input
                  id="nextAppointment"
                  value={formData.nextAppointmentSuggestion || ''}
                  onChange={(e) => setFormData({ ...formData, nextAppointmentSuggestion: e.target.value })}
                  placeholder="Ej: Control en 1 semana, limpieza en 6 meses..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCancel}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveVisit} isLoading={saving} className="bg-primary-600">
                  <Save className="w-4 h-4 mr-2" />
                  {editingVisitId ? 'Actualizar' : 'Guardar'} Visita
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de visitas */}
        <div className="space-y-4">
          {visits.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No hay visitas registradas</p>
                {!showNewVisitForm && (
                  <Button onClick={() => setShowNewVisitForm(true)} className="bg-primary-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Registrar Primera Visita
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            visits.map((visit) => (
              <Card key={visit.id} className="hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-5 h-5 text-primary-600" />
                        <CardTitle className="text-lg">
                          {new Date(visit.visitDate).toLocaleDateString('es-AR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </CardTitle>
                        {visit.appointmentId && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            📅 Cita vinculada
                          </span>
                        )}
                      </div>
                      {visit.chiefComplaint && (
                        <p className="text-sm text-gray-600">
                          <strong>Motivo:</strong> {visit.chiefComplaint}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditVisit(visit)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteVisit(visit.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {visit.symptoms && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">Síntomas:</p>
                      <p className="text-sm text-gray-600">{visit.symptoms}</p>
                    </div>
                  )}

                  {visit.treatmentsPerformed && visit.treatmentsPerformed.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">Tratamientos Realizados:</p>
                      <div className="flex flex-wrap gap-2">
                        {visit.treatmentsPerformed.map((treatment, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm"
                          >
                            {treatment}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {visit.diagnosis && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">Diagnóstico:</p>
                      <p className="text-sm text-gray-600">{visit.diagnosis}</p>
                    </div>
                  )}

                  {visit.prescriptions && visit.prescriptions.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">Prescripciones:</p>
                      <div className="flex flex-wrap gap-2">
                        {visit.prescriptions.map((prescription, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-green-50 text-green-700 rounded text-sm"
                          >
                            {prescription}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {visit.notes && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">Notas:</p>
                      <p className="text-sm text-gray-600 italic">{visit.notes}</p>
                    </div>
                  )}

                  {visit.nextAppointmentSuggestion && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm font-semibold text-yellow-800 mb-1">Próxima Cita:</p>
                      <p className="text-sm text-yellow-700">{visit.nextAppointmentSuggestion}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
