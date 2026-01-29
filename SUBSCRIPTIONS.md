# Sistema de Suscripciones - DentOS

## Resumen

DentOS utiliza un modelo de **Trial + Activación Manual** para monetizar el servicio. Este enfoque permite:
- Control total sobre quién accede al sistema
- Relación directa con cada cliente
- Proceso de pago simple sin automatización inicial
- Escalabilidad futura a pagos automáticos

---

## Flujo de Usuario

### 1. Registro (Automático)
Cuando un dentista se registra en DentOS:
- Se crea su cuenta en Firebase Authentication
- Se crea su perfil en Firestore con:
  - `subscriptionStatus: 'trial'`
  - `trialEndsAt: fecha actual + 7 días`
- Puede acceder inmediatamente a todas las funcionalidades

### 2. Período de Prueba (7 días)
Durante el trial:
- Acceso completo sin restricciones
- Banner amarillo en dashboard mostrando días restantes
- Botón "Activar Ahora" con link a WhatsApp

### 3. Expiración del Trial
Cuando el trial expira:
- `ProtectedRoute` detecta que `trialEndsAt < fecha actual`
- Redirige automáticamente a `/subscription-expired`
- Usuario no puede acceder a ninguna funcionalidad excepto:
  - Ver página de expiración
  - Cerrar sesión

### 4. Página de Suscripción Expirada
Muestra:
- Mensaje de trial finalizado
- Información del usuario (nombre, email, licencia)
- Instrucciones de activación (4 pasos)
- Datos de contacto (WhatsApp + Email)
- Planes disponibles (Mensual $3,000 / Anual $30,000)
- Botón de logout

### 5. Contacto y Pago (Manual)
El dentista:
- Contacta por WhatsApp o Email
- Coordina forma de pago (transferencia, MercadoPago, etc.)
- Envía comprobante de pago

### 6. Activación (Admin)
El administrador:
- Ingresa a `/admin` (panel protegido por email)
- Ve lista de todos los dentistas con estado de suscripción
- Busca al dentista por nombre/email/licencia
- Presiona botón "Activar Mensual" o "Activar Anual"
- Sistema actualiza Firestore:
  - `subscriptionStatus: 'active'`
  - `planType: 'monthly' | 'annual'`
  - `subscriptionEndsAt: fecha actual + 30 días (o 365 días)`
  - `lastPaymentDate: fecha actual`

### 7. Usuario Activo
Después de activación:
- Usuario puede acceder normalmente
- Banner verde en dashboard mostrando "Suscripción Activa"
- Muestra fecha de renovación

---

## Configuración Inicial

### 1. Email de Administrador
Editar [app/admin/page.tsx](app/admin/page.tsx) línea 19:
```typescript
const ADMIN_EMAIL = 'tu-email@ejemplo.com' // Cambiar por tu email real
```

### 2. Datos de Contacto
Editar [app/subscription-expired/page.tsx](app/subscription-expired/page.tsx):

**WhatsApp (línea ~119):**
```tsx
href="https://wa.me/5491123456789" 
// Cambiar 5491123456789 por tu número (código país + área + número, sin espacios)
```

**Email (línea ~126):**
```tsx
href="mailto:soporte@dentos.com"
// Cambiar por tu email real
```

**Botón del Dashboard:**
Editar [app/dashboard/page.tsx](app/dashboard/page.tsx) línea ~87:
```tsx
onClick={() => window.location.href = 'https://wa.me/5491123456789'}
```

### 3. Precios (Opcional)
Si quieres cambiar los precios, editar [app/subscription-expired/page.tsx](app/subscription-expired/page.tsx):

**Plan Mensual (línea ~137):**
```tsx
<p className="text-3xl font-bold text-primary-600 mb-2">$3,000</p>
```

**Plan Anual (línea ~153):**
```tsx
<p className="text-3xl font-bold text-primary-600 mb-2">$30,000</p>
```

---

## Arquitectura Técnica

### Tipos de Datos (types/index.ts)
```typescript
export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'cancelled'
export type PlanType = 'monthly' | 'annual'

export interface DentistProfile {
  // ... campos existentes
  subscriptionStatus: SubscriptionStatus
  trialEndsAt?: Date
  subscriptionEndsAt?: Date
  planType?: PlanType
  lastPaymentDate?: Date
}
```

### Funciones Principales

**lib/auth.ts - registerDentist()**
```typescript
// Crea trial de 7 días automáticamente
const trialEndsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
```

**components/auth/protected-route.tsx**
```typescript
// Valida subscripción y redirige si expiró
if (dentistProfile.subscriptionStatus === 'trial' && now > trialEnd) {
  router.push('/subscription-expired')
}
```

**app/admin/page.tsx - handleActivate()**
```typescript
// Activa suscripción y calcula fecha de expiración
const subscriptionEndsAt = new Date(now + durationMonths * 30 días)
await updateDoc(dentistRef, {
  subscriptionStatus: 'active',
  planType: planType,
  subscriptionEndsAt: Timestamp.fromDate(subscriptionEndsAt),
  lastPaymentDate: Timestamp.fromDate(now)
})
```

