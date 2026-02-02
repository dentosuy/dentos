import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users } from 'lucide-react'

interface GroupCardProps {
  groupName: string
  patientCount: number
  onClick: () => void
}

/**
 * Card para mostrar un grupo de pacientes
 */
export function GroupCard({ groupName, patientCount, onClick }: GroupCardProps) {
  return (
    <Card 
      className="hover:shadow-lg transition-all cursor-pointer hover:border-primary-500 bg-gradient-to-br from-primary-50 to-white border-2 border-primary-200"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-primary-500 rounded-full flex items-center justify-center shadow-md">
            <Users className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl text-primary-900">
              {groupName}
            </CardTitle>
            <p className="text-sm text-primary-600 font-medium mt-1">
              Grupo de pacientes
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-primary-100">
          <span className="text-gray-600 font-medium">Total de pacientes:</span>
          <span className="text-2xl font-bold text-primary-600">{patientCount}</span>
        </div>
      </CardContent>
    </Card>
  )
}
