import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './firebase'
import type { User, DentistProfile } from '@/types'

/**
 * Registrar un nuevo dentista
 */
export async function registerDentist(
  email: string,
  password: string,
  displayName: string,
  licenseNumber: string
): Promise<DentistProfile> {
  try {
    // Crear usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const { user } = userCredential

    // Actualizar perfil con el nombre
    await updateProfile(user, { displayName })

    // Calcular fecha de fin del trial (7 días desde ahora)
    const now = new Date()
    const trialEndsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 días

    // Crear perfil del dentista en Firestore
    const dentistProfile: Omit<DentistProfile, 'createdAt' | 'updatedAt'> = {
      uid: user.uid,
      email: user.email!,
      displayName,
      licenseNumber,
      subscriptionStatus: 'trial',
      trialEndsAt,
    }

    await setDoc(doc(db, 'dentists', user.uid), {
      ...dentistProfile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return {
      ...dentistProfile,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  } catch (error: any) {
    console.error('Error al registrar dentista:', error)
    throw new Error(getErrorMessage(error.code))
  }
}

/**
 * Iniciar sesión
 */
export async function signIn(email: string, password: string): Promise<User> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const { user } = userCredential

    // Obtener perfil del dentista
    const dentistDoc = await getDoc(doc(db, 'dentists', user.uid))
    
    if (!dentistDoc.exists()) {
      throw new Error('Perfil de dentista no encontrado')
    }

    const dentistData = dentistDoc.data()
    
    return {
      uid: user.uid,
      email: user.email!,
      displayName: user.displayName || undefined,
      photoURL: user.photoURL || undefined,
      createdAt: dentistData.createdAt?.toDate() || new Date(),
      updatedAt: dentistData.updatedAt?.toDate() || new Date(),
    }
  } catch (error: any) {
    console.error('Error al iniciar sesión:', error)
    throw new Error(getErrorMessage(error.code))
  }
}

/**
 * Cerrar sesión
 */
export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(auth)
  } catch (error) {
    console.error('Error al cerrar sesión:', error)
    throw new Error('Error al cerrar sesión')
  }
}

/**
 * Restablecer contraseña
 */
export async function resetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email)
  } catch (error: any) {
    console.error('Error al enviar email de restablecimiento:', error)
    throw new Error(getErrorMessage(error.code))
  }
}

/**
 * Obtener perfil del dentista actual
 */
export async function getDentistProfile(uid: string): Promise<DentistProfile | null> {
  try {
    const dentistDoc = await getDoc(doc(db, 'dentists', uid))
    
    if (!dentistDoc.exists()) {
      return null
    }

    const data = dentistDoc.data()
    
    return {
      uid: dentistDoc.id,
      email: data.email,
      displayName: data.displayName,
      photoURL: data.photoURL,
      licenseNumber: data.licenseNumber,
      specialization: data.specialization,
      phone: data.phone,
      clinicName: data.clinicName,
      clinicAddress: data.clinicAddress,
      subscriptionStatus: data.subscriptionStatus || 'trial',
      trialEndsAt: data.trialEndsAt?.toDate(),
      subscriptionEndsAt: data.subscriptionEndsAt?.toDate(),
      planType: data.planType,
      lastPaymentDate: data.lastPaymentDate?.toDate(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    }
  } catch (error) {
    console.error('Error al obtener perfil:', error)
    return null
  }
}

/**
 * Observar cambios en el estado de autenticación
 */
export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback)
}

/**
 * Mensajes de error en español
 */
function getErrorMessage(errorCode: string): string {
  const errorMessages: Record<string, string> = {
    'auth/email-already-in-use': 'Este email ya está registrado',
    'auth/invalid-email': 'Email inválido',
    'auth/operation-not-allowed': 'Operación no permitida',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
    'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
    'auth/user-not-found': 'Usuario no encontrado',
    'auth/wrong-password': 'Contraseña incorrecta',
    'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
    'auth/network-request-failed': 'Error de conexión. Verifica tu internet',
  }

  return errorMessages[errorCode] || 'Error al procesar la solicitud'
}
