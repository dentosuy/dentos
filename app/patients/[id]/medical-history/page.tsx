'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getPatient } from '@/lib/patients'
import { getMedicalHistory, saveMedicalHistory } from '@/lib/medical-history'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/components/ui/toast'
import type { Patient, MedicalHistory, BudgetPayment } from '@/types'
import Link from 'next/link'
import { ArrowLeft, Save, FileText, Plus, Trash2 } from 'lucide-react'

// SVG Components para cada tipo de diente
const IncisorSVG = ({ fillColor }: { fillColor: string }) => (
  <svg viewBox="0 0 40 60" className="w-full h-full">
    {/* Corona */}
    <rect x="12" y="5" width="16" height="25" rx="3" fill={fillColor} stroke="#333" strokeWidth="1.5" />
    {/* Raíz */}
    <path d="M 15 30 L 12 55 Q 20 58 28 55 L 25 30 Z" fill={fillColor} stroke="#333" strokeWidth="1.5" />
  </svg>
)

const CanineSVG = ({ fillColor }: { fillColor: string }) => (
  <svg viewBox="0 0 40 60" className="w-full h-full">
    {/* Corona puntiaguda */}
    <path d="M 20 3 L 28 30 L 12 30 Z" fill={fillColor} stroke="#333" strokeWidth="1.5" />
    {/* Raíz larga */}
    <path d="M 15 30 L 10 58 Q 20 60 30 58 L 25 30 Z" fill={fillColor} stroke="#333" strokeWidth="1.5" />
  </svg>
)

const PremolarSVG = ({ fillColor }: { fillColor: string }) => (
  <svg viewBox="0 0 40 60" className="w-full h-full">
    {/* Corona con cúspides */}
    <path d="M 10 15 Q 15 5 20 8 Q 25 5 30 15 L 28 30 L 12 30 Z" fill={fillColor} stroke="#333" strokeWidth="1.5" />
    {/* Raíz */}
    <path d="M 14 30 L 12 55 Q 20 58 28 55 L 26 30 Z" fill={fillColor} stroke="#333" strokeWidth="1.5" />
  </svg>
)

const MolarSVG = ({ fillColor }: { fillColor: string }) => (
  <svg viewBox="0 0 45 60" className="w-full h-full">
    {/* Corona ancha con múltiples cúspides */}
    <path d="M 8 18 Q 11 8 15 10 Q 18 6 22.5 8 Q 27 6 30 10 Q 34 8 37 18 L 35 32 L 10 32 Z" fill={fillColor} stroke="#333" strokeWidth="1.5" />
    {/* Raíces múltiples */}
    <path d="M 12 32 L 8 56 Q 12 58 16 56 L 18 32 Z" fill={fillColor} stroke="#333" strokeWidth="1.5" />
    <path d="M 27 32 L 29 56 Q 33 58 37 56 L 33 32 Z" fill={fillColor} stroke="#333" strokeWidth="1.5" />
  </svg>
)

// Componente de Odontograma
interface OdontogramComponentProps {
  odontogram: { [toothNumber: string]: { status: string; notes?: string } }
  onChange: (odontogram: { [toothNumber: string]: { status: string; notes?: string } }) => void
}

