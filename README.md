# GPS Vehicle Tracking App

Una aplicación web completa para rastrear vehículos en tiempo real con ubicación, telemetría, alertas y geofencing.

## Características

- **Rastreo en tiempo real**: Actualización de ubicaciones cada 5-10 segundos
- **Mapa interactivo**: Visualización de vehículos con Google Maps o Mapbox
- **Telemetría completa**: Velocidad, nivel de combustible, temperatura del motor
- **Geofencing**: Define zonas y recibe alertas cuando vehículos entran/salen
- **Alertas automáticas**: Notificaciones por email y push
- **Autenticación segura**: Login con email/contraseña o Google OAuth
- **Múltiples tipos de usuarios**: Propietarios, gerentes de flota, conductores, observadores
- **Historial de ubicaciones**: Rastreo de rutas recorridas
- **Dashboard analítico**: Reportes y estadísticas

## Tech Stack

### Backend
- **Next.js 16** con App Router
- **Aurora PostgreSQL** para base de datos
- **AWS IAM Authentication** con RDS Signer
- **Server-Sent Events (SSE)** para actualizaciones en tiempo real

### Frontend
- **React 19** con TypeScript
- **Tailwind CSS v4** para estilos
- **Lucide React** para iconos
- **SWR** para data fetching
- **React Map GL** / **Google Maps** para mapas

### Integraciones externas
- Google Maps o Mapbox API
- **Google OAuth 2.0** para autenticación con Gmail
- AWS Aurora PostgreSQL
- Firebase Cloud Messaging (push notifications)
- SendGrid o Resend (email notifications)

## Instalación

### 1. Clonar y configurar
```bash
git clone <repo-url>
cd gps-tracking-app
pnpm install
```

### 2. Variables de entorno
Crea un archivo `.env.local` basado en `.env.example`:

```env
# Aurora PostgreSQL
PGHOST=your-aurora-host
PGDATABASE=gps_tracking
PGUSER=postgres
AWS_REGION=us-east-1
AWS_ROLE_ARN=arn:aws:iam::YOUR_ACCOUNT:role/YOUR_ROLE

# Maps
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token
# O para Google Maps:
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key

# Notifications
SENDGRID_API_KEY=your-sendgrid-key
FIREBASE_PROJECT_ID=your-firebase-project
```

### 3. Inicializar base de datos
```bash
curl http://localhost:3000/api/setup
```

Esto creará todas las tablas necesarias en Aurora PostgreSQL.

### 4. Ejecutar
```bash
pnpm dev
```

Accede a la app en http://localhost:3000

## Estructura de la aplicación

```
app/
  ├── api/                    # API routes
  │   ├── auth/              # Autenticación
  │   ├── vehicles/          # Gestión de vehículos
  │   ├── gps-devices/       # Dispositivos GPS
  │   ├── locations/         # Ubicaciones
  │   ├── telemetry/         # Telemetría
  │   ├── geofences/         # Geofences
  │   ├── alerts/            # Alertas
  │   └── updates/           # SSE real-time
  ├── dashboard/             # Dashboard principal
  ├── login/                 # Página login
  ├── register/              # Página registro
  ├── vehicles/              # Gestión de vehículos
  └── alerts/                # Visualización de alertas

components/
  ├── dashboard.tsx          # Dashboard principal
  ├── vehicle-map.tsx        # Mapa de vehículos
  ├── vehicle-list.tsx       # Lista de vehículos
  └── alerts-display.tsx     # Mostrador de alertas

lib/
  ├── db.ts                  # Pool de conexión Aurora
  ├── types.ts               # Tipos TypeScript
  ├── auth.ts                # Utilidades de auth
  └── auth-middleware.ts     # Middleware de verificación

hooks/
  ├── use-auth.ts            # Hook de autenticación
  └── use-realtime-updates.ts # Hook SSE para actualizaciones
```

## Flujo de datos

1. **Autenticación**: Usuario se registra/login → sesión en base de datos
2. **Vehículos**: Propietario agrega vehículos → se almacenan en BD
3. **Dispositivos GPS**: Se vinculan a vehículos → envían ubicaciones
4. **Ubicaciones**: API recibe updates → SSE envía a clientes
5. **Telemetría**: Se almacena cada 5 segundos
6. **Alertas**: Se generan por geofences o reglas → notificaciones push/email

