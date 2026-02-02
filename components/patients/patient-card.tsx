import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Patient } from '@/types'

interface PatientCardProps {
  patient: Patient
}

/**
 * Card individual para mostrar información de un paciente
 */
export function PatientCard({ patient }: PatientCardProps) {
  const age = calculateAge(patient.dateOfBirth)
  
  return (
    <Link href={`/patients/${patient.id}`}>
      <Card className="hover:shadow-lg transition-all cursor-pointer hover:border-primary-300">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-xl">👤</span>
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">
                {patient.firstName} {patient.lastName}
              </CardTitle>
              <p className="text-sm text-gray-500">{age} años</p>
              {patient.groupName && (
                <p className="text-xs text-primary-600 font-medium mt-1 flex items-center gap-1">
                  <span>👥</span> {patient.groupName}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>📞</span>
            <span>{patient.phone}</span>
          </div>
          {patient.email && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>📧</span>
              <span className="truncate">{patient.email}</span>
            </div>
          )}
          {patient.address && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>📍</span>
              <span className="truncate">{patient.address}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

/**
 * Calcular edad a partir de fecha de nacimiento
 */
function calculateAge(dateOfBirth: Date): number {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  
  return age
}
