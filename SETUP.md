# 🦷 DentOS - Guía de Configuración

## Paso 1: Configurar Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. En la configuración del proyecto, agrega una aplicación web
4. Copia las credenciales que te proporciona Firebase

## Paso 2: Variables de Entorno

1. Crea un archivo `.env.local` en la raíz del proyecto
2. Copia el contenido de `.env.local.example`
3. Reemplaza los valores con tus credenciales de Firebase:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key_real
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
```

## Paso 3: Configurar Firestore

1. En Firebase Console, ve a **Firestore Database**
2. Crea una base de datos (modo producción o prueba)
3. Configura las reglas de seguridad copiando el contenido del archivo `firestore.rules` en la raíz del proyecto, o usa estas reglas directamente:

**IMPORTANTE:** Las reglas de seguridad son críticas para proteger los datos de tus pacientes. El archivo `firestore.rules` incluye:
- Validación de tipos de datos
- Verificación de propiedad (solo el dentista puede ver sus datos)
- Validación de campos requeridos
- Límites de tamaño para prevenir abuso
- Protección contra eliminación accidental de perfiles

Puedes desplegar las reglas automáticamente con Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

## Paso 4: Habilitar Authentication

1. Ve a **Authentication** en Firebase Console
2. Haz clic en "Get Started"
3. Habilita el método de autenticación **Email/Password**

## Paso 5: Ejecutar el Proyecto

```bash
npm run dev
```

El proyecto estará disponible en [http://localhost:3000](http://localhost:3000)

## Estructura del Proyecto

```
DentOS/
├── app/                    # Rutas de Next.js
│   ├── login/             # Página de login
│   ├── register/          # Página de registro
│   └── dashboard/         # Panel principal
├── components/            # Componentes reutilizables
│   ├── ui/               # Componentes de UI (Button, Input, Card)
│   └── auth/             # Componentes de autenticación
├── contexts/             # Contextos de React
│   └── auth-context.tsx  # Contexto de autenticación
├── hooks/                # Custom hooks
│   └── use-auth.ts       # Hook de autenticación
├── lib/                  # Utilidades
│   ├── firebase.ts       # Configuración de Firebase
│   ├── auth.ts           # Funciones de autenticación
│   └── utils.ts          # Utilidades generales
└── types/                # Definiciones de TypeScript
    └── index.ts          # Tipos del proyecto
```

## Características Implementadas

✅ Sistema de autenticación con Firebase  
✅ Login y registro de dentistas  
✅ Protección de rutas privadas  
✅ Dashboard principal  
✅ Diseño responsive y profesional  
✅ Validación de formularios  
✅ Manejo de errores  
✅ TypeScript para seguridad de tipos  

## Próximos Pasos

Ahora que el login está funcionando, los siguientes pasos serán:

1. **Perfil**: Página para editar información del dentista
2. **Pacientes**: CRUD completo de pacientes
3. **Agenda**: Sistema de citas con calendario
4. **Pedidos**: Gestión de pedidos y suministros

## ¿Necesitas Ayuda?

Si tienes algún problema con la configuración, revisa que:
- Las variables de entorno estén correctamente configuradas
- Firebase esté habilitado correctamente
- Las dependencias estén instaladas (`npm install`)