---

## Panel de Administración

### Acceso
- URL: `/admin`
- Protegido por email (solo el email configurado puede acceder)
- Si no eres admin, redirige a `/dashboard`

### Funcionalidades

**Vista General:**
- Total de dentistas registrados
- Cantidad en trial
- Cantidad activos
- Cantidad expirados

**Listado:**
- Todos los dentistas con su estado
- Búsqueda por nombre, email o licencia
- Badges de color según estado:
  - 🟡 Trial (con días restantes)
  - 🔴 Trial Expirado
  - 🟢 Activo (con días restantes)
  - ⚫ Expirado

**Acciones:**
Para cuentas en trial o expiradas:
- Botón "Activar Mensual" (30 días)
- Botón "Activar Anual" (365 días)

Para cuentas activas:
- Botón "+ 1 Mes" (extiende 30 días desde fecha actual de expiración)
- Botón "+ 12 Meses" (extiende 365 días)

---

## Estados de Suscripción

### `trial`
- **Cuándo:** Automático al registrarse
- **Duración:** 7 días
- **Acceso:** Completo mientras no expire
- **Banner:** Amarillo con días restantes
- **Siguiente:** Después de 7 días → `expired` (automático por validación)

### `active`
- **Cuándo:** Admin activa manualmente
- **Duración:** 30 o 365 días según plan
- **Acceso:** Completo
- **Banner:** Verde con fecha de renovación
- **Siguiente:** Después de expirar → validación redirige a `/subscription-expired`

### `expired`
- **Cuándo:** Admin lo marca o suscripción vence
- **Duración:** Indefinido hasta reactivación
- **Acceso:** Solo página de expiración
- **Banner:** No accede al dashboard
- **Siguiente:** Admin reactiva → `active`

### `cancelled`
- **Cuándo:** Usuario cancela voluntariamente (no implementado aún)
- **Duración:** Indefinido
- **Acceso:** Solo página de expiración
- **Banner:** N/A
- **Siguiente:** Contacto con soporte para reactivar

---

## Validación de Suscripción

La validación ocurre en `components/auth/protected-route.tsx`:

```typescript
// Si está en trial y expiró
if (dentistProfile.subscriptionStatus === 'trial' && dentistProfile.trialEndsAt) {
  const trialEnd = new Date(dentistProfile.trialEndsAt)
  if (now > trialEnd) {
    router.push('/subscription-expired')
    return
  }
}

// Si está expirado o cancelado
if (dentistProfile.subscriptionStatus === 'expired' || 
    dentistProfile.subscriptionStatus === 'cancelled') {
  router.push('/subscription-expired')
  return
}

// Si está activo pero la suscripción expiró
if (dentistProfile.subscriptionStatus === 'active' && 
    dentistProfile.subscriptionEndsAt) {
  const subscriptionEnd = new Date(dentistProfile.subscriptionEndsAt)
  if (now > subscriptionEnd) {
    router.push('/subscription-expired')
    return
  }
}
```

**Páginas que NO validan suscripción:**
- `/login`
- `/register`
- `/subscription-expired`

**Todas las demás rutas:**
- Dashboard
- Pacientes
- Citas
- Stock
- Finanzas
- Etc.

---

## Renovaciones

### Manual (Actual)
1. Cliente contacta 1-3 días antes de vencimiento
2. Coordina pago
3. Admin entra a `/admin`
4. Presiona "+ 1 Mes" o "+ 12 Meses"
5. Sistema extiende desde fecha de expiración actual
6. Cliente recibe confirmación por WhatsApp/Email

### Automática (Futuro)
Para implementar cuando tengas 20-50 clientes:
1. Integrar MercadoPago API
2. Crear webhook para procesar pagos
3. Actualizar suscripción automáticamente
4. Enviar email de confirmación
5. Manejar fallos de pago (reintentos, notificaciones)

---

## Notificaciones (Futuro)

**Recomendaciones para implementar:**

**3 días antes de expiración:**
- Email: "Tu trial expira en 3 días"
- Incluir link a WhatsApp para activar
- Destacar beneficios de planes

**1 día antes:**
- Email: "Última oportunidad - Trial expira mañana"
- Urgencia sin ser agresivo
- Número directo de WhatsApp

**Día de expiración:**
- Email: "Tu trial ha expirado - Activa ahora"
- Proceso simple de activación
- Recordar que datos no se pierden

**Renovaciones (clientes activos):**
- 7 días antes: "Tu suscripción se renueva pronto"
- 3 días antes: "Recordatorio de renovación"
- Día de vencimiento: "Hoy vence tu suscripción"

---

## Firestore Structure

