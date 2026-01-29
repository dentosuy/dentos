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
  limit,
} from 'firebase/firestore'
import { db } from './firebase'
import type { MedicalHistory } from '@/types'

/**
 * Crear o actualizar historia clínica de un paciente
 * Un paciente solo tiene una historia clínica
 */
export async function saveMedicalHistory(
  dentistId: string,
  patientId: string,
  historyData: Partial<Omit<MedicalHistory, 'id' | 'dentistId' | 'patientId' | 'createdAt' | 'updatedAt'>>
): Promise<MedicalHistory> {
  try {
    // Verificar si ya existe una historia clínica para este paciente
    const existing = await getMedicalHistory(patientId)

    if (existing) {
      // Actualizar existente
      await updateDoc(doc(db, 'medicalHistories', existing.id), {
        ...historyData,
        updatedAt: serverTimestamp(),
      })

      const updated = await getDoc(doc(db, 'medicalHistories', existing.id))
      const data = updated.data()

      return {
        id: updated.id,
        patientId: data!.patientId,
        dentistId: data!.dentistId,
        chiefComplaint: data!.chiefComplaint,
        currentIllness: data!.currentIllness,
        allergies: data!.allergies,
        currentMedications: data!.currentMedications,
        systemicDiseases: data!.systemicDiseases,
        previousSurgeries: data!.previousSurgeries,
        familyHistory: data!.familyHistory,
        smokingHabit: data!.smokingHabit,
        alcoholConsumption: data!.alcoholConsumption,
        bruxism: data!.bruxism,
        otherHabits: data!.otherHabits,
        extraoralExam: data!.extraoralExam,
        intraoralExam: data!.intraoralExam,
        odontogram: data!.odontogram,
        periodontalIndices: data!.periodontalIndices,
        presumptiveDiagnosis: data!.presumptiveDiagnosis,
        definitiveDiagnosis: data!.definitiveDiagnosis,
        treatmentPlan: data!.treatmentPlan,
        prognosis: data!.prognosis,
        createdAt: data!.createdAt?.toDate() || new Date(),
        updatedAt: data!.updatedAt?.toDate() || new Date(),
      }
    } else {
      // Crear nueva
      const historyRef = await addDoc(collection(db, 'medicalHistories'), {
        ...historyData,
        dentistId,
        patientId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      const newHistory = await getDoc(historyRef)
      const data = newHistory.data()

      return {
        id: newHistory.id,
        patientId: data!.patientId,
        dentistId: data!.dentistId,
        chiefComplaint: data!.chiefComplaint,
        currentIllness: data!.currentIllness,
        allergies: data!.allergies,
        currentMedications: data!.currentMedications,
        systemicDiseases: data!.systemicDiseases,
        previousSurgeries: data!.previousSurgeries,
        familyHistory: data!.familyHistory,
        smokingHabit: data!.smokingHabit,
        alcoholConsumption: data!.alcoholConsumption,
        bruxism: data!.bruxism,
        otherHabits: data!.otherHabits,
        extraoralExam: data!.extraoralExam,
        intraoralExam: data!.intraoralExam,
        odontogram: data!.odontogram,
        periodontalIndices: data!.periodontalIndices,
        presumptiveDiagnosis: data!.presumptiveDiagnosis,
        definitiveDiagnosis: data!.definitiveDiagnosis,
        treatmentPlan: data!.treatmentPlan,
        prognosis: data!.prognosis,
        createdAt: data!.createdAt?.toDate() || new Date(),
        updatedAt: data!.updatedAt?.toDate() || new Date(),
      }
    }
  } catch (error) {
    console.error('Error al guardar historia clínica:', error)
    throw new Error('No se pudo guardar la historia clínica')
  }
}

/**
 * Obtener la historia clínica de un paciente
 */
export async function getMedicalHistory(patientId: string): Promise<MedicalHistory | null> {
  try {
    const q = query(
      collection(db, 'medicalHistories'),
      where('patientId', '==', patientId),
      limit(1)
    )

    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return null
    }

    const historyDoc = querySnapshot.docs[0]
    const data = historyDoc.data()

    return {
      id: historyDoc.id,
      patientId: data.patientId,
      dentistId: data.dentistId,
      chiefComplaint: data.chiefComplaint,
      currentIllness: data.currentIllness,
      allergies: data.allergies,
      currentMedications: data.currentMedications,
      systemicDiseases: data.systemicDiseases,
      previousSurgeries: data.previousSurgeries,
      familyHistory: data.familyHistory,
      smokingHabit: data.smokingHabit,
      alcoholConsumption: data.alcoholConsumption,
      bruxism: data.bruxism,
      otherHabits: data.otherHabits,
      extraoralExam: data.extraoralExam,
      intraoralExam: data.intraoralExam,
      odontogram: data.odontogram,
      periodontalIndices: data.periodontalIndices,
      presumptiveDiagnosis: data.presumptiveDiagnosis,
      definitiveDiagnosis: data.definitiveDiagnosis,
      treatmentPlan: data.treatmentPlan,
      prognosis: data.prognosis,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    }
  } catch (error) {
    console.error('Error al obtener historia clínica:', error)
    return null
  }
}

/**
 * Eliminar historia clínica
 */
export async function deleteMedicalHistory(historyId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'medicalHistories', historyId))
  } catch (error) {
    console.error('Error al eliminar historia clínica:', error)
    throw new Error('No se pudo eliminar la historia clínica')
  }
}
