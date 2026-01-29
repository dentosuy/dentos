import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Appointment } from '@/types'

/**
 * Agregar una nueva cita
 */
export async function addAppointment(
  dentistId: string,
  appointmentData: Omit<Appointment, 'id' | 'dentistId' | 'createdAt' | 'updatedAt'>
): Promise<Appointment> {
  try {
    const appointmentRef = await addDoc(collection(db, 'appointments'), {
      ...appointmentData,
      dentistId,
      date: Timestamp.fromDate(new Date(appointmentData.date)),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    const newAppointment = await getDoc(appointmentRef)
    const data = newAppointment.data()

    return {
      id: newAppointment.id,
      dentistId,
      patientId: data!.patientId,
      date: data!.date.toDate(),
      duration: data!.duration,
      type: data!.type,
      status: data!.status,
      notes: data!.notes,
      price: data!.price,
      paymentStatus: data!.paymentStatus,
      transactionId: data!.transactionId,
      createdAt: data!.createdAt.toDate(),
      updatedAt: data!.updatedAt.toDate(),
    }
  } catch (error) {
    console.error('Error al agregar cita:', error)
    throw new Error('No se pudo agregar la cita')
  }
}

/**
 * Obtener todas las citas de un dentista
 */
export async function getAppointments(dentistId: string): Promise<Appointment[]> {
  try {
    const q = query(
      collection(db, 'appointments'),
      where('dentistId', '==', dentistId)
    )

    const querySnapshot = await getDocs(q)
    
    const appointments = querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        dentistId: data.dentistId,
        patientId: data.patientId,
        date: data.date.toDate(),
        duration: data.duration,
        type: data.type,
        status: data.status,
        notes: data.notes,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      }
    })

    // Ordenar por fecha
    return appointments.sort((a, b) => a.date.getTime() - b.date.getTime())
  } catch (error) {
    console.error('Error al obtener citas:', error)
    throw new Error('No se pudieron obtener las citas')
  }
}

/**
 * Obtener citas de un mes específico
 */
export async function getAppointmentsByMonth(
  dentistId: string,
  year: number,
  month: number
): Promise<Appointment[]> {
  try {
    const q = query(
      collection(db, 'appointments'),
      where('dentistId', '==', dentistId)
    )

    const querySnapshot = await getDocs(q)
    
    const appointments = querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        dentistId: data.dentistId,
        patientId: data.patientId,
        date: data.date.toDate(),
        duration: data.duration,
        type: data.type,
        status: data.status,
        notes: data.notes,
        price: data.price,
        paymentStatus: data.paymentStatus,
        transactionId: data.transactionId,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      }
    })

    // Filtrar por mes en el cliente
    const filtered = appointments.filter(apt => {
      const aptDate = new Date(apt.date)
      return aptDate.getMonth() === month && aptDate.getFullYear() === year
    })

    return filtered.sort((a, b) => a.date.getTime() - b.date.getTime())
  } catch (error) {
    console.error('Error al obtener citas del mes:', error)
    throw new Error('No se pudieron obtener las citas del mes')
  }
}

/**
 * Obtener citas de un día específico
 */
export async function getAppointmentsByDay(
  dentistId: string,
  date: Date
): Promise<Appointment[]> {
  try {
    const q = query(
      collection(db, 'appointments'),
      where('dentistId', '==', dentistId)
    )

    const querySnapshot = await getDocs(q)
    
    const appointments = querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        dentistId: data.dentistId,
        patientId: data.patientId,
        date: data.date.toDate(),
        duration: data.duration,
        type: data.type,
        status: data.status,
        notes: data.notes,
        price: data.price,
        paymentStatus: data.paymentStatus,
        transactionId: data.transactionId,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      }
    })

    // Filtrar por día en el cliente
    const targetDate = new Date(date)
    targetDate.setHours(0, 0, 0, 0)
    
    const filtered = appointments.filter(apt => {
      const aptDate = new Date(apt.date)
      aptDate.setHours(0, 0, 0, 0)
      return aptDate.getTime() === targetDate.getTime()
    })

    return filtered.sort((a, b) => a.date.getTime() - b.date.getTime())
  } catch (error) {
    console.error('Error al obtener citas del día:', error)
    throw new Error('No se pudieron obtener las citas del día')
  }
}

/**
 * Obtener citas de un paciente específico
 */
export async function getPatientAppointments(patientId: string): Promise<Appointment[]> {
  try {
    const q = query(
      collection(db, 'appointments'),
      where('patientId', '==', patientId)
    )

    const querySnapshot = await getDocs(q)
    
    const appointments = querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        dentistId: data.dentistId,
        patientId: data.patientId,
        date: data.date.toDate(),
        duration: data.duration,
        type: data.type,
        status: data.status,
        notes: data.notes,
        price: data.price,
        paymentStatus: data.paymentStatus,
        transactionId: data.transactionId,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      }
    })

    return appointments.sort((a, b) => b.date.getTime() - a.date.getTime())
  } catch (error) {
    console.error('Error al obtener citas del paciente:', error)
    throw new Error('No se pudieron obtener las citas del paciente')
  }
}

/**
 * Obtener una cita por ID
 */
export async function getAppointment(appointmentId: string): Promise<Appointment | null> {
  try {
    const appointmentDoc = await getDoc(doc(db, 'appointments', appointmentId))
    
    if (!appointmentDoc.exists()) {
      return null
    }

    const data = appointmentDoc.data()
    
    return {
      id: appointmentDoc.id,
      dentistId: data.dentistId,
      patientId: data.patientId,
      date: data.date.toDate(),
      duration: data.duration,
      type: data.type,
      status: data.status,
      notes: data.notes,
      price: data.price,
      paymentStatus: data.paymentStatus,
      transactionId: data.transactionId,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    }
  } catch (error) {
    console.error('Error al obtener cita:', error)
    return null
  }
}

/**
 * Actualizar una cita
 */
export async function updateAppointment(
  appointmentId: string,
  appointmentData: Partial<Omit<Appointment, 'id' | 'dentistId' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  try {
    const updateData: any = {
      ...appointmentData,
      updatedAt: serverTimestamp(),
    }

    if (appointmentData.date) {
      updateData.date = Timestamp.fromDate(new Date(appointmentData.date))
    }

    await updateDoc(doc(db, 'appointments', appointmentId), updateData)
  } catch (error) {
    console.error('Error al actualizar cita:', error)
    throw new Error('No se pudo actualizar la cita')
  }
}

/**
 * Eliminar una cita
 */
export async function deleteAppointment(appointmentId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'appointments', appointmentId))
  } catch (error) {
    console.error('Error al eliminar cita:', error)
    throw new Error('No se pudo eliminar la cita')
  }
}

/**
 * Cambiar estado de una cita
 */
export async function updateAppointmentStatus(
  appointmentId: string,
  status: Appointment['status']
): Promise<void> {
  try {
    await updateDoc(doc(db, 'appointments', appointmentId), {
      status,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error('Error al actualizar estado de cita:', error)
    throw new Error('No se pudo actualizar el estado de la cita')
  }
}
