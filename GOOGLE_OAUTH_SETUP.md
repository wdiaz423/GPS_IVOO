# Google OAuth 2.0 Setup Guide

Este documento explica cómo configurar la autenticación con Google (Gmail) en tu aplicación GPS Vehicle Tracker.

## Requisitos previos

- Tener una cuenta de Google
- Acceso a [Google Cloud Console](https://console.cloud.google.com)
- Tu app ya está alojada (local o en producción)

## Paso 1: Crear un proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Haz clic en "Seleccionar un proyecto" en la parte superior
3. Haz clic en "NUEVO PROYECTO"
4. Ingresa un nombre para tu proyecto (ej: "GPS Vehicle Tracker")
5. Haz clic en "CREAR"
6. Espera a que se cree el proyecto (puede tomar un minuto)

## Paso 2: Habilitar Google+ API

1. Desde la consola de Google Cloud, busca "Google+ API" en la barra de búsqueda
2. Selecciona "Google+ API" en los resultados
3. Haz clic en "HABILITAR"

## Paso 3: Crear credenciales OAuth 2.0

1. Ve a "Credenciales" en el panel lateral izquierdo
2. Haz clic en "CREAR CREDENCIALES"
3. Selecciona "ID de cliente OAuth"
4. Si es la primera vez, te pedirá que configures la "Pantalla de consentimiento de OAuth"

### Configurar la pantalla de consentimiento:

1. Selecciona "Externo" como tipo de usuario
2. Haz clic en "CREAR"
3. Completa el formulario:
   - **Nombre de la app**: "GPS Vehicle Tracker"
   - **Email de soporte del usuario**: Tu email de Google
   - En "Información de contacto del desarrollador" añade tu email
4. Haz clic en "GUARDAR Y CONTINUAR"
5. En "Permisos", haz clic en "GUARDAR Y CONTINUAR" (sin agregar permisos por ahora)
6. En "Usuarios de prueba", haz clic en "GUARDAR Y CONTINUAR"

### Crear el ID de cliente:

1. Después de configurar la pantalla de consentimiento, volverás a la página de Credenciales
2. Haz clic en "CREAR CREDENCIALES" nuevamente
3. Selecciona "ID de cliente OAuth"
4. Elige "Aplicación web"
5. En "Nombres de origen autorizados" agrega:
   - `http://localhost:3000` (para desarrollo local)
   - `http://localhost` (alternativa)
   - Tu dominio si estás en producción (ej: `https://yourdomain.com`)

6. En "URIs de redireccionamiento autorizados" agrega:
   - `http://localhost:3000/api/auth/callback/google` (desarrollo)
   - `https://yourdomain.com/api/auth/callback/google` (producción)

7. Haz clic en "CREAR"
8. Se abrirá una ventana con tu **ID de cliente** y **Secreto de cliente** - **COPIA ESTOS VALORES**

## Paso 4: Configurar variables de entorno

1. Crea un archivo `.env.local` en la raíz del proyecto (cópialo desde `.env.example`)
2. Agrega los valores obtenidos de Google:

```bash
# NextAuth
NEXTAUTH_SECRET=<tu_secret_generado_con: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000  # Cambia en producción a tu dominio

# Google OAuth
GOOGLE_CLIENT_ID=<tu_id_de_cliente>
GOOGLE_CLIENT_SECRET=<tu_secreto_de_cliente>
```

### Generar NEXTAUTH_SECRET

En tu terminal, ejecuta:
```bash
openssl rand -base64 32
```

Copia el resultado y úsalo en `NEXTAUTH_SECRET`

## Paso 5: Verificar la configuración

1. Inicia tu aplicación:
```bash
pnpm dev
```

2. Ve a `http://localhost:3000/login`
3. Deberías ver un botón de "Continuar con Google"
4. Haz clic en él y deberías ser redirigido a Google
5. Autoriza la aplicación
6. Deberías ser redirigido al dashboard

## Solución de problemas

### Error: "Invalid redirect_uri"
- Verifica que los URIs en Google Cloud Console coincidan exactamente con los que usas en tu app
- No olvides incluir `/api/auth/callback/google`

### Error: "Invalid Client"
- Verifica que el `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` sean correctos
- Recopia los valores desde Google Cloud Console

### Error: "NEXTAUTH_SECRET not set"
- Asegúrate de que el archivo `.env.local` está en la raíz del proyecto
- Verifica que `NEXTAUTH_SECRET` esté configurado correctamente

### Error: "NEXTAUTH_URL not set"
- Agrega `NEXTAUTH_URL` a tu archivo `.env.local`
- En desarrollo: `NEXTAUTH_URL=http://localhost:3000`
- En producción: `NEXTAUTH_URL=https://yourdomain.com`

## Para producción (Vercel)

Si despliegas a Vercel:

1. Ve a tu proyecto en Vercel
2. Haz clic en "Settings" → "Environment Variables"
3. Agrega las mismas variables:
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (usa tu dominio de Vercel o dominio personalizado)
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

4. Actualiza los URIs autorizados en Google Cloud Console:
   - Origen autorizado: `https://yourdomain.vercel.app`
   - URI de redireccionamiento: `https://yourdomain.vercel.app/api/auth/callback/google`

## Cómo funciona

Cuando un usuario hace clic en "Continuar con Google":

1. Es redirigido a Google para autenticarse
2. Google verifica sus credenciales
3. Google redirige de vuelta a tu app con un código
4. NextAuth intercambia el código por tokens
5. NextAuth verifica o crea el usuario en la base de datos
6. Se crea una sesión y el usuario es redirigido al dashboard

Los usuarios pueden:
- Crear cuenta directamente con Google
- Vincular Google a una cuenta existente (si usan el mismo email)
- Cambiar entre inicio de sesión con email y Google

## Seguridad

- Los tokens de sesión se almacenan de forma segura en cookies HTTP-only
- Las contraseñas de usuarios con email/password siguen siendo hasheadas con bcrypt
- Los usuarios con OAuth no tienen contraseña almacenada

## Soporte

Para más información sobre NextAuth, visita: https://next-auth.js.org/
