import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import type { AppointmentMaterial } from '@/types'
import { updateStockQuantity } from './stock'

/**
 * Agregar material usado a una cita
 */
export async function addAppointmentMaterial(
  materialData: Omit<AppointmentMaterial, 'id' | 'registeredAt'>
): Promise<AppointmentMaterial> {
  try {
    // Agregar el registro del material usado
    const materialRef = await addDoc(collection(db, 'appointmentMaterials'), {
      ...materialData,
      registeredAt: serverTimestamp(),
    })

    // Actualizar el stock (restar la cantidad usada)
    await updateStockQuantity(materialData.stockItemId, -materialData.quantityUsed)

    const newMaterial = {
      id: materialRef.id,
      ...materialData,
      registeredAt: new Date(),
    }

    return newMaterial
  } catch (error) {
    console.error('Error al agregar material usado:', error)
    throw new Error('No se pudo agregar el material usado')
  }
}

/**
 * Obtener materiales usados en una cita
 */
export async function getAppointmentMaterials(
  appointmentId: string
): Promise<AppointmentMaterial[]> {
  try {
    const q = query(
      collection(db, 'appointmentMaterials'),
      where('appointmentId', '==', appointmentId)
    )

    const querySnapshot = await getDocs(q)
    
    const materials = querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        appointmentId: data.appointmentId,
        stockItemId: data.stockItemId,
        stockItemName: data.stockItemName,
        category: data.category,
        quantityUsed: data.quantityUsed,
        unit: data.unit,
        cost: data.cost,
        registeredAt: data.registeredAt?.toDate() || new Date(),
      }
    })

    // Ordenar por fecha de registro
    return materials.sort((a, b) => b.registeredAt.getTime() - a.registeredAt.getTime())
  } catch (error) {
    console.error('Error al obtener materiales de la cita:', error)
    throw new Error('No se pudieron obtener los materiales de la cita')
  }
}

/**
 * Eliminar un material usado (y devolver el stock)
 */
export async function deleteAppointmentMaterial(
  materialId: string,
  stockItemId: string,
  quantityUsed: number
): Promise<void> {
  try {
    // Eliminar el registro
    await deleteDoc(doc(db, 'appointmentMaterials', materialId))

    // Devolver la cantidad al stock (sumar la cantidad que se había restado)
    await updateStockQuantity(stockItemId, quantityUsed)
  } catch (error) {
    console.error('Error al eliminar material usado:', error)
    throw new Error('No se pudo eliminar el material usado')
  }
}

/**
 * Calcular costo total de materiales usados en una cita
 */
export async function getAppointmentMaterialsCost(
  appointmentId: string
): Promise<number> {
  try {
    const materials = await getAppointmentMaterials(appointmentId)
    
    return materials.reduce((total, material) => {
      if (material.cost) {
        return total + (material.cost * material.quantityUsed)
      }
      return total
    }, 0)
  } catch (error) {
    console.error('Error al calcular costo de materiales:', error)
    return 0
  }
}
