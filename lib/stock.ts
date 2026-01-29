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
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import type { StockItem } from '@/types'

/**
 * Agregar un nuevo item al stock
 */
export async function addStockItem(
  dentistId: string,
  stockData: Omit<StockItem, 'id' | 'dentistId' | 'createdAt' | 'updatedAt'>
): Promise<StockItem> {
  try {
    const stockItemRef = await addDoc(collection(db, 'stock'), {
      ...stockData,
      dentistId,
      expirationDate: stockData.expirationDate 
        ? Timestamp.fromDate(new Date(stockData.expirationDate))
        : null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    const newStockItem = await getDoc(stockItemRef)
    const data = newStockItem.data()

    return {
      id: newStockItem.id,
      dentistId,
      name: data!.name,
      category: data!.category,
      quantity: data!.quantity,
      unit: data!.unit,
      minQuantity: data!.minQuantity,
      location: data!.location,
      supplier: data!.supplier,
      cost: data!.cost,
      notes: data!.notes,
      expirationDate: data!.expirationDate?.toDate(),
      createdAt: data!.createdAt.toDate(),
      updatedAt: data!.updatedAt.toDate(),
    }
  } catch (error) {
    console.error('Error al agregar item al stock:', error)
    throw new Error('No se pudo agregar el item al stock')
  }
}

/**
 * Obtener todos los items del stock de un dentista
 */
export async function getStockItems(dentistId: string): Promise<StockItem[]> {
  try {
    const q = query(
      collection(db, 'stock'),
      where('dentistId', '==', dentistId)
    )

    const querySnapshot = await getDocs(q)
    
    const stockItems = querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        dentistId: data.dentistId,
        name: data.name,
        category: data.category,
        quantity: data.quantity,
        unit: data.unit,
        minQuantity: data.minQuantity,
        location: data.location,
        supplier: data.supplier,
        cost: data.cost,
        notes: data.notes,
        expirationDate: data.expirationDate?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      }
    })

    // Ordenar por nombre en el cliente
    return stockItems.sort((a, b) => a.name.localeCompare(b.name))
  } catch (error) {
    console.error('Error al obtener items del stock:', error)
    throw new Error('No se pudieron obtener los items del stock')
  }
}

/**
 * Obtener items con stock bajo (cantidad <= minQuantity)
 */
export async function getLowStockItems(dentistId: string): Promise<StockItem[]> {
  try {
    const allItems = await getStockItems(dentistId)
    return allItems.filter(item => item.quantity <= item.minQuantity)
  } catch (error) {
    console.error('Error al obtener items con stock bajo:', error)
    throw new Error('No se pudieron obtener los items con stock bajo')
  }
}

/**
 * Obtener un item del stock por ID
 */
export async function getStockItem(stockItemId: string): Promise<StockItem | null> {
  try {
    const stockItemDoc = await getDoc(doc(db, 'stock', stockItemId))
    
    if (!stockItemDoc.exists()) {
      return null
    }

    const data = stockItemDoc.data()
    
    return {
      id: stockItemDoc.id,
      dentistId: data.dentistId,
      name: data.name,
      category: data.category,
      quantity: data.quantity,
      unit: data.unit,
      minQuantity: data.minQuantity,
      location: data.location,
      supplier: data.supplier,
      cost: data.cost,
      notes: data.notes,
      expirationDate: data.expirationDate?.toDate(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    }
  } catch (error) {
    console.error('Error al obtener item del stock:', error)
    return null
  }
}

/**
 * Actualizar un item del stock
 */
export async function updateStockItem(
  stockItemId: string,
  stockData: Partial<Omit<StockItem, 'id' | 'dentistId' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  try {
    const updateData: any = {
      ...stockData,
      updatedAt: serverTimestamp(),
    }

    if (stockData.expirationDate) {
      updateData.expirationDate = Timestamp.fromDate(new Date(stockData.expirationDate))
    }

    await updateDoc(doc(db, 'stock', stockItemId), updateData)
  } catch (error) {
    console.error('Error al actualizar item del stock:', error)
    throw new Error('No se pudo actualizar el item del stock')
  }
}

/**
 * Eliminar un item del stock
 */
export async function deleteStockItem(stockItemId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'stock', stockItemId))
  } catch (error) {
    console.error('Error al eliminar item del stock:', error)
    throw new Error('No se pudo eliminar el item del stock')
  }
}

/**
 * Actualizar cantidad de un item (útil para registrar uso/entrada de materiales)
 */
export async function updateStockQuantity(
  stockItemId: string,
  quantityChange: number // positivo para agregar, negativo para restar
): Promise<void> {
  try {
    const stockItem = await getStockItem(stockItemId)
    
    if (!stockItem) {
      throw new Error('Item no encontrado')
    }

    const newQuantity = stockItem.quantity + quantityChange

    if (newQuantity < 0) {
      throw new Error('La cantidad no puede ser negativa')
    }

    await updateDoc(doc(db, 'stock', stockItemId), {
      quantity: newQuantity,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error('Error al actualizar cantidad:', error)
    throw new Error('No se pudo actualizar la cantidad')
  }
}
