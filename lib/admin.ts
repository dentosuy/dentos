import { db } from './firebase'
import { collection, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore'
import { DentistProfile } from '@/types'

/**
 * Obtiene todos los dentistas registrados (solo para admin)
 */
export async function getAllDentists(): Promise<DentistProfile[]> {
  try {
    const dentistsRef = collection(db, 'dentists')
    const snapshot = await getDocs(dentistsRef)
    
    return snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        uid: doc.id,
        email: data.email,
        displayName: data.displayName,
        licenseNumber: data.licenseNumber,
        phone: data.phone,
        clinicName: data.clinicName,
        clinicAddress: data.clinicAddress,
        subscriptionStatus: data.subscriptionStatus || 'trial',
        trialEndsAt: data.trialEndsAt?.toDate(),
        subscriptionEndsAt: data.subscriptionEndsAt?.toDate(),
        planType: data.planType,
        lastPaymentDate: data.lastPaymentDate?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      }
    })
  } catch (error) {
    console.error('Error getting all dentists:', error)
    throw new Error('No se pudieron obtener los dentistas')
  }
}

/**
 * Activa la suscripción de un dentista
 * @param dentistId - ID del dentista
 * @param planType - 'monthly' o 'annual'
 */
export async function activateDentistSubscription(
  dentistId: string, 
  planType: 'monthly' | 'annual'
): Promise<void> {
  try {
    const dentistRef = doc(db, 'dentists', dentistId)
    
    const now = new Date()
    const durationMonths = planType === 'monthly' ? 1 : 12
    const subscriptionEndsAt = new Date(now.getTime() + durationMonths * 30 * 24 * 60 * 60 * 1000)
    
    await updateDoc(dentistRef, {
      subscriptionStatus: 'active',
      planType: planType,
      subscriptionEndsAt: Timestamp.fromDate(subscriptionEndsAt),
      lastPaymentDate: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now)
    })
  } catch (error) {
    console.error('Error activating subscription:', error)
    throw new Error('No se pudo activar la suscripción')
  }
}

/**
 * Extiende la suscripción de un dentista activo
 * @param dentistId - ID del dentista
 * @param months - Número de meses a extender
 */
export async function extendDentistSubscription(
  dentistId: string,
  months: number
): Promise<void> {
  try {
    const dentistRef = doc(db, 'dentists', dentistId)
    
    const now = new Date()
    const extensionMs = months * 30 * 24 * 60 * 60 * 1000
    
    // Obtener la fecha de finalización actual
    const dentistDoc = await getDocs(collection(db, 'dentists'))
    const currentDentist = dentistDoc.docs.find(d => d.id === dentistId)
    
    if (!currentDentist) {
      throw new Error('Dentista no encontrado')
    }
    
    const data = currentDentist.data()
    let newEndDate: Date
    
    if (data.subscriptionEndsAt) {
      // Si ya tiene fecha de finalización, extender desde esa fecha
      const currentEndDate = data.subscriptionEndsAt.toDate()
      newEndDate = new Date(currentEndDate.getTime() + extensionMs)
    } else {
      // Si no tiene fecha, extender desde hoy
      newEndDate = new Date(now.getTime() + extensionMs)
    }
    
    await updateDoc(dentistRef, {
      subscriptionStatus: 'active',
      subscriptionEndsAt: Timestamp.fromDate(newEndDate),
      lastPaymentDate: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now)
    })
  } catch (error) {
    console.error('Error extending subscription:', error)
    throw new Error('No se pudo extender la suscripción')
  }
}

/**
 * Cancela la suscripción de un dentista
 * @param dentistId - ID del dentista
 */
export async function cancelDentistSubscription(dentistId: string): Promise<void> {
  try {
    const dentistRef = doc(db, 'dentists', dentistId)
    const now = new Date()
    
    await updateDoc(dentistRef, {
      subscriptionStatus: 'cancelled',
      updatedAt: Timestamp.fromDate(now)
    })
  } catch (error) {
    console.error('Error cancelling subscription:', error)
    throw new Error('No se pudo cancelar la suscripción')
  }
}
