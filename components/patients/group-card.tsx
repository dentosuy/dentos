import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
      className="hover:shadow-lg transition-all cursor-pointer hover:border-primary-300"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-xl">👥</span>
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">
              {groupName}
            </CardTitle>
            <p className="text-sm text-gray-500">{patientCount} paciente{patientCount !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </CardHeader>
    </Card>
  )
}
