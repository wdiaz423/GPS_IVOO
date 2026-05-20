'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'

export default function Home() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          router.push('/dashboard')
        } else {
          setIsLoading(false)
        }
      } catch (error) {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-foreground text-balance">
              Rastreo GPS en Tiempo Real
            </h1>
            <p className="text-xl text-muted-foreground text-balance">
              Monitorea tu flota de vehículos con precisión en tiempo real. Acceso a ubicación, telemetría, alertas y geofencing.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 py-12">
            <div className="bg-card p-6 rounded-lg border border-border hover:border-primary/50 transition-colors">
              <div className="text-3xl mb-4">📍</div>
              <h3 className="font-semibold text-foreground mb-2">Ubicación en Tiempo Real</h3>
              <p className="text-sm text-muted-foreground">
                Actualización cada 5-10 segundos con precisión de metros
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg border border-border hover:border-primary/50 transition-colors">
              <div className="text-3xl mb-4">📊</div>
              <h3 className="font-semibold text-foreground mb-2">Telemetría Completa</h3>
              <p className="text-sm text-muted-foreground">
                Velocidad, combustible, temperatura y más datos del vehículo
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg border border-border hover:border-primary/50 transition-colors">
              <div className="text-3xl mb-4">🚨</div>
              <h3 className="font-semibold text-foreground mb-2">Alertas Inteligentes</h3>
              <p className="text-sm text-muted-foreground">
                Notificaciones por email, push y SMS cuando ocurren eventos
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-muted-foreground mb-6">Comienza ahora a rastrear tus vehículos</p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button onClick={() => router.push('/login')} size="lg">
                Iniciar Sesión
              </Button>
              <Button onClick={() => router.push('/register')} variant="secondary" size="lg">
                Crear Cuenta
              </Button>
            </div>
          </div>

          <div className="pt-12 border-t border-border mt-12">
            <p className="text-xs text-muted-foreground">
              GPS Vehicle Tracker © 2026 - Solución empresarial de rastreo de flota
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
