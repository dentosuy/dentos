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
import type { Transaction } from '@/types'

/**
 * Agregar una nueva transacción (ingreso o egreso)
 */
export async function addTransaction(
  dentistId: string,
  transactionData: Omit<Transaction, 'id' | 'dentistId' | 'createdAt' | 'updatedAt'>
): Promise<Transaction> {
  try {
    const transactionRef = await addDoc(collection(db, 'transactions'), {
      ...transactionData,
      dentistId,
      date: Timestamp.fromDate(new Date(transactionData.date)),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    const newTransaction = await getDoc(transactionRef)
    const data = newTransaction.data()

    return {
      id: newTransaction.id,
      dentistId,
      type: data!.type,
      amount: data!.amount,
      category: data!.category,
      concept: data!.concept,
      date: data!.date.toDate(),
      paymentMethod: data!.paymentMethod,
      status: data!.status,
      isPossible: data!.isPossible,
      patientId: data!.patientId,
      appointmentId: data!.appointmentId,
      notes: data!.notes,
      createdAt: data!.createdAt.toDate(),
      updatedAt: data!.updatedAt.toDate(),
    }
  } catch (error) {
    console.error('Error al agregar transacción:', error)
    throw new Error('No se pudo agregar la transacción')
  }
}

/**
 * Obtener todas las transacciones de un dentista
 */
export async function getTransactions(dentistId: string): Promise<Transaction[]> {
  try {
    const q = query(
      collection(db, 'transactions'),
      where('dentistId', '==', dentistId)
    )

    const querySnapshot = await getDocs(q)
    
    const transactions = querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        dentistId: data.dentistId,
        type: data.type,
        amount: data.amount,
        category: data.category,
        concept: data.concept,
        date: data.date.toDate(),
        paymentMethod: data.paymentMethod,
        status: data.status,
        isPossible: data.isPossible,
        patientId: data.patientId,
        appointmentId: data.appointmentId,
        notes: data.notes,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      }
    })

    // Ordenar por fecha descendente (más recientes primero)
    return transactions.sort((a, b) => b.date.getTime() - a.date.getTime())
  } catch (error) {
    console.error('Error al obtener transacciones:', error)
    throw new Error('No se pudieron obtener las transacciones')
  }
}

/**
 * Obtener transacciones de un mes específico
 */
export async function getTransactionsByMonth(
  dentistId: string,
  year: number,
  month: number
): Promise<Transaction[]> {
  try {
    const allTransactions = await getTransactions(dentistId)
    
    return allTransactions.filter(transaction => {
      const transactionDate = new Date(transaction.date)
      return transactionDate.getFullYear() === year && transactionDate.getMonth() === month
    })
  } catch (error) {
    console.error('Error al obtener transacciones del mes:', error)
    throw new Error('No se pudieron obtener las transacciones del mes')
  }
}

/**
 * Obtener una transacción por ID
 */
export async function getTransaction(transactionId: string): Promise<Transaction | null> {
  try {
    const transactionDoc = await getDoc(doc(db, 'transactions', transactionId))
    
    if (!transactionDoc.exists()) {
      return null
    }

    const data = transactionDoc.data()
    
    return {
      id: transactionDoc.id,
      dentistId: data.dentistId,
      type: data.type,
      amount: data.amount,
      category: data.category,
      concept: data.concept,
      date: data.date.toDate(),
      paymentMethod: data.paymentMethod,
      status: data.status,
      isPossible: data.isPossible,
      patientId: data.patientId,
      appointmentId: data.appointmentId,
      notes: data.notes,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    }
  } catch (error) {
    console.error('Error al obtener transacción:', error)
    return null
  }
}

/**
 * Actualizar una transacción
 */
export async function updateTransaction(
  transactionId: string,
  transactionData: Partial<Omit<Transaction, 'id' | 'dentistId' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  try {
    const updateData: any = {
      ...transactionData,
      updatedAt: serverTimestamp(),
    }

    if (transactionData.date) {
      updateData.date = Timestamp.fromDate(new Date(transactionData.date))
    }

    await updateDoc(doc(db, 'transactions', transactionId), updateData)
  } catch (error) {
    console.error('Error al actualizar transacción:', error)
    throw new Error('No se pudo actualizar la transacción')
  }
}

/**
 * Eliminar una transacción
 */
export async function deleteTransaction(transactionId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'transactions', transactionId))
  } catch (error) {
    console.error('Error al eliminar transacción:', error)
    throw new Error('No se pudo eliminar la transacción')
  }
}

/**
 * Calcular balance del mes (ingresos - egresos)
 * Incluye cálculo de ingresos brutos (oficiales + posibles) y netos (solo oficiales)
 */
export async function getMonthlyBalance(
  dentistId: string,
  year: number,
  month: number
): Promise<{ 
  grossIncome: number; // Ingresos brutos (oficiales + posibles)
  netIncome: number;   // Ingresos netos (solo oficiales/concretados)
  expenses: number; 
  balance: number 
}> {
  try {
    const transactions = await getTransactionsByMonth(dentistId, year, month)
    
    // Ingresos netos: solo ingresos oficiales pagados (no posibles)
    const netIncome = transactions
      .filter(t => t.type === 'income' && t.status === 'paid' && !t.isPossible)
      .reduce((sum, t) => sum + t.amount, 0)
    
    // Ingresos posibles: ingresos marcados como posibles
    const possibleIncome = transactions
      .filter(t => t.type === 'income' && t.isPossible === true)
      .reduce((sum, t) => sum + t.amount, 0)
    
    // Ingresos brutos: suma de ingresos netos + ingresos posibles
    const grossIncome = netIncome + possibleIncome
    
    const expenses = transactions
      .filter(t => t.type === 'expense' && t.status === 'paid')
      .reduce((sum, t) => sum + t.amount, 0)
    
    return {
      grossIncome,
      netIncome,
      expenses,
      balance: netIncome - expenses // El balance se calcula con ingresos netos
    }
  } catch (error) {
    console.error('Error al calcular balance:', error)
    return { grossIncome: 0, netIncome: 0, expenses: 0, balance: 0 }
  }
}