const OdontogramComponent = ({ odontogram, onChange }: OdontogramComponentProps) => {
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null)
  
  // Dientes adultos (Numeración FDI - Vista del dentista)
  const upperRight = [18, 17, 16, 15, 14, 13, 12, 11] // Cuadrante 1
  const upperLeft = [21, 22, 23, 24, 25, 26, 27, 28]  // Cuadrante 2
  const lowerLeft = [31, 32, 33, 34, 35, 36, 37, 38]  // Cuadrante 3
  const lowerRight = [48, 47, 46, 45, 44, 43, 42, 41] // Cuadrante 4

  const statusColors: { [key: string]: string } = {
    healthy: '#d1fae5',      // green-100
    caries: '#fee2e2',       // red-100
    filling: '#dbeafe',      // blue-100
    crown: '#f3e8ff',        // purple-100
    missing: '#e5e7eb',      // gray-200
    implant: '#e0e7ff',      // indigo-100
    'root-canal': '#fed7aa', // orange-100
    other: '#fef3c7'         // yellow-100
  }

  const statusBorders: { [key: string]: string } = {
    healthy: '#86efac',
    caries: '#fca5a5',
    filling: '#93c5fd',
    crown: '#d8b4fe',
    missing: '#9ca3af',
    implant: '#a5b4fc',
    'root-canal': '#fdba74',
    other: '#fde047'
  }

  const getToothType = (toothNumber: number): string => {
    const lastDigit = toothNumber % 10
    if (lastDigit === 1 || lastDigit === 2) return 'incisor'
    if (lastDigit === 3) return 'canine'
    if (lastDigit === 4 || lastDigit === 5) return 'premolar'
    if (lastDigit === 6 || lastDigit === 7 || lastDigit === 8) return 'molar'
    return 'incisor'
  }

  const updateTooth = (toothNumber: number, status: string) => {
    const newOdontogram = { ...odontogram }
    if (status === 'healthy' || status === '') {
      delete newOdontogram[toothNumber.toString()]
    } else {
      newOdontogram[toothNumber.toString()] = { status }
    }
    onChange(newOdontogram)
    setSelectedTooth(null)
  }

  const getToothStatus = (toothNumber: number) => {
    return odontogram[toothNumber.toString()]?.status || 'healthy'
  }

  const ToothIcon = ({ toothNumber, isUpper }: { toothNumber: number; isUpper: boolean }) => {
    const status = getToothStatus(toothNumber)
    const toothType = getToothType(toothNumber)
    const fillColor = statusColors[status] || statusColors['healthy']
    const borderColor = statusBorders[status] || statusBorders['healthy']
    
    const SVGComponent = toothType === 'incisor' ? IncisorSVG :
                        toothType === 'canine' ? CanineSVG :
                        toothType === 'premolar' ? PremolarSVG : MolarSVG
    
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="text-xs text-gray-500 font-mono font-semibold">{toothNumber}</div>
        <button
          onClick={() => setSelectedTooth(toothNumber)}
          className="w-12 h-16 hover:scale-110 transition-transform cursor-pointer relative group"
          style={{ 
            filter: status === 'missing' ? 'grayscale(1) opacity(0.5)' : 'none'
          }}
          title={`Diente ${toothNumber} - ${status}`}
        >
          <div 
            className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ 
              border: `3px solid ${borderColor}`,
              boxShadow: `0 0 10px ${borderColor}`
            }}
          />
          <SVGComponent fillColor={fillColor} />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Leyenda */}
      <div className="flex flex-wrap gap-3 text-xs bg-gray-50 p-3 rounded-lg">
        <div className="flex items-center gap-1">
          <span className="w-6 h-6 rounded" style={{ backgroundColor: statusColors.healthy, border: `2px solid ${statusBorders.healthy}` }} />
          <span>Sano</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-6 h-6 rounded" style={{ backgroundColor: statusColors.caries, border: `2px solid ${statusBorders.caries}` }} />
          <span>Caries</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-6 h-6 rounded" style={{ backgroundColor: statusColors.filling, border: `2px solid ${statusBorders.filling}` }} />
          <span>Obturación</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-6 h-6 rounded" style={{ backgroundColor: statusColors.crown, border: `2px solid ${statusBorders.crown}` }} />
          <span>Corona</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-6 h-6 rounded" style={{ backgroundColor: statusColors.missing, border: `2px solid ${statusBorders.missing}` }} />
          <span>Ausente</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-6 h-6 rounded" style={{ backgroundColor: statusColors.implant, border: `2px solid ${statusBorders.implant}` }} />
          <span>Implante</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-6 h-6 rounded" style={{ backgroundColor: statusColors['root-canal'], border: `2px solid ${statusBorders['root-canal']}` }} />
          <span>Endodoncia</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-6 h-6 rounded" style={{ backgroundColor: statusColors.other, border: `2px solid ${statusBorders.other}` }} />
          <span>Otro</span>
        </div>
      </div>

      {/* Odontograma */}
      <div className="space-y-6 bg-white p-4 rounded-lg border-2 border-gray-200">
        {/* Superior */}
        <div className="border-b-2 border-gray-300 pb-6">
          <div className="text-xs text-gray-500 mb-2 text-center font-semibold">MAXILAR SUPERIOR</div>
          <div className="flex justify-center gap-3">
            {/* Cuadrante Superior Derecho (1) */}
            <div className="flex gap-2">
              {upperRight.map(tooth => <ToothIcon key={tooth} toothNumber={tooth} isUpper={true} />)}
            </div>
            {/* Separador central */}
            <div className="w-px bg-gray-400" />
            {/* Cuadrante Superior Izquierdo (2) */}
            <div className="flex gap-2">
              {upperLeft.map(tooth => <ToothIcon key={tooth} toothNumber={tooth} isUpper={true} />)}
            </div>
          </div>
        </div>

        {/* Inferior */}
        <div>
          <div className="flex justify-center gap-3">
            {/* Cuadrante Inferior Derecho (4) */}
            <div className="flex gap-2">
              {lowerRight.map(tooth => <ToothIcon key={tooth} toothNumber={tooth} isUpper={false} />)}
            </div>
            {/* Separador central */}
            <div className="w-px bg-gray-400" />
            {/* Cuadrante Inferior Izquierdo (3) */}
            <div className="flex gap-2">
              {lowerLeft.map(tooth => <ToothIcon key={tooth} toothNumber={tooth} isUpper={false} />)}
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-2 text-center font-semibold">MAXILAR INFERIOR</div>
        </div>
      </div>

      {/* Modal de selección de estado */}
      {selectedTooth && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedTooth(null)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">Diente {selectedTooth}</h3>
            <p className="text-sm text-gray-600 mb-4">Selecciona el estado del diente:</p>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => updateTooth(selectedTooth, 'healthy')}
                className="p-4 rounded-lg border-2 hover:border-green-500 transition-all"
                style={{ backgroundColor: statusColors.healthy, borderColor: statusBorders.healthy }}
              >
                <div className="font-semibold">Sano</div>
              </button>
              <button
                onClick={() => updateTooth(selectedTooth, 'caries')}
                className="p-4 rounded-lg border-2 hover:border-red-500 transition-all"
                style={{ backgroundColor: statusColors.caries, borderColor: statusBorders.caries }}
              >
                <div className="font-semibold">Caries</div>
              </button>
              <button
                onClick={() => updateTooth(selectedTooth, 'filling')}
                className="p-4 rounded-lg border-2 hover:border-blue-500 transition-all"
                style={{ backgroundColor: statusColors.filling, borderColor: statusBorders.filling }}
              >
                <div className="font-semibold">Obturación</div>
              </button>
              <button
                onClick={() => updateTooth(selectedTooth, 'crown')}
                className="p-4 rounded-lg border-2 hover:border-purple-500 transition-all"
                style={{ backgroundColor: statusColors.crown, borderColor: statusBorders.crown }}
              >
                <div className="font-semibold">Corona</div>
              </button>
              <button
                onClick={() => updateTooth(selectedTooth, 'missing')}
                className="p-4 rounded-lg border-2 hover:border-gray-500 transition-all"
                style={{ backgroundColor: statusColors.missing, borderColor: statusBorders.missing }}
              >
                <div className="font-semibold">Ausente</div>
              </button>
              <button
                onClick={() => updateTooth(selectedTooth, 'implant')}
                className="p-4 rounded-lg border-2 hover:border-indigo-500 transition-all"
                style={{ backgroundColor: statusColors.implant, borderColor: statusBorders.implant }}
              >
                <div className="font-semibold">Implante</div>
              </button>
              <button
                onClick={() => updateTooth(selectedTooth, 'root-canal')}
                className="p-4 rounded-lg border-2 hover:border-orange-500 transition-all"
                style={{ backgroundColor: statusColors['root-canal'], borderColor: statusBorders['root-canal'] }}
              >
                <div className="font-semibold">Endodoncia</div>
              </button>
              <button
                onClick={() => updateTooth(selectedTooth, 'other')}
                className="p-4 rounded-lg border-2 hover:border-yellow-500 transition-all"
                style={{ backgroundColor: statusColors.other, borderColor: statusBorders.other }}
              >
                <div className="font-semibold">Otro</div>
              </button>
            </div>

            <button
              onClick={() => setSelectedTooth(null)}
              className="mt-4 w-full py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function MedicalHistoryPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const toast = useToast()
  const patientId = params.id as string
  
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingBudget, setSavingBudget] = useState(false)
  const [history, setHistory] = useState<Partial<MedicalHistory>>({
    allergies: [],
    currentMedications: [],
    systemicDiseases: [],
    smokingHabit: 'no',
    alcoholConsumption: 'no',
    bruxism: false,
    budgetAmount: undefined,
    budgetPayments: [],
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const patientData = await getPatient(patientId)
        if (!patientData) {
          router.push('/patients')
          return
        }
        setPatient(patientData)

        const medicalHistory = await getMedicalHistory(patientId)
        if (medicalHistory) {
          setHistory(medicalHistory)
        }
      } catch (error) {
        console.error('Error al cargar datos:', error)
        router.push('/patients')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [patientId, router])

  const handleSave = async () => {
    if (!user) return

    try {
      setSaving(true)
      await saveMedicalHistory(user.uid, patientId, history)
      
      // Recargar la historia clínica completa desde Firestore
      const updatedHistory = await getMedicalHistory(patientId)
      if (updatedHistory) {
        setHistory(updatedHistory)
      }
      
      toast.success('Historia clínica guardada exitosamente')
    } catch (error) {
      console.error('Error al guardar historia clínica:', error)
      toast.error('Error al guardar historia clínica')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveBudget = async () => {
    if (!user) return

    try {
      setSavingBudget(true)
      // Guardar solo los campos de presupuesto
      await saveMedicalHistory(user.uid, patientId, {
        budgetAmount: history.budgetAmount,
        budgetPayments: history.budgetPayments,
      })
      
      // Recargar la historia clínica completa desde Firestore para asegurar que los datos estén sincronizados
      const updatedHistory = await getMedicalHistory(patientId)
      if (updatedHistory) {
        setHistory(updatedHistory)
      }
      
      toast.success('Presupuesto guardado exitosamente')
    } catch (error) {
      console.error('Error al guardar presupuesto:', error)
      toast.error('Error al guardar presupuesto')
    } finally {
      setSavingBudget(false)
    }
  }

  const addItem = (field: 'allergies' | 'currentMedications' | 'systemicDiseases', value: string) => {
    if (!value.trim()) return
    const currentArray = (history[field] as string[]) || []
    setHistory({
      ...history,
      [field]: [...currentArray, value.trim()]
    })
  }

  const removeItem = (field: 'allergies' | 'currentMedications' | 'systemicDiseases', index: number) => {
    const currentArray = (history[field] as string[]) || []
    setHistory({
      ...history,
      [field]: currentArray.filter((_, i) => i !== index)
    })
  }

  // Funciones para manejar presupuesto
  const addBudgetPayment = () => {
    const newPayment: BudgetPayment = {
      id: Date.now().toString(),
      date: new Date(),
      treatment: '',
      amount: 0
    }
    setHistory({
      ...history,
      budgetPayments: [...(history.budgetPayments || []), newPayment]
    })
  }

  const updateBudgetPayment = (id: string, field: keyof BudgetPayment, value: any) => {
    const payments = history.budgetPayments || []
    const updatedPayments = payments.map(payment => 
      payment.id === id ? { ...payment, [field]: value } : payment
    )
    setHistory({
      ...history,
      budgetPayments: updatedPayments
    })
  }

  const removeBudgetPayment = (id: string) => {
    setHistory({
      ...history,
      budgetPayments: (history.budgetPayments || []).filter(p => p.id !== id)
    })
  }

  const calculateBalance = (upToIndex: number): number => {
    const budgetAmount = history.budgetAmount || 0
    const payments = history.budgetPayments || []
    const totalPaid = payments.slice(0, upToIndex + 1).reduce((sum, p) => sum + (p.amount || 0), 0)
    return budgetAmount - totalPaid
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout title="Historia Clínica">
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
      <DashboardLayout title={`Historia Clínica - ${patient.firstName} ${patient.lastName}`}>
        <div className="mb-6 flex justify-between items-center">
          <Link href={`/patients/${patientId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Paciente
            </Button>
          </Link>
          <Button onClick={handleSave} isLoading={saving} className="bg-primary-600">
            <Save className="w-4 h-4 mr-2" />
            Guardar Cambios
          </Button>
        </div>

        <div className="space-y-6">
          {/* ANAMNESIS */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Anamnesis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="chiefComplaint">Motivo de Consulta</Label>
                <textarea
                  id="chiefComplaint"
                  value={history.chiefComplaint || ''}
                  onChange={(e) => setHistory({ ...history, chiefComplaint: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={2}
                  placeholder="¿Por qué viene el paciente?"
                />
              </div>

              <div>
                <Label htmlFor="currentIllness">Enfermedad Actual</Label>
                <textarea
                  id="currentIllness"
                  value={history.currentIllness || ''}
                  onChange={(e) => setHistory({ ...history, currentIllness: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* ANTECEDENTES PERSONALES */}
          <Card>
            <CardHeader>
              <CardTitle>Antecedentes Personales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Alergias */}
              <div>
                <Label>Alergias</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    id="allergyInput"
                    placeholder="Agregar alergia..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.target as HTMLInputElement
                        addItem('allergies', input.value)
                        input.value = ''
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      const input = document.getElementById('allergyInput') as HTMLInputElement
                      addItem('allergies', input.value)
                      input.value = ''
                    }}
                  >
                    +
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(history.allergies || []).map((allergy, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm flex items-center gap-2"
                    >
                      {allergy}
                      <button
                        onClick={() => removeItem('allergies', index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Medicación Actual */}
              <div>
                <Label>Medicación Actual</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    id="medicationInput"
                    placeholder="Agregar medicamento..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.target as HTMLInputElement
                        addItem('currentMedications', input.value)
                        input.value = ''
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      const input = document.getElementById('medicationInput') as HTMLInputElement
                      addItem('currentMedications', input.value)
                      input.value = ''
                    }}
                  >
                    +
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(history.currentMedications || []).map((med, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2"
                    >
                      {med}
                      <button
                        onClick={() => removeItem('currentMedications', index)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Enfermedades Sistémicas */}
              <div>
                <Label>Enfermedades Sistémicas</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    id="diseaseInput"
                    placeholder="Agregar enfermedad (diabetes, hipertensión, etc)..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.target as HTMLInputElement
                        addItem('systemicDiseases', input.value)
                        input.value = ''
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      const input = document.getElementById('diseaseInput') as HTMLInputElement
                      addItem('systemicDiseases', input.value)
                      input.value = ''
                    }}
                  >
                    +
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(history.systemicDiseases || []).map((disease, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm flex items-center gap-2"
                    >
                      {disease}
                      <button
                        onClick={() => removeItem('systemicDiseases', index)}
                        className="text-yellow-600 hover:text-yellow-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Cirugías Previas */}
              <div>
                <Label htmlFor="previousSurgeries">Cirugías Previas</Label>
                <textarea
                  id="previousSurgeries"
                  value={history.previousSurgeries || ''}
                  onChange={(e) => setHistory({ ...history, previousSurgeries: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* ANTECEDENTES FAMILIARES */}
          <Card>
            <CardHeader>
              <CardTitle>Antecedentes Familiares</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={history.familyHistory || ''}
                onChange={(e) => setHistory({ ...history, familyHistory: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
                placeholder="Enfermedades hereditarias, antecedentes odontológicos familiares..."
              />
            </CardContent>
          </Card>

          {/* HÁBITOS */}
          <Card>
            <CardHeader>
              <CardTitle>Hábitos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smokingHabit">Tabaquismo</Label>
                  <select
                    id="smokingHabit"
                    value={history.smokingHabit || 'no'}
                    onChange={(e) => setHistory({ ...history, smokingHabit: e.target.value as any })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="no">No</option>
                    <option value="occasional">Ocasional</option>
                    <option value="frequent">Frecuente</option>
                    <option value="heavy">Intenso</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="alcoholConsumption">Consumo de Alcohol</Label>
                  <select
                    id="alcoholConsumption"
                    value={history.alcoholConsumption || 'no'}
                    onChange={(e) => setHistory({ ...history, alcoholConsumption: e.target.value as any })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="no">No</option>
                    <option value="occasional">Ocasional</option>
                    <option value="frequent">Frecuente</option>
                    <option value="heavy">Intenso</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="bruxism"
                  checked={history.bruxism || false}
                  onChange={(e) => setHistory({ ...history, bruxism: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="bruxism" className="mb-0">Bruxismo</Label>
              </div>

              <div>
                <Label htmlFor="otherHabits">Otros Hábitos</Label>
                <textarea
                  id="otherHabits"
                  value={history.otherHabits || ''}
                  onChange={(e) => setHistory({ ...history, otherHabits: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* EXAMEN CLÍNICO */}
          <Card>
            <CardHeader>
              <CardTitle>Examen Clínico</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="extraoralExam">Examen Extraoral</Label>
                <textarea
                  id="extraoralExam"
                  value={history.extraoralExam || ''}
                  onChange={(e) => setHistory({ ...history, extraoralExam: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="Ganglios, ATM, asimetrías, lesiones externas..."
                />
              </div>

              <div>
                <Label htmlFor="intraoralExam">Examen Intraoral</Label>
                <textarea
                  id="intraoralExam"
                  value={history.intraoralExam || ''}
                  onChange={(e) => setHistory({ ...history, intraoralExam: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="Mucosa, lengua, encías, paladar..."
                />
              </div>
            </CardContent>
          </Card>

          {/* ODONTOGRAMA */}
          <Card>
            <CardHeader>
              <CardTitle>Odontograma</CardTitle>
              <CardDescription>Estado de cada pieza dental (Numeración FDI)</CardDescription>
            </CardHeader>
            <CardContent>
              <OdontogramComponent
                odontogram={history.odontogram || {}}
                onChange={(newOdontogram) => setHistory({ ...history, odontogram: newOdontogram as any })}
              />
            </CardContent>
          </Card>

          {/* DIAGNÓSTICO */}
          <Card>
            <CardHeader>
              <CardTitle>Diagnóstico</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="presumptiveDiagnosis">Diagnóstico Presuntivo</Label>
                <textarea
                  id="presumptiveDiagnosis"
                  value={history.presumptiveDiagnosis || ''}
                  onChange={(e) => setHistory({ ...history, presumptiveDiagnosis: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="definitiveDiagnosis">Diagnóstico Definitivo</Label>
                <textarea
                  id="definitiveDiagnosis"
                  value={history.definitiveDiagnosis || ''}
                  onChange={(e) => setHistory({ ...history, definitiveDiagnosis: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* PLAN DE TRATAMIENTO */}
          <Card>
            <CardHeader>
              <CardTitle>Plan de Tratamiento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="treatmentPlan">Tratamientos Planificados</Label>
                <textarea
                  id="treatmentPlan"
                  value={history.treatmentPlan || ''}
                  onChange={(e) => setHistory({ ...history, treatmentPlan: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={4}
                  placeholder="Lista de tratamientos a realizar..."
                />
              </div>

              <div>
                <Label htmlFor="prognosis">Pronóstico</Label>
                <select
                  id="prognosis"
                  value={history.prognosis || ''}
                  onChange={(e) => setHistory({ ...history, prognosis: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Seleccionar...</option>
                  <option value="excellent">Excelente</option>
                  <option value="good">Bueno</option>
                  <option value="fair">Regular</option>
                  <option value="poor">Malo</option>
                  <option value="hopeless">Sin esperanza</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* PRESUPUESTO */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Presupuesto:</CardTitle>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveBudget}
                    isLoading={savingBudget}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Presupuesto
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={addBudgetPayment}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Fila
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Monto del presupuesto */}
              <div className="mb-4">
                <Label htmlFor="budgetAmount">Monto Total del Presupuesto</Label>
                <div className="relative max-w-xs">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    id="budgetAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={history.budgetAmount || ''}
                    onChange={(e) => setHistory({ ...history, budgetAmount: parseFloat(e.target.value) || 0 })}
                    className="pl-7"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Tabla de pagos */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="text-left py-3 px-4 bg-gray-50 font-semibold text-gray-700">Fecha</th>
                      <th className="text-left py-3 px-4 bg-gray-50 font-semibold text-gray-700">Tratamiento Realizado</th>
                      <th className="text-right py-3 px-4 bg-gray-50 font-semibold text-gray-700">Entrega</th>
                      <th className="text-right py-3 px-4 bg-gray-50 font-semibold text-gray-700">Saldo</th>
                      <th className="text-center py-3 px-4 bg-gray-50 font-semibold text-gray-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!history.budgetPayments || history.budgetPayments.length === 0 ? (
                      <tr className="border-b border-gray-200">
                        <td className="py-6 px-4 text-gray-500 text-center" colSpan={5}>
                          No hay registros de presupuesto aún. Haz clic en "Agregar Fila" para comenzar.
                        </td>
                      </tr>
                    ) : (
                      history.budgetPayments.map((payment, index) => (
                        <tr key={payment.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="py-2 px-4">
                            <Input
                              type="date"
                              value={payment.date instanceof Date ? payment.date.toISOString().split('T')[0] : ''}
                              onChange={(e) => updateBudgetPayment(payment.id, 'date', new Date(e.target.value))}
                              className="w-full"
                            />
                          </td>
                          <td className="py-2 px-4">
                            <Input
                              type="text"
                              value={payment.treatment}
                              onChange={(e) => updateBudgetPayment(payment.id, 'treatment', e.target.value)}
                              placeholder="Descripción del tratamiento..."
                              className="w-full"
                            />
                          </td>
                          <td className="py-2 px-4">
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={payment.amount || ''}
                                onChange={(e) => updateBudgetPayment(payment.id, 'amount', parseFloat(e.target.value) || 0)}
                                className="w-full pl-7 text-right"
                                placeholder="0.00"
                              />
                            </div>
                          </td>
                          <td className="py-2 px-4 text-right font-semibold">
                            <span className={calculateBalance(index) >= 0 ? 'text-green-600' : 'text-red-600'}>
                              ${calculateBalance(index).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </td>
                          <td className="py-2 px-4 text-center">
                            <button
                              onClick={() => removeBudgetPayment(payment.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar fila"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {history.budgetPayments && history.budgetPayments.length > 0 && (
                    <tfoot>
                      <tr className="bg-gray-100 font-bold">
                        <td colSpan={2} className="py-3 px-4 text-right">Total:</td>
                        <td className="py-3 px-4 text-right">
                          ${(history.budgetPayments.reduce((sum, p) => sum + (p.amount || 0), 0)).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={calculateBalance(history.budgetPayments.length - 1) >= 0 ? 'text-green-600' : 'text-red-600'}>
                            ${calculateBalance(history.budgetPayments.length - 1).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Botón guardar final */}
          <div className="flex justify-end">
            <Button onClick={handleSave} isLoading={saving} size="lg" className="bg-primary-600">
              <Save className="w-4 h-4 mr-2" />
              Guardar Historia Clínica
            </Button>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
