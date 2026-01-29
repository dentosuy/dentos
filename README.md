# DentOS 🦷

Sistema de gestión profesional para consultorios dentales.

## Características

- ✅ Autenticación segura con Firebase
- � Sistema de suscripciones (Trial + Activación Manual)
- 📅 Gestión de agenda y citas
- 👥 Administración de pacientes
- 📦 Control de inventario y stock
- 💰 Gestión financiera (ingresos/egresos)
- 📋 Historias clínicas completas
- 🔔 Sistema de notificaciones en tiempo real
- ✔️ Validación robusta de datos
- 🔒 Seguridad y privacidad de datos médicos
- 🎨 Interfaz moderna y responsive

## Sistema de Suscripciones

DentOS utiliza un modelo de suscripción para monetizar el servicio:

### Período de Prueba
- **7 días gratis** al registrarse
- Acceso completo a todas las funcionalidades
- Banner informativo sobre días restantes en dashboard
- Al finalizar el trial, se muestra pantalla de suscripción expirada

### Planes de Suscripción
- **Mensual**: $3,000 ARS/mes
- **Anual**: $30,000 ARS/año (equivalente a 10 meses, 2 meses gratis)

### Activación de Cuentas
- Contacto directo vía WhatsApp o email
- Pago manual (transferencia, MercadoPago, etc.)
- Activación manual desde panel de administración
- Soporte dentro de 24hs

### Panel de Administración
- Acceso en `/admin` (solo para email configurado como admin)
- Lista de todos los dentistas registrados
- Estado de suscripción de cada usuario
- Botones para activar/extender suscripciones
- Estadísticas generales (trials, activos, expirados)

### Configurar Email de Administrador
Editar el archivo [app/admin/page.tsx](app/admin/page.tsx):
```typescript
const ADMIN_EMAIL = 'tu-email@ejemplo.com' // Cambiar por tu email real
```

## Stack Tecnológico

- **Framework**: Next.js 14 (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Backend**: Firebase (Auth + Firestore)
- **Iconos**: Lucide React

## Seguridad

- ✅ Validación de datos en cliente y servidor
- ✅ Sanitización de inputs
- ✅ Reglas de seguridad Firebase robustas
- ✅ Confirmaciones para acciones destructivas
- ✅ Feedback visual de errores
- 📄 Ver [SECURITY.md](SECURITY.md) para más detalles

## Instalación

1. Clona el repositorio
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Configura Firebase (ver [SETUP.md](SETUP.md))
4. Despliega las reglas de seguridad:
   ```bash
   firebase deploy --only firestore:rules
   ```
5. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
6. Abre [http://localhost:3000](http://localhost:3000)

## Documentación

- 📖 [Guía de Configuración](SETUP.md)
- 🔒 [Guía de Seguridad](SECURITY.md)
- 🔐 [Política de Privacidad](PRIVACY_POLICY.md)
- 📜 [Términos de Servicio](TERMS_OF_SERVICE.md)

## Estructura del Proyecto

```
dentos/
├── app/              # Rutas y páginas (Next.js App Router)
├── components/       # Componentes reutilizables
│   ├── ui/          # Componentes UI (Button, Input, Toast, etc.)
│   ├── auth/        # Componentes de autenticación
│   └── layout/      # Layouts compartidos
├── lib/             # Utilidades y lógica de negocio
│   ├── validation.ts # Validación de datos
│   ├── firebase.ts   # Configuración Firebase
│   └── *.ts         # Funciones CRUD por módulo
├── hooks/           # Custom React Hooks
├── types/           # Definiciones de TypeScript
└── contexts/        # React Contexts
```

## Estado del Proyecto

### ✅ Completado
- Sistema de autenticación
- CRUD completo de pacientes, citas, stock, finanzas
- Sistema de notificaciones toast
- Validación robusta de formularios
- Confirmaciones de eliminación
- Reglas de seguridad Firebase
- Historias clínicas
- UI responsive

### 🚧 En Progreso
- Tests unitarios e integración
- Paginación de listados
- Sistema de respaldo

### 📋 Pendiente
- Exportación de datos (PDF, Excel)
- Reportes y estadísticas
- Sistema de recordatorios
- Optimizaciones de performance
- PWA (Progressive Web App)

## ⚠️ IMPORTANTE - Antes de Producción

**NO lanzar sin:**
1. ✅ Revisar reglas de Firebase
2. ⚠️ Tests completos
3. ⚠️ Revisión legal (abogado)
4. ⚠️ Cumplimiento normativas sanitarias
5. ⚠️ Sistema de backup automático
6. ⚠️ Monitoreo y error tracking

Ver [SECURITY.md](SECURITY.md) para checklist completo.

## Desarrollado con ❤️ para dentistas profesionales
