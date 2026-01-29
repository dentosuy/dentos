/**
 * Librería de validación de datos
 * Validaciones reutilizables para formularios y datos
 */

export interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * Valida email
 */
export function validateEmail(email: string): ValidationResult {
  const trimmed = email.trim()
  
  if (!trimmed) {
    return { valid: false, error: 'El email es requerido' }
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Email inválido' }
  }
  
  return { valid: true }
}

/**
 * Valida teléfono
 */
export function validatePhone(phone: string): ValidationResult {
  const trimmed = phone.trim()
  
  if (!trimmed) {
    return { valid: false, error: 'El teléfono es requerido' }
  }
  
  // Acepta formatos: +34 XXX XXX XXX, XXX-XXX-XXX, XXXXXXXXX
  const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/
  if (!phoneRegex.test(trimmed)) {
    return { valid: false, error: 'Teléfono inválido' }
  }
  
  return { valid: true }
}

/**
 * Valida password
 */
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { valid: false, error: 'La contraseña es requerida' }
  }
  
  if (password.length < 6) {
    return { valid: false, error: 'La contraseña debe tener al menos 6 caracteres' }
  }
  
  return { valid: true }
}

/**
 * Valida nombre (firstName, lastName)
 */
export function validateName(name: string, fieldName: string = 'nombre'): ValidationResult {
  const trimmed = name.trim()
  
  if (!trimmed) {
    return { valid: false, error: `El ${fieldName} es requerido` }
  }
  
  if (trimmed.length < 2) {
    return { valid: false, error: `El ${fieldName} debe tener al menos 2 caracteres` }
  }
  
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(trimmed)) {
    return { valid: false, error: `El ${fieldName} solo puede contener letras` }
  }
  
  return { valid: true }
}

/**
 * Valida fecha de nacimiento
 */
export function validateDateOfBirth(date: Date | string): ValidationResult {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(dateObj.getTime())) {
    return { valid: false, error: 'Fecha inválida' }
  }
  
  const today = new Date()
  const age = today.getFullYear() - dateObj.getFullYear()
  
  if (dateObj > today) {
    return { valid: false, error: 'La fecha no puede ser futura' }
  }
  
  if (age > 150) {
    return { valid: false, error: 'La fecha parece incorrecta' }
  }
  
  return { valid: true }
}

/**
 * Valida cantidad numérica positiva
 */
export function validatePositiveNumber(value: number | string, fieldName: string = 'valor'): ValidationResult {
  const num = typeof value === 'string' ? parseFloat(value) : value
  
  if (isNaN(num)) {
    return { valid: false, error: `El ${fieldName} debe ser un número` }
  }
  
  if (num < 0) {
    return { valid: false, error: `El ${fieldName} no puede ser negativo` }
  }
  
  return { valid: true }
}

/**
 * Valida precio
 */
export function validatePrice(price: number | string): ValidationResult {
  const result = validatePositiveNumber(price, 'precio')
  if (!result.valid) return result
  
  const num = typeof price === 'string' ? parseFloat(price) : price
  
  if (num > 1000000) {
    return { valid: false, error: 'El precio parece demasiado alto' }
  }
  
  return { valid: true }
}

/**
 * Valida fecha de cita
 */
export function validateAppointmentDate(date: Date | string): ValidationResult {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(dateObj.getTime())) {
    return { valid: false, error: 'Fecha inválida' }
  }
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const maxDate = new Date()
  maxDate.setFullYear(maxDate.getFullYear() + 2)
  
  if (dateObj < today) {
    return { valid: false, error: 'La fecha no puede ser en el pasado' }
  }
  
  if (dateObj > maxDate) {
    return { valid: false, error: 'La fecha está demasiado lejos en el futuro' }
  }
  
  return { valid: true }
}

/**
 * Sanitiza string (elimina caracteres peligrosos)
 */
export function sanitizeString(str: string): string {
  return str
    .trim()
    .replace(/[<>]/g, '') // Elimina < >
    .replace(/javascript:/gi, '') // Elimina javascript:
    .replace(/on\w+=/gi, '') // Elimina onXXX=
}

/**
 * Valida y sanitiza input de texto general
 */
export function validateAndSanitizeText(text: string, maxLength: number = 1000): ValidationResult & { sanitized?: string } {
  const trimmed = text.trim()
  
  if (!trimmed) {
    return { valid: false, error: 'El campo no puede estar vacío' }
  }
  
  if (trimmed.length > maxLength) {
    return { valid: false, error: `El texto no puede exceder ${maxLength} caracteres` }
  }
  
  const sanitized = sanitizeString(trimmed)
  
  return { valid: true, sanitized }
}

/**
 * Valida número de licencia profesional
 */
export function validateLicenseNumber(license: string): ValidationResult {
  const trimmed = license.trim()
  
  if (!trimmed) {
    return { valid: false, error: 'El número de licencia es requerido' }
  }
  
  if (trimmed.length < 4) {
    return { valid: false, error: 'El número de licencia debe tener al menos 4 caracteres' }
  }
  
  return { valid: true }
}
