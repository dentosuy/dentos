import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Card que se muestra cuando no hay pacientes registrados
 */
export function EmptyPatientsCard() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <div className="mx-auto mb-4 w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-4xl">👥</span>
          </div>
          <CardTitle className="text-2xl">No tienes pacientes registrados</CardTitle>
          <CardDescription className="text-base mt-2">
            Comienza agregando tu primer paciente para gestionar sus citas y tratamientos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/patients/new">
            <Button size="lg" className="w-full sm:w-auto">
              ➕ Agregar Primer Paciente
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
