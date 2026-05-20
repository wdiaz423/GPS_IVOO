# Guía de Integración GPS - Dispositivos y APIs

## Integración de dispositivos GPS externos

La aplicación soporta múltiples tipos de dispositivos GPS y APIs de terceros.

### AirTag / Apple Find My

1. **Obtener ubicación**
   - Usar Apple Find My API
   - O integrar con app de Apple que maneje AirTag

2. **Endpoint para recibir ubicaciones**
   ```bash
   POST /api/locations
   Body: {
     "vehicle_id": "vehicle-123",
     "device_id": "airtag-456",
     "latitude": 40.7128,
     "longitude": -74.0060,
     "accuracy": 10,
     "timestamp": "2026-05-20T10:30:00Z"
   }
   ```

### Rastreadores OBD-II (OBDLink, Vyncs, etc.)

1. **Configurar webhook en el dispositivo**
   ```
   Webhook URL: https://tuapp.com/api/gps-devices/webhook
   ```

2. **Payload esperado**
   ```json
   {
     "device_id": "obdlink-123",
     "latitude": 40.7128,
     "longitude": -74.0060,
     "speed": 65,
     "rpm": 2500,
     "fuel_level": 75,
     "temperature": 90
   }
   ```

### Google Maps Timeline

1. **Autorizar app**
   - Usar OAuth 2.0
   - Solicitar scope: `https://www.googleapis.com/auth/location.timeline.readonly`

2. **Sincronizar ubicaciones**
   ```typescript
   const response = await fetch(
     'https://www.googleapis.com/mapsplatform/ext/places/v1/places:queryPlaces',
     {
       headers: {
         'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY,
       }
     }
   );
   ```

### APIs de Telemática (Samsara, Geotab, etc.)

1. **Configurar credenciales**
   ```env
   SAMSARA_API_KEY=your-api-key
   GEOTAB_USERNAME=username
   GEOTAB_PASSWORD=password
   ```

2. **Sincronizar datos periódicamente**
   - Cron job cada 5 minutos
   - Fetch ubicaciones y telemetría
   - Almacenar en base de datos

3. **Ejemplo Samsara**
   ```typescript
   const vehicles = await fetch(
     'https://api.samsara.com/vehicles',
     {
       headers: {
         'Authorization': `Bearer ${process.env.SAMSARA_API_KEY}`,
       }
     }
   );
   ```

## Configuración de Notificaciones

### Email (SendGrid)

1. **Instalar SDK**
   ```bash
   pnpm add @sendgrid/mail
   ```

2. **Configurar en .env**
   ```env
   SENDGRID_API_KEY=SG.xxx...
   SENDGRID_FROM_EMAIL=alerts@tuapp.com
   ```

3. **Enviar alertas**
   ```typescript
   import sgMail from '@sendgrid/mail';
   sgMail.setApiKey(process.env.SENDGRID_API_KEY);

   await sgMail.send({
     to: user.email,
     from: process.env.SENDGRID_FROM_EMAIL,
     subject: 'Alerta: Vehículo fuera de zona',
     html: `
       <h2>Alerta de Geofence</h2>
       <p>Tu vehículo ${vehicle.name} salió de la zona permitida.</p>
     `
   });
   ```

### Push Notifications (Firebase Cloud Messaging)

1. **Instalar SDK**
   ```bash
   pnpm add firebase-admin
   ```

2. **Inicializar Firebase Admin**
   ```typescript
   import admin from 'firebase-admin';

   admin.initializeApp({
     credential: admin.credential.cert(
       JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
     ),
   });
   ```

3. **Enviar notificación**
   ```typescript
   await admin.messaging().send({
     token: userDeviceToken,
     notification: {
       title: 'Alerta de Vehículo',
       body: `Tu ${vehicle.name} salió de la zona.`,
     },
     data: {
       vehicleId: vehicle.id,
       alertType: 'geofence_exit',
     },
   });
   ```

### SMS (Twilio)

1. **Instalar SDK**
   ```bash
   pnpm add twilio
   ```

2. **Configurar Twilio**
   ```env
   TWILIO_ACCOUNT_SID=ACxx...
   TWILIO_AUTH_TOKEN=xxxx...
   TWILIO_PHONE_NUMBER=+1...
   ```

3. **Enviar SMS**
   ```typescript
   import twilio from 'twilio';

   const client = twilio(
     process.env.TWILIO_ACCOUNT_SID,
     process.env.TWILIO_AUTH_TOKEN
   );

   await client.messages.create({
     body: `Alerta: ${vehicle.name} detectado fuera de zona.`,
     from: process.env.TWILIO_PHONE_NUMBER,
     to: user.phone_number,
   });
   ```