```
/dentists/{dentistId}
{
  // Campos de autenticación
  email: string
  displayName: string
  licenseNumber: string
  phone: string
  clinicName: string
  clinicAddress: string
  
  // Campos de suscripción
  subscriptionStatus: 'trial' | 'active' | 'expired' | 'cancelled'
  trialEndsAt: Timestamp | null
  subscriptionEndsAt: Timestamp | null
  planType: 'monthly' | 'annual' | null
  lastPaymentDate: Timestamp | null
  
  // Metadata
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

---

## Costos Estimados

### Firebase
- **Firestore:** ~$0.06 por 100K lecturas
- **Auth:** Gratis hasta 10K usuarios
- **Storage:** $0.026/GB/mes

**Estimación para 100 dentistas activos:**
- ~10K lecturas/día (validación de suscripción) = $0.006/día = $1.80/mes
- Storage mínimo = $0.26/mes
- **Total: ~$2/mes**

### Vercel (Hosting)
- **Hobby:** Gratis (suficiente para 100-200 usuarios)
- **Pro:** $20/mes (si necesitas más recursos)

### Total Mensual (primeros 100 clientes)
- Firebase: $2
- Vercel: $0
- **Total: $2/mes**

---

## Escalabilidad

### Hasta 50 Clientes
- **Sistema actual:** ✅ Perfecto
- **Proceso:** Manual, controlado, personal
- **Tiempo:** ~5 minutos por activación

### 50-200 Clientes
- **Sistema actual:** ⚠️ Funciona pero demandante
- **Recomendación:** Implementar pagos automáticos con MercadoPago
- **Tiempo admin:** ~1 hora/día en renovaciones

### 200+ Clientes
- **Sistema actual:** ❌ No escalable
- **Necesario:** Automatización completa
- **Agregar:** Sistema de tickets, soporte dedicado

---

## Mejoras Futuras (Prioridad)

### Corto Plazo (1-3 meses)
1. ✅ Sistema de trial + activación manual (HECHO)
2. 📧 Emails automáticos de recordatorio
3. 📊 Dashboard de métricas en `/admin`
4. 🔔 Notificaciones push (opcional)

### Mediano Plazo (3-6 meses)
1. 💳 Integración MercadoPago
2. 🔄 Renovación automática
3. 📄 Facturas automáticas
4. 📞 Sistema de tickets/soporte

### Largo Plazo (6-12 meses)
1. 📊 Analytics avanzado
2. 🎯 Segmentación de clientes
3. 💰 Múltiples planes (Basic, Pro, Enterprise)
4. 🌎 Internacionalización

---

## Testing Manual

### Probar Trial
1. Registra una cuenta nueva
2. Verifica que aparece banner amarillo en dashboard
3. Verifica que muestra "7 días restantes"
4. **Simular expiración:**
   - En Firebase Console, edita el documento del dentista
   - Cambia `trialEndsAt` a fecha pasada
   - Refresca la app → debe redirigir a `/subscription-expired`

### Probar Activación
1. Ingresa a `/admin` con tu cuenta admin
2. Busca el dentista con trial expirado
3. Presiona "Activar Mensual"
4. Verifica que cambia a badge verde "Activo"
5. Vuelve a login como ese dentista
6. Verifica que puede acceder normalmente
7. Verifica banner verde con fecha de renovación

### Probar Extensión
1. Teniendo un dentista activo
2. En `/admin` presiona "+ 1 Mes"
3. Verifica que `subscriptionEndsAt` se extendió correctamente

---

## Troubleshooting

### "No puedo acceder a /admin"
- Verifica que tu email en auth sea exactamente el mismo que `ADMIN_EMAIL`
- Firebase Auth es case-sensitive
- Haz logout y login nuevamente

### "Usuario dice que no puede acceder"
- Verifica en Firebase Console su `subscriptionStatus`
- Verifica que `subscriptionEndsAt` sea fecha futura
- Verifica que no haya error de timezone

### "Fecha de expiración incorrecta"
- Firestore usa UTC
- Asegúrate de usar `.toDate()` al leer Timestamps
- Usa `Timestamp.fromDate()` al escribir fechas

### "Admin no aparece en lista"
- `getAllDentists()` no filtra por subscriptionStatus
- Debería aparecer, verifica que el usuario esté en colección `dentists`
- Verifica que no haya error de JavaScript en consola

---

## Contacto y Soporte

Para modificar los datos de contacto que ven los usuarios:

**app/subscription-expired/page.tsx:**
```tsx
// Línea ~119: WhatsApp
href="https://wa.me/5491123456789"

// Línea ~126: Email
href="mailto:soporte@dentos.com"
```

**app/dashboard/page.tsx:**
```tsx
// Línea ~87: Botón WhatsApp
onClick={() => window.location.href = 'https://wa.me/5491123456789'}
```

---

## Conclusión

El sistema de Trial + Activación Manual es ideal para:
- ✅ Lanzamiento rápido
- ✅ Control total sobre clientes
- ✅ Costos mínimos ($2/mes)
- ✅ Relación directa con cada dentista
- ✅ Feedback temprano del producto
- ✅ Proceso de pago simple

**No es ideal para:**
- ❌ Más de 200 clientes (se vuelve manual)
- ❌ Crecimiento viral rápido
- ❌ Automatización total

**Cuándo migrar a pagos automáticos:**
- Cuando tengas 20-50 clientes regulares
- Cuando el proceso manual tome >2 horas/día
- Cuando tengas flujo de caja para contratar desarrollador
- Cuando MercadoPago sea necesario para credibilidad