## API Endpoints

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Usuario actual

### Vehículos
- `GET /api/vehicles` - Listar mis vehículos
- `POST /api/vehicles` - Crear vehículo
- `GET /api/vehicles/[id]` - Detalles vehículo
- `PUT /api/vehicles/[id]` - Actualizar vehículo
- `DELETE /api/vehicles/[id]` - Eliminar vehículo

### Ubicaciones
- `POST /api/locations` - Enviar ubicación (desde GPS device)
- `GET /api/locations/history` - Historial de ubicaciones

### Telemetría
- `POST /api/telemetry` - Enviar datos telemetría
- `GET /api/telemetry` - Obtener telemetría actual

### Geofences
- `GET /api/geofences` - Listar geofences
- `POST /api/geofences` - Crear geofence
- `PUT /api/geofences/[id]` - Actualizar geofence
- `DELETE /api/geofences/[id]` - Eliminar geofence

### Alertas
- `GET /api/alerts` - Listar alertas
- `POST /api/alerts` - Crear alerta manual

### Real-time
- `GET /api/updates` - SSE stream de actualizaciones en tiempo real

## Modelos de base de datos

### users
- id, email, password_hash, full_name, role, created_at

### vehicles
- id, owner_id, fleet_id, name, license_plate, vehicle_type, status, created_at

### gps_devices
- id, vehicle_id, device_id, device_type, api_key, status, created_at

### vehicle_locations
- id, vehicle_id, latitude, longitude, accuracy, created_at
- Particionada por fecha para performance

### telemetry
- id, vehicle_id, speed, fuel_level, temperature, rpm, created_at

### geofences
- id, owner_id, name, center_latitude, center_longitude, radius_km, created_at

### alerts
- id, vehicle_id, geofence_id, type, severity, title, message, read, created_at

### sessions
- id, user_id, token_hash, expires_at, created_at

## Configuración de integraciones

### Google OAuth (Gmail Sign-In)
La aplicación incluye autenticación con Google OAuth integrada. Para configurarla:

1. Lee la guía completa: [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)
2. Crea proyecto en [Google Cloud Console](https://console.cloud.google.com)
3. Habilita Google+ API
4. Crea credenciales OAuth 2.0 para aplicación web
5. Agrega las siguientes variables en `.env.local`:
   - `NEXTAUTH_SECRET` (genera con `openssl rand -base64 32`)
   - `NEXTAUTH_URL` (tu URL de app)
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

Los usuarios pueden crear cuenta o iniciar sesión con su cuenta de Google directamente.

### Google Maps
1. Crea proyecto en Google Cloud Console
2. Habilita Maps JavaScript API
3. Crea API key
4. Agrega `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` en .env

### Mapbox
1. Crea cuenta en mapbox.com
2. Crea token de acceso
3. Agrega `NEXT_PUBLIC_MAPBOX_TOKEN` en .env

### SendGrid (email)
1. Crea cuenta en sendgrid.com
2. Crea API key
3. Agrega `SENDGRID_API_KEY` en .env

### Firebase (push notifications)
1. Crea proyecto en Firebase Console
2. Descarga credenciales JSON
3. Configura Firebase Admin SDK

## Desarrollo

```bash
# Instalar dependencias
pnpm install

# Ejecutar servidor de desarrollo
pnpm dev

# Build para producción
pnpm build

# Iniciar modo producción
pnpm start

# Linting
pnpm lint

# Type checking
pnpm type-check
```

## Próximas características

- [ ] App móvil con React Native
- [ ] Soporte para múltiples GPS providers
- [ ] Análisis predictivo de rutas
- [ ] Integración con seguros (telemática)
- [ ] Sistema de mantenimiento preventivo
- [ ] Análisis de comportamiento de conducción
- [ ] Exportación de reportes PDF

## Licencia

MIT

## Soporte

Para reportar bugs o sugerencias, abre un issue en el repositorio.
