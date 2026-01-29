/**
 * Página de carga global
 */
export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4"></div>
        </div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          DentOS 🦷
        </h2>
        <p className="text-gray-600">
          Cargando...
        </p>
      </div>
    </div>
  )
}
