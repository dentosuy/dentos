import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc,
  query, 
  where,
  orderBy,
  Timestamp,
  serverTimestamp 
} from 'firebase/firestore'
import { db } from './firebase'
import type { Visit } from '@/types'

/**
 * Convierte un documento de Firestore a tipo Visit
 */
const firestoreToVisit = (doc: any): Visit => {
  const data = doc.data()
  return {
    id: doc.id,
    dentistId: data.dentistId,
    patientId: data.patientId,
    appointmentId: data.appointmentId,
    visitDate: data.visitDate?.toDate() || new Date(),
    chiefComplaint: data.chiefComplaint,
    symptoms: data.symptoms,
    treatmentsPerformed: data.treatmentsPerformed || [],
    notes: data.notes,
    diagnosis: data.diagnosis,
    prescriptions: data.prescriptions || [],
    nextAppointmentSuggestion: data.nextAppointmentSuggestion,
    attachments: data.attachments || [],
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  }
}

/**
 * Crear una nueva visita
 */
export const createVisit = async (
  dentistId: string,
  patientId: string,
  visitData: Partial<Visit>
): Promise<string> => {
  try {
    const visitsRef = collection(db, 'visits')
    const docRef = await addDoc(visitsRef, {
      dentistId,
      appointmentId: visitData.appointmentId || null,
      patientId,
      visitDate: visitData.visitDate ? Timestamp.fromDate(visitData.visitDate) : Timestamp.now(),
      chiefComplaint: visitData.chiefComplaint || '',
      symptoms: visitData.symptoms || '',
      treatmentsPerformed: visitData.treatmentsPerformed || [],
      notes: visitData.notes || '',
      diagnosis: visitData.diagnosis || '',
      prescriptions: visitData.prescriptions || [],
      nextAppointmentSuggestion: visitData.nextAppointmentSuggestion || '',
      attachments: visitData.attachments || [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    
    return docRef.id
  } catch (error) {
    console.error('Error al crear visita:', error)
    throw error
  }
}

/**
 * Obtener todas las visitas de un paciente
 */
export const getPatientVisits = async (patientId: string): Promise<Visit[]> => {
  try {
    const visitsRef = collection(db, 'visits')
    const q = query(
      visitsRef,
      where('patientId', '==', patientId)
    )
    
    const querySnapshot = await getDocs(q)
    const visits = querySnapshot.docs.map(firestoreToVisit)
    
    // Ordenar en el cliente por fecha de visita (más reciente primero)
    return visits.sort((a, b) => b.visitDate.getTime() - a.visitDate.getTime())
  } catch (error) {
    console.error('Error al obtener visitas:', error)
    throw error
  }
}

/**
 * Obtener visita asociada a una cita específica
 */
export const getVisitByAppointment = async (appointmentId: string): Promise<Visit | null> => {
  try {
    const visitsRef = collection(db, 'visits')
    const q = query(
      visitsRef,
      where('appointmentId', '==', appointmentId)
    )
    
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      return null
    }
    
    // Debería haber solo una visita por cita
    return firestoreToVisit(querySnapshot.docs[0])
  } catch (error) {
    console.error('Error al obtener visita por cita:', error)
    throw error
  }
}

/**
 * Obtener todas las visitas de un dentista
 */
export const getDentistVisits = async (dentistId: string): Promise<Visit[]> => {
  try {
    const visitsRef = collection(db, 'visits')
    const q = query(
      visitsRef,
      where('dentistId', '==', dentistId),
      orderBy('visitDate', 'desc')
    )
    
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(firestoreToVisit)
  } catch (error) {
    console.error('Error al obtener visitas:', error)
    throw error
  }
}

/**
 * Obtener una visita por ID
 */
export const getVisit = async (visitId: string): Promise<Visit | null> => {
  try {
    const visitRef = doc(db, 'visits', visitId)
    const visitDoc = await getDoc(visitRef)
    
    if (!visitDoc.exists()) {
      return null
    }
    
    return firestoreToVisit(visitDoc)
  } catch (error) {
    console.error('Error al obtener visita:', error)
    throw error
  }
}

/**
 * Actualizar una visita existente
 */
export const updateVisit = async (
  visitId: string,
  visitData: Partial<Visit>
): Promise<void> => {
  try {
    const visitRef = doc(db, 'visits', visitId)
    
    const updateData: any = {
      updatedAt: serverTimestamp(),
    }
    
    if (visitData.visitDate) {
      updateData.visitDate = Timestamp.fromDate(visitData.visitDate)
    }
    if (visitData.chiefComplaint !== undefined) {
      updateData.chiefComplaint = visitData.chiefComplaint
    }
    if (visitData.symptoms !== undefined) {
      updateData.symptoms = visitData.symptoms
    }
    if (visitData.treatmentsPerformed) {
      updateData.treatmentsPerformed = visitData.treatmentsPerformed
    }
    if (visitData.notes !== undefined) {
      updateData.notes = visitData.notes
    }
    if (visitData.diagnosis !== undefined) {
      updateData.diagnosis = visitData.diagnosis
    }
    if (visitData.prescriptions) {
      updateData.prescriptions = visitData.prescriptions
    }
    if (visitData.nextAppointmentSuggestion !== undefined) {
      updateData.nextAppointmentSuggestion = visitData.nextAppointmentSuggestion
    }
    if (visitData.attachments) {
      updateData.attachments = visitData.attachments
    }
    
    await updateDoc(visitRef, updateData)
  } catch (error) {
    console.error('Error al actualizar visita:', error)
    throw error
  }
}

/**
 * Eliminar una visita
 */
export const deleteVisit = async (visitId: string): Promise<void> => {
  try {
    const visitRef = doc(db, 'visits', visitId)
    await deleteDoc(visitRef)
  } catch (error) {
    console.error('Error al eliminar visita:', error)
    throw error
  }
}
