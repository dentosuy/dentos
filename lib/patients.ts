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
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Patient } from '@/types'

/**
 * Agregar un nuevo paciente
 */
export async function addPatient(
  dentistId: string,
  patientData: Omit<Patient, 'id' | 'dentistId' | 'createdAt' | 'updatedAt'>
): Promise<Patient> {
  try {
    const patientRef = await addDoc(collection(db, 'patients'), {
      ...patientData,
      dentistId,
      dateOfBirth: new Date(patientData.dateOfBirth),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    const newPatient = await getDoc(patientRef)
    const data = newPatient.data()

    return {
      id: newPatient.id,
      dentistId,
      firstName: data!.firstName,
      lastName: data!.lastName,
      email: data!.email,
      phone: data!.phone,
      dateOfBirth: data!.dateOfBirth.toDate(),
      address: data!.address,
      medicalHistory: data!.medicalHistory,
      createdAt: data!.createdAt.toDate(),
      updatedAt: data!.updatedAt.toDate(),
    }
  } catch (error) {
    console.error('Error al agregar paciente:', error)
    throw new Error('No se pudo agregar el paciente')
  }
}

/**
 * Obtener todos los pacientes de un dentista
 */
export async function getPatients(dentistId: string): Promise<Patient[]> {
  try {
    const q = query(
      collection(db, 'patients'),
      where('dentistId', '==', dentistId)
    )

    const querySnapshot = await getDocs(q)
    
    const patients = querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        dentistId: data.dentistId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth.toDate(),
        address: data.address,
        medicalHistory: data.medicalHistory,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      }
    })

    // Ordenar por fecha de creación en el cliente
    return patients.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  } catch (error) {
    console.error('Error al obtener pacientes:', error)
    throw new Error('No se pudieron obtener los pacientes')
  }
}

/**
 * Obtener un paciente por ID
 */
export async function getPatient(patientId: string): Promise<Patient | null> {
  try {
    const patientDoc = await getDoc(doc(db, 'patients', patientId))
    
    if (!patientDoc.exists()) {
      return null
    }

    const data = patientDoc.data()
    
    return {
      id: patientDoc.id,
      dentistId: data.dentistId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      dateOfBirth: data.dateOfBirth.toDate(),
      address: data.address,
      medicalHistory: data.medicalHistory,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    }
  } catch (error) {
    console.error('Error al obtener paciente:', error)
    return null
  }
}

/**
 * Actualizar un paciente
 */
export async function updatePatient(
  patientId: string,
  patientData: Partial<Omit<Patient, 'id' | 'dentistId' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  try {
    const updateData: any = {
      ...patientData,
      updatedAt: serverTimestamp(),
    }

    if (patientData.dateOfBirth) {
      updateData.dateOfBirth = new Date(patientData.dateOfBirth)
    }

    await updateDoc(doc(db, 'patients', patientId), updateData)
  } catch (error) {
    console.error('Error al actualizar paciente:', error)
    throw new Error('No se pudo actualizar el paciente')
  }
}

/**
 * Eliminar un paciente
 */
export async function deletePatient(patientId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'patients', patientId))
  } catch (error) {
    console.error('Error al eliminar paciente:', error)
    throw new Error('No se pudo eliminar el paciente')
  }
}

/**
 * Buscar pacientes por nombre
 */
export async function searchPatients(dentistId: string, searchTerm: string): Promise<Patient[]> {
  try {
    const allPatients = await getPatients(dentistId)
    
    const searchLower = searchTerm.toLowerCase()
    
    return allPatients.filter(patient => 
      patient.firstName.toLowerCase().includes(searchLower) ||
      patient.lastName.toLowerCase().includes(searchLower) ||
      patient.phone.includes(searchTerm) ||
      (patient.email && patient.email.toLowerCase().includes(searchLower))
    )
  } catch (error) {
    console.error('Error al buscar pacientes:', error)
    throw new Error('No se pudieron buscar los pacientes')
  }
}