## Webhooks para dispositivos GPS

### Crear endpoint para recibir datos

```typescript
// app/api/gps-devices/webhook/route.ts
export async function POST(request: Request) {
  const data = await request.json();

  // Validar API key del dispositivo
  const device = await query(
    'SELECT * FROM gps_devices WHERE api_key = $1',
    [request.headers.get('authorization')?.split(' ')[1]]
  );

  if (!device.rows[0]) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Guardar ubicación
  await query(
    `INSERT INTO vehicle_locations 
     (vehicle_id, latitude, longitude, accuracy, created_at)
     VALUES ($1, $2, $3, $4, NOW())`,
    [
      device.rows[0].vehicle_id,
      data.latitude,
      data.longitude,
      data.accuracy || null,
    ]
  );

  // Guardar telemetría
  if (data.speed || data.fuel_level || data.temperature) {
    await query(
      `INSERT INTO telemetry 
       (vehicle_id, speed, fuel_level, temperature, rpm, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        device.rows[0].vehicle_id,
        data.speed || null,
        data.fuel_level || null,
        data.temperature || null,
        data.rpm || null,
      ]
    );
  }

  // Verificar geofences
  await checkGeofences(device.rows[0].vehicle_id, data.latitude, data.longitude);

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
```

## Detección de Geofences

```typescript
// lib/geofence.ts
import { query } from './db';

export async function checkGeofences(vehicleId: string, latitude: number, longitude: number) {
  // Obtener geofences relevantes
  const geofences = await query(
    `SELECT gf.*, v.owner_id FROM geofences gf
     JOIN vehicles v ON gf.owner_id = v.owner_id
     WHERE gf.owner_id = (SELECT owner_id FROM vehicles WHERE id = $1)`,
    [vehicleId]
  );

  for (const geofence of geofences.rows) {
    const distance = calculateDistance(
      latitude,
      longitude,
      geofence.center_latitude,
      geofence.center_longitude
    );

    const insideGeofence = distance <= geofence.radius_km;

    // Obtener estado anterior
    const lastStatus = await query(
      `SELECT inside_geofence FROM geofence_history 
       WHERE vehicle_id = $1 AND geofence_id = $2
       ORDER BY created_at DESC LIMIT 1`,
      [vehicleId, geofence.id]
    );

    const wasInside = lastStatus.rows[0]?.inside_geofence ?? false;

    // Detectar entrada/salida
    if (insideGeofence !== wasInside) {
      // Crear alerta
      const alertType = insideGeofence ? 'geofence_entry' : 'geofence_exit';
      await query(
        `INSERT INTO alerts 
         (vehicle_id, geofence_id, type, severity, title, message, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          vehicleId,
          geofence.id,
          alertType,
          'warning',
          `Vehículo ${alertType === 'geofence_entry' ? 'entró' : 'salió'} de ${geofence.name}`,
          `El vehículo fue detectado ${alertType === 'geofence_entry' ? 'entrando a' : 'saliendo de'} la zona ${geofence.name}.`,
        ]
      );

      // Enviar notificaciones
      await sendNotifications(vehicleId, alertType, geofence.name);
    }

    // Guardar historial
    await query(
      `INSERT INTO geofence_history 
       (vehicle_id, geofence_id, inside_geofence, latitude, longitude, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [vehicleId, geofence.id, insideGeofence, latitude, longitude]
    );
  }
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
```

## Sincronización de datos desde APIs externas

Crear un cron job para sincronizar datos:

```typescript
// app/api/cron/sync-gps-data/route.ts
export async function POST(request: Request) {
  // Verificar token de autorización (from external cron service)
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const providers = ['samsara', 'geotab', 'google-maps'];

  for (const provider of providers) {
    try {
      await syncDataFromProvider(provider);
    } catch (error) {
      console.error(`[v0] Error syncing ${provider}:`, error);
    }
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
```

Configurar en el panel del proveedor de cron (ej: Vercel Cron):
```json
{
  "path": "/api/cron/sync-gps-data",
  "schedule": "*/5 * * * *"  // Cada 5 minutos
}
```

## Testing

```bash
# Simular actualización GPS
curl -X POST http://localhost:3000/api/locations \
  -H "Content-Type: application/json" \
  -d '{
    "vehicle_id": "vehicle-1",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "accuracy": 10
  }'
```
