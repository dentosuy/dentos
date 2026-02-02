import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from './firebase'

/**
 * Estructura del backup completo
 */
export interface BackupData {
  exportDate: string
  dentistInfo: {
    uid: string
    email: string
    displayName?: string
    clinicName?: string
    clinicAddress?: string
    phone?: string
    licenseNumber?: string
  }
  patients: any[]
  medicalHistories: any[]
  appointments: any[]
  transactions: any[]
  stock: any[]
  visits: any[]
  metadata: {
    version: string
    totalRecords: number
  }
}

/**
 * Exportar todos los datos del dentista a un objeto JSON
 */
export async function exportAllData(dentistId: string, dentistInfo: any): Promise<BackupData> {
  try {
    // Recopilar todos los datos del dentista
    const [
      patientsSnapshot,
      medicalHistoriesSnapshot,
      appointmentsSnapshot,
      transactionsSnapshot,
      stockSnapshot,
      visitsSnapshot
    ] = await Promise.all([
      getDocs(query(collection(db, 'patients'), where('dentistId', '==', dentistId))),
      getDocs(query(collection(db, 'medicalHistories'), where('dentistId', '==', dentistId))),
      getDocs(query(collection(db, 'appointments'), where('dentistId', '==', dentistId))),
      getDocs(query(collection(db, 'transactions'), where('dentistId', '==', dentistId))),
      getDocs(query(collection(db, 'stock'), where('dentistId', '==', dentistId))),
      getDocs(query(collection(db, 'visits'), where('dentistId', '==', dentistId)))
    ])

    // Convertir snapshots a arrays de objetos JSON serializables
    const patients = patientsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...serializeData(doc.data())
    }))

    const medicalHistories = medicalHistoriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...serializeData(doc.data())
    }))

    const appointments = appointmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...serializeData(doc.data())
    }))

    const transactions = transactionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...serializeData(doc.data())
    }))

    const stock = stockSnapshot.docs.map(doc => ({
      id: doc.id,
      ...serializeData(doc.data())
    }))

    const visits = visitsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...serializeData(doc.data())
    }))

    const totalRecords = 
      patients.length + 
      medicalHistories.length + 
      appointments.length + 
      transactions.length + 
      stock.length + 
      visits.length

    const backupData: BackupData = {
      exportDate: new Date().toISOString(),
      dentistInfo: {
        uid: dentistId,
        email: dentistInfo.email || '',
        displayName: dentistInfo.displayName,
        clinicName: dentistInfo.clinicName,
        clinicAddress: dentistInfo.clinicAddress,
        phone: dentistInfo.phone,
        licenseNumber: dentistInfo.licenseNumber
      },
      patients,
      medicalHistories,
      appointments,
      transactions,
      stock,
      visits,
      metadata: {
        version: '1.0',
        totalRecords
      }
    }

    return backupData
  } catch (error) {
    console.error('Error al exportar datos:', error)
    throw new Error('No se pudieron exportar los datos')
  }
}

/**
 * Serializar datos de Firestore para JSON
 * Convierte Timestamps a strings ISO
 */
function serializeData(data: any): any {
  const serialized: any = {}
  
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) {
      serialized[key] = null
    } else if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
      // Timestamp de Firestore
      serialized[key] = value.toDate().toISOString()
    } else if (Array.isArray(value)) {
      serialized[key] = value.map(item => 
        item && typeof item === 'object' ? serializeData(item) : item
      )
    } else if (value && typeof value === 'object') {
      serialized[key] = serializeData(value)
    } else {
      serialized[key] = value
    }
  }
  
  return serialized
}

/**
 * Descargar datos como archivo JSON
 */
export function downloadBackupFile(data: BackupData, filename?: string) {
  const jsonString = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename || `backup-dentos-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Obtener estadísticas del backup
 */
export function getBackupStats(data: BackupData) {
  return {
    totalPacientes: data.patients.length,
    totalHistorias: data.medicalHistories.length,
    totalCitas: data.appointments.length,
    totalTransacciones: data.transactions.length,
    totalStock: data.stock.length,
    totalVisitas: data.visits.length,
    totalRegistros: data.metadata.totalRecords,
    fechaExportacion: new Date(data.exportDate).toLocaleString('es-AR'),
    tamanioEstimado: `${(JSON.stringify(data).length / 1024).toFixed(2)} KB`
  }
}
