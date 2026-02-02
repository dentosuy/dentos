/**
 * Usuario autenticado en el sistema
 */
export interface User {
  uid: string
  email: string
  displayName?: string
  photoURL?: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Estado de suscripción del dentista
 */
export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'cancelled'

/**
 * Tipo de plan de suscripción
 */
export type PlanType = 'monthly' | 'annual'

/**
 * Perfil del dentista
 */
export interface DentistProfile extends User {
  licenseNumber: string
  specialization?: string
  phone?: string
  clinicName?: string
  clinicAddress?: string
  // Campos de suscripción
  subscriptionStatus: SubscriptionStatus
  trialEndsAt?: Date
  subscriptionEndsAt?: Date
  planType?: PlanType
  lastPaymentDate?: Date
}

/**
 * Paciente
 */
export interface Patient {
  id: string
  dentistId: string
  firstName: string
  lastName: string
  email?: string
  phone: string
  dateOfBirth: Date
  address?: string
  medicalHistory?: string
  groupName?: string // Nombre del grupo al que pertenece (ej: "Colegio San José")
  lastMonthlyPayment?: Date // Fecha del último pago de mensualidad (para grupos)
  createdAt: Date
  updatedAt: Date
}

/**
 * Cita/Agenda
 */
export interface Appointment {
  id: string
  dentistId: string
  patientId: string
  date: Date
  duration: number // en minutos
  type: 'consultation' | 'cleaning' | 'treatment' | 'emergency' | 'other'
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
  notes?: string
  price?: number // precio de la consulta/tratamiento
  paymentStatus?: 'paid' | 'pending' | 'partial' // estado de pago
  transactionId?: string // referencia a la transacción en finanzas
  createdAt: Date
  updatedAt: Date
}

/**
 * Pedido
 */
export interface Order {
  id: string
  dentistId: string
  patientId: string
  items: OrderItem[]
  total: number
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  createdAt: Date
  updatedAt: Date
}

/**
 * Item de un pedido
 */
export interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
}

/**
 * Item de Stock/Inventario
 */
export interface StockItem {
  id: string
  dentistId: string
  name: string
  category: 'material' | 'instrument' | 'medication' | 'consumable' | 'other'
  quantity: number
  unit: string // ej: 'unidades', 'cajas', 'ml', 'gr'
  minQuantity: number // cantidad mínima antes de alerta
  location?: string // ubicación en el consultorio
  supplier?: string // proveedor
  cost?: number // costo unitario
  notes?: string
  expirationDate?: Date // para medicamentos/materiales con vencimiento
  createdAt: Date
  updatedAt: Date
}

/**
 * Material usado en una cita
 */
export interface AppointmentMaterial {
  id: string
  appointmentId: string
  stockItemId: string
  stockItemName: string // Denormalizado para lectura rápida
  category: StockItem['category']
  quantityUsed: number
  unit: string
  cost?: number // Costo al momento de uso
  registeredAt: Date
}

/**
 * Transacción financiera (Ingreso o Egreso)
 */
export interface Transaction {
  id: string
  dentistId: string
  type: 'income' | 'expense'
  amount: number
  category: string
  concept: string
  date: Date
  paymentMethod: 'cash' | 'card' | 'transfer' | 'other'
  status: 'paid' | 'pending' | 'partial'
  
  // Referencias opcionales
  patientId?: string
  appointmentId?: string
  
  notes?: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Historia Clínica Odontológica
 */
export interface MedicalHistory {
  id: string
  patientId: string
  dentistId: string
  
  // Anamnesis
  chiefComplaint?: string // Motivo de consulta
  currentIllness?: string // Enfermedad actual
  
  // Antecedentes Personales
  allergies?: string[] // Alergias
  currentMedications?: string[] // Medicación actual
  systemicDiseases?: string[] // Enfermedades sistémicas (diabetes, hipertensión, etc.)
  previousSurgeries?: string // Cirugías previas
  
  // Antecedentes Familiares
  familyHistory?: string
  
  // Hábitos
  smokingHabit?: 'no' | 'occasional' | 'frequent' | 'heavy'
  alcoholConsumption?: 'no' | 'occasional' | 'frequent' | 'heavy'
  bruxism?: boolean
  otherHabits?: string
  
  // Examen Clínico
  extraoralExam?: string
  intraoralExam?: string
  
  // Odontograma (estado dental) - JSON con estructura de dientes
  odontogram?: {
    [toothNumber: string]: {
      status: 'healthy' | 'caries' | 'filling' | 'crown' | 'missing' | 'implant' | 'root-canal' | 'other'
      notes?: string
    }
  }
  
  // Índices periodontales
  periodontalIndices?: {
    plaque?: number
    gingival?: number
    bleeding?: number
  }
  
  // Diagnóstico
  presumptiveDiagnosis?: string
  definitiveDiagnosis?: string
  
  // Plan de Tratamiento
  treatmentPlan?: string
  prognosis?: 'excellent' | 'good' | 'fair' | 'poor' | 'hopeless'
  
  // Presupuesto y pagos
  budgetAmount?: number // Monto total del presupuesto
  budgetPayments?: BudgetPayment[] // Historial de pagos
  
  // Metadata
  createdAt: Date
  updatedAt: Date
}

/**
 * Registro de pago en el presupuesto
 */
export interface BudgetPayment {
  id: string
  date: Date
  treatment: string // Tratamiento realizado
  amount: number // Monto entregado/pagado
}

/**
 * Visita/Evolución del paciente
 */
export interface Visit {
  id: string
  dentistId: string
  patientId: string
  appointmentId?: string // Vinculación opcional con una cita
  visitDate: Date
  chiefComplaint?: string // Motivo de la visita
  symptoms?: string // Síntomas presentados
  treatmentsPerformed?: string[] // Tratamientos realizados en esta visita
  notes?: string // Notas de evolución
  diagnosis?: string // Diagnóstico de esta visita
  prescriptions?: string[] // Medicamentos recetados
  nextAppointmentSuggestion?: string // Sugerencia de próxima cita
  attachments?: string[] // URLs de imágenes/archivos adjuntos
  createdAt: Date
  updatedAt: Date
}
